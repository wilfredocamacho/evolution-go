# Webhooks Multi-Trigger com Chatbot

> Gerencie múltiplos webhooks com triggers baseados em regex, sessões de conversa e integração bidirecional com serviços externos.

## Visão Geral

O sistema de Webhooks Multi-Trigger substitui o webhook único por uma arquitetura flexível onde cada instância pode ter **N webhooks**, cada um com seu próprio **trigger** e **URL**. Quando uma mensagem coincide com um trigger, o webhook é disparado e uma **sessão** é criada para aquele número.

### Fluxo Completo

```
Mensagem WhatsApp → Event Handler
  → [Webhook único existente] — eventos gerais (inalterado)
  → [Chatbot Listener] — avalia triggers e gerencia sessões
     ├─ Webhook A (trigger: "ajuda") → match? → POST → resposta → WhatsApp
     ├─ Webhook B (trigger: "preço") → match? → POST → resposta → WhatsApp
     └─ Webhook C (trigger: regex)   → match? → POST → resposta → WhatsApp
```

### Quando Usar

- **Chatbot com n8n/Make/Zapier**: cada endpoint tem seu próprio webhook
- **Roteamento inteligente**: mensagens de "vendas" vão pra um webhook, "suporte" pra outro
- **Múltiplas integrações**: mesmo número pode conversar com diferentes bots simultaneamente

---

## Trigger Types

Cada webhook define **como** as mensagens são avaliadas para disparar o webhook.

| Type | Descrição | Operadores |
|------|-----------|------------|
| `all` | Todas as mensagens (apenas 1 por instância) | — |
| `keyword` | Match por palavra-chave com operador | equals, contains, startsWith, endsWith, regex |
| `advanced` | Operadores compostos (AND/OR) | contains, notcontains, startsWith, endsWith, exact |

### Ordem de Avaliação

1. `all` / `none` — sempre match
2. `advanced` — operadores compostos
3. `keyword:equals` — igualdade exata
4. `keyword:regex` — expressão regular
5. `keyword:startsWith` — prefixo
6. `keyword:endsWith` — sufixo
7. `keyword:contains` — substring

> **Nota**: Múltiplos webhooks podem coincidir com a mesma mensagem. **Todos** os que fizerem match serão disparados simultaneamente.

---

## Sistema de Sessões

### Como Funciona

Quando um trigger coincide e não há sessão ativa para aquele par (webhook + número), uma **sessão** é criada em memória:

```
Estado: opened
```

Uma vez com sessão aberta, **todas as mensagens seguintes** daquele número vão direto para o webhook, sem reavaliar o trigger.

### Estados

| Estado | Descrição |
|--------|-----------|
| `opened` | Sessão ativa. Mensagens vão direto ao webhook |
| `closed` | Sessão fechada. Próxima trigger match cria nova sessão |

> `paused` foi removido. O campo `stopBotFromMe` agora usa `closed` como estado padrão.

### Fechamento Automático

- **keywordFinish**: quando o usuário envia a palavra configurada, a sessão é fechada
- **Timeout**: após 5 minutos de inatividade, a sessão é removida automaticamente
- **API**: via endpoint `/webhook/change-status`

---

## API Reference

### Criar Webhook

`POST /webhook/create/:instanceId` — Requer `GlobalApiKey`

**Request Body:**
```json
{
  "enabled": true,
  "description": "Chatbot de soporte",
  "webhookUrl": "https://n8n.midominio.com/webhook/abc123",
  "basicAuthUser": "user",
  "basicAuthPass": "pass123",
  "triggerType": "keyword",
  "triggerOperator": "regex",
  "triggerValue": "ayuda|soporte|problema",
  "keywordFinish": "salir",
  "expire": 300,
  "listeningFromMe": false,
  "stopBotFromMe": false,
  "ignoreJids": ["5551999999999@s.whatsapp.net"]
}
```

**Response (200):**
```json
{
  "message": "success",
  "data": {
    "id": "uuid-do-webhook",
    "instanceId": "uuid-da-instancia",
    "enabled": true,
    "description": "Chatbot de soporte",
    "webhookUrl": "https://n8n.midominio.com/webhook/abc123",
    "triggerType": "keyword",
    "triggerOperator": "regex",
    "triggerValue": "ayuda|soporte|problema",
    "keywordFinish": "salir",
    "expire": 300,
    "listeningFromMe": false,
    "stopBotFromMe": false,
    "ignoreJids": ["5551999999999@s.whatsapp.net"],
    "createdAt": "2026-05-25T..."
  }
}
```

