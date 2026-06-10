# Internus LTD — company website

Static site (plain HTML/CSS/JS) + a small self-hosted Node.js contact-form
handler. Served by Caddy on the VPS at 72.62.0.124.

## Local development

```bash
python3 -m http.server 8000          # serve the static site at localhost:8000
cd form-handler && npm install
PORT=8721 SMTP_HOST=... SMTP_USER=... SMTP_PASS=... MAIL_TO=you@example.com node server.js
```

The form posts to `/api/contact`; locally that only works behind a proxy, so
test the handler directly with curl (see form-handler/server.js).

## Before going live — checklist

1. **Register the domain** and update it everywhere it appears as
   `internus.dev` (grep for it): all HTML meta/canonical/OG tags, sitemap.xml,
   robots.txt, deploy/Caddyfile.snippet, form-handler config.
2. **Fill the placeholders** — grep for `PLACEHOLDER`:
   - Company registry number + address (footer of every page, privacy.html)
   - Real case-study content in index.html and projects/*.html
   - LinkedIn URL in index.html
   - Email provider name in privacy.html
3. **Set up email**: mailbox or forwarding on the domain (hello@…), plus an
   SMTP relay (e.g. Brevo free tier) for the form handler; SPF/DKIM/DMARC DNS
   records.
4. **Create assets/og-image.png** (1200×630) — used in social previews.
5. **Analytics**: create a goatcounter.com account, uncomment the snippet at
   the bottom of index.html.

## Server setup (one-time)

```bash
ssh root@72.62.0.124
mkdir -p /var/www/internus /var/www/internus-form
# install Node.js if missing (apt install nodejs npm, or nodesource)
# copy form-handler/.env.example -> /var/www/internus-form/.env and fill in
# append deploy/Caddyfile.snippet to /root/loodus/Caddyfile
# copy deploy/internus-form.service -> /etc/systemd/system/ then:
systemctl daemon-reload && systemctl enable --now internus-form
caddy reload --config /root/loodus/Caddyfile
```

DNS: A record for the domain (and www) → 72.62.0.124. Caddy fetches TLS
certificates automatically once DNS resolves.

## Deploy

```bash
./deploy.sh
```

Syncs the static site to /var/www/internus and the handler to
/var/www/internus-form, installs deps, restarts the service.
