/**
 * offlineSync.ts
 * Saves exam answers to localStorage first, then syncs to Supabase.
 * If network is unavailable, queues writes and retries on reconnect.
 */

const QUEUE_KEY = 'avilingo_answer_queue'

interface QueuedAnswer {
  examId: string
  questionId: string
  section: string
  answer: string
  timeSpentMs: number
  autoScore: number | null
  queuedAt: number
}

function getQueue(): QueuedAnswer[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveQueue(q: QueuedAnswer[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q))
  } catch { /* storage full */ }
}

/** Save or update answer in the local queue */
export function queueAnswer(answer: Omit<QueuedAnswer, 'queuedAt'>) {
  const queue = getQueue()
  const idx = queue.findIndex(
    q => q.examId === answer.examId && q.questionId === answer.questionId
  )
  const entry = { ...answer, queuedAt: Date.now() }
  if (idx >= 0) {
    queue[idx] = entry
  } else {
    queue.push(entry)
  }
  saveQueue(queue)
}

/** Flush all queued answers to Supabase — call when online */
export async function flushQueue(
  upsertFn: (rows: any[]) => Promise<void>
) {
  const queue = getQueue()
  if (queue.length === 0) return

  try {
    const rows = queue.map(q => ({
      exam_id: q.examId,
      question_id: q.questionId,
      section: q.section,
      answer: q.answer,
      time_spent_ms: q.timeSpentMs,
      auto_score: q.autoScore,
    }))
    await upsertFn(rows)
    // Clear only successfully synced items
    saveQueue([])
  } catch (err) {
    console.warn('[offlineSync] Flush failed, retrying next online event:', err)
  }
}

/** Restore answers from the local queue for a specific exam */
export function restoreAnswers(examId: string): Record<string, string> {
  const queue = getQueue()
  const map: Record<string, string> = {}
  queue
    .filter(q => q.examId === examId)
    .forEach(q => { map[q.questionId] = q.answer })
  return map
}
