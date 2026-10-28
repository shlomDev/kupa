# Grocery Price Catalog

Hosted Worker app with one self-contained HTML interface. The browser needs no installs or API keys.

## Supported data

- PriceFull / Price XML: actual ItemPrice values, barcode, title, manufacturer, quantity, unit-measure price and source fields. Invalid/missing prices are excluded, not converted to zero.
- PromoFull / Promo XML: PromotionID, description, reported discount amount/rate, quantity requirements, membership IDs, validity dates, restrictions and included barcodes. Raw scalar fields remain visible. No guessed promotion arithmetic or unit-price claims.
- JSON equivalents, including singleton/repeated records. Gzip is detected by magic bytes and decompressed before XML/JSON detection.
- Import .gz/.xml/.json or paste decompressed XML/JSON. Parsing happens locally; catalog files are not uploaded or persisted. Catalogs stay in the tab until refresh. Branches are isolated by ChainID + StoreID, and offers match product titles by barcode only inside that branch.

## Interface

Blue-and-amber palette with a light default and matching navy dark theme; card layout inspired by the user's car-app reference, favorites, barcode/name/brand search, category filters, price sorting, expandable source details, and incremental rendering.

Source categories are preserved. Suggested categories use transparent title-keyword rules and are labeled as suggestions. Optional product photos/categories use exact barcode lookups in Open Food Facts / Open Beauty Facts with source attribution. No stock/guessed product images. Lookup failure does not modify prices or titles.

Alerts are scoped to chain, branch and barcode and checked only after fresh regular catalog fetches. Saved data/imports never trigger Telegram sends. Delivery requires bot token and chat ID; credentials remain browser-local. Repeated delivery at an unchanged price is suppressed.

## Branch and source connections

Store, city/GPS and branch selection are visible on entry. The app starts without a catalog; it never silently opens branch 221 in place of the branch the user wanted. Catalog downloads cannot hide branch selection. Switching chain/location clears the prior branch and displayed catalog.

The branch cache is generated from official sources retrieved on 28 October 2026: SuperPharm's separate retail branch-directory endpoint (305 branches), Rami Levi's Stores XML (99 branches), and Osher Ad's Stores XML (24 branches). It refreshes in the background. City codes are resolved through the current government settlement directory. No branches, city names or coordinates are manually fabricated. Nearby distances appear only where coordinates are available; GPS requires browser permission.

Rami Levi and Osher Ad now use their documented public session usernames and empty passwords. The connector retains chain-specific cookies, handles redirects, obtains pre/post-login CSRF tokens, POSTs paginated file listings and downloads the newest file matching the selected chain/branch/type. A password field outside the actual login form is not treated as failed login. Both gzip and plain XML, including UTF-16, are decoded.

Direct-source validation on 28 October 2026 succeeded: Rami Levi Netanya Polg (024) PriceFull had 14,676 Items; Osher Ad Netanya (023) PriceFull had 6,488 Items. Hosted-path validation is reported separately in the conversation.

SuperPharm branch discovery no longer depends on its price portal. PriceFull/PromoFull downloads still use that portal; its verification challenge is reported accurately and is not bypassed. The selected branch remains available after a download error.

The optional saved catalog remains a real official SuperPharm PriceFull retrieved on 25 October 2026 for branch 221, with 8,729 products. It is opened only on explicit request, clearly dated, and is never substituted for a failed selected-branch request.

## Build and checks

- `node scripts/build.mjs` builds the inline HTML/parser/data/Worker.
- `node tests/branches.mjs` checks current official branch counts, Netanya ordering, English/Hebrew city resolution, and visible location/store controls.
- `node tests/feed-session.mjs` checks cookies, redirects, fresh CSRF, POST listings, UTF-16 and the login-form regression.
- `node tests/catalog.mjs` checks the real catalog, synthetic promotion rules, singleton items, numeric edge cases, gzip JSON, branch extraction, suggested categories and challenge handling.
- `node tests/source-response.mjs` checks source response rejection/passthrough.
- `node scripts/validate-artifact.mjs` validates the Worker artifact.

Browser QA: real-data search, favorites, XML product import via paste, XML promotion import via paste, membership/quantity/date display and barcode matching passed. Automated file-picker upload timed out, so that browser path remains unverified. Gzip JSON decompression passed parser tests. The supplied live Netanya PromoFull file was not downloaded; real-source PromoFull validation remains outstanding. Photo provider success and Telegram delivery remain unverified.
