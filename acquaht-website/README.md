# AcquaHT Labs Website

Modern redesign of acquahtlabs.in built with Next.js 14, deployed on AWS Amplify.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Hosting**: AWS Amplify
- **CDN**: CloudFront (built into Amplify)

## Local Development

```bash
cd acquaht-website
npm install
npm run dev
```

Open http://localhost:3000

## AWS Amplify Deployment (Step-by-Step)

### 1. Log into AWS Console
Go to https://console.aws.amazon.com and sign in to the AcquaHT Labs AWS account.

### 2. Open AWS Amplify
- Search for **Amplify** in the services search bar
- Click **"Create new app"**

### 3. Connect your GitHub repository
- Choose **GitHub** as the source
- Authorize AWS Amplify to access your GitHub account
- Select the **BiGeo** repository and the branch `claude/trusting-rubin-e46o9t`
- Set the **App root directory** to `acquaht-website`

### 4. Build settings
Amplify will auto-detect the `amplify.yml` file. Confirm the build settings look like:
- Build command: `npm run build`
- Base directory: `.next`

### 5. Deploy
Click **"Save and deploy"**. The first build takes ~3-5 minutes.

### 6. Connect Custom Domain (acquahtlabs.in)
1. In Amplify → your app → **Domain management**
2. Click **"Add domain"**
3. Enter `acquahtlabs.in`
4. Amplify will give you DNS records (CNAME or A records)
5. Log into your domain registrar (Hostinger or wherever the domain is managed)
6. Update the DNS records with the values Amplify provides
7. SSL is automatically provisioned via AWS Certificate Manager (free)

### DNS records to add in Hostinger (example):
| Type  | Name | Value |
|-------|------|-------|
| CNAME | www  | `<your-amplify-id>.amplifyapp.com` |
| A     | @    | Amplify's IP (provided in console) |

DNS propagation takes 10-60 minutes after updating.

## Cost Estimate (with $5,000 AWS Credits)
| Service | Cost |
|---------|------|
| AWS Amplify hosting | ~$15/month |
| CloudFront CDN | Included |
| Route 53 DNS (optional) | ~$1/month |
| ACM SSL Certificate | Free |
| **Total** | **~$16/month** |

Your $5,000 credits will cover **25+ years** of hosting at this traffic level.
