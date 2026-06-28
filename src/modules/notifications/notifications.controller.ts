import type { Request, Response } from "express";
import { NotificationsService } from "./notifications.service.js";

export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  list = (_request: Request, response: Response) => response.json(this.notificationsService.list());

  markAllRead = (_request: Request, response: Response) => response.json(this.notificationsService.markAllRead());

  registerDevice = (request: Request, response: Response) => {
    try {
      response.status(201).json(this.notificationsService.registerDevice(request.body));
    } catch (error) {
      response.status(400).json({ error: error instanceof Error ? error.message : "Could not register device" });
    }
  };
}
