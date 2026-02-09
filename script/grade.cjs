#!/usr/bin/env node

/**
 * Lab Autograder — JavaScript & Web APIs Lab
 *
 * Marking:
 * - 80 marks for TODOs (JS checks) => 4 TODOs × 20
 * - 20 marks for submission timing (deadline-based)
 *   - On/before deadline => 20/20
 *   - After deadline     => 10/20
 *
 * Deadline: 16 Feb 2026 11:59 PM (Asia/Riyadh, UTC+03:00)
 *
 * Notes:
 * - Ignores HTML comments and JS comments (so examples inside comments do NOT count).
 * - Lenient checks only (not strict): looks for top-level structure and key constructs.
 * - Accepts common equivalents and flexible naming.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ARTIFACTS_DIR = "artifacts";
const FEEDBACK_DIR = path.join(ARTIFACTS_DIR, "feedback");
fs.mkdirSync(FEEDBACK_DIR, { recursive: true });

/* -----------------------------
   Deadline (Asia/Riyadh)
   16 Feb 2026, 11:59 PM
-------------------------------- */
const DEADLINE_RIYADH_ISO = "2026-02-16T23:59:00+03:00";
const DEADLINE_MS = Date.parse(DEADLINE_RIYADH_ISO);

// Submission marks policy
const SUBMISSION_MAX = 20;
const SUBMISSION_LATE = 10;

/* -----------------------------
   TODO marks (out of 80)
-------------------------------- */
const tasks = [
  { id: "todo1", name: 'TODO 1: Welcome Board (set "Hello, World!" in #t1-msg on load)', marks: 20 },
  { id: "todo2", name: 'TODO 2: Interaction Corner (click #t2-btn updates #t2-status)', marks: 20 },
  { id: "todo3", name: "TODO 3: Inspiring Quote Board (fetch random quote, show quote+author)", marks: 20 },
  { id: "todo4", name: "TODO 4: Dammam Weather Now (fetch weather, show temp/hum/wind)", marks: 20 },
];

const STEPS_MAX = tasks.reduce((sum, t) => sum + t.marks, 0); // 80
const TOTAL_MAX = STEPS_MAX + SUBMISSION_MAX; // 100

/* -----------------------------
   Helpers
-------------------------------- */
function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function mdEscape(s) {
  return String(s).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function splitMarks(stepMarks, missingCount, totalChecks) {
  if (missingCount <= 0) return stepMarks;
  const perItem = stepMarks / totalChecks;
  const deducted = perItem * missingCount;
  return Math.max(0, round2(stepMarks - deducted));
}

function stripHtmlComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

/**
 * Strip JS comments while trying to preserve strings/templates.
 * Not a full parser, but robust enough for beginner labs and avoids
 * counting commented-out code.
 */
function stripJsComments(code) {
  if (!code) return code;

  let out = "";
  let i = 0;

  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;

  while (i < code.length) {
    const ch = code[i];
    const next = code[i + 1];

    // Handle string/template boundaries (with escapes)
    if (!inDouble && !inTemplate && ch === "'" && !inSingle) {
      inSingle = true;
      out += ch;
      i++;
      continue;
    }
    if (inSingle && ch === "'") {
      let backslashes = 0;
      for (let k = i - 1; k >= 0 && code[k] === "\\"; k--) backslashes++;
      if (backslashes % 2 === 0) inSingle = false;
      out += ch;
      i++;
      continue;
    }

    if (!inSingle && !inTemplate && ch === '"' && !inDouble) {
      inDouble = true;
      out += ch;
      i++;
      continue;
    }
    if (inDouble && ch === '"') {
      let backslashes = 0;
      for (let k = i - 1; k >= 0 && code[k] === "\\"; k--) backslashes++;
      if (backslashes % 2 === 0) inDouble = false;
      out += ch;
      i++;
      continue;
    }

    if (!inSingle && !inDouble && ch === "`" && !inTemplate) {
      inTemplate = true;
      out += ch;
      i++;
      continue;
    }
    if (inTemplate && ch === "`") {
      let backslashes = 0;
      for (let k = i - 1; k >= 0 && code[k] === "\\"; k--) backslashes++;
      if (backslashes % 2 === 0) inTemplate = false;
      out += ch;
      i++;
      continue;
    }

    // If not inside a string/template, strip comments
    if (!inSingle && !inDouble && !inTemplate) {
      // line comment
      if (ch === "/" && next === "/") {
        i += 2;
        while (i < code.length && code[i] !== "\n") i++;
        continue;
      }
      // block comment
      if (ch === "/" && next === "*") {
        i += 2;
        while (i < code.length) {
          if (code[i] === "*" && code[i + 1] === "/") {
            i += 2;
            break;
          }
          i++;
        }
        continue;
      }
    }

    out += ch;
    i++;
  }

  return out;
}

function findAnyHtmlFile() {
  const preferred = path.join(process.cwd(), "index.html");
  if (fs.existsSync(preferred)) return preferred;

  const ignoreDirs = new Set(["node_modules", ".git", ARTIFACTS_DIR]);
  const stack = [process.cwd()];

  while (stack.length) {
    const dir = stack.pop();
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const e of entries) {
      const full = path.join(dir, e.name);

      if (e.isDirectory()) {
        if (!ignoreDirs.has(e.name)) stack.push(full);
      } else if (e.isFile() && e.name.toLowerCase().endsWith(".html")) {
        return full;
      }
    }
  }
  return null;
}

