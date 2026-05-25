package webhook_service

import (
	"sync"
	"time"
)

type Session struct {
	SessionID  string
	RemoteJid  string
	PushName   string
	Status     string // opened, closed
	WebhookID  string
	InstanceID string
	Expire     int
	CreatedAt  time.Time
	LastActive time.Time
}

type SessionManager struct {
	mu       sync.RWMutex
	sessions map[string]*Session
	stopCh   chan struct{}
}

func NewSessionManager() *SessionManager {
	return &SessionManager{
		sessions: make(map[string]*Session),
		stopCh:   make(chan struct{}),
	}
}

func (sm *SessionManager) Get(webhookID, remoteJid string) *Session {
	sm.mu.RLock()
	defer sm.mu.RUnlock()
	key := webhookID + ":" + remoteJid
	return sm.sessions[key]
}

func (sm *SessionManager) CreateOrGet(webhookID, remoteJid, pushName, instanceID string, expire int) *Session {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	key := webhookID + ":" + remoteJid
	if s, exists := sm.sessions[key]; exists && s.Status == "opened" {
		s.LastActive = time.Now()
		s.Expire = expire
		return s
	}
	s := &Session{
		SessionID:  key,
		RemoteJid:  remoteJid,
		PushName:   pushName,
		Status:     "opened",
		WebhookID:  webhookID,
		InstanceID: instanceID,
		Expire:     expire,
		CreatedAt:  time.Now(),
		LastActive: time.Now(),
	}
	sm.sessions[key] = s
	return s
}

func (sm *SessionManager) CloseSession(remoteJid string) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	for _, s := range sm.sessions {
		if s.RemoteJid == remoteJid {
			s.Status = "closed"
		}
	}
}

func (sm *SessionManager) PauseSession(webhookID, remoteJid string) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	key := webhookID + ":" + remoteJid
	if s, exists := sm.sessions[key]; exists {
		s.Status = "paused"
	}
}

func (sm *SessionManager) DeleteSession(remoteJid string) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	for k, s := range sm.sessions {
		if s.RemoteJid == remoteJid {
			delete(sm.sessions, k)
		}
	}
}

func (sm *SessionManager) Touch(webhookID, remoteJid string) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	key := webhookID + ":" + remoteJid
	if s, exists := sm.sessions[key]; exists {
		s.LastActive = time.Now()
	}
}

func (sm *SessionManager) StartCleanup(defaultExpire time.Duration) {
	go func() {
		ticker := time.NewTicker(60 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				sm.mu.Lock()
				for k, s := range sm.sessions {
					if s.Status == "closed" {
						delete(sm.sessions, k)
						continue
					}
					
					expireDuration := defaultExpire
					if s.Expire > 0 {
						expireDuration = time.Duration(s.Expire) * time.Second
					}
					
					if time.Since(s.LastActive) > expireDuration {
						delete(sm.sessions, k)
					}
				}
				sm.mu.Unlock()
			case <-sm.stopCh:
				return
			}
		}
	}()
}

func (sm *SessionManager) StopCleanup() {
	close(sm.stopCh)
}
