# Directory Structure

> How backend code is organized in this project.

---

## Project Layout

```
evolution-go/
├── cmd/evolution-go/        # Main entrypoint (main.go)
├── docker/                  # Docker Compose & container configs
├── docs/                    # Swagger docs + project wiki
├── manager/                 # React-based manager UI (frontend)
├── pkg/                     # All Go packages
│   ├── call/                # WhatsApp call handling
│   ├── chat/                # WhatsApp chat management
│   ├── community/           # WhatsApp communities
│   ├── config/              # Environment-based configuration
│   │   └── env/             # Env var constants
│   ├── core/                # Licensing, runtime, heartbeat, middleware
│   ├── events/              # Event producers
│   │   ├── interfaces/      # Producer interface
│   │   ├── nats/            # NATS event producer
│   │   ├── rabbitmq/        # RabbitMQ event producer
│   │   ├── webhook/         # Webhook event producer
│   │   └── websocket/       # WebSocket event producer
│   ├── group/               # WhatsApp group operations
│   ├── instance/            # Instance lifecycle (model/repository/service/handler)
│   ├── internal/            # Internal shared types
│   │   └── event_types/     # Event type constants
│   ├── label/               # WhatsApp labels (model/repository/service/handler)
│   ├── logger/              # Structured JSON logger
│   ├── message/             # Message storage (model/repository/service/handler)
│   ├── middleware/          # Auth & JID validation middleware
│   ├── newsletter/          # WhatsApp newsletters
│   ├── poll/                # WhatsApp polls
│   ├── routes/              # All route definitions
│   ├── sendMessage/         # Message sending
│   ├── server/              # Health checks
│   ├── storage/             # Media storage
│   │   ├── interfaces/      # MediaStorage interface
│   │   └── minio/           # MinIO implementation
│   ├── telemetry/           # Telemetry
│   ├── user/                # WhatsApp user operations
│   ├── utils/               # Shared utilities (JID, proxy, etc.)
│   └── whatsmeow/           # WhatsApp client service
├── public/                  # Static assets
├── whatsmeow-lib/           # Forked whatsmeow library
```

---

## Module Organization

Each domain feature follows a consistent 4-layer structure:

| Layer | Directory | Responsibility |
|-------|-----------|----------------|
| **Handler** | `pkg/<domain>/handler/` | HTTP request parsing, validation, response |
| **Service** | `pkg/<domain>/service/` | Business logic, orchestrates calls |
| **Model** | `pkg/<domain>/model/` | Data structs, GORM hooks |
| **Repository** (when DB) | `pkg/<domain>/repository/` | Database access via GORM |

Not all domains have all layers. Example: `poll/` uses a handler directly injected with a service from another domain.

---

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Package | `snake_case` matching directory | `instance_handler`, `message_service` |
| Files | `snake_case.go` | `instance_handler.go`, `auth_middleware.go` |
| Interfaces | PascalCase with `Interface` suffix in interface pkg | `Producer`, `MediaStorage` |
| Structs | PascalCase (exported) | `Instance`, `LogEntry` |
| Functions | PascalCase (exported), camelCase (unexported) | `NewInstanceService`, `ensureClientConnected` |
| Imports | Aliased with descriptive prefix | `instance_model`, `auth_middleware` |

---

## Import Aliasing Convention

When importing sibling packages within `pkg/`, use descriptive aliases:

```go
import (
    instance_model "github.com/EvolutionAPI/evolution-go/pkg/instance/model"
    instance_service "github.com/EvolutionAPI/evolution-go/pkg/instance/service"
    auth_middleware "github.com/EvolutionAPI/evolution-go/pkg/middleware"
)
```

Standard external libraries use their default package name (e.g., `gin`, `gorm`).
