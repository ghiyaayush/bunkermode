/**
 * In-process scheduler for Module A timed messages.
 *
 * Production version uses a persistent queue (Inngest, Trigger.dev, BullMQ).
 * Hackathon version uses setTimeout - good enough for the demo because
 * the longest delay we care about during a 3-minute pitch is ~12 hours,
 * but most demo screenshots show T+0 / T+30min / T+2h.
 *
 * The full production transition is straightforward: replace `enqueue`
 * with a persistent job submission and the rest of the system stays the same.
 */

export interface ScheduledTask {
  id: string;
  walletAddress: string;
  delayMs: number;
  payload: Record<string, unknown>;
  kind: "post-incident-message" | "weekly-reentry-status" | "monthly-audit";
  createdAt: Date;
}

const queue = new Map<string, NodeJS.Timeout>();

export function enqueue(task: ScheduledTask, handler: (t: ScheduledTask) => Promise<void>) {
  const id = task.id;
  const t = setTimeout(async () => {
    try {
      await handler(task);
    } catch (err) {
      console.error(`[scheduler] task ${id} failed:`, err);
    } finally {
      queue.delete(id);
    }
  }, task.delayMs);
  queue.set(id, t);
}

export function cancel(id: string) {
  const t = queue.get(id);
  if (t) {
    clearTimeout(t);
    queue.delete(id);
  }
}

export function activeCount(): number {
  return queue.size;
}
