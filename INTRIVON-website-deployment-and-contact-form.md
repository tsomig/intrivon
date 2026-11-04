# INTRIVON website — deployment & contact form

Last updated: 4 November 2026 (v234 live).

## Where the site lives

- **Live URL:** https://www.intrivon.com/ (`intrivon.com` redirects to `www`).
- **Repository:** github.com/tsomig/intrivon — GitHub Pages serves the **root of the `main` branch**. The custom domain is set by the `CNAME` file (`www.intrivon.com`); `.nojekyll` keeps Pages from processing the files.
- **Type:** fully static — no Node, npm, build step, PHP or database. Pages: `index.html`, `policies.html`, `contact-sent.html` (thank-you page), `404.html`; everything else under `assets/`.
- **Current version:** production handoff **v234** (base commit `512e2f32…`), deployed 4 Nov 2026 via PR #10. Follow-ups: PR #11 (CONTACT US button moved to the footer under FOLLOW US), PR #12 (contact form switched to Web3Forms).

## How to deploy a new handoff

1. Unzip the handoff package (if it comes in parts, join them first: `cat part-aa part-ab > handoff.zip`). Optionally verify with `sha256sum -c SHA256SUMS.txt`.
2. The **contents of `public/`** go to the repository root, so `index.html` sits at the top level. Keep folder structure and file-name case exactly.
3. **Keep these repo files** — they are not in the package: `CNAME`, `.nojekyll`, `404.html`, `robots.txt`, `favicon.ico`, `sitemap.xml` (update its `lastmod`).
4. Commit on a branch, open a pull request, merge into `main`. Pages redeploys automatically within 1–2 minutes. **Rollback** = revert the merge commit on GitHub.
5. Post-publish checks (from the handoff's START-HERE): private window on desktop and Safari/iPhone; hero video and its rotation; menu; the four "What we do" phases; Services; Sectors; Core Values; footer policy links; one test submission through the contact form.
6. Size limits: GitHub rejects single files over 100 MB; keep the repo well under 1 GB. The v234 package carries roughly 84 MB of assets the pages never reference (alternate hero videos, large studio portrait PNGs, the Lato font family) — safe to prune in a later release.

## Contact form

- **Provider:** **Web3Forms** (switched from FormSubmit on 4 Nov 2026 after repeated Cloudflare 522 outages on FormSubmit's side).
- **Endpoint:** `POST https://api.web3forms.com/submit`. The access key sits in `index.html` as a hidden field (`access_key`); it is public by design.
- **Recipient:** the key was issued for **gts@intrivon.com**, so every submission is delivered there. To change the recipient: create a new key at web3forms.com for the new address and replace the `access_key` value in `index.html`.
- **Hidden fields:** `subject` = `INTRIVON | New website inquiry`; `from_name` = `INTRIVON website`; `redirect` = `https://www.intrivon.com/contact-sent.html`; `botcheck` honeypot (hidden checkbox). The visitor's `email` field becomes the reply-to automatically. Visible fields: name, email, title, company, message.
- **Free-plan notes:** 250 submissions/month; the redirect must stay on the same domain as the form; CC to a second address (`ccemail`) is a paid feature — hence the mailbox filter below.
- **Fallback:** the CONTACT US links carry `mailto:vtri@intrivon.com,gts@intrivon.com`, used only when the form dialog cannot open (JavaScript off).
- **Policies page:** the Privacy and Cookies sections of `policies.html` name Web3Forms as the form processor; update them if the provider changes again.

## Copy of inquiries to vtri@intrivon.com

- **Mail hosting:** Papaki — Email Manager at mail.controlpanel.pro (mailboxes `gts@`, `jsc@`, `nt@`, `vtri@`; one of the plan's five addresses is still free), webmail (Roundcube) at email.papaki.com.
- **Filter** in the **gts@** mailbox: Webmail → Settings (Ρυθμίσεις) → Filters (Φίλτρα) → filter "INTRIVON | New website inquiry", scope *any of the rules*: Subject contains `website inquiry` **or** Sender contains `web3forms` → action *Send message copy to* `vtri@intrivon.com` (copy, so the original stays in `gts@`).
- The filter only applies to mail that arrives **after** it is saved, and copies can take a few minutes to appear. Do **not** use the mailbox-level "Forwarding" (Προώθηση) option — that forwards all mail, not just inquiries.
- Alternative if ever needed: create `contact@intrivon.com` as a forward-only address delivering to both people and re-issue the Web3Forms key for it.

## Troubleshooting

- **Form shows a Cloudflare / provider error page:** the provider's server is down, not the site. Retry later; if it persists, switch provider (one `action` line plus hidden fields in `index.html`, and the wording in `policies.html`).
- **Submission "succeeds" but no e-mail:** check the recipient's spam folder; confirm the `access_key` in the live `index.html` matches the key issued for that address; keep test messages realistic (very short "test" messages can be dropped by the spam check).
- **Copy not arriving at vtri@:** confirm the filter is saved in the `gts@` mailbox (not another one), send a fresh test, and check `vtri@`'s spam folder.
