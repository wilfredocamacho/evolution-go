import { apiPost } from "./api-client";
import { ENDPOINTS } from "./constants";
import type { ApiResponse } from "@/types/api";
import type {
  SendText,
  SendLink,
  SendMedia,
  SendPoll,
  SendSticker,
  SendLocation,
  SendContact,
  SendButton,
  SendList,
  SendCarousel,
  SendStatusText,
  SendStatusMedia,
} from "@/types/send";

export async function sendText(
  instanceId: string,
  data: SendText
): Promise<void> {
  await apiPost<ApiResponse<void>>(ENDPOINTS.SEND_TEXT, data, { instanceId });
}

export async function sendLink(
  instanceId: string,
  data: SendLink
): Promise<void> {
  await apiPost<ApiResponse<void>>(ENDPOINTS.SEND_LINK, data, { instanceId });
}

export async function sendMedia(
  instanceId: string,
  data: SendMedia
): Promise<void> {
  const formData = new FormData();
  formData.append("number", data.number);
  formData.append("type", data.type);
  if (data.caption) formData.append("caption", data.caption);
  if (data.filename) formData.append("filename", data.filename);
  if (data.delay) formData.append("delay", String(data.delay));
  if (data.media) {
    formData.append("media", data.media);
  } else if (data.url) {
    formData.append("url", data.url);
  }
  await apiPost<ApiResponse<void>>(ENDPOINTS.SEND_MEDIA, formData, {
    instanceId,
    isFormData: true,
  });
}

export async function sendPoll(
  instanceId: string,
  data: SendPoll
): Promise<void> {
  await apiPost<ApiResponse<void>>(ENDPOINTS.SEND_POLL, data, { instanceId });
}

export async function sendSticker(
  instanceId: string,
  data: SendSticker
): Promise<void> {
  await apiPost<ApiResponse<void>>(ENDPOINTS.SEND_STICKER, data, {
    instanceId,
  });
}

export async function sendLocation(
  instanceId: string,
  data: SendLocation
): Promise<void> {
  await apiPost<ApiResponse<void>>(ENDPOINTS.SEND_LOCATION, data, {
    instanceId,
  });
}

export async function sendContact(
  instanceId: string,
  data: SendContact
): Promise<void> {
  await apiPost<ApiResponse<void>>(ENDPOINTS.SEND_CONTACT, data, {
    instanceId,
  });
}

export async function sendButton(
  instanceId: string,
  data: SendButton
): Promise<void> {
  await apiPost<ApiResponse<void>>(ENDPOINTS.SEND_BUTTON, data, {
    instanceId,
  });
}

export async function sendList(
  instanceId: string,
  data: SendList
): Promise<void> {
  await apiPost<ApiResponse<void>>(ENDPOINTS.SEND_LIST, data, { instanceId });
}

export async function sendCarousel(
  instanceId: string,
  data: SendCarousel
): Promise<void> {
  await apiPost<ApiResponse<void>>(ENDPOINTS.SEND_CAROUSEL, data, {
    instanceId,
  });
}

export async function sendStatusText(
  instanceId: string,
  data: SendStatusText
): Promise<void> {
  await apiPost<ApiResponse<void>>(ENDPOINTS.SEND_STATUS_TEXT, data, {
    instanceId,
  });
}

export async function sendStatusMedia(
  instanceId: string,
  data: SendStatusMedia
): Promise<void> {
  const formData = new FormData();
  formData.append("type", data.type);
  if (data.caption) formData.append("caption", data.caption);
  if (data.media) {
    formData.append("media", data.media);
  } else if (data.url) {
    formData.append("url", data.url);
  }
  await apiPost<ApiResponse<void>>(ENDPOINTS.SEND_STATUS_MEDIA, formData, {
    instanceId,
    isFormData: true,
  });
}
