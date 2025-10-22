-- CreateIndex
CREATE INDEX "comments_experienceId_createdAt_idx" ON "comments"("experienceId", "createdAt");

-- CreateIndex
CREATE INDEX "experiences_aiAssistant_createdAt_idx" ON "experiences"("aiAssistant", "createdAt");

-- CreateIndex
CREATE INDEX "experiences_userId_createdAt_idx" ON "experiences"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "experiences_createdAt_deletedAt_idx" ON "experiences"("createdAt", "deletedAt");

-- CreateIndex
CREATE INDEX "users_createdAt_deletedAt_idx" ON "users"("createdAt", "deletedAt");
