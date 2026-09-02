import { PgBoss } from "pg-boss";

import { env } from "@/env";

export const PUBLICATION_QUEUE = "navori-publication";

const globalForQueue = globalThis as unknown as {
  publicationQueuePromise?: Promise<PgBoss>;
};

async function startQueue() {
  const boss = new PgBoss({
    connectionString: env.DATABASE_URL,
    schema: "pgboss",
    application_name: "pozitif-navori-publisher",
  });
  boss.on("error", () => {
    // pg-boss surfaces errors to callers; secret-bearing connection data is not logged.
  });
  await boss.start();
  await boss.createQueue(PUBLICATION_QUEUE);
  return boss;
}

export function getQueue(): Promise<PgBoss> {
  globalForQueue.publicationQueuePromise ??= startQueue();
  return globalForQueue.publicationQueuePromise;
}

export async function enqueuePublication(
  jobId: string,
  idempotencyKey: string,
) {
  const boss = await getQueue();
  const queueJobId = await boss.send(
    PUBLICATION_QUEUE,
    { publicationJobId: jobId },
    {
      retryLimit: 3,
      retryDelay: 5,
      retryBackoff: true,
      singletonKey: idempotencyKey,
      expireInSeconds: 60 * 30,
      retentionSeconds: 60 * 60 * 24 * 14,
    },
  );
  if (!queueJobId) throw new Error("Queue job was not created");
  return queueJobId;
}
