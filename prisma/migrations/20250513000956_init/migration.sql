-- CreateTable
CREATE TABLE "ServerSeedSession" (
    "id" TEXT NOT NULL,
    "userPubkey" TEXT NOT NULL,
    "clientSeed" TEXT,
    "serverSeed" TEXT NOT NULL,
    "serverSeedHash" TEXT NOT NULL,
    "revealed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServerSeedSession_pkey" PRIMARY KEY ("id")
);
