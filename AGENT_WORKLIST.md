# AGENT WORKLIST - Full Audit June 2026 backlog
Source: RBH_DIGITAL_MASTER_PLAN_v2.md and RBH_DIGITAL_BUILD_PACK_v2.md
(AI\Digital Marketing\handover files, 17 July copies) and
00_DIGITAL_AUDIT_CONTEXT_PACK.md (AI\Weebly\seo).

## Rules for every run
- Work ONLY in C:\Dev\rbh-site-data on branch agents/audit-backlog.
- NEVER checkout, commit to, merge or push main. NEVER force-push anything.
- Follow repo conventions in CLAUDE.md. Pages are generated: change the
  generators and data (branches.json, tools, scripts), then regenerate.
  Do not hand-edit generated output.
- One worklist item per run, done properly. Tick it here when complete.
- Append a dated entry to AGENT_LOG.md every run, even if nothing changed.
- If an item needs a decision from Rishi, write the question in AGENT_LOG.md
  under "Questions for Rishi", mark the item [BLOCKED] here, move on.
- UK English. No em dashes. No emojis. Plain English.

## Phase 1 - Data accuracy (quick wins)
- [x] 1.4 Check every branch page's NAP (name, address, phone) against
      branches.json; fix mismatches at source and regenerate. Done 2026-08-04.
      New tools/check-nap.js verifies all 171 generated pages; Scorah
      Bramhall switch page address corrected (61-63 North Park Road),
      disposed Wilmslow switch page removed, generator now skips
      disposed branches. Checker passes clean.

## Phase 2 - Pilot pair (agreed sequence: one strong, one weak)
- [ ] 2.1 Fishlocks Ainsdale: audit its pages against the Build Pack v2 spec;
      list gaps in AGENT_LOG.md, then fix what can be fixed in-repo.
- [ ] 2.2 Fishlocks shared-domain split: branch-specific landing pages so
      Ainsdale and Eccleston each have their own local target page.
- [ ] 2.3 Cherry Lane: build-from-near-zero per Build Pack v2. Full page set
      (services, Pharmacy First, switch, weight loss, travel) with local SEO.

## Phase 3 - Town and service words in titles and headings (all pages)
The core position fix from the audit. Work brand by brand, one item per run.
For each brand: put town plus service words into every page title, meta
description and H1 via the generators, following the pattern in Build Pack v2.
- [ ] 3.1 Define the title/H1 pattern once, in the generator, with per-branch
      town words sourced from branches.json. Document the pattern in
      AGENT_LOG.md before rolling out.
- [ ] 3.2 Apply to brand 1 in branches.json order, regenerate, verify.
- [ ] 3.3 Apply to brand 2, regenerate, verify.
- [ ] 3.4 Apply to brand 3, regenerate, verify.
- [ ] 3.5 Apply to brand 4, regenerate, verify.
- [ ] 3.6 Apply to brand 5, regenerate, verify.
- [ ] 3.7 Apply to brand 6, regenerate, verify.
- [ ] 3.8 Apply to brand 7, regenerate, verify.
- [ ] 3.9 Apply to brand 8, regenerate, verify.
- [ ] 3.10 Apply to brand 9, regenerate, verify.
- [ ] 3.11 Apply to brand 10, regenerate, verify.
- [ ] 3.12 Apply to brand 11, regenerate, verify.
- [ ] 3.13 Apply to brand 12, regenerate, verify.

## Phase 4 - GBP content packs (drafts only; agents cannot edit GBP)
One pack per branch, saved to gbp-packs/<branch-slug>.md on this branch.
Each pack: business description, extra categories to add, services section
content, photo shot list, and four post drafts (Pharmacy First, switch to us,
weight loss, travel clinic). Use branches.json for facts. Ready for Rishi or
Dane to paste in. Advertising rules apply: no medicine brand names in weight
loss posts (POM advertising is not permitted), no efficacy claims, keep
Pharmacy First wording to the NHS service description.
- [ ] 4.1 Create the pack template plus the first pack (Fishlocks Ainsdale).
- [ ] 4.2 Cherry Lane pack.
- [ ] 4.3 Hirshmans pack.
- [ ] 4.4 through 4.14 One pack per remaining branch in branches.json order,
      one per run. Split into individual ticks in this file as they are done.

## Done
Completed items stay in place above, ticked [x] with the completion date
appended to the line. Do not move them; the status page reads them in place.
- [x] 1.3 Sweep all pages for the McCanns Sandringham postcode error
      (CH49 1SX appearing anywhere; correct is L17 4JP). Done 2026-08-04.
      Repo, repo history and live site all clean; correct L17 4JP throughout.
      Per Master Plan v2 and Build Pack v2 section 4.2 the CH49 1SX sits in
      the GBP management record, which this agent cannot reach - action note
      for Rishi or Dane logged in AGENT_LOG.md.
- [x] 1.2 Verify Hirshmans address reads "56-62 Sherwood House, Station Road,
      Ainsdale" everywhere on the site. Done 2026-08-04. Repo and live site
      both verified correct; no changes needed. One cosmetic note logged
      (contact-us page left block splits "Station Road" across a line break
      and omits the postcode - hand edit on Weebly when convenient).
- [x] 1.1 Standardise brand-name spelling across all site data and pages
      (Fishlock vs Fishlocks, Coleman & Leigh vs Leighs, Gordon Short vs
      Shorts). Done 2026-08-04, commit 1ec8f7b. Canonical form fixed to
      "Gordon Short Chemist"; Fishlocks already consistent; Coleman & Leigh
      question logged for Rishi in AGENT_LOG.md.

## Questions for Rishi
(See AGENT_LOG.md for the running list.)
