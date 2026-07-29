// Dummy scripted responses for the HR chatbot demo (UI only).
export type ChatReply = { thinking: string; answer: string };

export const scriptedReplies: ChatReply[] = [
  {
    thinking: "Checking Usman Ali's profile, tenure signals, and attrition model score...",
    answer: `Usman Ali is showing a **high attrition risk** (model score: **82%**).
Based on current signals, they are projected to leave within the next **60–90 days** if nothing changes.

**Likely contributing reasons:**
1. Eligible for pension in under 6 months, with no confirmed intent to extend service
2. Two consecutive promotion cycles passed over despite strong performance reviews
3. Currently posted 400km from family residence with no pending transfer approved

**Suggested action:** Offer a retention conversation and prioritise his pending transfer request before the pension eligibility window closes.`,
  },
  {
    thinking: "Scanning the team roster for elevated attrition risk over the next quarter...",
    answer: `There are currently **12 employees** flagged as high risk this quarter.
Top three to prioritise:
1. **Usman Ali** — 82% risk (pension window closing)
2. **Sarah Malik** — 76% risk (missed promotion, offer signals)
3. **Ahmed Raza** — 71% risk (long commute, low engagement scores)

Would you like a retention playbook for any of them?`,
  },
  {
    thinking: "Aggregating exit interview themes from the last 6 months...",
    answer: `The **top 3 reasons** people left in the last 6 months:
1. **Career growth** — 34% cited limited promotion paths
2. **Compensation** — 28% mentioned market gap
3. **Work-life balance** — 22% cited commute or shift load

Overall attrition sits at **8.4%**, slightly above the industry average of 7.1%.`,
  },
];

export function pickReply(input: string): ChatReply {
  const q = input.toLowerCase();
  if (q.includes("usman")) return scriptedReplies[0];
  if (q.includes("risk") || q.includes("who")) return scriptedReplies[1];
  if (q.includes("reason") || q.includes("why") || q.includes("leave")) return scriptedReplies[2];
  return scriptedReplies[Math.floor(Math.random() * scriptedReplies.length)];
}
