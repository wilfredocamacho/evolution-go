# Logging Guidelines

> Structured logging conventions in this project.

---

## Two Logging Systems

The project uses two loggers simultaneously:

### 1. `github.com/gomessguii/logger` (global console)

Used for:
- Startup/shutdown messages
- Global events (not instance-specific)
- When there is no instance context

```go
import "github.com/gomessguii/logger"

logger.LogInfo("Starting Evolution GO version %s", version)
logger.LogError("Failed to connect to RabbitMQ, err: %v", err)
logger.LogWarn("[CONFIG] Auto-setup failed: %v", err)
logger.LogDebug("Normalized number from %s to %s", old, new)
```

Levels: `LogInfo`, `LogError`, `LogWarn`, `LogDebug`, `LogFatal`

### 2. Custom `LoggerManager` (per-instance JSON files)

Used for all instance-specific logging. Writes structured JSON to files with rotation.

```go
loggerWrapper := logger_wrapper.NewLoggerManager(config)
logger := loggerWrapper.GetLogger(instanceId)
logger.LogInfo("[%s] Client connected successfully", instanceId)
logger.LogError("[%s] Failed to start instance: %v", instanceId, err)
logger.LogWarn("[%s] Ignoring disconnect: not connected", instanceId)
```

---

## Structured JSON Log Format

Each line is a JSON object:

```json
{"timestamp":"2026-05-25T10:30:00Z","level":"INFO","instance_id":"abc-123","message":"Client connected"}
{"timestamp":"2026-05-25T10:30:01Z","level":"ERROR","instance_id":"abc-123","message":"Failed to connect: timeout"}
```

### LogEntry Struct

```go
type LogEntry struct {
    Timestamp  time.Time       `json:"timestamp"`
    Level      string          `json:"level"`      // INFO, ERROR, WARN, DEBUG
    InstanceId string          `json:"instance_id"`
    Message    string          `json:"message"`
    Metadata   json.RawMessage `json:"metadata,omitempty"`
}
```

---

## Log Message Format

Instance-scoped logs use this format for the message string:

```
[<instanceId>] <message>
```

Example:
```go
logger.LogInfo("[%s] Processing subscribe events: %v", instance.Id, data.Subscribe)
logger.LogError("[%s] Error updating instance: %s", instance.Id, err)
```

---

## Log File Management

| Config | Default | Description |
|--------|---------|-------------|
| `LOG_DIRECTORY` | `./logs` | Base directory for log files |
| `LOG_MAX_SIZE` | 100 | Max file size in MB before rotation |
| `LOG_MAX_BACKUPS` | 5 | Max rotated files to keep |
| `LOG_MAX_AGE` | 30 | Max age in days before deletion |
| `LOG_COMPRESS` | true | Compress rotated files with gzip |

Files are organized as:

```
<LOG_DIRECTORY>/
  <instanceId>/
    instance.log
```

File rotation uses `gopkg.in/natefinch/lumberjack.v2`.

---

## Logging Patterns by Layer

### Configuration (`pkg/config`)

```go
logger.LogInfo("[CONFIG] AMQP URL validation successful: %s://%s", scheme, host)
logger.LogDebug("Connecting to database on: %s", dsn)
logger.LogWarn("[CONFIG] Auto-setup failed (will try anyway): %v", err)
logger.LogFatal("[CONFIG] required configuration variable is missing.")
```

### Instance Service

Always use the instance-scoped logger with `[instanceId]` prefix:

```go
logger := i.loggerWrapper.GetLogger(instance.Id)
logger.LogInfo("[%s] Starting new client instance", instance.Id)
logger.LogError("[%s] Failed to start instance: %v", instance.Id, err)
logger.LogWarn("[%s] Ignoring disconnect: not connected", instance.Id)
```

### Repository

Use global logger for DB errors:

```go
logger.LogError("Error updating instance in DB: %v", err)
```

---

## Forbidden Patterns

- Do NOT use `fmt.Println` or `fmt.Printf` for logging (except core startup)
- Do NOT log sensitive data (tokens, passwords, API keys)
- Do NOT log the same event to both loggers — use instance logger for instance operations, global logger for system operations
- Do NOT log in tight loops without rate limiting
