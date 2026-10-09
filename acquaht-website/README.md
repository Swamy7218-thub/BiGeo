# AcquaHT Labs website (acquahtlabs.in)

A one-page site built with Next.js, exported as plain HTML, hosted on Hostinger.

## Where to change things

- **All text and numbers:** `content/site.ts`. Most updates only touch this file.
- **Images:** `public/images/`
- **Contact form email:** `public/contact.php` (the `$TO` address)
- **Page sections:** `components/`

## Run it on your computer

```bash
cd acquaht-website
npm install
npm run dev        # open http://localhost:3000
npm run build      # writes the finished site to out/
```

The contact form needs PHP, so it only sends mail on Hostinger. To test it locally, build first and then run `php -S 127.0.0.1:8099 -t out`.

## How it goes live

1. A change is merged into `main`.
2. GitHub Actions (`.github/workflows/deploy-acquaht.yml`) builds the site and pushes the finished files to the `hostinger` branch.
3. Hostinger pulls the `hostinger` branch into `public_html`.

### One-time Hostinger setup

1. hPanel → **Websites → acquahtlabs.in → Advanced → GIT**.
2. Repository: `https://github.com/Swamy7218-thub/BiGeo.git`. Branch: `hostinger`. Directory: leave empty (`public_html`).
3. Back up and empty `public_html` first. Hostinger needs it empty to set up Git.
4. Click **Create**, then **Deploy** once.
5. Turn on **Auto Deployment**. Copy the webhook URL into GitHub → **Settings → Webhooks → Add webhook**. Set content type to `application/json` and choose "Just the push event".

The repo is public, so Hostinger doesn't need a deploy key.

### Contact form email

`contact.php` sends from `website@acquahtlabs.in` to `admin@acquahtlabs.in`. If mail doesn't arrive, create the `website@acquahtlabs.in` mailbox in hPanel → Emails, or change `$FROM` to an existing address on the domain.
