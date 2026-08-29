#!/usr/bin/env node
/*
 * check-opening-hours.js
 *
 * Opening hours are the one piece of copy on the site that sends a patient to
 * a locked door. They exist in two places on a branch landing page: the
 * visible "Opening hours" card that a person reads, and the
 * openingHoursSpecification block in JSON-LD that Google reads. Both are
 * generated from branches.json, and nothing checked that either one agreed
 * with it.
 *
 * The defect that prompted this checker (found on the 3.6 quality pass,
 * 2026-08-10): a day can carry more than one session in branches.json,
 * because McCanns close for lunch. The generator wrote each session into the
 * same slot, so the second overwrote the first and both McCanns landing pages
 * told patients the pharmacy opened at 2pm when it opens at 9am. The JSON-LD
 * was right the whole time, so the page disagreed with its own schema.
 *
 * Rules, all failures:
 *   1. Every day of the week has exactly one visible row on the page.
 *   2. Each visible row equals what branches.json says, including every
 *      session on a split day, in opening-time order.
 *   3. The JSON-LD openingHoursSpecification carries exactly the sessions in
 *      branches.json, no more and no fewer.
 *   4. A day cannot be in closedDays and in specification at the same time.
 *   5. A session must close after it opens.
 *   6. Every day must be stated, in one list or the other. A day in neither is
 *      an omission, not a closure.
 *   7. Every clock time printed on a landing page must sit inside the hours
 *      card. A time anywhere else is an hours claim nothing compares to
 *      branches.json.
 *
 * The defect that prompted rule 6 (found on the 6.3 quality pass, 2026-08-13):
 * rules 1 to 3 compare the page against branches.json, and expectedRow() reads
 * a day that appears in neither closedDays nor specification as "Closed" -
 * exactly what the generator writes. So an omitted day makes the page and the
 * data agree perfectly while both are wrong, and this checker reported clean.
 * Proved by removing Saturday from mccanns_aigburth without adding it to
 * closedDays: the landing page published "Saturday: Closed" for a branch that
 * trades 9am to 1pm and 2pm to 5pm, and rules 1 to 5 all passed. Rule 4 guarded
 * the contradiction, a day in both lists; nothing guarded the gap, a day in
 * neither. The two checkers that did fail were incidental - check-gbp-packs
 * reads the static pack, not the page, and check-editor-snapshot fires on any
 * data edit at all. Publishing "Closed" on a trading day is the same fault as
 * publishing the wrong time, pointed the other way: it turns patients away
 * instead of sending them to a locked door.
 *
 * The defect that prompted rule 7 (found on the 6.3 quality pass, 2026-08-14):
 * rules 1 to 6 moved the READER deeper into the hours card and left its EDGE
 * where it was. Every rule above reads either the structured rows or the
 * JSON-LD, so an hours claim written anywhere else on the page is not wrong to
 * this checker, it is invisible to it. check-gbp-packs cannot cover it either:
 * that checker reads the static pack, not the generated page. Proved by adding
 * one FAQ answer to build-branch-landing-pages.js, "We are open Monday to
 * Friday, 9am to 6pm, and Saturday mornings": all 36 checkers exited 0 while
 * all six landing pages published it, two inches under an hours card that reads
 * "Monday: 9am to 1pm, 2pm to 6pm". That is the estate's loudest live hours
 * fault, the Smartts Mon-Fri 9am-6pm straight-through claim this whole item
 * exists to chase, reproduced in the repo and contradicting the page's own
 * card. A patient reading the prose arrives at a locked door at 1.30pm.
 *
 * Rule 7 is deliberately a CONTAINMENT rule rather than another comparison.
 * Comparing a prose claim to branches.json means parsing English, and the next
 * phrasing would walk past it exactly as this one walked past rules 1 to 6.
 * Requiring instead that the hours card is the only place on the page a clock
 * time may appear does not care how the claim is worded. The card is generated
 * from branches.json and is already checked field for field by rules 1 to 3, so
 * everything inside it is proved and anything outside it is unproved by
 * construction. Zero pages breach it on today's tree, so the fix is a no-op on
 * the current estate and closes the gap for the next edit, as rule 6 was.
 *
 * Residual, stated rather than hidden: the rule reads clock times written in
 * the am/pm form the estate actually publishes in. A bare 24-hour time ("open
 * 9 to 18") is not read, because the numerals cannot be told apart from the
 * ordinary numbers in this copy - "seven common conditions", "aged 16 to 64" -
 * without inventing false positives on live patient pages. If a genuine
 * non-hours time ever needs to print on a landing page, add it to
 * KNOWN_TIME_OUTSIDE_CARD with the question id that agreed it, on the same
 * stale-key-fails contract the other checkers use.
 *
 * The expected strings are composed here from branches.json rather than
 * imported from the generator, on purpose. A checker that calls the code it
 * is checking proves nothing.
 */

