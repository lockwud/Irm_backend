import { Router } from "express";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../../common/auth.middleware.js";
import type { FeatureModule } from "../../common/router.js";
import { env } from "../../config/env.js";
import { createPrismaClient } from "../../database/prisma.service.js";

type LessonGuideBody = {
  prompt?: string;
  mode?: "Weekly" | "Termly";
  subject?: string;
  topic?: string;
  className?: string;
  week?: string;
  weekEnding?: string;
  planner?: Record<string, unknown>;
};
type LessonAiMessage = { role: "assistant" | "student"; text: string; createdAt?: string };
type LessonAiChat = {
  id: string;
  title: string;
  subject: string;
  topic: string;
  mode: "Weekly" | "Termly";
  studentIdentifier: string;
  createdAt: string;
  updatedAt: string;
  messages: LessonAiMessage[];
};

const router = Router();
router.use(requireAuth);
let prisma: ReturnType<typeof createPrismaClient> | null = null;

function database() {
  if (!prisma) prisma = createPrismaClient();
  return prisma as unknown as {
    aiLessonNoteChat: {
      findMany: (args: unknown) => Promise<LessonAiChat[]>;
      findFirst: (args: unknown) => Promise<LessonAiChat | null>;
      create: (args: unknown) => Promise<LessonAiChat>;
      update: (args: unknown) => Promise<LessonAiChat>;
      delete: (args: unknown) => Promise<LessonAiChat>;
    };
    aiLessonNoteMessage: { deleteMany: (args: unknown) => Promise<unknown> };
  };
}

function dbUnavailable(response: { status: (code: number) => { json: (body: unknown) => unknown } }) {
  return response.status(503).json({ error: "PostgreSQL is not configured. Set DATABASE_URL, run Prisma migrate, then restart the API." });
}

function clean(value: unknown, fallback = "Not specified") {
  const text = String(value || "").trim();
  return text || fallback;
}

function buildGeminiPrompt(body: LessonGuideBody) {
  return [
    "You are an AAMUSTED Student Internship Programme lesson-note assistant.",
    "Help a student teacher prepare a Ghana standards-based lesson note.",
    "Use concise, practical Ghana classroom language. Do not invent official curriculum codes unless the user provides them.",
    "Prioritise: learning indicators, performance indicators, teaching/learning resources, starter, main activity, reflection/assessment, and inclusive learner-centred activities.",
    "If the student asks for a section, answer only that section unless a short note is needed.",
    "",
    `Lesson type: ${clean(body.mode)}`,
    `Subject: ${clean(body.subject)}`,
    `Topic: ${clean(body.topic)}`,
    `Class: ${clean(body.className)}`,
    `Week: ${clean(body.week)}`,
    `Week ending: ${clean(body.weekEnding)}`,
    `Current planner JSON: ${JSON.stringify(body.planner || {})}`,
    "",
    `Student request: ${clean(body.prompt)}`,
  ].join("\n");
}

router.post("/ai/lesson-note-guide", async (request, response) => {
  const body = request.body as LessonGuideBody;

  if (!clean(body.prompt, "")) {
    return response.status(400).json({ error: "Please provide a lesson-note question." });
  }

  if (!env.geminiApiKey) {
    return response.status(503).json({ error: "Gemini is not configured. Add GEMINI_API_KEY to the backend environment and restart the API." });
  }

  try {
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildGeminiPrompt(body) }] }],
        generationConfig: { temperature: 0.35, topP: 0.9, maxOutputTokens: 900 },
      }),
    });

    if (!geminiResponse.ok) {
      const detail = await geminiResponse.text().catch(() => "");
      return response.status(502).json({ error: "Gemini request failed. Check GEMINI_API_KEY, GEMINI_MODEL and Render outbound access.", detail });
    }

    const data = await geminiResponse.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const answer = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n").trim();
    if (!answer) return response.status(502).json({ error: "Gemini returned an empty lesson-note response." });
    return response.json({ provider: "gemini", answer });
  } catch (error) {
    return response.status(502).json({ error: "Gemini request could not be completed.", detail: error instanceof Error ? error.message : "Unknown provider error" });
  }
});

router.get("/ai/lesson-note-chats", (request, response) => {
  const owner = request.user?.identifier || "";
  try {
    database().aiLessonNoteChat.findMany({
      where: { studentIdentifier: owner },
      orderBy: { updatedAt: "desc" },
      include: { messages: { orderBy: { sortOrder: "asc" } } },
    }).then((records) => response.json(records)).catch(() => dbUnavailable(response));
  } catch {
    return dbUnavailable(response);
  }
});

router.post("/ai/lesson-note-chats", (request, response) => {
  const owner = request.user?.identifier || "";
  const now = new Date().toISOString();
  const input = request.body as Partial<LessonAiChat>;
  const subject = clean(input.subject, "Lesson note");
  const topic = clean(input.topic, "Untitled topic");
  const messages = Array.isArray(input.messages) ? input.messages : [];
  const dbMessages = messages.map((message, index) => ({ role: message.role, text: message.text, sortOrder: index, createdAt: message.createdAt ? new Date(message.createdAt) : new Date(now) }));

  try {
    const db = database();
    const payload = {
      title: clean(input.title, `${subject} — ${topic}`),
      subject,
      topic,
      mode: input.mode === "Termly" ? "Termly" : "Weekly",
      studentIdentifier: owner,
      messages: { create: dbMessages },
    };
    if (input.id) {
      db.aiLessonNoteChat.findFirst({ where: { id: input.id, studentIdentifier: owner } }).then(async (existing) => {
        if (!existing) {
          const created = await db.aiLessonNoteChat.create({ data: { ...payload, id: `AIC-${randomUUID()}` }, include: { messages: { orderBy: { sortOrder: "asc" } } } });
          return response.status(201).json(created);
        }
        await db.aiLessonNoteMessage.deleteMany({ where: { chatId: input.id } });
        const updated = await db.aiLessonNoteChat.update({ where: { id: input.id }, data: payload, include: { messages: { orderBy: { sortOrder: "asc" } } } });
        return response.json(updated);
      }).catch(() => dbUnavailable(response));
      return;
    }
    db.aiLessonNoteChat.create({ data: { ...payload, id: `AIC-${randomUUID()}` }, include: { messages: { orderBy: { sortOrder: "asc" } } } }).then((chat) => response.status(201).json(chat)).catch(() => dbUnavailable(response));
    return;
  } catch {
    return dbUnavailable(response);
  }
});

router.get("/ai/lesson-note-chats/:id", (request, response) => {
  const owner = request.user?.identifier || "";
  try {
    database().aiLessonNoteChat.findFirst({ where: { id: request.params.id, studentIdentifier: owner }, include: { messages: { orderBy: { sortOrder: "asc" } } } }).then((chat) => {
      if (!chat) return response.status(404).json({ error: "AI chat not found" });
      return response.json(chat);
    }).catch(() => dbUnavailable(response));
    return;
  } catch {
    return dbUnavailable(response);
  }
});

router.delete("/ai/lesson-note-chats/:id", (request, response) => {
  const owner = request.user?.identifier || "";
  try {
    database().aiLessonNoteChat.findFirst({ where: { id: request.params.id, studentIdentifier: owner } }).then(async (chat) => {
      if (!chat) return response.status(404).json({ error: "AI chat not found" });
      await database().aiLessonNoteChat.delete({ where: { id: request.params.id } });
      return response.json({ deleted: true });
    }).catch(() => dbUnavailable(response));
    return;
  } catch {
    return dbUnavailable(response);
  }
});

export const AiModule: FeatureModule = {
  basePath: "/api/v1",
  router,
};