function findStudentJsFile() {
  // Prefer common names
  const preferredNames = ["script.js", "app.js", "main.js", "index.js"];
  for (const name of preferredNames) {
    const p = path.join(process.cwd(), name);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }

  const ignoreDirs = new Set(["node_modules", ".git", ARTIFACTS_DIR]);
  const ignoreFiles = new Set(["grade.cjs", "grade.js"]);

  const stack = [process.cwd()];
  while (stack.length) {
    const dir = stack.pop();
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const e of entries) {
      const full = path.join(dir, e.name);

      if (e.isDirectory()) {
        if (!ignoreDirs.has(e.name)) stack.push(full);
      } else if (e.isFile()) {
        const lower = e.name.toLowerCase();
        if (ignoreFiles.has(lower)) continue;
        if (lower.endsWith(".js")) return full;
      }
    }
  }
  return null;
}

/* Extract <script> tags; return array of { attrs, content } */
function extractScriptTags(html) {
  const scripts = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    scripts.push({ attrs: m[1] || "", content: m[2] || "" });
  }
  return scripts;
}

function scriptHasSrc(attrs) {
  return /\bsrc\s*=\s*["'][^"']+["']/i.test(attrs || "");
}

function getScriptSrc(attrs) {
  const m = (attrs || "").match(/\bsrc\s*=\s*["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function hasAnyExternalScriptTag(html) {
  if (!html) return false;
  const scripts = extractScriptTags(html);
  return scripts.some((s) => scriptHasSrc(s.attrs));
}

function jsLinkedSomewhereMatchesStudentFile(html, studentJsPath) {
  if (!html || !studentJsPath) return false;
  const studentBase = path.basename(studentJsPath).toLowerCase();
  const scripts = extractScriptTags(html);
  for (const s of scripts) {
    if (!scriptHasSrc(s.attrs)) continue;
    const src = (getScriptSrc(s.attrs) || "").toLowerCase();
    if (src.endsWith("/" + studentBase) || src === studentBase || src.endsWith(studentBase)) return true;
  }
  return false;
}

/* -----------------------------
   Determine submission time
-------------------------------- */
let lastCommitISO = null;
let lastCommitMS = null;

try {
  lastCommitISO = execSync("git log -1 --format=%cI", { encoding: "utf8" }).trim();
  lastCommitMS = Date.parse(lastCommitISO);
} catch {
  // fallback (still grades, but treat as "now")
  lastCommitISO = new Date().toISOString();
  lastCommitMS = Date.now();
}

/* -----------------------------
   Submission marks
-------------------------------- */
const isLate = Number.isFinite(lastCommitMS) ? lastCommitMS > DEADLINE_MS : true;
const submissionScore = isLate ? SUBMISSION_LATE : SUBMISSION_MAX;

/* -----------------------------
   Load student files
-------------------------------- */
const htmlFile = findAnyHtmlFile();
const jsFile = findStudentJsFile();

const htmlRaw = htmlFile ? safeRead(htmlFile) : null;
const jsRaw = jsFile ? safeRead(jsFile) : null;

const html = htmlRaw ? stripHtmlComments(htmlRaw) : null;
const js = jsRaw ? stripJsComments(jsRaw) : null;

const results = []; // { id, name, max, score, checklist[], deductions[] }

/* -----------------------------
   Result helpers
-------------------------------- */
function addResult(task, required, missing) {
  const score = splitMarks(task.marks, missing.length, required.length);
  results.push({
    id: task.id,
    name: task.name,
    max: task.marks,
    score,
    checklist: required.map((r) => `${r.ok ? "✅" : "❌"} ${r.label}`),
    deductions: missing.length ? missing.map((m) => `Missing: ${m.label}`) : [],
  });
}

function failTask(task, reason) {
  results.push({
    id: task.id,
    name: task.name,
    max: task.marks,
    score: 0,
    checklist: [],
    deductions: [reason],
  });
}

/* -----------------------------
   Light detection helpers
-------------------------------- */
function mkHas(code) {
  return (re) => re.test(code);
}

function anyOf(has, res) {
  return res.some((r) => has(r));
}

function hasTextSetForId(has, id) {
  // Very lenient: if they reference the id and set some text-ish property anywhere
  // Accepts: .textContent / .innerText / .innerHTML
  // Allows separate selection and assignment.
  const idMention = new RegExp(`["'\`]${id}["'\`]`, "i");
  const setter = /(textContent|innerText|innerHTML)\s*=/i;
  return has(idMention) && has(setter);
}

/* -----------------------------
   Grade TODOs (JS)
-------------------------------- */
if (!js) {
  for (const t of tasks) {
    failTask(t, jsFile ? `Could not read JS file at: ${jsFile}` : "No student .js file found.");
  }
} else {
  const has = mkHas(js);

  /* TODO1: Welcome Board */
  {
    const required = [
      {
        label: 'Selects #t1-msg using document.getElementById("t1-msg") (or similar)',
        ok: anyOf(has, [
          /document\.getElementById\s*\(\s*["'`]t1-msg["'`]\s*\)/i,
          /querySelector\s*\(\s*["'`]#t1-msg["'`]\s*\)/i,
        ]),
      },
      {
        label: 'Sets text in #t1-msg (textContent/innerText/innerHTML)',
        ok: hasTextSetForId(has, "t1-msg"),
      },
      {
        label: 'Sets message to "Hello, World!" (case/punctuation lenient)',
        ok: has(/Hello\s*,?\s*World\s*!?/i),
      },
      {
        label: "Runs on load (DOMContentLoaded / window.onload) OR top-level DOM update",
        ok: anyOf(has, [
          /DOMContentLoaded/i,
          /window\.onload\s*=/i,
          /addEventListener\s*\(\s*["'`]load["'`]/i,
          // allow just writing it directly (common in simple labs)
          /getElementById\s*\(\s*["'`]t1-msg["'`]\s*\)[\s\S]*?(textContent|innerText|innerHTML)\s*=/i,
        ]),
      },
    ];
    const missing = required.filter((r) => !r.ok);
    addResult(tasks[0], required, missing);
  }

  /* TODO2: Interaction Corner */
  {
    const required = [
      {
        label: 'Selects button #t2-btn (getElementById/querySelector)',
        ok: anyOf(has, [
          /document\.getElementById\s*\(\s*["'`]t2-btn["'`]\s*\)/i,
          /querySelector\s*\(\s*["'`]#t2-btn["'`]\s*\)/i,
        ]),
      },
      {
        label: "Adds a click event listener (addEventListener('click', ...))",
        ok: anyOf(has, [
          /addEventListener\s*\(\s*["'`]click["'`]\s*,/i,
          /\.onclick\s*=/i,
        ]),
      },
      {
        label: 'Selects #t2-status (getElementById/querySelector)',
        ok: anyOf(has, [
          /document\.getElementById\s*\(\s*["'`]t2-status["'`]\s*\)/i,
          /querySelector\s*\(\s*["'`]#t2-status["'`]\s*\)/i,
        ]),
      },
      {
        label: 'Updates #t2-status text (textContent/innerText/innerHTML)',
        ok: hasTextSetForId(has, "t2-status"),
      },
      {
        label: 'Uses message "You clicked the button!" (lenient)',
        ok: has(/You\s+clicked\s+the\s+button\s*!?/i),
      },
    ];
    const missing = required.filter((r) => !r.ok);
    addResult(tasks[1], required, missing);
  }

  /* TODO3: Inspiring Quote Board */
  {
    const required = [
      {
        label: 'Adds click listener to #t3-loadQuote (or uses onclick)',
        ok: anyOf(has, [
          /getElementById\s*\(\s*["'`]t3-loadQuote["'`]\s*\)[\s\S]*?addEventListener\s*\(\s*["'`]click["'`]/i,
          /querySelector\s*\(\s*["'`]#t3-loadQuote["'`]\s*\)[\s\S]*?addEventListener\s*\(\s*["'`]click["'`]/i,
          /["'`]t3-loadQuote["'`][\s\S]*?\.onclick\s*=/i,
        ]),
      },
      {
        label: "Uses fetch(...) to call the quote API (dummyjson quotes/random) (light)",
        ok: anyOf(has, [
          /fetch\s*\(\s*["'`]https?:\/\/dummyjson\.com\/quotes\/random["'`]\s*\)/i,
          /dummyjson\.com\/quotes\/random/i,
        ]),
      },
      {
        label: "Parses JSON (response.json()) OR uses await response.json()",
        ok: anyOf(has, [
          /\.json\s*\(\s*\)/i,
          /await\s+\w+\.json\s*\(\s*\)/i,
        ]),
      },
      {
        label: "Displays quote text into #t3-quote (textContent/innerText/innerHTML)",
        ok:
          (anyOf(has, [
            /getElementById\s*\(\s*["'`]t3-quote["'`]\s*\)/i,
            /querySelector\s*\(\s*["'`]#t3-quote["'`]\s*\)/i,
          ]) && has(/(textContent|innerText|innerHTML)\s*=/i)),
      },
      {
        label: "Displays author into #t3-author (textContent/innerText/innerHTML)",
        ok:
          (anyOf(has, [
            /getElementById\s*\(\s*["'`]t3-author["'`]\s*\)/i,
            /querySelector\s*\(\s*["'`]#t3-author["'`]\s*\)/i,
          ]) && has(/(textContent|innerText|innerHTML)\s*=/i)),
      },
      {
        label: "Uses data.quote and data.author (or equivalent destructuring) (lenient)",
        ok: anyOf(has, [
          /\bdata\s*\.\s*quote\b/i,
          /\bquote\b\s*:\s*\w+/i, // destructuring-ish
        ]) && anyOf(has, [
          /\bdata\s*\.\s*author\b/i,
          /\bauthor\b\s*:\s*\w+/i,
        ]),
      },
      {
        label: "Handles errors (try/catch or .catch()) (optional but rewarded)",
        ok: anyOf(has, [
          /\btry\s*\{/i,
          /\.catch\s*\(/i,
        ]),
      },
    ];

    // Make error handling NOT required: only count it if present by excluding it from missing calc.
    const requiredForMarks = required.map((r) => r);
    const optionalIdx = requiredForMarks.findIndex((r) => r.label.startsWith("Handles errors"));
    const optional = optionalIdx >= 0 ? requiredForMarks.splice(optionalIdx, 1)[0] : null;

    const missing = requiredForMarks.filter((r) => !r.ok);
    // Add optional as an FYI only (doesn't reduce marks)
    if (optional) required.push(optional);

    addResult(tasks[2], requiredForMarks, missing);
  }

  /* TODO4: Dammam Weather Now */
  {
    const required = [
      {
        label: 'Adds click listener to #t4-loadWx (or uses onclick)',
        ok: anyOf(has, [
          /getElementById\s*\(\s*["'`]t4-loadWx["'`]\s*\)[\s\S]*?addEventListener\s*\(\s*["'`]click["'`]/i,
          /querySelector\s*\(\s*["'`]#t4-loadWx["'`]\s*\)[\s\S]*?addEventListener\s*\(\s*["'`]click["'`]/i,
          /["'`]t4-loadWx["'`][\s\S]*?\.onclick\s*=/i,
        ]),
      },
      {
        label: "Uses fetch(...) for OpenWeatherMap current weather (q=Dammam) (light)",
        ok: anyOf(has, [
          /api\.openweathermap\.org\/data\/2\.5\/weather/i,
          /q\s*=\s*Dammam/i,
          /["'`]Dammam["'`]/i,
        ]) && has(/fetch\s*\(/i),
      },
      {
        label: "Parses JSON (response.json()) OR uses await response.json()",
        ok: anyOf(has, [
          /\.json\s*\(\s*\)/i,
          /await\s+\w+\.json\s*\(\s*\)/i,
        ]),
      },
      {
        label: "Reads temperature from data.main.temp (or equivalent) (light)",
        ok: anyOf(has, [
          /\bdata\s*\.\s*main\s*\.\s*temp\b/i,
          /\bmain\s*\.\s*temp\b/i,
        ]),
      },
      {
        label: "Reads humidity from data.main.humidity (or equivalent) (light)",
        ok: anyOf(has, [
          /\bdata\s*\.\s*main\s*\.\s*humidity\b/i,
          /\bmain\s*\.\s*humidity\b/i,
        ]),
      },
      {
        label: "Reads wind speed from data.wind.speed (or equivalent) (light)",
        ok: anyOf(has, [
          /\bdata\s*\.\s*wind\s*\.\s*speed\b/i,
          /\bwind\s*\.\s*speed\b/i,
        ]),
      },
      {
        label: "Writes temperature into #t4-temp",
        ok: hasTextSetForId(has, "t4-temp"),
      },
      {
        label: "Writes humidity into #t4-hum",
        ok: hasTextSetForId(has, "t4-hum"),
      },
      {
        label: "Writes wind speed into #t4-wind",
        ok: hasTextSetForId(has, "t4-wind"),
      },
      {
        label: 'Includes units=metric in request (recommended) OR shows °C in output (lenient)',
        ok: anyOf(has, [
          /units\s*=\s*metric/i,
          /metric/i,
          /°C|\bc\b/i,
        ]),
      },
      {
        label: "Handles errors (try/catch or .catch()) (optional but rewarded)",
        ok: anyOf(has, [
          /\btry\s*\{/i,
          /\.catch\s*\(/i,
        ]),
      },
    ];

    // Make error handling NOT required
    const requiredForMarks = required.map((r) => r);
    const optionalIdx = requiredForMarks.findIndex((r) => r.label.startsWith("Handles errors"));
    const optional = optionalIdx >= 0 ? requiredForMarks.splice(optionalIdx, 1)[0] : null;

    const missing = requiredForMarks.filter((r) => !r.ok);
    if (optional) required.push(optional);

    addResult(tasks[3], requiredForMarks, missing);
  }
}

/* -----------------------------
   Final scoring
-------------------------------- */
const stepsScore = results.reduce((sum, r) => sum + r.score, 0);
const totalScore = round2(stepsScore + submissionScore);

/* -----------------------------
   Build summary + feedback
-------------------------------- */
const submissionLine = `- **Lab:** 5-1-js-dom-and-api-tasks
- **Deadline (Riyadh / UTC+03:00):** ${DEADLINE_RIYADH_ISO}
- **Last commit time (from git log):** ${lastCommitISO}
- **Submission marks:** **${submissionScore}/${SUBMISSION_MAX}** ${isLate ? "(Late submission)" : "(On time)"}
`;

const extraLinkInfo = (() => {
  if (!html || !jsFile) return "";
  const okAny = hasAnyExternalScriptTag(html);
  const okMatch = jsLinkedSomewhereMatchesStudentFile(html, jsFile);
  return `\n- **HTML script link (not graded):** ${okAny ? "✅ Has external <script src=...>" : "❌ No external <script src=...> found"}${
    okAny && jsFile ? (okMatch ? " (matches your JS filename)" : " (may not match your JS filename)") : ""
  }`;
})();

let summary = `# 5-1-js-dom-and-api-tasks — Autograding Summary

## Submission

${submissionLine}

## Files Checked

- HTML: ${htmlFile ? `✅ ${htmlFile}` : "❌ No HTML file found"}
- JS: ${jsFile ? `✅ ${jsFile}` : "❌ No student .js file found"}${extraLinkInfo}

## Marks Breakdown

| Component | Marks |
|---|---:|
`;

for (const r of results) summary += `| ${r.name} | ${r.score}/${r.max} |\n`;
summary += `| Submission (timing) | ${submissionScore}/${SUBMISSION_MAX} |\n`;

summary += `
## Total Marks

**${totalScore} / ${TOTAL_MAX}**

## Detailed Checks (What you did / missed)
`;

for (const r of results) {
  const done = (r.checklist || []).filter((x) => x.startsWith("✅"));
  const missed = (r.checklist || []).filter((x) => x.startsWith("❌"));

  summary += `
<details>
  <summary><strong>${mdEscape(r.name)}</strong> — ${r.score}/${r.max}</summary>

  <br/>

  <strong>✅ Found</strong>
  ${done.length ? "\n" + done.map((x) => `- ${mdEscape(x)}`).join("\n") : "\n- (Nothing detected)"}

  <br/><br/>

  <strong>❌ Missing</strong>
  ${missed.length ? "\n" + missed.map((x) => `- ${mdEscape(x)}`).join("\n") : "\n- (Nothing missing)"}

  <br/><br/>

  <strong>❗ Deductions / Notes</strong>
  ${
    r.deductions && r.deductions.length
      ? "\n" + r.deductions.map((d) => `- ${mdEscape(d)}`).join("\n")
      : "\n- No deductions."
  }

</details>
`;
}

summary += `
> Full feedback is also available in: \`artifacts/feedback/README.md\`
`;

let feedback = `# 5-1-js-dom-and-api-tasks — Feedback

## Submission

${submissionLine}

## Files Checked

- HTML: ${htmlFile ? `✅ ${htmlFile}` : "❌ No HTML file found"}
- JS: ${jsFile ? `✅ ${jsFile}` : "❌ No student .js file found"}${extraLinkInfo}

---

## TODO-by-TODO Feedback
`;

for (const r of results) {
  feedback += `
### ${r.name} — **${r.score}/${r.max}**

**Checklist**
${r.checklist.length ? r.checklist.map((x) => `- ${x}`).join("\n") : "- (No checks available)"}

**Deductions / Notes**
${r.deductions.length ? r.deductions.map((d) => `- ❗ ${d}`).join("\n") : "- ✅ No deductions. Good job!"}
`;
}

feedback += `
---

## How marks were deducted (rules)

- HTML comments are ignored (so examples in comments do NOT count).
- JS comments are ignored (so examples in comments do NOT count).
- Checks are intentionally light: they look for key constructs and basic structure.
- Code can be in ANY order; repeated code is allowed.
- Common equivalents are accepted, and naming is flexible.
- Missing required items reduce marks proportionally within that TODO.
`;

/* -----------------------------
   Write outputs
-------------------------------- */
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);

const csv = `student,score,max_score
all_students,${totalScore},${TOTAL_MAX}
`;

fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
fs.writeFileSync(path.join(ARTIFACTS_DIR, "grade.csv"), csv);
fs.writeFileSync(path.join(FEEDBACK_DIR, "README.md"), feedback);

console.log(
  `✔ Lab graded: ${totalScore}/${TOTAL_MAX} (Submission: ${submissionScore}/${SUBMISSION_MAX}, TODOs: ${stepsScore}/${STEPS_MAX}).`
);