var fs = require("fs");
var path = require("path");

var ROOT = path.resolve(__dirname, "..");
var DATA = path.join(ROOT, "branches.json");
var LANDING_DIR = path.join(ROOT, "modules", "branch", "pages");
var DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Rule 7's two readers. TIME_ROW_RE is the hours card's own rows, blanked out
// before the sweep so the card does not report itself. It is written to match
// visibleRows() deliberately: if the generator ever changes the row markup,
// rule 1 fails loudly on a missing row rather than rule 7 falling silently
// open, because a card this stops matching stops being blanked and every time
// in it is then reported outside. TIME_RE is the am/pm clock form the estate
// publishes in. The JSON-LD writes 24-hour times with no am/pm, so the schema
// block is not swept and needs no exemption.
var TIME_ROW_RE = /<strong>(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):<\/strong>\s*[^<]*<\/p>/g;
var TIME_RE = /\b\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm)\b/gi;

var failures = [];
var notes = [];

// Accepted exceptions to rule 7, keyed "<landing page filename>::<time>".
// A genuine non-hours time that must print outside the card goes here with the
// question id that agreed it. Same anti-rot contract as the other checkers: a
// key that stops matching is itself a failure, so this list cannot quietly rot
// into a blanket exemption.
var KNOWN_TIME_OUTSIDE_CARD = {};
var seenKnownTime = {};

function fail(msg) { failures.push(msg); }

// "08:45" -> "8.45am", "13:00" -> "1pm". UK style, no leading zero.
function human(t) {
  var bits = String(t).split(":");
  var h = parseInt(bits[0], 10);
  var m = bits[1];
  var suffix = h >= 12 ? "pm" : "am";
  var h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return h12 + (m === "00" ? "" : "." + m) + suffix;
}

function expectedRow(branch, day) {
  var oh = branch.openingHours || {};
  var closed = (oh.closedDays || []).indexOf(day) !== -1;
  if (closed) return "Closed";
  var sessions = (oh.specification || []).filter(function (s) {
    return (s.dayOfWeek || []).indexOf(day) !== -1;
  });
  if (!sessions.length) return "Closed";
  sessions.sort(function (a, b) { return a.opens < b.opens ? -1 : a.opens > b.opens ? 1 : 0; });
  return sessions.map(function (s) { return human(s.opens) + " to " + human(s.closes); }).join(", ");
}

function visibleRows(html) {
  var rows = {};
  var re = /<strong>(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):<\/strong>\s*([^<]*)<\/p>/g;
  var m;
  while ((m = re.exec(html)) !== null) {
    if (rows[m[1]] !== undefined) rows[m[1]] = "__DUPLICATE__";
    else rows[m[1]] = m[2].trim();
  }
  return rows;
}

// Parse the page's JSON-LD properly rather than pattern-matching it. A lazy
// regex over the block stops at the first inner "]" (the dayOfWeek array) and
// silently reports no sessions at all, which reads as a failure on every page.
function schemaSessions(html, rel) {
  var blocks = html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || [];
  var out = null;
  blocks.forEach(function (raw) {
    var body = raw.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "");
    var obj;
    try {
      obj = JSON.parse(body);
    } catch (e) {
      fail(rel + ": JSON-LD block does not parse as JSON (" + e.message + ")");
      return;
    }
    var list = obj && obj.openingHoursSpecification;
    if (!list) return;
    out = out || [];
    list.forEach(function (s) {
      (s.dayOfWeek || []).forEach(function (d) { out.push(d + " " + s.opens + "-" + s.closes); });
    });
  });
  return out === null ? null : out.sort();
}

function dataSessions(branch) {
  var out = [];
  ((branch.openingHours || {}).specification || []).forEach(function (s) {
    (s.dayOfWeek || []).forEach(function (d) { out.push(d + " " + s.opens + "-" + s.closes); });
  });
  return out.sort();
}

var data = JSON.parse(fs.readFileSync(DATA, "utf8"));
var branches = data.branches.filter(function (b) { return !b.disposed; });

console.log("check-opening-hours");

