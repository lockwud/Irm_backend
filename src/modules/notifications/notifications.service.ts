import { persistDemoState, workflow } from "../../seed.js";
import { persistState, readState } from "../../database/state-store.js";

type DeviceToken = {
  token: string;
  platform: string;
  role?: string;
  registeredAt: string;
};

const deviceTokens: DeviceToken[] = [];

export async function hydrateDeviceTokensFromPostgres() {
  const saved = await readState<DeviceToken[]>("sip.device-tokens");
  if (Array.isArray(saved)) deviceTokens.splice(0, deviceTokens.length, ...saved);
  else await persistState("sip.device-tokens", deviceTokens);
}

function persistDeviceTokens() {
  persistState("sip.device-tokens", deviceTokens);
}

export class NotificationsService {
  list() {
    return workflow.notifications;
  }

  markAllRead() {
    workflow.notifications = workflow.notifications.map((item) => ({ ...item, read: true }));
    persistDemoState();
    return workflow.notifications;
  }

  registerDevice(input: { token?: string; platform?: string; role?: string }) {
    if (!input.token) throw new Error("Device token is required");
    const record = {
      token: input.token,
      platform: input.platform || "web",
      role: input.role,
      registeredAt: new Date().toISOString(),
    };
    const existing = deviceTokens.findIndex((item) => item.token === record.token);
    if (existing >= 0) deviceTokens[existing] = record;
    else deviceTokens.push(record);
    persistDeviceTokens();
    return { registered: true, token: record.token, totalDevices: deviceTokens.length };
  }
}
