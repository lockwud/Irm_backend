import { workflow } from "../../seed.js";

type DeviceToken = {
  token: string;
  platform: string;
  role?: string;
  registeredAt: string;
};

const deviceTokens: DeviceToken[] = [];

export class NotificationsService {
  list() {
    return workflow.notifications;
  }

  markAllRead() {
    workflow.notifications = workflow.notifications.map((item) => ({ ...item, read: true }));
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
    return { registered: true, token: record.token, totalDevices: deviceTokens.length };
  }
}
