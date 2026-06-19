# BiGeo — Project Context for Claude

## Founder
- **Name:** Swamynathan Jerra
- **Email:** admin@bigeo.in
- **Location:** Siddipet, Telangana, India
- **Role:** Founder & CEO

## Company
- **Name:** BiGeo
- **Website:** bigeo.in
- **Tagline:** Rural India's Last-Mile OS
- **Product:** AI-powered geocoding API — resolves unstructured Indian village addresses to GPS in <2 seconds
- **API Base URL:** https://v34s17v3h2.execute-api.ap-south-1.amazonaws.com/v1
- **Demo Key:** demo-public-readonly

## Funding Raised (Pre-seed)
| Source | Amount | Program | Institution |
|--------|--------|---------|-------------|
| MeitY Startup Hub — Genesis Program | ₹3,75,000 | Genesis Grant | IIM Udaipur |
| IIT Hyderabad | ₹1,00,000 | Incubation Support | IIT Hyderabad |
| **Total Raised** | **₹4,75,000** | | |

**Total raised to date: ₹4.75 Lakhs (~$5,700 USD)**
**Raising now: ₹1–2 Crore pre-seed**

## Key Numbers
- 649,529 villages indexed (LGD)
- 1M+ GPS points (PMGSY + India Post)
- 19,559 pincodes in DynamoDB
- 165,627 post offices with coordinates
- 8 Lambda functions in production
- AWS Credits: $10,000 active (ap-south-1)

## Tool & Platform Credits Active
| Tool | Plan | Notes |
|------|------|-------|
| AWS | $10,000 credits | ap-south-1, active |
| Miro | Pro + Prototyping Add-On | Use for product wireframes, user journey maps, investor pitch flows |
| Miro AI | 350× AI credits | Miro AI for flowcharts, diagrams, auto-layout |
| GitHub Enterprise | $10,000 credits | For Startups program, active |

## Security Rules (Never Violate)
- Never purchase/activate paid services using personal card without explicit approval
- Never provision RDS — DynamoDB only (exception: India Address Graph uses PostGIS by design)
- Never provision SageMaker — Bedrock only
- Never leave EC2 instances running after task ends
- Tag every AWS resource: Project=BiGeo, Env=dev or Env=prod
- Billing alarm set at $500 before any production deploy
- Target: under $200/month AWS burn until first paying customer

## Git Branch
- Active branch: `claude/happy-ramanujan-obsurt`

## AWS
- Region: ap-south-1
- S3 Portal: vaahan-portal-bigeo
- S3 URL: http://vaahan-portal-bigeo.s3-website.ap-south-1.amazonaws.com/

## Websites (Deployed to S3)
- bigeo.in → portal/index.html
- Personal site → portal/swamy.html
- Demo deck → portal/bigeo-demo-deck.html
