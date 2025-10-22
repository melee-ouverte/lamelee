-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "githubId" TEXT NOT NULL,
    "githubUsername" TEXT NOT NULL,
    "accessToken" TEXT,
    "experienceCount" INTEGER NOT NULL DEFAULT 0,
    "totalRating" REAL NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "githubUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "aiAssistant" TEXT NOT NULL,
    "tags" TEXT,
    "promptCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "reactionCount" INTEGER NOT NULL DEFAULT 0,
    "averageRating" REAL NOT NULL DEFAULT 0,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "experiences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prompts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "context" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "averageRating" REAL NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "experienceId" INTEGER NOT NULL,
    CONSTRAINT "prompts_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "experiences" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "userId" INTEGER NOT NULL,
    "experienceId" INTEGER NOT NULL,
    CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comments_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "experiences" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reactions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reactionType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "experienceId" INTEGER NOT NULL,
    CONSTRAINT "reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reactions_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "experiences" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prompt_ratings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rating" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    "promptId" INTEGER NOT NULL,
    CONSTRAINT "prompt_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "prompt_ratings_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "prompts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_githubId_key" ON "users"("githubId");

-- CreateIndex
CREATE INDEX "users_githubId_idx" ON "users"("githubId");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "experiences_userId_idx" ON "experiences"("userId");

-- CreateIndex
CREATE INDEX "experiences_aiAssistant_idx" ON "experiences"("aiAssistant");

-- CreateIndex
CREATE INDEX "experiences_createdAt_idx" ON "experiences"("createdAt");

-- CreateIndex
CREATE INDEX "experiences_deletedAt_idx" ON "experiences"("deletedAt");

-- CreateIndex
CREATE INDEX "experiences_tags_idx" ON "experiences"("tags");

-- CreateIndex
CREATE INDEX "prompts_experienceId_idx" ON "prompts"("experienceId");

-- CreateIndex
CREATE INDEX "prompts_orderIndex_idx" ON "prompts"("orderIndex");

-- CreateIndex
CREATE INDEX "prompts_createdAt_idx" ON "prompts"("createdAt");

-- CreateIndex
CREATE INDEX "prompts_deletedAt_idx" ON "prompts"("deletedAt");

-- CreateIndex
CREATE INDEX "comments_userId_idx" ON "comments"("userId");

-- CreateIndex
CREATE INDEX "comments_experienceId_idx" ON "comments"("experienceId");

-- CreateIndex
CREATE INDEX "comments_createdAt_idx" ON "comments"("createdAt");

-- CreateIndex
CREATE INDEX "comments_deletedAt_idx" ON "comments"("deletedAt");

-- CreateIndex
CREATE INDEX "reactions_userId_idx" ON "reactions"("userId");

-- CreateIndex
CREATE INDEX "reactions_experienceId_idx" ON "reactions"("experienceId");

-- CreateIndex
CREATE INDEX "reactions_reactionType_idx" ON "reactions"("reactionType");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_userId_experienceId_key" ON "reactions"("userId", "experienceId");

-- CreateIndex
CREATE INDEX "prompt_ratings_userId_idx" ON "prompt_ratings"("userId");

-- CreateIndex
CREATE INDEX "prompt_ratings_promptId_idx" ON "prompt_ratings"("promptId");

-- CreateIndex
CREATE INDEX "prompt_ratings_rating_idx" ON "prompt_ratings"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_ratings_userId_promptId_key" ON "prompt_ratings"("userId", "promptId");
