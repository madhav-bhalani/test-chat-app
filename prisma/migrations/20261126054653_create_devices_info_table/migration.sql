-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('web', 'mobile');

-- CreateTable
CREATE TABLE "devices_info" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "isLogin" INTEGER NOT NULL DEFAULT 0,
    "devicePlatform" "DevicePlatform" NOT NULL DEFAULT 'web',
    "deviceToken" TEXT,
    "deviceUniqueId" TEXT,
    "deviceModel" TEXT,
    "os" TEXT,
    "sessionId" TEXT,
    "appVersion" TEXT,
    "browserName" TEXT,
    "browserVersion" TEXT,
    "ipAddress" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_info_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "devices_info_sessionId_key" ON "devices_info"("sessionId");

-- CreateIndex
CREATE INDEX "devices_info_userId_idx" ON "devices_info"("userId");

-- CreateIndex
CREATE INDEX "devices_info_deviceUniqueId_idx" ON "devices_info"("deviceUniqueId");

-- CreateIndex
CREATE INDEX "devices_info_sessionId_idx" ON "devices_info"("sessionId");

-- AddForeignKey
ALTER TABLE "devices_info" ADD CONSTRAINT "devices_info_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