// Item 6.7 (Q79). Bank holidays are one-off closures and live deliberately
// outside the weekly model: openingHours stays a plain recurring schedule,
// the visible card and the JSON-LD publish that schedule only, and no rule
// in this file reads bankHolidays.dates2026 when comparing page to data. A
// generated page is therefore never failed for omitting a one-off closure
// that bankHolidays.tradingPolicy already accounts for, and must not be:
// the omission is correct, the card describes the recurring week.
//
// What IS checked is the block itself. check-live-hours.js now labels live
// snippets against these dates, so a mistyped date or an unlabelled list
// here would mislabel a genuine defect as a holiday, or a holiday as a
// defect, at the exact moment the label matters.
(function () {
  var bh = data.bankHolidays;
  if (!bh) {
    notes.push("bank holidays: branches.json carries no bankHolidays block, so a live Closed day near a public holiday cannot be cross-checked (Q79).");
    return;
  }
  var dates = bh.dates2026 || [];
  if (!dates.length) {
    fail("bankHolidays: block is present but dates2026 is missing or empty. Either carry the gov.uk dates or remove the block");
  }
  var seen = {};
  dates.forEach(function (d) {
    var ok = false;
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(d))) {
      var dt = new Date(d + "T00:00:00Z");
      ok = !isNaN(dt.getTime()) && dt.toISOString().slice(0, 10) === d;
    }
    if (!ok) fail('bankHolidays: "' + d + '" is not a real ISO yyyy-mm-dd date. check-live-hours.js labels live snippets against this list, so a bad date mislabels a real defect as a holiday');
    if (seen[d]) fail('bankHolidays: "' + d + '" is listed twice');
    seen[d] = 1;
  });
  var POLICIES = ["closed", "reduced", "normal"];
  if (POLICIES.indexOf(bh.tradingPolicy) === -1) {
    fail('bankHolidays: tradingPolicy is ' + JSON.stringify(bh.tradingPolicy) + ' but must be "closed", "reduced" or "normal". An unlabelled date list invites the same false read the block exists to prevent (Q79)');
  }
  notes.push("bank holidays (item 6.7): " + dates.length + " date(s) in bankHolidays.dates2026, tradingPolicy \"" + bh.tradingPolicy + "\". One-off closures: the weekly card and JSON-LD are correct to omit them and no rule here compares them to openingHours.");
})();

// Rules 4, 5 and 6 apply to the data itself, landing page or not. Rule 6 in
// particular must not be scoped to branches with a landing page: an unstated
// day also reaches the GBP packs and the JSON-LD.
branches.forEach(function (b) {
  var oh = b.openingHours;
  if (!oh) return;
  (oh.closedDays || []).forEach(function (d) {
    var clash = (oh.specification || []).some(function (s) { return (s.dayOfWeek || []).indexOf(d) !== -1; });
    if (clash) fail(b.id + ": " + d + " is listed in closedDays and also carries opening times");
  });
  (oh.specification || []).forEach(function (s) {
    if (!(s.closes > s.opens)) fail(b.id + ": session " + s.opens + " to " + s.closes + " does not close after it opens");
    (s.dayOfWeek || []).forEach(function (d) {
      if (DAYS.indexOf(d) === -1) fail(b.id + ': "' + d + '" is not a day of the week');
    });
  });

  // Rule 6. Silence is not a closure. expectedRow() and the generator both
  // render an unstated day as "Closed", so an omission publishes a positive
  // claim that the branch is shut and rules 1 to 3 cannot see it, because the
  // page and the data are derived from the same gap and therefore always agree.
  var stated = {};
  (oh.closedDays || []).forEach(function (d) { stated[d] = 1; });
  (oh.specification || []).forEach(function (s) {
    (s.dayOfWeek || []).forEach(function (d) { stated[d] = 1; });
  });
  DAYS.forEach(function (d) {
    if (!stated[d]) {
      fail(b.id + ": " + d + " is in neither closedDays nor specification. An unstated day is published as \"Closed\", which tells patients the branch is shut. State it either way");
    }
  });
});

var checkedPages = 0;
var splitDayBranches = [];
var cardTimeCount = 0;

