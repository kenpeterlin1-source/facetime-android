// After-call notes → tasks, things to ask next time, and facts worth remembering. Uses the AI you picked in setup
// (Claude for now) with your own API key stored on the phone. With no AI set up, a simple on-phone fallback is used.
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

// Shown in setup. Only Claude is wired up; the others are placeholders so people can say what they have.
export const AI_PROVIDERS = [
  { key: 'claude', label: 'Claude', ready: true, keyHint: 'Paste an API key from console.anthropic.com (starts with sk-ant-).' },
  { key: 'chatgpt', label: 'ChatGPT', ready: false },
  { key: 'gemini', label: 'Gemini', ready: false },
  { key: 'none', label: 'No AI', ready: true },
];

const TaskList = z.object({
  tasks: z.array(z.object({
    title: z.string(),                     // short, starts with a verb: "Help Mom set up her printer"
    due_date: z.string().nullable(),       // YYYY-MM-DD, or null when no day was mentioned
    due_time: z.string().nullable(),       // HH:MM 24h, or null
    details: z.string().nullable(),        // anything else worth keeping
  })),
  // questions to bring up on the next call: "Ask if Ava is feeling better"
  follow_ups: z.array(z.string()),
  // lasting facts about the person: "Daughter: Ava", "Moving to Boulder in March"
  facts: z.array(z.string()),
});

const SYSTEM = `You read a short note someone wrote or dictated right after a phone or video call and pull out three lists.
tasks: things the note says the writer should do (requests, promises, reminders). Titles are short, start with a verb,
and name the other person when it helps ("Send Giulia the photos"). Resolve relative days ("Saturday", "tomorrow",
"next week") against today's date and time zone given below.
follow_ups: things worth asking about on the next call, written as a reminder to the writer, e.g. "Ask if Ava is
feeling better", "Ask how the job interview went". Only for news that will have moved on by next time.
facts: lasting details about the person or their family worth remembering, e.g. "Daughter: Ava", "Allergic to cats".
Skip small talk. Any list can be empty.`;

// Returns {tasks: [{title, due_date, due_time, details}], follow_ups: [..], facts: [..]}. Throws on network/API errors so the UI can say so.
export async function analyzeNote({ note, personName, ai, timeZone, now = new Date() }) {
  if (ai?.provider !== 'claude' || !ai.apiKey) return simpleTasks(note, personName);

  // The key belongs to the phone's owner and never leaves the phone except to Anthropic.
  const client = new Anthropic({ apiKey: ai.apiKey, dangerouslyAllowBrowser: true });
  const today = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' }).format(now);

  const response = await client.beta.messages.parse({
    model: 'claude-opus-5',
    max_tokens: 2000,
    output_config: { effort: 'low', format: betaZodOutputFormat(TaskList) },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',                  // a declined request is retried on a fallback model server-side
    system: SYSTEM,
    messages: [{
      role: 'user',
      content: `Today is ${today} (${timeZone}). The call was with ${personName}.\n\nNote:\n${note}`,
    }],
  });

  if (response.stop_reason === 'refusal') throw new Error("Claude couldn't process that note.");
  if (!response.parsed_output) throw new Error('Claude returned an unexpected answer.');
  return response.parsed_output;
}

// No AI: requests become tasks; news (sick, surgery, interview, trip…) becomes a follow-up. No facts.
function simpleTasks(note, personName) {
  const sentences = note.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim().replace(/[.!?]+$/, '')).filter(Boolean);
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const isTask = (s) => /\b(can you|could you|please|need to|remember|remind|send|call|buy|fix|help|book|pick up)\b/i.test(s);
  const isNews = (s) => /\b(sick|ill|hospital|surgery|doctor|interview|exam|trip|travel|moving|baby|birthday|wedding|new job)\b/i.test(s);
  return {
    tasks: sentences.filter(isTask).map((s) => ({ title: cap(s), due_date: null, due_time: null, details: `From your call with ${personName}` })),
    follow_ups: sentences.filter((s) => !isTask(s) && isNews(s)).map((s) => `Ask about: ${s}`),
    facts: [],
  };
}