### Listar Webhooks

`GET /webhook/find/:instanceId` — Requer `GlobalApiKey`

Query param: `instanceId` ou usa o token da instância autenticada.

**Response (200):**
```json
{
  "message": "success",
  "data": [
    { ...webhook... },
    { ...webhook... }
  ]
}
```

### Obter Webhook

`GET /webhook/fetch/:webhookId` — Requer `GlobalApiKey`

**Response (200):**
```json
{
  "message": "success",
  "data": { ...webhook... }
}
```

**Response (404):**
```json
{
  "error": "webhook not found"
}
```

### Atualizar Webhook

`PUT /webhook/update/:webhookId` — Requer `GlobalApiKey`

Mesmo body do Create. Campos omitidos mantêm valor atual.

**Response (200):**
```json
{
  "message": "success",
  "data": { ...webhook atualizado... }
}
```

### Deletar Webhook

`DELETE /webhook/delete/:webhookId` — Requer `GlobalApiKey`

Remove o webhook e **todas as sessões ativas** associadas a ele.

**Response (200):**
```json
{
  "message": "success"
}
```

### Listar Sessões

`GET /webhook/sessions/:instanceId` — Requer `GlobalApiKey`

Retorna todas as sessões ativas (e recém-fechadas) associadas à instância.

**Response (200):**
```json
{
  "message": "success",
  "data": [
    {
      "sessionId": "webhook-uuid:5511999999999@s.whatsapp.net",
      "remoteJid": "5511999999999@s.whatsapp.net",
      "pushName": "João",
      "status": "opened",
      "webhookId": "uuid-do-webhook",
      "instanceId": "uuid-da-instancia",
      "expire": 300,
      "createdAt": "2026-05-25T18:30:00Z",
      "lastActive": "2026-05-25T18:35:00Z"
    }
  ]
}
```

### Mudar Estado da Sessão

`POST /webhook/change-status` — Requer `token da instância`

**Request Body:**
```json
{
  "remoteJid": "5511999999999@s.whatsapp.net",
  "status": "closed"
}
```

| Status | Efeito |
|--------|--------|
| `closed` | Marca sessão como fechada. Próxima trigger match reabre |
| `delete` | Remove sessão da memória completamente |

**Response (200):**
```json
{
  "message": "success"
}
```

---

## Gerenciamento via Frontend

O Evolution GO Manager Web (painel administrativo em `/manager/`) oferece uma interface completa para gerenciar webhooks:

### Acesso

1. Faça login em `/manager/login` com sua **GlobalApiKey**
2. Selecione uma instância no dashboard
3. Aba **Webhook** no detalhe da instância

### Funcionalidades da Interface

- **Listar webhooks**: cards com descrição, URL, tipo de trigger e status
- **Criar webhook**: formulário completo com todos os campos
- **Editar webhook**: alterar URL, trigger, sessão e segurança
- **Ativar/Desativar**: toggle para habilitar/desabilitar sem deletar
- **Excluir webhook**: remove permanentemente
- **Webhook confiável**: switch `isTrusted` para controlar envio de `apiKey`
- **Sesiones**: botão que abre modal com sessões ativas, polling 5s, botões Cerrar/Eliminar por número

### Campos no Formulário

| Seção | Campos |
|-------|--------|
| **URL** | URL do Webhook (obrigatório) |
| **Trigger** | Tipo (all/keyword/advanced), Operador, Valor |
| **Sessão** | Palavra para fechar sessão, Timeout (segundos) |
| **Opções** | Habilitado, Escutar próprios, Pausar ao enviar, Confiável |
| **Autenticação** | Basic Auth usuário e senha |
| **Ignorar** | JIDs a ignorar (um por linha) |

---

## Payload do Webhook

Quando uma mensagem é disparada para o webhook, o payload enviado é:

