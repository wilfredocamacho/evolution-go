# Backend Development Guidelines

> Best practices for backend development in this project.

---

## Overview

This project is **evolution-go**, a WhatsApp API built on the [whatsmeow](https://go.mau.fi/whatsmeow) library. It provides REST endpoints for WhatsApp messaging, group management, calls, communities, labels, newsletters, and polls — all exposed via a Gin HTTP server.

### Key Technologies

| Technology | Usage |
|------------|-------|
| **Go 1.25** | Language runtime |
| **Gin** | HTTP framework |
| **GORM v2** | ORM for PostgreSQL |
| **whatsmeow** | WhatsApp multi-device library |
| **RabbitMQ / NATS** | Event message brokers |
| **WebSocket / Webhook** | Event delivery channels |
| **MinIO** | Media file storage |
| **Swaggo** | Swagger/OpenAPI docs |
| **lumberjack** | Log file rotation |

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Module organization and file layout | ✅ Populated |
| [Database Guidelines](./database-guidelines.md) | ORM patterns, queries, migrations | ✅ Populated |
| [Error Handling](./error-handling.md) | Error types, handling strategies | ✅ Populated |
| [Logging Guidelines](./logging-guidelines.md) | Structured logging, log levels | ✅ Populated |
| [Quality Guidelines](./quality-guidelines.md) | Code standards, forbidden patterns | ✅ Populated |

---

## Architecture Overview

```
HTTP Request  →  Gin Router  →  Auth Middleware  →  Handler  →  Service  →  Repository/DB
                                                                ↓
                                                          whatsmeow Client
                                                                ↓
                                                     Event Producers (NATS/RabbitMQ/Webhook/WebSocket)
```

Each domain (instance, message, group, label, etc.) follows a consistent layered pattern.

---

## Language

All code and documentation is written in **English**. Comments and commit messages are also in English.
