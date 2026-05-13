import { Worker, type Job } from "bullmq";
import { logger } from "./logger";
import { runSimulation } from "./simulation";
import type { SimulationRun } from "@/types/domain";

const QUEUE_NAME = "riskybusiness-simulations";
const SHUTDOWN_TIMEOUT_MS = 10_000;
const DEFAULT_CONCURRENCY = 4;

const concurrency = Number(process.env.WORKER_CONCURRENCY) > 0 ? Number(process.env.WORKER_CONCURRENCY) : DEFAULT_CONCURRENCY;
const connection = { url: process.env.REDIS_URL || "redis://localhost:6379" };

const worker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    logger.debug("Job started", { id: job.id, name: job.name });
    if (job.name === "run-simulation") {
      return runSimulation(job.data as SimulationRun["settings"]);
    }
    logger.warn("Unknown job name", { id: job.id, name: job.name });
    return { ok: false, reason: "unknown_job" };
  },
  { connection, concurrency }
);

worker.on("ready", () => logger.info("Worker ready", { queue: QUEUE_NAME, concurrency }));
worker.on("completed", (job) => logger.info("Job completed", { id: job.id, name: job.name }));
worker.on("failed", (job, err) => logger.error("Job failed", { id: job?.id, name: job?.name, error: err }));
worker.on("error", (err) => logger.error("Worker error", { error: err }));

const shutdown = async (signal: string) => {
  logger.info("Worker shutdown requested", { signal });
  const timer = setTimeout(() => {
    logger.error("Worker shutdown timed out, forcing exit", { signal });
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  try {
    await worker.close();
    clearTimeout(timer);
    logger.info("Worker shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error("Worker shutdown failed", { error: error instanceof Error ? error : { message: String(error) } });
    process.exit(1);
  }
};

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => logger.error("Unhandled rejection in worker", { reason: reason instanceof Error ? reason : { message: String(reason) } }));
process.on("uncaughtException", (error) => logger.error("Uncaught exception in worker", { error }));
