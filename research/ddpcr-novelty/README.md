# ddPCR in Food Molecular Analysis — Global Novelty & Research Strategy

A senior-researcher strategy brief: worldwide literature analysis (2009–2026, all disciplines) → research-gap analysis → **4 ranked, fully-specified, publication-worthy ddPCR projects** for food authenticity, meat/food safety, reference materials, metrology, validation and multiplexing.

## Contents
| File | What it is |
|------|------------|
| `ddPCR_Novelty_Strategy.pptx` | 23-slide presentation deck (idea → workflow → design → outcomes → novelty → publications → references). **Primary deliverable.** |
| `REPORT.md` | Full scholarly backing: uploaded-paper analysis, global literature by domain, novelty matrix, 10-idea funnel, all four projects at 15-point detail, weighted scorecard, and a grouped, verification-tagged reference list (≈60 refs). |
| `build_deck.py` | Regenerates the deck (`python3 build_deck.py`). |
| `deck_engine.py` | Reusable python-pptx styling engine (theme, tables, layouts). |

## The four selected projects
1. **Meat-species quantification CRM + traceable copy-number→mass-fraction conversion** (buffalo/cattle/sheep/goat) — flagship (metrology + authenticity + ISO 20395).
2. **Methylation-ddPCR for tissue-origin (muscle vs offal) & processing-history authentication** — highest-ceiling scientific white space.
3. **PMA-viability multiplex ddPCR for viable pathogens in solid meat** — safest high-impact safety project.
4. **ISO 20395-framed interlaboratory comparison certifying a meat-species plasmid copy-number RM** — standardisation capstone.

## Reference integrity
No fabricated citations or DOIs. Every reference carries a verification tag: ✔ verified from a real source URL · ⚠ DOI unconfirmed (verify before citing) · ▣ preprint · ◆ standard/guidance. Publisher full-text was egress-limited during research, so ✔ means "read from a real result URL/snippet," not "full page re-fetched."

## Rebuild
```bash
pip install python-pptx
python3 build_deck.py
```
