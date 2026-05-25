# Database Guidelines

> ORM patterns, queries, and migrations in this project.

---

## Database Technologies

| Database | Usage | Driver |
|----------|-------|--------|
| **PostgreSQL** (primary) | Main user data, instances, messages, labels | `gorm.io/driver/postgres` + `database/sql` for raw connection |
| **SQLite** (auth fallback) | WhatsApp auth credentials when PostgreSQL AUTH not configured | `modernc.org/sqlite` (pure Go driver) |
| **PostgreSQL AUTH** | WhatsApp auth credentials (preferred) | `database/sql` + `lib/pq` |

---

## ORM: GORM

The project uses **GORM v2** as its ORM. All domain models embed `gorm` tags for column mapping.

### Model Definition Pattern

```go
type Instance struct {
    Id        string    `json:"id" gorm:"type:uuid;primaryKey"`
    Name      string    `json:"name"`
    Token     string    `json:"token" gorm:"unique"`
    Connected bool      `json:"connected"`
    CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime"`

    // Advanced Settings (stored on the same table)
    AlwaysOnline bool `json:"alwaysOnline" gorm:"default:false"`
}
```

### GORM Hooks

Use `BeforeCreate` for auto-generating primary keys:

```go
func (m *Instance) BeforeCreate(tx *gorm.DB) (err error) {
    if m.Id == "" {
        m.Id = uuid.New().String()
    }
    return
}
```

### Table Naming

- GORM **snake_case** convention: `Instance` → `instances`, `RuntimeConfig` → `runtime_configs`
- Explicit `TableName()` override when the default doesn't fit

```go
func (RuntimeConfig) TableName() string {
    return "runtime_configs"
}
```

---

## Repository Pattern

Each domain with database access has a `Repository` interface and implementation:

```go
type InstanceRepository interface {
    Create(instance instance_model.Instance) (*instance_model.Instance, error)
    GetInstanceByID(instanceId string) (*instance_model.Instance, error)
    Update(*instance_model.Instance) error
    Delete(instanceId string) error
}
```

### Common Query Patterns

**Get by field, return error on not found:**
```go
func (r *instanceRepository) GetInstanceByToken(token string) (*instance_model.Instance, error) {
    var instance instance_model.Instance
    err := r.db.Where("token = ?", token).First(&instance).Error
    if err != nil {
        return nil, err
    }
    return &instance, nil
}
```

**Partial update with `Updates` (map):**
```go
func (r *instanceRepository) UpdateConnected(userId string, status bool, reason string) error {
    return r.db.Model(&instance_model.Instance{}).
        Where("id = ?", userId).
        Update("connected", status).
        Update("disconnect_reason", reason).Error
}
```

**Select specific columns:**
```go
r.db.Select("always_online, reject_call").Where("id = ?", instanceId).First(&instance)
```

**Transaction for cascade delete:**
```go
func (r *instanceRepository) Delete(instanceId string) error {
    return r.db.Transaction(func(tx *gorm.DB) error {
        tx.Where("instance_id = ?", instanceId).Delete(&label_model.Label{})
        tx.Where("source = ?", instanceId).Delete(&message_model.Message{})
        tx.Where("id = ?", instanceId).Delete(&instance_model.Instance{})
        return nil
    })
}
```

**Upsert with OnConflict clause:**
```go
func (r *messageRepository) InsertMessage(message message_model.Message) error {
    return r.db.Clauses(clause.OnConflict{
        Columns:   []clause.Column{{Name: "message_id"}},
        DoUpdates: clause.AssignmentColumns([]string{"timestamp", "status", "source"}),
    }).Create(&message).Error
}
```

---

## Connection Pool Configuration

PostgreSQL connections are configured with the same pool settings everywhere:

```go
sqlDB.SetMaxOpenConns(25)
sqlDB.SetMaxIdleConns(5)
sqlDB.SetConnMaxLifetime(5 * time.Minute)
sqlDB.SetConnMaxIdleTime(1 * time.Minute)
```

---

## Migration Strategy

- **AutoMigrate** in `main()` for development simplicity:
  ```go
  func migrate(db *gorm.DB) {
      db.AutoMigrate(&instance_model.Instance{}, &message_model.Message{}, &label_model.Label{})
  }
  ```
- Core runtime migrations also use `AutoMigrate`:
  ```go
  core.MigrateDB() // auto-migrates RuntimeConfig
  ```

---

## UUID Handling

- IDs are UUIDv4 strings (not binary)
- Generated via `github.com/google/uuid`:
  ```go
  m.Id = uuid.New().String()
  ```
- UUID format is validated before queries:
  ```go
  if _, err := uuid.Parse(instanceId); err != nil {
      return nil, fmt.Errorf("invalid UUID format: %v", err)
  }
  ```
