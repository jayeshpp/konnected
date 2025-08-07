/*
  Warnings:

  - A unique constraint covering the columns `[name,tenantId]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,tenantId]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,tenantId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tenantId` to the `Permission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Role` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Permission" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Role" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_name_key" ON "public"."Tenant"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "public"."Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_tenantId_key" ON "public"."Permission"("name", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_tenantId_key" ON "public"."Role"("name", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_tenantId_key" ON "public"."User"("email", "tenantId");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Role" ADD CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Permission" ADD CONSTRAINT "Permission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
