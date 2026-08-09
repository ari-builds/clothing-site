# Clothing Store — WhatsApp-order storefront

Low-budget startup store: clean, mobile-first, order direct on WhatsApp.

## Run locally
```
node server.js          # http://localhost:4173  (storefront)
                        # http://localhost:4173/admin (daily uploads, admin token in data/config.json)
```

## Daily upload flow (new arrivals)
1. Open `http://localhost:4173/admin` and add the product + photo. It saves to `data/products.json`.
2. Run `.\push-site.ps1` — commits and pushes to GitHub. Vercel auto-rebuilds and the new arrival goes live.
   (Or: `git add -A; git commit -m "new arrival"; git push`)

## Deployed (read-only storefront)
Vercel serves the storefront from the committed `data/products.json`. WhatsApp ordering is fully client-side — no cart, no backend writes needed.

## Config (`data/config.json`)
- `brand` — store name shown in the header
- `whatsapp` — your WhatsApp number in international form, digits only (e.g. `639123456789`)
- `accent` — brand color (hex)
- `currency` — e.g. `₱`
- `adminToken` — the token used to log into `/admin` (CHANGE THIS)
