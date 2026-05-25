import { apiGet, apiPost, apiPut, apiDelete, extractData, setInstanceTokenCache } from "./api-client";
import { ENDPOINTS } from "./constants";
import type { ApiResponse } from "@/types/api";
import type {
  Instance,
  AdvancedSettings,
  CreateInstancePayload,
  SetProxyStruct,
  QrcodeStruct,
  StatusStruct,
  PairReturnStruct,
} from "@/types/instance";

export async function createInstance(
  payload: CreateInstancePayload
): Promise<Instance> {
  const res = await apiPost<ApiResponse<Instance>>(
    ENDPOINTS.INSTANCE_CREATE,
    payload,
    { isAdmin: true }
  );
  const instance = extractData(res)!;
  setInstanceTokenCache(instance.id, instance.token);
  return instance;
}

export async function getAllInstances(): Promise<Instance[]> {
  const res = await apiGet<ApiResponse<Instance[]>>(ENDPOINTS.INSTANCE_ALL, {
    isAdmin: true,
  });
  const instances = extractData(res) || [];
  instances.forEach((inst) =>
    setInstanceTokenCache(inst.id, inst.token)
  );
  return instances;
}

export async function getInstanceInfo(id: string): Promise<Instance> {
  const res = await apiGet<ApiResponse<Instance>>(
    ENDPOINTS.INSTANCE_INFO(id),
    { isAdmin: true }
  );
  const instance = extractData(res)!;
  if (instance && instance.token) {
    setInstanceTokenCache(instance.id, instance.token);
  }
  return instance;
}

export async function deleteInstance(id: string): Promise<void> {
  await apiDelete<ApiResponse<void>>(ENDPOINTS.INSTANCE_DELETE(id), {
    isAdmin: true,
  });
}

export async function connectInstance(
  instanceId: string,
  data?: { webhookUrl?: string; subscribe?: string[]; phone?: string }
): Promise<void> {
  await apiPost<ApiResponse<void>>(
    ENDPOINTS.INSTANCE_CONNECT,
    data || {},
    { instanceId }
  );
}

export async function reconnectInstance(
  instanceId: string
): Promise<void> {
  await apiPost<ApiResponse<void>>(ENDPOINTS.INSTANCE_RECONNECT, {}, { instanceId });
}

export async function disconnectInstance(
  instanceId: string
): Promise<void> {
  await apiPost<ApiResponse<void>>(ENDPOINTS.INSTANCE_DISCONNECT, {}, { instanceId });
}

export async function logoutInstance(
  instanceId: string
): Promise<void> {
  await apiDelete<ApiResponse<void>>(ENDPOINTS.INSTANCE_LOGOUT, {
    instanceId,
  });
}

export async function getInstanceQr(
  instanceId: string
): Promise<QrcodeStruct> {
  const res = await apiGet<ApiResponse<QrcodeStruct>>(
    ENDPOINTS.INSTANCE_QR,
    { instanceId }
  );
  return extractData(res)!;
}

export async function getInstanceStatus(
  instanceId: string
): Promise<StatusStruct> {
  const res = await apiGet<ApiResponse<StatusStruct>>(
    ENDPOINTS.INSTANCE_STATUS,
    { instanceId }
  );
  return extractData(res)!;
}

export async function pairInstance(
  instanceId: string,
  phone: string
): Promise<string> {
  const res = await apiPost<ApiResponse<PairReturnStruct>>(
    ENDPOINTS.INSTANCE_PAIR,
    { phone },
    { instanceId }
  );
  return extractData(res)!.pairingCode;
}

export async function getAdvancedSettings(
  instanceId: string
): Promise<AdvancedSettings> {
  return apiGet<AdvancedSettings>(
    ENDPOINTS.INSTANCE_ADVANCED_SETTINGS(instanceId),
    { instanceId }
  );
}

export async function updateAdvancedSettings(
  instanceId: string,
  settings: AdvancedSettings
): Promise<void> {
  await apiPut<ApiResponse<void>>(
    ENDPOINTS.INSTANCE_ADVANCED_SETTINGS(instanceId),
    settings,
    { instanceId }
  );
}

export async function setProxy(
  instanceId: string,
  proxy: SetProxyStruct
): Promise<void> {
  await apiPost<ApiResponse<void>>(
    ENDPOINTS.INSTANCE_SET_PROXY(instanceId),
    proxy,
    { isAdmin: true }
  );
}

export async function deleteProxy(instanceId: string): Promise<void> {
  await apiDelete<ApiResponse<void>>(
    ENDPOINTS.INSTANCE_DELETE_PROXY(instanceId),
    { isAdmin: true }
  );
}

export async function forceReconnect(
  instanceId: string,
  number: string
): Promise<void> {
  await apiPost<ApiResponse<void>>(
    ENDPOINTS.INSTANCE_FORCE_RECONNECT(instanceId),
    { number },
    { isAdmin: true }
  );
}
