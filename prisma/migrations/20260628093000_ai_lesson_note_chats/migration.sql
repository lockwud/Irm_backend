CREATE TABLE "AiLessonNoteChat" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'Weekly',
    "studentIdentifier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiLessonNoteChat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiLessonNoteMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiLessonNoteMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiLessonNoteChat_studentIdentifier_idx" ON "AiLessonNoteChat"("studentIdentifier");
CREATE INDEX "AiLessonNoteChat_updatedAt_idx" ON "AiLessonNoteChat"("updatedAt");
CREATE INDEX "AiLessonNoteMessage_chatId_idx" ON "AiLessonNoteMessage"("chatId");

ALTER TABLE "AiLessonNoteMessage"
ADD CONSTRAINT "AiLessonNoteMessage_chatId_fkey"
FOREIGN KEY ("chatId") REFERENCES "AiLessonNoteChat"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
