# Broken internal links sweep - 2026-08-11 (item 6.2)

Run by the audit-backlog worker with tools/sweep-broken-links.js (new).
Raw data with per-page sources: broken-links-sweep-2026-08-11.json.

## Scope

All 12 www branch-site hosts from branches.json hostMap. Excluded:
www.clearchemist.co.uk (27,000+ URLs, cannot be swept in one run) and the
bare rbhealth.co.uk (redirects to www). 449 sitemap pages fetched, 403
unique estate-internal link targets status-checked. Read-only GET/HEAD.

## Result: 15 broken targets, three real, twelve one artefact

1. Cloudflare email obfuscation (12 of the 15). Every site's mailto links
   are rewritten by Cloudflare to /cdn-cgi/l/email-protection, which 404s
   for any crawler while working fine for real visitors. Footers carry
   email links, so this sits on nearly every page of every site and is
   almost certainly the estate-wide "Page has links to broken page" top
   issue in Ahrefs. Decision on silencing it: Q54.

2. Riddings switch permalink (site-wide on Riddings). Every Riddings page
   links switch-prescriptions-riddings-timperley.html (404). The live page
   sits at the old permalink switch-prescriptions.html. Every other site
   serves its switch page at the canonical pattern; the generated pages in
   this repo link the canonical target correctly, so this is live-only.
   Same permalink Q31 worked around in the GBP pack. Decision: Q53.

3. Tiffenbergs book-now.html (site-wide on Tiffenbergs). The other ten
   sites serve book-now.html; Tiffenbergs alone 404s while its nav links
   it from every page. Live-only publish. Decision: Q53.

4. Riddings /clinic-prices (8 sites). The service-price-list.html pages on
   eight sites cross-link riddingspharmacy.co.uk/clinic-prices, which does
   not exist. Correct target is /service-price-list.html. The price list
   pages are Weebly-native, not generated, so live-only. Decision: Q53.

## Generator-owned defects found: none

The string clinic-prices appears nowhere in the repo, book-now is not
emitted by any generator, and the generated Riddings pages link the
canonical (correct) switch permalink. Nothing to fix at source.