```json
{
  "chatInput": "Olá, preciso de ajuda",
  "sessionId": "5511999999999@s.whatsapp.net",
  "remoteJid": "5511999999999@s.whatsapp.net",
  "pushName": "João",
  "instanceName": "meu-whatsapp",
  "instanceId": "uuid-da-instancia",
  "apiKey": "token-da-instancia"
}
```

> **Atenção**: `apiKey` **só é enviado** quando o webhook tem o campo `isTrusted: true`. Para webhooks não confiáveis, o campo `apiKey` é omitido do payload por segurança.

### Resposta Esperada

Para que a resposta seja reenviada ao WhatsApp, o webhook deve responder com:

```json
{
  "output": "Olá! Como posso ajudar?"
}
```

Ou nos formatos alternativos:
- `{ "answer": "..." }`
- `{ "data": { "output": "..." } }`
- `{ "data": { "answer": "..." } }`

Se a resposta for vazia, nada é enviado ao WhatsApp.

---

## Integração com n8n

### Exemplo: Chatbot com n8n

**1. Crie um webhook no evolution-go:**
```bash
curl -X POST https://seu-server.com/webhook/create/instance-uuid \
  -H "apikey: SUA-GLOBAL-API-KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "webhookUrl": "https://seu-n8n.com/webhook/chatbot",
    "triggerType": "all",
    "keywordFinish": "sair"
  }'
```

**2. Workflow no n8n:**
```
[Webhook] → [Code: Parse Input] → [Seu Serviço] → [Evolution API Send]
```

- **Webhook**: recebe o POST do evolution-go com o payload
- **Parse Input**: extrai `chatInput`, `remoteJid`, `instanceName`, `apiKey`
- **Responder**: retorna `{ "output": "resposta" }`
- O evolution-go reenvia a resposta ao WhatsApp automaticamente

**3. Fechar sessão via API:**
```bash
curl -X POST https://seu-server.com/webhook/change-status \
  -H "apikey: token-da-instancia" \
  -H "Content-Type: application/json" \
  -d '{
    "remoteJid": "5511999999999@s.whatsapp.net",
    "status": "closed"
  }'
```

---

## Configurações por Webhook

| Campo | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `enabled` | boolean | `true` | Liga/desliga o webhook |
| `description` | string | — | Identificação do webhook |
| `webhookUrl` | string | — | URL para onde enviar o POST |
| `basicAuthUser` | string | — | Usuário para Basic Auth |
| `basicAuthPass` | string | — | Senha para Basic Auth |
| `triggerType` | string | — | `all`, `keyword`, `advanced` |
| `triggerOperator` | string | — | `equals`, `contains`, `startsWith`, `endsWith`, `regex` |
| `triggerValue` | string | — | Valor do trigger (palavra, regex) |
| `keywordFinish` | string | — | Palavra que fecha a sessão |
| `expire` | int | `300` | Timeout da sessão em segundos (5 min) |
| `listeningFromMe` | boolean | `false` | Responder a mensagens enviadas pelo próprio número |
| `stopBotFromMe` | boolean | `false` | Fechar sessão quando o usuário envia mensagem |
| `isTrusted` | boolean | `false` | Se `true`, inclui `apiKey` no payload do webhook |
| `ignoreJids` | array | `[]` | Lista de JIDs a ignorar |

### Ignore JIDs

Use `ignoreJids` para ignorar mensagens de números específicos ou tipos de chat:

```json
{
  "ignoreJids": [
    "5511999999999@s.whatsapp.net",  // ignora contato específico
    "@g.us",                          // ignora TODOS os grupos
    "@s.whatsapp.net"                 // ignora TODOS os contatos 1:1
  ]
}
```

---

## Mensagens de Áudio

Quando o conteúdo da mensagem contém `audioMessage`, o sistema detecta automaticamente. Se o serviço de transcrição (Whisper) estiver disponível, o áudio é transcrito e prefixado como `[audio] transcrição` no campo `chatInput` do payload.

Sem Whisper disponível, o áudio é ignorado para o chatbot.

---

## Compatibilidade

- O **webhook único existente** (`instance.webhook`) continua funcionando normalmente para eventos gerais
- O novo sistema é **exclusivo para mensagens** (event type `Message`)
- RabbitMQ, NATS e WebSocket não são afetados
