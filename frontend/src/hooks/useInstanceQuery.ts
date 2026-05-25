import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as instanceApi from "@/lib/instance-api";
import type {
  CreateInstancePayload,
  AdvancedSettings,
  SetProxyStruct,
} from "@/types/instance";

const INSTANCES_KEY = ["instances"] as const;

export function useInstances() {
  return useQuery({
    queryKey: INSTANCES_KEY,
    queryFn: instanceApi.getAllInstances,
    refetchInterval: 10_000,
  });
}

export function useInstance(id: string) {
  return useQuery({
    queryKey: [...INSTANCES_KEY, id],
    queryFn: () => instanceApi.getInstanceInfo(id),
    enabled: !!id,
  });
}

export function useCreateInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInstancePayload) =>
      instanceApi.createInstance(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INSTANCES_KEY });
      toast.success("Instance created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => instanceApi.deleteInstance(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INSTANCES_KEY });
      toast.success("Instance deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useConnectInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      webhookUrl?: string;
      subscribe?: string[];
    }) => instanceApi.connectInstance(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INSTANCES_KEY });
      toast.success("Instance connected");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useReconnectInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => instanceApi.reconnectInstance(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INSTANCES_KEY });
      toast.success("Instance reconnected");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDisconnectInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => instanceApi.disconnectInstance(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INSTANCES_KEY });
      toast.success("Instance disconnected");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useLogoutInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => instanceApi.logoutInstance(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INSTANCES_KEY });
      toast.success("Instance logged out");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useInstanceQr(id: string, enabled: boolean) {
  return useQuery({
    queryKey: [...INSTANCES_KEY, id, "qr"],
    queryFn: () => instanceApi.getInstanceQr(id),
    enabled,
    refetchInterval: enabled ? 2_000 : false,
  });
}

export function useInstanceStatus(id: string, enabled: boolean) {
  return useQuery({
    queryKey: [...INSTANCES_KEY, id, "status"],
    queryFn: () => instanceApi.getInstanceStatus(id),
    enabled,
    refetchInterval: enabled ? 3_000 : false,
  });
}

export function usePairInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, phone }: { id: string; phone: string }) =>
      instanceApi.pairInstance(id, phone),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INSTANCES_KEY });
      toast.success("Pairing code generated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useAdvancedSettings(id: string) {
  return useQuery({
    queryKey: [...INSTANCES_KEY, id, "advanced-settings"],
    queryFn: () => instanceApi.getAdvancedSettings(id),
    enabled: !!id,
  });
}

export function useUpdateAdvancedSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      settings,
    }: {
      id: string;
      settings: AdvancedSettings;
    }) => instanceApi.updateAdvancedSettings(id, settings),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INSTANCES_KEY });
      toast.success("Settings updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSetProxy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      proxy,
    }: {
      id: string;
      proxy: SetProxyStruct;
    }) => instanceApi.setProxy(id, proxy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INSTANCES_KEY });
      toast.success("Proxy set");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteProxy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => instanceApi.deleteProxy(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: INSTANCES_KEY });
      toast.success("Proxy removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
