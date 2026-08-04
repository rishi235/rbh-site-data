#!/usr/bin/env node
/*
  build-status-page.js
  Generates status/index.html (a phone-friendly progress board) from
  AGENT_WORKLIST.md and AGENT_LOG.md. No dependencies. Run from anywhere:
      node tools/build-status-page.js
  The page is static: it goes live when the branch is pushed and the host
  (Cloudflare Pages / GitHub Pages) redeploys. Answer buttons on question
  cards open a pre-addressed email; the hourly worker reads replies whose
  subject starts "AGENT ANSWER".
*/
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ANSWER_EMAIL = "rishi@rbhealth.co.uk";

const worklist = fs.readFileSync(path.join(ROOT, "AGENT_WORKLIST.md"), "utf8");
const log = fs.readFileSync(path.join(ROOT, "AGENT_LOG.md"), "utf8");

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ---------- parse AGENT_WORKLIST.md ---------- */
const todo = [];
const blocked = [];
const done = [];
{
  let section = "";
  let current = null;
  for (const line of worklist.split(/\r?\n/)) {
    const h = line.match(/^##\s+(.*)/);
    if (h) { section = h[1].trim(); current = null; continue; }
    const item = line.match(/^- \[( |x)\]\s+(.*)/);
    if (item) {
      current = { text: item[2].trim(), section: section };
      if (item[1] === "x" || /^Done\b/i.test(section)) done.push(current);
      else if (/\[BLOCKED\]/.test(item[2])) blocked.push(current);
      else todo.push(current);
    } else if (current && /^\s{2,}\S/.test(line)) {
      current.text += " " + line.trim();
    } else if (line.trim() === "") {
      current = null;
    }
  }
}

/* ---------- parse questions from AGENT_LOG.md ---------- */
const questions = [];
{
  const m = log.match(/## Questions for Rishi\r?\n([\s\S]*?)(\r?\n---|\r?\n## |$)/);
  if (m) {
    let q = null;
    for (const line of m[1].split(/\r?\n/)) {
      if (/^- /.test(line)) { q = { text: line.slice(2).trim() }; questions.push(q); }
      else if (q && /^\s+\S/.test(line)) q.text += " " + line.trim();
      else q = null;
    }
  }
}

/* ---------- parse recent log entries ---------- */
const entries = [];
{
  const re = /^## (\d{4}-\d{2}-\d{2}[^\r\n]*)\r?\n([\s\S]*?)(?=\r?\n## |$)/gm;
  let m;
  while ((m = re.exec(log)) !== null && entries.length < 5) {
    entries.push({ title: m[1].trim(), body: m[2].trim() });
  }
}

/* ---------- render ---------- */
function itemRef(text) {
  const m = text.match(/\b(\d+\.\d+)\b/);
  return m ? m[1] : "";
}

function card(item, cls) {
  const ref = itemRef(item.text);
  const tag = ref ? '<span class="ref">' + esc(ref) + "</span> " : "";
  return '<div class="card ' + cls + '">' + tag + esc(item.text) +
    (item.section && !/^Done/i.test(item.section)
      ? '<div class="sec">' + esc(item.section) + "</div>" : "") +
    "</div>";
}

function questionCard(q, i) {
  const ref = itemRef(q.text);
  const subject = "AGENT ANSWER " + (ref || "Q" + (i + 1));
  const mailto = "mailto:" + ANSWER_EMAIL +
    "?subject=" + encodeURIComponent(subject) +
    "&body=" + encodeURIComponent("Question: " + q.text.slice(0, 300) +
      "\n\nMy answer:\n");
  return '<div class="card q">' + esc(q.text) +
    '<div class="actions"><a class="btn" href="' + esc(mailto) +
    '">Answer by email</a></div></div>';
}

const stamp = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";

const css = [
  ":root{--bg:#f4f5f7;--card:#fff;--ink:#1d2733;--mut:#67707c;--line:#e3e6ea;",
  "--blue:#2457a7;--amber:#b0680a;--green:#1e7a3c;--red:#a3352b}",
  "*{box-sizing:border-box}body{margin:0;font:15px/1.5 -apple-system,Segoe UI,",
  "Roboto,Arial,sans-serif;background:var(--bg);color:var(--ink);padding:16px}",
  "h1{font-size:20px;margin:0 0 2px}h2{font-size:15px;margin:0 0 10px}",
  ".meta{color:var(--mut);font-size:13px;margin-bottom:18px}",
  ".grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(290px,1fr))}",
  ".col{background:none}.count{color:var(--mut);font-weight:normal}",
  ".card{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--blue);",
  "border-radius:8px;padding:10px 12px;margin-bottom:10px;font-size:14px}",
  ".card.q{border-left-color:var(--red)}.card.done{border-left-color:var(--green);color:var(--mut)}",
  ".card.blocked{border-left-color:var(--amber)}",
  ".ref{display:inline-block;background:#eef2f8;border-radius:4px;padding:0 6px;",
  "font-weight:600;font-size:12.5px;color:var(--blue)}",
  ".sec{color:var(--mut);font-size:12px;margin-top:6px}",
  ".actions{margin-top:8px}.btn{display:inline-block;background:var(--blue);color:#fff;",
  "text-decoration:none;border-radius:6px;padding:6px 12px;font-size:13.5px}",
  ".qwrap{background:#fdf3f2;border:1px solid #f0d9d6;border-radius:10px;padding:12px;margin-bottom:20px}",
  ".log{margin-top:26px}.log pre{background:var(--card);border:1px solid var(--line);",
  "border-radius:8px;padding:12px;white-space:pre-wrap;font:12.5px/1.45 ui-monospace,Consolas,monospace;color:#333}",
  "details summary{cursor:pointer;font-weight:600;margin:8px 0}"
].join("");

const qBlock = questions.length
  ? '<div class="qwrap"><h2>Questions needing your answer <span class="count">(' +
    questions.length + ")</span></h2>" +
    questions.map(questionCard).join("") + "</div>"
  : "";

const html = "<!doctype html>\n<html lang=\"en-GB\">\n<head>\n" +
  '<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
  '<meta name="robots" content="noindex,nofollow">\n' +
  "<title>RBH audit backlog - status</title>\n" +
  "<style>" + css + "</style>\n</head>\n<body>\n" +
  "<h1>RBH digital audit backlog</h1>\n" +
  '<div class="meta">Hourly agent on the ProDesk, branch agents/audit-backlog. ' +
  "Updated " + esc(stamp) + ". Answer buttons email the worker; put your reply " +
  "above the quoted question and keep the subject starting AGENT ANSWER.</div>\n" +
  qBlock +
  '<div class="grid">\n' +
  '<div class="col"><h2>To do <span class="count">(' + todo.length + ")</span></h2>" +
  todo.map(function (i) { return card(i, ""); }).join("") + "</div>\n" +
  '<div class="col"><h2>Blocked <span class="count">(' + blocked.length + ")</span></h2>" +
  (blocked.length ? blocked.map(function (i) { return card(i, "blocked"); }).join("")
    : '<div class="card done">Nothing blocked.</div>') + "</div>\n" +
  '<div class="col"><h2>Done <span class="count">(' + done.length + ")</span></h2>" +
  (done.length ? done.map(function (i) { return card(i, "done"); }).join("")
    : '<div class="card done">Nothing yet.</div>') + "</div>\n" +
  "</div>\n" +
  '<div class="log"><h2>Recent runs</h2>' +
  entries.map(function (e) {
    return "<details" + (entries.indexOf(e) === 0 ? " open" : "") +
      "><summary>" + esc(e.title) + "</summary><pre>" + esc(e.body) +
      "</pre></details>";
  }).join("") + "</div>\n" +
  "</body>\n</html>\n";

const outDir = path.join(ROOT, "status");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
fs.writeFileSync(path.join(outDir, "index.html"), html);
console.log("Status page written: status/index.html (" +
  todo.length + " to do, " + blocked.length + " blocked, " +
  done.length + " done, " + questions.length + " questions)");
