import { apiGet, apiPost, apiPut, apiDelete, extractData } from "./api-client"
import type { ApiResponse } from "@/types/api"
import type { Webhook, CreateWebhookPayload, WebhookSessionStatus } from "@/types/webhook"

export async function getWebhooks(instanceId: string): Promise<Webhook[]> {
  const res = await apiGet<ApiResponse<Webhook[]>>(
    `/webhook/find/${instanceId}`,
    { isAdmin: true }
  )
  return extractData(res) || []
}

export async function getWebhook(id: string): Promise<Webhook> {
  const res = await apiGet<ApiResponse<Webhook>>(
    `/webhook/fetch/${id}`,
    { isAdmin: true }
  )
  return extractData(res)!
}

export async function createWebhook(
  instanceId: string,
  payload: CreateWebhookPayload
): Promise<Webhook> {
  const res = await apiPost<ApiResponse<Webhook>>(
    `/webhook/create/${instanceId}`,
    payload,
    { isAdmin: true }
  )
  return extractData(res)!
}

export async function updateWebhook(
  id: string,
  payload: Partial<CreateWebhookPayload>
): Promise<Webhook> {
  const res = await apiPut<ApiResponse<Webhook>>(
    `/webhook/update/${id}`,
    payload,
    { isAdmin: true }
  )
  return extractData(res)!
}

export async function deleteWebhook(id: string): Promise<void> {
  await apiDelete<ApiResponse<void>>(
    `/webhook/delete/${id}`,
    { isAdmin: true }
  )
}

export async function changeSessionStatus(
  instanceId: string,
  payload: WebhookSessionStatus
): Promise<void> {
  await apiPost<ApiResponse<void>>(
    "/webhook/change-status",
    payload,
    { instanceId }
  )
}