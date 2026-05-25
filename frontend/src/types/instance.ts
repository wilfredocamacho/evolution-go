export interface Instance {
  id: string;
  name: string;
  token: string;
  webhook: string;
  rabbitmqEnable: string;
  websocketEnable: string;
  natsEnable: string;
  jid: string;
  qrcode: string;
  connected: boolean;
  expiration: number;
  disconnect_reason: string;
  events: string;
  os_name: string;
  proxy: string;
  client_name: string;
  createdAt: string;
  alwaysOnline: boolean;
  rejectCall: boolean;
  msgRejectCall: string;
  readMessages: boolean;
  ignoreGroups: boolean;
  ignoreStatus: boolean;
}

export interface AdvancedSettings {
  alwaysOnline: boolean;
  rejectCall: boolean;
  msgRejectCall: string;
  readMessages: boolean;
  ignoreGroups: boolean;
  ignoreStatus: boolean;
}

export interface CreateInstancePayload {
  name: string;
  token: string;
  webhook?: string;
  proxy?: ProxyConfig;
  advancedSettings?: AdvancedSettings;
}

export interface ProxyConfig {
  protocol?: string;
  host: string;
  port: string;
  username: string;
  password: string;
}

export interface SetProxyStruct {
  protocol?: string;
  host: string;
  port: string;
  username?: string;
  password?: string;
}

export interface QrcodeStruct {
  qrcode: string;
  code: string;
}

export interface StatusStruct {
  connected: boolean;
  loggedIn: boolean;
  name: string;
}

export interface PairReturnStruct {
  pairingCode: string;
}
