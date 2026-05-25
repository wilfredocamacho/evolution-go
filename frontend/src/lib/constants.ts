export const API_BASE = import.meta.env.VITE_API_URL || "";

export const STORAGE_KEY = "evo_api_key";

export const ENDPOINTS = {
  // Instance (admin)
  INSTANCE_CREATE: "/instance/create",
  INSTANCE_ALL: "/instance/all",
  INSTANCE_INFO: (id: string) => `/instance/info/${id}`,
  INSTANCE_DELETE: (id: string) => `/instance/delete/${id}`,
  INSTANCE_SET_PROXY: (id: string) => `/instance/proxy/${id}`,
  INSTANCE_DELETE_PROXY: (id: string) => `/instance/proxy/${id}`,
  INSTANCE_FORCE_RECONNECT: (id: string) => `/instance/forcereconnect/${id}`,
  INSTANCE_LOGS: (id: string) => `/instance/logs/${id}`,
  INSTANCE_ADVANCED_SETTINGS: (id: string) =>
    `/instance/${id}/advanced-settings`,

  // Instance (auth)
  INSTANCE_CONNECT: "/instance/connect",
  INSTANCE_STATUS: "/instance/status",
  INSTANCE_QR: "/instance/qr",
  INSTANCE_PAIR: "/instance/pair",
  INSTANCE_DISCONNECT: "/instance/disconnect",
  INSTANCE_RECONNECT: "/instance/reconnect",
  INSTANCE_LOGOUT: "/instance/logout",

  // Send
  SEND_TEXT: "/send/text",
  SEND_LINK: "/send/link",
  SEND_MEDIA: "/send/media",
  SEND_POLL: "/send/poll",
  SEND_STICKER: "/send/sticker",
  SEND_LOCATION: "/send/location",
  SEND_CONTACT: "/send/contact",
  SEND_BUTTON: "/send/button",
  SEND_LIST: "/send/list",
  SEND_CAROUSEL: "/send/carousel",
  SEND_STATUS_TEXT: "/send/status/text",
  SEND_STATUS_MEDIA: "/send/status/media",

  // Server
  SERVER_OK: "/server/ok",
};
