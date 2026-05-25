# Error Handling

> How errors are handled in this project.

---

## Layer-by-Layer Error Handling

### Handler Layer

Handlers are responsible for:
1. Parsing and validating request input
2. Calling the service layer
3. Returning appropriate HTTP responses with `gin.H` JSON

Pattern for every handler method:

```go
func (h *instanceHandler) Create(ctx *gin.Context) {
    var data *instance_service.CreateStruct
    err := ctx.ShouldBindJSON(&data)
    if err != nil {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    if data.Name == "" {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
        return
    }

    result, err := h.instanceService.Create(data)
    if err != nil {
        ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    ctx.JSON(http.StatusOK, gin.H{"message": "success", "data": result})
}
```

**Response format:**
- Success: `gin.H{"message": "success", "data": <value>}`
- Error: `gin.H{"error": <error string>}`
- HTTP status codes reflect the error type (400, 401, 404, 500)

### Service Layer

Services return Go `error` values. They:
- Use `fmt.Errorf` for wrapping: `fmt.Errorf("instance already exists")`
- Use `errors.New` for simple messages: `errors.New("no active session found")`
- Can use `%w` to wrap errors for `errors.Is`/`errors.As` unwrapping
- Do NOT log errors at catch sites — errors propagate to handlers

### Repository Layer

Repositories return raw GORM errors. The caller decides how to handle `gorm.ErrRecordNotFound`:

```go
func (r *messageRepository) GetMessageByID(messageID string) (*message_model.Message, error) {
    var message message_model.Message
    err := r.db.Where("message_id = ?", messageID).First(&message).Error
    if err != nil {
        if err == gorm.ErrRecordNotFound {
            return nil, nil  // Not found is not an error here
        }
        return nil, err
    }
    return &message, nil
}
```

---

## Input Validation

Validation happens in **handlers** (not services), before calling the service:

```go
if data.Name == "" {
    ctx.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
    return
}
```

For complex JID validation, use the `JIDValidationMiddleware`:

```go
routes.POST("/pair", r.jidValidationMiddleware.ValidateNumberField(), r.instanceHandler.Pair)
```

---

## Middleware Errors

### Auth Middleware

Auth errors return 401 with a generic message to avoid leaking information:

```go
func (m middleware) Auth(ctx *gin.Context) {
    token := ctx.GetHeader("apikey")
    if token == "" {
        ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "not authorized"})
        return
    }
    instance, err := m.instanceService.GetInstanceByToken(token)
    if err != nil {
        ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "not authorized"})
        return
    }
    ctx.Set("instance", instance)
    ctx.Next()
}
```

### License Gate Middleware

License validation returns 503 with a structured error:

```go
c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{
    "error":        "service not activated",
    "code":         "LICENSE_REQUIRED",
    "register_url": managerURL,
    "message":      "License required. Open the manager to activate your license.",
})
```

---

## Common Patterns

### Success Response

```go
ctx.JSON(http.StatusOK, gin.H{"message": "success", "data": result})
```

### Instance from Context

Handlers that need the authenticated instance extract it from the gin context:

```go
getInstance := ctx.MustGet("instance")
instance, ok := getInstance.(*instance_model.Instance)
if !ok {
    ctx.JSON(http.StatusInternalServerError, gin.H{"error": "instance not found"})
    return
}
```

### Forbidden Patterns

- Do NOT call `log.Fatal` or `panic` in handlers/services — only in `main()`
- Do NOT expose internal error details in production responses
- Do NOT swallow errors with `_`
- Do NOT use string error codes in responses (use `code` field when needed, as in license gate)
