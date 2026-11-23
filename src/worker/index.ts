import "dotenv/config";
import { startWorker } from "../lib/queue";
import { checkStartupConfig } from "../lib/config";
import { expireSubscriptions, sendReminders } from "../lib/billing";

const { ok, missing } = checkStartupConfig();
if (!ok) {
  console.error("Missing required environment variables:", missing.join(", "));
  process.exit(1);
}

console.log("Starting Omnia AI worker...");
const worker = startWorker();

// Simple periodic billing tasks (every hour in production you may want a proper cron)
setInterval(async () => {
  try {
    const n = await expireSubscriptions();
    if (n) console.log(`Expired ${n} subscriptions`);
    await sendReminders();
  } catch (e) {
    console.error("Billing task error", e);
  }
}, 60 * 60 * 1000);

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});

