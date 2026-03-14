import webSearch from "./server-function/web-search";
import { config } from "dotenv";

config();

async function createPrompt() {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  console.log(`=== Generated prompt for ${date} ===\n`);

  const prompt = `
OVERVIEW
You are the lead generation engine for Vyral Events, a white-glove corporate event architecture firm based in the Greater Toronto Area (GTA). Vyral does not plan events — it architects moments. Clients are tech companies, fashion/lifestyle brands, and creative agencies that demand cultural edge, not cookie-cutter galas.

Your job this session: find, research, score, and report 2 high-quality Canadian leads for the current week using live web search. Do not rely on memory or cached data.

You will search the web in real time using the "web_search" tool, which allows you to query multiple sources.
You need to search for recent trigger events (e.g. funding rounds, product launches, expansions) that signal a potential need for Vyral's services. Focus on companies in the GTA area and prioritize those with clear signals of having a significant event budget.
The current date is ${date}. Only consider leads with trigger events published within the last 7 days.

---

GUIDELINES
- Always search the web in real time. Every lead must have a trigger event published within the last 7 days.
- Maximum 2 A-level leads per report. Quality over volume.
- Only A-level leads appear in the final report. B/C leads are held for future reference.
- Never auto-send emails, create CRM records, or contact any lead. Present the report and wait for approval.
- Flag any trigger older than 72 hours — outreach urgency drops significantly after that window.

Ideal client profiles:
- Tech companies: Series B+, IPO, product launch, new office, headcount growth
- Fashion & lifestyle brands: collection launch, brand activation, pop-up, campaign drop
- Creative / PR agencies: new client win, rebrand, award, team growth
- Private / HNW: luxury milestone, exclusive experience

Immediately discard any lead that is:
- A traditional wedding planner or "safe gala" organizer
- A non-profit without clear event budget signals
- Already working with Bassett Events, Duet Events, or Hilary Bonebakker
- Outside Canada with no GTA office or event anchor

---

QUALIFICATION WORKFLOW

Step 1 — Live Trigger Search
Run all of the following queries and collect every result published in the last 7 days:
  - "Toronto" "Series B" OR "Series A" OR "raises" site:betakit.com
  - "Toronto" "product launch" OR "new office" OR "expansion" 2025 OR 2026
  - "GTA" OR "Toronto" startup funding announcement this week
  - "Toronto" fashion brand OR lifestyle brand launch 2025 OR 2026
  - "Toronto" agency "new client" OR "rebrand" OR "campaign launch"
List all raw results before filtering.

Step 2 — Filter by Ideal Client Profile
Apply the ideal client profiles and discard rules above. Keep only companies with at least one matching profile signal. Remove all discard-rule matches immediately.

Step 3 — Research Each Surviving Candidate
For each candidate, run the following searches:
  - "[Company Name]" event OR "launch party" OR conference — did they host events before?
  - "[Company Name]" LinkedIn — headcount, recent posts, culture language
  - "[Company Name]" site or Instagram — assess brand aesthetic
  - "[Company Name]" CMO OR "VP Marketing" OR "Executive Assistant" LinkedIn — find decision-maker
Record: company name, industry, location, trigger event, estimated budget tier, brand aesthetic (Edge / Neutral / Safe), decision-maker details, and a brief Vyral fit assessment.

Step 4 — Score Each Lead (A / B / C)
  - A: GTA-based, trigger in last 7 days, $5M+ budget signals, brand has edge, decision-maker identified
  - B: GTA-based, trigger within 30 days, budget signals present, decision-maker partial or brand Neutral
  - C: Weak trigger, outside GTA, safe brand, or no decision-maker found
Only A-level leads proceed to the report.

---

RETURN FORMAT

VYRAL EVENTS — WEEKLY LEAD REPORT
Week of: [Current date]
Leads scanned: [X total] → [X] A-level → [X] B/C held

---

LEAD 1 — [Company Name]
Score: A
Industry: [e.g. SaaS / Tech]
Location: [City, GTA]
Trigger: [Specific event and date — e.g. "Raised $28M Series B announced March 12, 2026 via BetaKit"]
Source: [Direct URL]
Brand Aesthetic: [Edge / Neutral / Safe] — [1 sentence justification]
Budget Tier: [e.g. $25K–$75K based on raise size and headcount]
Decision-Maker: [Name, Title, LinkedIn URL]
Why Vyral Fits: [2–3 sentences referencing the company's energy, milestone, and the moment Vyral could architect]
Outreach Angle: [1 sentence concept hook]
Urgency: [🔴 This week / 🟡 This month / 🟢 Pipeline]

---

LEAD 2 — [Company Name]
[Same structure as Lead 1]

---

B/C LEADS — HELD
- [Company] — [Score] — [One line reason] — revisit [timeframe]
- [Company] — [Score] — [One line reason] — revisit [timeframe]
`;

  return prompt;
}

async function main() {
  const query = await createPrompt();

  const request = new Request("http://localhost:3000/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  console.log("=== Starting web search ===\n");

  const result = await webSearch(request);
  const reader = result.body?.getReader();

  if (!reader) {
    console.error("No response body");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let lastSearchCount = 0;
  let textStarted = false;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(line.slice(6));
      } catch {
        continue;
      }

      if (data.type === "progress") {
        const count = data.sitesSearched as number;
        const sources = data.sources as Array<{
          url: string;
          title: string;
          page_age?: string;
        }>;
        if (count > lastSearchCount) {
          console.log(`\n[Search #${count}]`);
          lastSearchCount = count;
        }
        if (Array.isArray(sources) && sources.length > 0) {
          const newest = sources[sources.length - 1];
          console.log(
            `  + ${newest.title || newest.url}${newest.page_age ? ` (${newest.page_age})` : ""}`,
          );
          console.log(`    ${newest.url}`);
        }
      } else if (data.type === "generating") {
        if (!textStarted) {
          console.log("\n[Generating response...]");
        }
      } else if (data.type === "text_delta") {
        if (!textStarted) {
          console.log("\n=== Response ===\n");
          textStarted = true;
        }
        process.stdout.write(data.text as string);
      } else if (data.type === "search_error") {
        console.warn(`\n[Search error: ${data.error_code}]`);
      } else if (data.type === "result") {
        const sources = data.sources as Array<{
          url: string;
          title: string;
          page_age?: string;
        }>;
        const citations = data.citations as Array<{
          url: string;
          title: string;
          cited_text: string;
        }>;

        if (!textStarted) {
          console.log("\n=== Response ===\n");
          console.log(data.summary);
        }

        if (Array.isArray(sources) && sources.length > 0) {
          console.log("\n\n=== Sources ===");
          sources.forEach((s, i) => {
            console.log(
              `  ${i + 1}. ${s.title || s.url}${s.page_age ? ` (${s.page_age})` : ""}`,
            );
            console.log(`     ${s.url}`);
          });
        }

        if (Array.isArray(citations) && citations.length > 0) {
          console.log("\n=== Citations ===");
          citations.forEach((c, i) => {
            console.log(`  ${i + 1}. [${c.title || c.url}]`);
            console.log(`     "${c.cited_text}"`);
            console.log(`     ${c.url}`);
          });
        }

        console.log(
          `\n=== Done — ${lastSearchCount} search${lastSearchCount === 1 ? "" : "es"} performed ===`,
        );
      } else if (data.type === "error") {
        console.error(`\n[Error] ${data.message}`);
      }
    }
  }
}

main();
