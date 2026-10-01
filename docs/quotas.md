# External services, limits and failure modes

Every third-party service the app talks to, what limit applies, and what the app does when that limit is hit or the service is down.

_Last reviewed: 2026-10-01. Limits come from the providers' public pages and third-party summaries; confirm the current numbers on the provider's own page before relying on them._

Checked automatically: `bash scripts/verify-quotas-doc.sh` fails if the source code calls an external host that has no complete row in the first table.

## Services called directly from the source code

| Service | Host | Used for | Limit (free tier) | When it fails / limit is hit | Mitigation / plan |
|---|---|---|---|---|---|
| MapTiler Cloud | `api.maptiler.com` | Map style and tiles; place search (geocoding) | Non-commercial and R&D use only. Roughly 100,000 requests and about 1,000 search sessions per month ([pricing](https://www.maptiler.com/cloud/pricing/)). No overage billing: service stops at the quota | Map goes blank and search returns nothing; the app shows no message | Key restricted to allowed origins (localhost for now); debounce and cache search requests; move to self-hosted tiles and geocoding before real traffic |
| OSRM public demo server | `router.project-osrm.org` | Driving route between two points | About 1 request per second, non-commercial, no uptime guarantee, not for production ([usage policy](https://github.com/Project-OSRM/osrm-backend/wiki/Api-usage-policy)) | Route request fails; the error is only written to the browser console and no route is drawn | Self-host a routing engine before supporting many users; add a retry and a visible error message |
| unpkg CDN | `unpkg.com` | MapLibre GL JS and CSS (also the old Leaflet entries in the service worker) | Free CDN for npm packages, no service-level guarantee | `maplibregl` is undefined: no maps and no markers; the rest of the page still loads | Install the packages with a bundler instead of loading them from a CDN |
| Google Fonts | `fonts.googleapis.com` | The Inter typeface | Free | Browser falls back to the system sans-serif font; layout still works | Self-host the font files |
| Firebase JS SDK (gstatic CDN) | `www.gstatic.com` | Firebase App and Auth modules (version 10.8.0), loaded as ES modules | Free CDN served by Google | `auth.js` fails to load, so sign-in and screen navigation are never defined: the app is unusable | Install the Firebase SDK with a bundler instead of importing from a URL |
| Placeholder image service | `via.placeholder.com` | Icons in `manifest.json` | Third-party placeholder service, no guarantee, not meant for production | Install icon is missing or broken | Ship real 192 and 512 pixel icons inside the repo |

## Services used indirectly (through the Firebase SDK or the browser)

| Service | Host | Used for | Limit (free tier) | When it fails / limit is hit | Mitigation / plan |
|---|---|---|---|---|---|
| Firebase Authentication | `identitytoolkit.googleapis.com`, `securetoken.googleapis.com` | Sign-in and refreshing login tokens | No per-user charge for Google sign-in on the free plan; phone/SMS sign-in and some advanced features are paid ([pricing](https://firebase.google.com/pricing)) | Sign-in fails with a generic "Sign-in failed" alert | Show the real error to the user; the browser key is restricted to Identity Toolkit and Token Service only |
| Firebase auth handler domain | `<project-id>.firebaseapp.com` | Hosts the Google sign-in popup/redirect handler | Free | Sign-in popup or redirect fails | Keep this domain in the key's allowed referrers and in Firebase's authorised domains |
| Google sign-in | `accounts.google.com` | Google account chooser and consent screen | Free | Sign-in is unavailable | None needed; show a clear message and let the user retry |
| Google Fonts files | `fonts.gstatic.com` | Font files referenced by the Google Fonts stylesheet | Free | Same as Google Fonts above | Self-host the font files |

## Cost protection (current setup)
- The Firebase project is on the **Spark (free) plan**, which has **no billing account attached**. Google cannot charge for it; if a free limit is reached, the affected feature stops working instead.
- MapTiler is on its free plan, which also stops at the quota instead of billing overage.
- **Before upgrading to the Blaze (pay-as-you-go) plan** (needed later for Cloud Functions), first create a budget in Google Cloud Billing with alerts at 50%, 90% and 100% of a small monthly amount. A budget only sends alerts; it does not stop spending.
- To double-check at any time: Firebase console → Usage and billing → plan should read "Spark".

## Notes
- **Origin and referrer restrictions stop other websites, not scripts.** A script can fake the header, so they are one layer, not the only one.
- A key shown in front-end code is never secret. Treat restrictions and quotas as the protection, not hiding the key.
- Whenever the code starts calling a new external host, add its row to the first table in the same change; the check script enforces this.
