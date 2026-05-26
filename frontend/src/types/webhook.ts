export interface WebhookSession {
  remoteJid: string
  pushName: string
  status: "opened" | "closed"
  startedAt: string
  updatedAt: string
}

export interface WebhookPayload {
  chatInput: string
  sessionId: string
  remoteJid: string
  pushName: string
  instanceName: string
  instanceId: string
  apiKey: string
}

export interface WebhookResponse {
  output?: string
  answer?: string
  data?: { output?: string; answer?: string }
}

export interface Webhook {
  id: string
  instanceId: string
  enabled: boolean
  description: string
  webhookUrl: string
  basicAuthUser: string
  basicAuthPass: string
  triggerType: "all" | "keyword" | "advanced"
  triggerOperator: string
  triggerValue: string
  keywordFinish: string
  expire: number
  listeningFromMe: boolean
  stopBotFromMe: boolean
  isTrusted: boolean
  ignoreJids: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateWebhookPayload {
  enabled?: boolean
  description?: string
  webhookUrl: string
  basicAuthUser?: string
  basicAuthPass?: string
  triggerType?: string
  triggerOperator?: string
  triggerValue?: string
  keywordFinish?: string
  expire?: number
  listeningFromMe?: boolean
  stopBotFromMe?: boolean
  isTrusted?: boolean
  ignoreJids?: string[]
}

export interface WebhookSessionStatus {
  remoteJid: string
  status: "closed" | "delete"
}