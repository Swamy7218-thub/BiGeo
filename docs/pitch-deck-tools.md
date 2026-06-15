# Open-Source Tools for YC-Style Pitch Decks

## Summary

Tools for generating clean, investor-ready pitch decks (YC/Sequoia/a16z style) — white background, one idea per slide, no animations, clean PDF/PPTX export.

---

## Repository Comparison

| Repository | GitHub URL | Stars (mid-2026) | License | YC Compat (/10) | Overall (/100) |
|---|---|---|---|---|---|
| Marp | github.com/marp-team/marp | ~11.6k | MIT | 9 | **81.5** |
| Slidev | github.com/slidevjs/slidev | ~46.9k | MIT | 8 | **75.5** |
| PptxGenJS | github.com/gitbrent/PptxGenJS | ~7–8k | MIT | 7 | **75** |
| Marp CLI | github.com/marp-team/marp-cli | ~3.5k | MIT | 8 | **74** |
| python-pptx | github.com/scanny/python-pptx | ~2.5–3k | MIT/BSD | 7 | **73.5** |
| Presenton | github.com/presenton/presenton | ~8.2k | Apache 2.0 | 6 | **72** |
| Marpit | github.com/marp-team/marpit | ~1.3k | MIT | 8 | **69.5** |
| cc-slidev | github.com/rhuss/cc-slidev | Small | MIT | 7 | **66.5** |
| Reveal.js | github.com/hakimel/reveal.js | ~60k+ | MIT | 6 | **64.5** |
| Decker | github.com/shadowaxe99/decker | Small | Unclear | 4 | **45** |

---

## Rankings & Reasoning

**1. Marp — 81.5/100**
Best match for YC deck style. Write plain markdown, split slides with `---`, default theme is white background + one idea per slide. Marp CLI exports clean PDF and PPTX.

**2. Slidev — 75.5/100**
Most popular (46.9k stars), Vue-based, very actively maintained. More "developer conference" look by default but `seriph` theme or a custom minimal theme gets close to YC style. PPTX export less polished than PDF.

**3. PptxGenJS — 75/100**
Not a slide app — it's the engine. Write JavaScript, get a real editable .pptx file. Full pixel control enforces strict minimal style. Best for products that must hand investors an actual PowerPoint.

**4. Marp CLI — 74/100**
The converter behind Marp. Turns markdown into PDF, PPTX, or images. Solid, MIT, well-maintained. The export layer to call from a script or server.

**5. python-pptx — 73.5/100**
Python twin of PptxGenJS. Standard way to write real .pptx files programmatically in a Python AI backend. Blank canvas — cleanliness is entirely up to your template code.

**6. Presenton — 72/100**
Only repo here that is a full "type a prompt, get a deck" product. Supports OpenAI, Gemini, and Ollama. Exports editable PPTX/PDF. Built-in themes are too "designed" for YC taste — needs a custom minimal Tailwind theme. Best single repo for a working AI-deck product out of the box.

**7. Marpit — 69.5/100**
Bare framework underneath Marp — just markdown + CSS, no built-in export. Useful for building a custom Marp-like tool from scratch.

**8. cc-slidev — 66.5/100**
Claude Code plugin adding evidence-based design guardrails on top of Slidev. Built for the Claude Code + slide generation workflow but small and new with thin community support.

**9. Reveal.js — 64.5/100**
Most famous HTML presentation framework (biggest community) but its identity is built on animations and 3D effects. Native PPTX export is weak — mostly share a link or PDF print.

**10. Decker — 45/100**
Small Flask app generating personalized pitch decks per investor. Lightly maintained, unclear output quality. Treat as inspiration, not infrastructure.

---

## Recommended Stack for an AI Pitch Deck Product

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js + Tailwind CSS | Fast, minimal, matches the clean look being output |
| Presentation Engine | PptxGenJS (Node) | Blank slate — build 8–10 strict YC-style slide layouts once, reuse forever |
| AI Layer | Claude API | Compresses messy founder notes into structured JSON: title + number + 2–3 lines per slide |
| Export | PptxGenJS for PPTX, Puppeteer/Playwright for PDF | PPTX so investors can edit; PDF so it looks identical everywhere |
| Database | Supabase (Postgres) | Stores users, decks, slide JSON, version history |
| Auth | Supabase Auth | Email + Google login |
| Deployment | Cloudflare Pages + Workers | Cheap and fast for India-based traffic |

**Cost estimate (MVP):** ₹0–3,000/month  
**Time to MVP:** 3–4 weeks  
**Time to revenue:** 6–10 weeks (₹999/deck or ₹2,999/month unlimited, targeting accelerator applicants)

---

## Key Decisions

- **Quick manual deck:** Write in Marp, export to PDF in 5 minutes.
- **Building a product:** Use PptxGenJS with a strict 8-slide template (cover, problem, solution, market, traction, business model, ask).
- **AI deck SaaS:** Presenton as starting foundation; migrate to PptxGenJS/python-pptx for full visual control within year one.
