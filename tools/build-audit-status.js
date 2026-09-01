#!/usr/bin/env node
// build-audit-status.js
// Renders AGENT_WORKLIST.md + AGENT_LOG.md + branch history into a
// self-contained HTML status page and publishes it to the data portal
// (rishi235/rbh-data-portal) via the GitHub API using the gh CLI.
// Run: node C:\Dev\rbh-site-data\tools\build-audit-status.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO = 'C:/Dev/rbh-site-data';
const WORKLIST = path.join(REPO, 'AGENT_WORKLIST.md');
const LOGFILE = path.join(REPO, 'AGENT_LOG.md');
const QFILE = path.join(REPO, 'QUESTIONS.json');
const PORTAL = 'rishi235/rbh-data-portal';
const DEST = 'reports/digital/Digital_Audit_Status.html';

function sh(cmd) {
  return execSync(cmd, { cwd: REPO, encoding: 'utf8' }).trim();
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---------- parse the worklist ----------
// Items may be ticked in place OR sit in the "## Done" section (early runs
// moved them). Attribute every item to its phase by its "N.M" number.
const wlLines = fs.readFileSync(WORKLIST, 'utf8').split(/\r?\n/);
const phases = []; // { num, name, items: [{id, text, done, blocked}] }
let section = '';
let lastItem = null;
for (const line of wlLines) {
  const h = line.match(/^## (.+)$/);
  if (h) {
    section = h[1];
    const p = section.match(/^Phase (\d+) - (.+)$/);
    if (p) phases.push({ num: p[1], name: p[2], items: [] });
    lastItem = null;
    continue;
  }
  const m = line.match(/^- \[( |x|X)\] (?:\[BLOCKED\] )?(\d+)\.(\d+[^ ]*) (.*)$/);
  if (m) {
    const item = {
      id: m[2] + '.' + m[3],
      phase: m[2],
      text: m[4],
      done: m[1].toLowerCase() === 'x',
      blocked: /\[BLOCKED\]/.test(line),
    };
    const ph = phases.find(p => p.num === item.phase);
    if (ph) {
      const existing = ph.items.find(i => i.id === item.id);
      if (existing) { // Done-section copy wins over the unticked original
        if (item.done) { existing.done = true; existing.text = item.text; }
      } else ph.items.push(item);
    }
    lastItem = item;
  } else if (lastItem && /^\s{4,}\S/.test(line)) {
    lastItem.text += ' ' + line.trim();
  } else lastItem = null;
}

// ---------- questions (structured) and recent activity ----------
let allQuestions = [];
try { allQuestions = JSON.parse(fs.readFileSync(QFILE, 'utf8')); } catch (e) {}
const openQs = allQuestions.filter(q => q.status === 'open');
const answeredQs = allQuestions.filter(q => q.status === 'answered');
let commits = [];
try {
  commits = sh('git log agents/audit-backlog --date=format:"%d %b %H:%M" ' +
    '--pretty=format:"%ad|%s" -12').split(/\r?\n/).filter(Boolean)
    .map(l => { const i = l.indexOf('|'); return { when: l.slice(0, i), what: l.slice(i + 1) }; });
} catch (e) { /* branch may not exist yet */ }

// ---------- counts ----------
const all = phases.flatMap(p => p.items);
const doneCount = all.filter(i => i.done).length;
const total = all.length;
const pct = total ? Math.round((doneCount / total) * 100) : 0;
const nextItem = all.find(i => !i.done && !i.blocked);
const blockedItems = all.filter(i => i.blocked && !i.done);
const now = new Date().toLocaleString('en-GB', {
  day: 'numeric', month: 'long', year: 'numeric',
  hour: '2-digit', minute: '2-digit' });

// ---------- render ----------
function badge(i) {
  if (i.done) return '<span class="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded">DONE</span>';
  if (i.blocked) return '<span class="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded">NEEDS RISHI</span>';
  if (nextItem && i.id === nextItem.id) return '<span class="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded">NEXT</span>';
  return '<span class="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded">QUEUED</span>';
}
const phaseHtml = phases.map(p => {
  const d = p.items.filter(i => i.done).length;
  const rows = p.items.map(i =>
    '<li class="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">' +
    '<span class="shrink-0 mt-0.5">' + badge(i) + '</span>' +
    '<span class="text-sm ' + (i.done ? 'text-gray-400' : 'text-gray-800') + '">' +
    '<span class="font-semibold">' + esc(i.id) + '</span> ' + esc(i.text) +
    '</span></li>').join('\n');
  return '<section class="bg-white rounded-xl shadow-sm p-5 mb-4">' +
    '<div class="flex items-center justify-between mb-1">' +
    '<h2 class="font-semibold text-gray-900">Phase ' + esc(p.num) + ': ' + esc(p.name) + '</h2>' +
    '<span class="text-sm text-gray-500">' + d + ' of ' + p.items.length + ' done</span></div>' +
    '<div class="w-full bg-gray-100 rounded h-2 mb-3"><div class="bg-green-500 h-2 rounded" style="width:' +
    (p.items.length ? Math.round(d / p.items.length * 100) : 0) + '%"></div></div>' +
    '<ul>' + rows + '</ul></section>';
}).join('\n');

function questionCard(q) {
  const opts = q.options.map((o, i) => {
    const rec = i === q.recommended;
    return '<label class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ' +
      (rec ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white hover:bg-gray-50') + '">' +
      '<input type="radio" name="' + esc(q.id) + '" value="' + esc(o) + '"' +
      (rec ? ' checked' : '') + ' class="mt-1 accent-amber-600">' +
      '<span class="text-sm text-gray-800">' + esc(o) +
      (rec ? ' <span class="ml-1 text-xs font-semibold text-amber-700">Recommended</span>' : '') +
      '</span></label>';
  }).join('\n');
  return '<div class="border border-gray-200 rounded-xl p-4 mb-3 bg-gray-50" data-qid="' + esc(q.id) + '">' +
    '<p class="text-xs text-gray-500 mb-1"><span class="font-semibold text-gray-700">' + esc(q.id) + '</span> - ' + esc(q.date) + ' - worklist item ' + esc(q.item) + '</p>' +
    '<p class="text-sm font-medium text-gray-900 mb-3">' + esc(q.question) + '</p>' +
    '<div class="space-y-2">' + opts +
    '<label class="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white cursor-pointer">' +
    '<input type="radio" name="' + esc(q.id) + '" value="__other__" class="mt-1 accent-amber-600">' +
    '<span class="text-sm text-gray-800 grow">Other:' +
    '<input type="text" data-other-for="' + esc(q.id) + '" placeholder="Type your answer" ' +
    'class="mt-1 w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"></span></label></div>' +
    (q.note ? '<p class="text-xs text-gray-500 mt-3">' + esc(q.note) + '</p>' : '') +
    '<div class="flex items-center gap-3 mt-3">' +
    '<button data-submit="' + esc(q.id) + '" class="bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-700">Send answer</button>' +
    '<span class="text-xs text-gray-500" data-status-for="' + esc(q.id) + '"></span></div></div>';
}
const answeredHtml = answeredQs.length
  ? '<details class="mt-2"><summary class="text-xs text-gray-500 cursor-pointer">Answered questions (' +
    answeredQs.length + ')</summary>' + answeredQs.map(q =>
      '<p class="text-xs text-gray-500 mt-2"><span class="font-semibold">' + esc(q.id) + '</span> ' +
      esc(q.question.slice(0, 120)) + ' <span class="text-green-700 font-semibold">Answered:</span> ' +
      esc(q.answer || '') + '</p>').join('') + '</details>'
  : '';
const questionsHtml = openQs.length
  ? '<section class="bg-white rounded-xl shadow-sm p-5 mb-4 border-l-4 border-red-400">' +
    '<h2 class="font-semibold text-gray-900 mb-1">Questions waiting on Rishi (' + openQs.length + ')</h2>' +
    '<p class="text-xs text-gray-500 mb-3">Pick an answer and press Send. The agents pick it up on their next hourly run.</p>' +
    openQs.map(questionCard).join('\n') + answeredHtml + '</section>'
  : '<section class="bg-white rounded-xl shadow-sm p-5 mb-4">' +
    '<h2 class="font-semibold text-gray-900 mb-1">Questions waiting on Rishi</h2>' +
    '<p class="text-sm text-gray-500">None at the moment.</p>' + answeredHtml + '</section>';
const answerScript = '<script>' +
  'function markSent(card, saved){' +
  'card.querySelectorAll("label,[data-submit]").forEach(function(el){ el.style.display = "none"; });' +
  'var note = card.querySelector("[data-sent-note]");' +
  'if (!note) { note = document.createElement("div");' +
  'note.setAttribute("data-sent-note", "1");' +
  'note.className = "mt-2 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-900";' +
  'card.appendChild(note); }' +
  'note.textContent = "Your answer (" + saved.at + "): " + saved.val + ". The agents record it on their next run; this card disappears once it is applied.";' +
  '}' +
  'document.querySelectorAll("[data-qid]").forEach(function(card){' +
  'var qid = card.getAttribute("data-qid"); var saved = null;' +
  'try { saved = JSON.parse(localStorage.getItem("auditAnswer:" + qid)); } catch (e) {}' +
  'if (saved) { markSent(card, saved); }' +
  '});' +
  'document.querySelectorAll("[data-submit]").forEach(function(btn){' +
  'btn.addEventListener("click", async function(){' +
  'var qid = btn.getAttribute("data-submit");' +
  'var card = document.querySelector("[data-qid=\\"" + qid + "\\"]");' +
  'var sel = document.querySelector("input[name=\\"" + qid + "\\"]:checked");' +
  'var status = document.querySelector("[data-status-for=\\"" + qid + "\\"]");' +
  'var val = sel ? sel.value : "";' +
  'if (val === "__other__") { val = (document.querySelector("[data-other-for=\\"" + qid + "\\"]").value || "").trim(); }' +
  'if (!val) { status.textContent = "Pick an option or type an answer first."; return; }' +
  'btn.disabled = true; status.textContent = "Sending...";' +
  'try {' +
  'var r = await fetch("/api/audit-answer", { method: "POST", headers: { "Content-Type": "application/json" },' +
  'body: JSON.stringify({ id: qid, answer: val }) });' +
  'var out = null; try { out = await r.json(); } catch (e2) {}' +
  'if (r.ok && out && out.ok) {' +
  'var saved = { val: val, at: new Date().toLocaleString("en-GB", { hour12: false }) };' +
  'try { localStorage.setItem("auditAnswer:" + qid, JSON.stringify(saved)); } catch (e) {}' +
  'markSent(card, saved);' +
  'if (out.written === "kv-fallback") { var n = card.querySelector("[data-sent-note]"); if (n) n.textContent += " (Recorded via the fallback box, not written straight to the file yet - tell Claude if this keeps happening.)"; }' +
  '} else { status.textContent = "Send failed (" + (out && out.error ? out.error : r.status) + "). Try again or answer in Claude chat."; btn.disabled = false; }' +
  '} catch (e) { status.textContent = "Send failed. Try again or answer in Claude chat."; btn.disabled = false; }' +
  '});});' +
  '</scr' + 'ipt>';
const commitsHtml = commits.length
  ? commits.map(c => '<li class="py-1.5 border-b border-gray-100 last:border-0 text-sm">' +
      '<span class="text-gray-400 mr-2">' + esc(c.when) + '</span>' +
      '<span class="text-gray-800">' + esc(c.what) + '</span></li>').join('\n')
  : '<li class="text-sm text-gray-500">No commits yet.</li>';

const html = '<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">' +
  '<meta name="robots" content="noindex">' +
  '<title>Digital Audit Status</title>' +
  '<script src="https://cdn.tailwindcss.com"><\/script></head>' +
  '<body class="bg-gray-50 text-gray-900"><div class="max-w-3xl mx-auto p-4 sm:p-6">' +
  '<header class="mb-5"><h1 class="text-2xl font-bold">Full Audit June 2026: agent progress</h1>' +
  '<p class="text-sm text-gray-500 mt-1">Updated ' + now + '. Refreshed automatically after every agent run.</p></header>' +
  '<section class="bg-white rounded-xl shadow-sm p-5 mb-4">' +
  '<h2 class="font-semibold mb-2">What this is, in plain English</h2>' +
  '<p class="text-sm text-gray-700 leading-relaxed">The June audit found our sites rank well when people already know us, ' +
  'and poorly for the local searches that bring new patients. Claude agents on the ProDesk work through the fix list ' +
  'below around the clock, one item per hour: correcting data errors, building the pilot pair (Fishlocks Ainsdale and ' +
  'Cherry Lane), putting town and service words into every page title and heading, and drafting Google Business Profile ' +
  'content packs for all 14 stores. Nothing goes live until Rishi merges it. Items marked NEEDS RISHI are waiting on a decision.</p>' +
  '</section>' +
  '<section class="bg-white rounded-xl shadow-sm p-5 mb-4">' +
  '<div class="flex items-center justify-between mb-1"><h2 class="font-semibold">Overall progress</h2>' +
  '<span class="text-sm font-semibold">' + doneCount + ' of ' + total + ' items (' + pct + '%)</span></div>' +
  '<div class="w-full bg-gray-100 rounded h-3"><div class="bg-green-500 h-3 rounded" style="width:' + pct + '%"></div></div>' +
  (nextItem ? '<p class="text-sm text-gray-600 mt-2">Working on next: <span class="font-semibold">' +
    esc(nextItem.id) + '</span> ' + esc(nextItem.text.slice(0, 140)) + '</p>' : '') +
  '</section>' +
  questionsHtml + phaseHtml +
  '<section class="bg-white rounded-xl shadow-sm p-5 mb-4">' +
  '<h2 class="font-semibold mb-2">Recent agent activity</h2><ul>' + commitsHtml + '</ul>' +
  '<p class="text-xs text-gray-400 mt-3">Review and merge: github.com/rishi235/rbh-site-data, branch agents/audit-backlog. ' +
  'Full detail in AGENT_LOG.md on that branch.</p></section>' +
  '</div>' + answerScript + '</body></html>';

// ---------- publish to the portal via GitHub API ----------
const b64 = Buffer.from(html, 'utf8').toString('base64');
let sha = '';
try {
  sha = sh('gh api repos/' + PORTAL + '/contents/' + DEST + ' --jq .sha');
} catch (e) { /* first publish: file does not exist yet */ }
const payload = { message: 'Digital audit status page update', content: b64 };
if (sha) payload.sha = sha;
const tmp = path.join(REPO, 'tools', '.status-payload.json');
fs.writeFileSync(tmp, JSON.stringify(payload));
try {
  sh('gh api -X PUT repos/' + PORTAL + '/contents/' + DEST + ' --input "' + tmp + '"');
  console.log('Published ' + DEST + ' (' + doneCount + '/' + total + ' done, ' + pct + '%)');
} finally {
  fs.unlinkSync(tmp);
}
