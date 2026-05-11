import { Worker } from "bullmq";
import { runSimulation } from "./simulation";

const connection = { url: process.env.REDIS_URL || "redis://localhost:6379" };

new Worker(
  "riskybusiness-simulations",
  async (job) => {
    if (job.name === "run-simulation") {
      return runSimulation(job.data);
    }
    return { ok: true };
  },
  { connection }
);

console.log("RiskyBusiness worker listening for simulation jobs.");