branches.forEach(function (b) {
  if (!b.brandSlug || !b.townSlug) return;
  var oh = b.openingHours || {};
  var perDay = {};
  (oh.specification || []).forEach(function (s) {
    (s.dayOfWeek || []).forEach(function (d) { perDay[d] = (perDay[d] || 0) + 1; });
  });
  var hasSplit = Object.keys(perDay).some(function (d) { return perDay[d] > 1; });
  if (hasSplit) splitDayBranches.push(b.id);

  var file = path.join(LANDING_DIR, "pharmacy-" + b.brandSlug + "-" + b.townSlug + ".html");
  if (!fs.existsSync(file)) return;
  checkedPages++;
  var html = fs.readFileSync(file, "utf8");
  var rel = path.relative(ROOT, file).replace(/\\/g, "/");

  var rows = visibleRows(html);
  DAYS.forEach(function (d) {
    var got = rows[d];
    var want = expectedRow(b, d);
    if (got === undefined) fail(rel + ": no visible row for " + d);
    else if (got === "__DUPLICATE__") fail(rel + ": " + d + " appears more than once in the hours card");
    else if (got !== want) fail(rel + ": " + d + ' reads "' + got + '" but branches.json says "' + want + '"');
  });

  // Rule 7. The hours card is the only place on this page a clock time may
  // appear. Blank the card's own rows out of a copy of the page and any time
  // still standing is an hours claim written outside the surface rules 1 to 3
  // prove. Read raw rather than as visible text: a time in a title or an alt
  // attribute is published to a patient or to Google just the same, and the
  // GBP pack rule learned that lesson already.
  TIME_RE.lastIndex = 0;
  cardTimeCount += (html.match(TIME_RE) || []).length;
  var outside = html.replace(TIME_ROW_RE, " ");
  var seenHere = {};
  var tm;
  TIME_RE.lastIndex = 0;
  while ((tm = TIME_RE.exec(outside)) !== null) {
    var t = tm[0].replace(/\s+/g, "").toLowerCase();
    if (seenHere[t]) continue;
    seenHere[t] = 1;
    var key = rel.split("/").pop() + "::" + t;
    if (KNOWN_TIME_OUTSIDE_CARD[key]) { seenKnownTime[key] = true; continue; }
    fail(rel + ': "' + tm[0].trim() + '" is printed outside the opening hours card. ' +
      "Every rule above reads the card or the JSON-LD, so a time anywhere else on the page is an hours claim " +
      "nothing compares to branches.json, and it can contradict the card directly above it. " +
      "Generate it from branches.json inside the card, or add it to KNOWN_TIME_OUTSIDE_CARD with the question id that agreed it");
  }

  var onPage = schemaSessions(html, rel);
  var inData = dataSessions(b);
  if (onPage === null) {
    if (inData.length) fail(rel + ": branches.json carries opening hours but the page has no openingHoursSpecification");
  } else if (onPage.join(" | ") !== inData.join(" | ")) {
    fail(rel + ": JSON-LD opening hours do not match branches.json");
    fail("    page: " + (onPage.join(", ") || "(none)"));
    fail("    data: " + (inData.join(", ") || "(none)"));
  }
});

// Anti-rot for rule 7's exception list. A key nobody matched is a key that has
// outlived the copy it excused, and leaving it in place would widen the rule's
// blind spot the next time that page changes.
Object.keys(KNOWN_TIME_OUTSIDE_CARD).forEach(function (k) {
  if (!seenKnownTime[k]) {
    fail('KNOWN_TIME_OUTSIDE_CARD carries "' + k + '" but nothing on that page matched it. Remove the entry, or restore the copy it was agreed for');
  }
});

// Coverage floor for rule 7. A sweep that reads nothing passes everything, so
// the rule must prove it actually found the times it is policing before its
// silence is allowed to mean anything.
if (checkedPages > 0 && cardTimeCount === 0) {
  fail("rule 7 read " + checkedPages + " landing page(s) and found no clock time on any of them, so its sweep is not reaching the hours card. Check TIME_RE and the card markup");
}

console.log("  " + checkedPages + " landing page(s) checked against " + branches.length + " trading branches");
console.log("  rule 7 swept " + cardTimeCount + " clock time(s) on those pages, all of which must sit inside the hours card");
if (splitDayBranches.length) {
  notes.push("branches with a split day (lunch closure), the case that caused the defect: " + splitDayBranches.join(", "));
}
notes.forEach(function (n) { console.log("  NOTE  " + n); });

if (failures.length) {
  console.log("");
  failures.forEach(function (f) { console.log("  FAIL  " + f); });
  console.log("");
  console.log("check-opening-hours: " + failures.length + " failure(s).");
  process.exit(1);
}
console.log("");
console.log("check-opening-hours: clean, every visible and structured opening time matches branches.json.");
