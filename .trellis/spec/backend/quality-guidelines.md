# Quality Guidelines

> Code standards, review expectations, and testing requirements.

---

## Go Version

The project uses **Go 1.25** (`go 1.25.0` in `go.mod`). All code must compile with this version.

---

## Coding Standards

### Package Organization

- One domain per package group: `pkg/<domain>/`
- Each domain has its own `handler/`, `service/`, `model/`, `repository/` as needed
- Interfaces are defined in the consumer's package (not a shared types package), except `events/interfaces/` and `storage/interfaces/` which define shared contracts

### Import Aliasing

All intra-package imports (from sibling `pkg/` sub-packages) MUST use descriptive aliases:

```go
// Good
import (
    instance_model  "github.com/EvolutionAPI/evolution-go/pkg/instance/model"
    instance_service "github.com/EvolutionAPI/evolution-go/pkg/instance/service"
    auth_middleware  "github.com/EvolutionAPI/evolution-go/pkg/middleware"
)

// Bad
import (
    "github.com/EvolutionAPI/evolution-go/pkg/instance/model"
    "github.com/EvolutionAPI/evolution-go/pkg/instance/service"
)
```

Alias pattern: `<package_abbreviation>_<sublayer>` (e.g., `instance_handler`, `message_model`, `instance_service`).

### Pointer vs Value Receivers

- **Service structs** are always pointer receivers: `func (i *instances) Create(...)`
- **Handler structs** are always pointer receivers: `func (i *instanceHandler) Connect(...)`
- **Repository structs** are always pointer receivers: `func (r *instanceRepository) GetInstanceByID(...)`
- Constructor functions use `&structType{}` and return the interface: `return &instanceHandler{...}`

### Interface Naming

- Service interfaces use `Service` suffix: `InstanceService`, `WhatsmeowService`
- Repository interfaces use `Repository` suffix: `InstanceRepository`, `MessageRepository`
- Implementations are lowercase: `instances`, `instanceHandler`
- Consider defining interfaces close to where they're consumed

### Error Handling

- Always check errors from DB/service calls
- Return early with descriptive error messages
- Use `fmt.Errorf` for error wrapping, `errors.New` for simple errors
- Do NOT use `_` to discard errors from significant operations

### Handler Struct Public Methods

All handler methods that serve HTTP endpoints are public (PascalCase). Private methods are camelCase.

---

## Forbidden Patterns

- **Global state** beyond `main()` (except `core` package's `var _cl *gorm.DB` and `atomic.Pointer` which are intentional)
- **Unused imports** or variables
- **Panics** outside `main()` (use error returns)
- **Mutable shared maps** without synchronization — always use `sync.RWMutex`
- **Overwriting request body** without restoring it via `io.NopCloser`
- **Magic strings** for event types — always reference `event_types` constants
- **Direct file I/O** in handler code — put it in services
- **Hardcoded timeouts** — use config or reasonable constants

---

## Testing Requirements

- Tests live alongside source code in `_test.go` files
- Example: `pkg/utils/utils_test.go`

### Current Test Coverage

```
pkg/utils/utils_test.go  // Exists — contains basic utility tests
```

### Test Writing Guidelines

- Use Go's built-in `testing` package (no Ginkgo/Gomega)
- Table-driven tests preferred:
  ```go
  func TestCreateJID(t *testing.T) {
      tests := []struct {
          name    string
          input   string
          want    string
          wantErr bool
      }{
          {"empty string", "", "", true},
          {"already jid", "5511999999999@s.whatsapp.net", "5511999999999@s.whatsapp.net", false},
      }
      for _, tt := range tests {
          t.Run(tt.name, func(t *testing.T) {
              got, err := CreateJID(tt.input)
              if (err != nil) != tt.wantErr {
                  t.Errorf("CreateJID() error = %v, wantErr %v", err, tt.wantErr)
                  return
              }
              if got != tt.want {
                  t.Errorf("CreateJID() = %v, want %v", got, tt.want)
              }
          })
      }
  }
  ```

- Mock interfaces for service/repository tests when needed
- Do NOT require a live database for unit tests

---

## Code Review Checklist

Before approving changes:

- [ ] New types/structs follow domain package conventions
- [ ] Error messages are clear and not misleading
- [ ] No exposed secrets (API keys, tokens in logs)
- [ ] Import aliases follow `<domain>_<layer>` pattern for sibling packages
- [ ] Handler returns proper HTTP status codes
- [ ] No `log.Fatal` outside `main()`
- [ ] Config changes have corresponding env var in `.env.example`
- [ ] Existing `_test.go` files still pass
