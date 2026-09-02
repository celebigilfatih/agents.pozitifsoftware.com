import type { Job } from "pg-boss";

import { getQueue, PUBLICATION_QUEUE } from "@/queue";
import {
  cleanupExpiredUploads,
  processPublicationJob,
} from "@/services/publication-worker";

type PublicationQueueData = { publicationJobId: string };

async function main() {
  const boss = await getQueue();
  await boss.work<PublicationQueueData>(
    PUBLICATION_QUEUE,
    { batchSize: 1, pollingIntervalSeconds: 2 },
    async (jobs: Job<PublicationQueueData>[]) => {
      const job = jobs[0];
      if (!job) return;
      await processPublicationJob(job.data.publicationJobId);
    },
  );

  await cleanupExpiredUploads();
  const cleanupTimer = setInterval(
    () => {
      void cleanupExpiredUploads();
    },
    60 * 60 * 1000,
  );
  cleanupTimer.unref();

  const shutdown = async () => {
    clearInterval(cleanupTimer);
    await boss.stop({ graceful: true, timeout: 30_000 });
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown());
  process.on("SIGINT", () => void shutdown());
}

main().catch(() => {
  process.stderr.write(
    "Worker başlatılamadı. Veritabanı ve queue readiness'i kontrol edin.\n",
  );
  process.exitCode = 1;
});
