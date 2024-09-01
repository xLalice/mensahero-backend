-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_lastMessageId_fkey";

-- AlterTable
ALTER TABLE "Conversation" ALTER COLUMN "lastMessageId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
