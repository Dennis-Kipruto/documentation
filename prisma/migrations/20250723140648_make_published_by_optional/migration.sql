-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "rawContent" TEXT NOT NULL,
    "excerpt" TEXT,
    "chapterId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "publishedById" TEXT,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Document_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Document_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("chapterId", "content", "createdAt", "excerpt", "filename", "id", "order", "publishedById", "rawContent", "title", "updatedAt", "updatedById") SELECT "chapterId", "content", "createdAt", "excerpt", "filename", "id", "order", "publishedById", "rawContent", "title", "updatedAt", "updatedById" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE UNIQUE INDEX "Document_chapterId_filename_key" ON "Document"("chapterId", "filename");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
