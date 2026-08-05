#!/usr/bin/env node
/*
  notify-questions.js
  Texts Rishi (via ClickSend) whenever a NEW question appears under
  "Questions for Rishi" in AGENT_LOG.md. Safe to run every cycle:
  - Credentials live OUTSIDE the repo in C:\Dev\secrets\agent-notify.json:
      {
        "clicksendUsername": "...",
        "clicksendApiKey":   "...",
        "smsTo":   "+447...",
        "smsFrom": "RBHAgent",
        "statusUrl": "https://<your-status-page>"   (optional)
      }
  - If that file is missing the script exits quietly (no-op).
  - Already-notified questions are tracked in .notify-state.json
    (gitignored) so each question is texted once.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const CRED_PATH = "C:\\Dev\\secrets\\agent-notify.json";
const STATE_PATH = path.join(ROOT, ".notify-state.json");

if (!fs.existsSync(CRED_PATH)) {
  console.log("notify: no credentials file at " + CRED_PATH + ", skipping");
  process.exit(0);
}
const cfg = JSON.parse(fs.readFileSync(CRED_PATH, "utf8"));
if (!cfg.clicksendUsername || !cfg.clicksendApiKey || !cfg.smsTo) {
  console.log("notify: credentials file incomplete, skipping");
  process.exit(0);
}

/* ---------- collect questions ---------- */
const log = fs.readFileSync(path.join(ROOT, "AGENT_LOG.md"), "utf8");
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

let state = { sent: [] };
try { state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8")); } catch (e) {}

function hash(text) {
  return crypto.createHash("sha1").update(text).digest("hex").slice(0, 12);
}
const fresh = questions.filter(function (q) {
  return state.sent.indexOf(hash(q.text)) === -1;
});
if (!fresh.length) {
  console.log("notify: no new questions (" + questions.length + " open)");
  process.exit(0);
}

/* ---------- send via ClickSend ---------- */
async function main() {
  const auth = Buffer.from(cfg.clicksendUsername + ":" + cfg.clicksendApiKey)
    .toString("base64");
  for (const q of fresh) {
    const ref = (q.text.match(/\b(\d+\.\d+)\b/) || [])[1];
    let body = "RBH agent question" + (ref ? " (item " + ref + ")" : "") +
      ": " + q.text;
    if (body.length > 380) body = body.slice(0, 377) + "...";
    body += "\nReply by email, subject: AGENT ANSWER " + (ref || "");
    if (cfg.statusUrl) body += "\n" + cfg.statusUrl;

    const res = await fetch("https://rest.clicksend.com/v3/sms/send", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + auth,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [{
          to: cfg.smsTo,
          from: cfg.smsFrom || "RBHAgent",
          body: body,
          source: "rbh-audit-agent"
        }]
      })
    });
    const out = await res.json().catch(function () { return {}; });
    if (res.ok && out.response_code === "SUCCESS") {
      state.sent.push(hash(q.text));
      console.log("notify: sent SMS for question " + (ref || hash(q.text)));
    } else {
      console.error("notify: ClickSend send FAILED (http " + res.status + "): " +
        JSON.stringify(out).slice(0, 300));
    }
  }
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

main().catch(function (e) {
  console.error("notify: error " + e.message);
  process.exit(1);
});
