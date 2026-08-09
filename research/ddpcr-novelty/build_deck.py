"""Build the ddPCR novelty strategy deck (16:9) from verified research content."""
from deck_engine import (
    new_deck, _blank, _rect, _text, _bullets, header, footer, add_table,
    INK, NAVY, TEAL, TEAL_DK, AMBER, CRIMSON, GREEN, SLATE, LIGHT, PAPER, BORDER, GRIDHEAD,
    EMU_W, EMU_H,
)
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

prs = new_deck()
IDX = 0
def nxt():
    global IDX; IDX += 1; return IDX

# ============================================================ 1. TITLE
s = _blank(prs)
_rect(s, 0, 0, EMU_W, EMU_H, fill=INK)
_rect(s, 0, 0, EMU_W, Inches(0.28), fill=TEAL)
_rect(s, 0, Inches(3.05), EMU_W, Inches(0.05), fill=AMBER)
_text(s, Inches(0.8), Inches(0.9), Inches(11.7), Inches(0.4),
      [[("GLOBAL RESEARCH-GAP ANALYSIS  ·  ddPCR IN FOOD MOLECULAR ANALYSIS", 13, TEAL, True, False)]])
_text(s, Inches(0.8), Inches(1.45), Inches(11.9), Inches(1.6),
      [[("Novel, publication-worthy ddPCR", 34, PAPER, True, False)],
       [("research projects for food authenticity, meat/food safety,", 34, PAPER, True, False)],
       [("reference materials & quantitative metrology", 34, RGBColor(0xBFE0E0 // 0x10000, (0xBFE0E0 // 0x100) & 0xFF, 0xBFE0E0 & 0xFF), True, False)]],
      line_spacing=1.02)
_text(s, Inches(0.8), Inches(3.3), Inches(11.9), Inches(1.5),
      [[("A senior-researcher strategy brief — worldwide literature (2009–2026), all disciplines", 15, RGBColor(0xC9,0xD4,0xDD), False, False)],
       [("translated toward food & meat science.  From: uploaded papers → global literature →", 15, RGBColor(0xC9,0xD4,0xDD), False, False)],
       [("cross-field technology → saturation → gap → novel concept → feasibility → publication.", 15, RGBColor(0xC9,0xD4,0xDD), False, False)]],
      line_spacing=1.15)
_text(s, Inches(0.8), Inches(5.15), Inches(11.9), Inches(0.4),
      [[("Deliverable: 4 ranked, fully-specified projects — not 20–30 generic ideas.", 15, AMBER, True, False)]])
_text(s, Inches(0.8), Inches(6.5), Inches(11.9), Inches(0.6),
      [[("Reference policy: no fabricated citations or DOIs — every reference tagged with verification status "
         "(✔ verified from source URL · ⚠ DOI unconfirmed · ▣ preprint · ◆ standard).", 10.5, RGBColor(0x9F,0xB0,0xBD), False, True)]])

# ============================================================ 2. METHODOLOGY / SCOPE
s = _blank(prs); header(s, "How this brief was built", "Method: a worldwide sweep, then a saturation filter", nxt(), prs)
_bullets(s, Inches(0.55), Inches(1.4), Inches(6.05), Inches(5.4), [
    (0, "Five parallel literature sweeps across ALL disciplines — not just food:", TEAL_DK, True),
    (1, "Metrology / CRM / plasmid / interlaboratory comparison (NIST, LGC, JRC, NMIJ, NIM, KRISS, BIPM-CCQM)"),
    (1, "ISO 20395:2019 & qPCR-vs-dPCR validation"),
    (1, "Multiplex ddPCR & probe-concentration chemistry"),
    (1, "DNA methylation + dPCR  &  CRISPR cut/uncut detection"),
    (1, "Meat authenticity, safety & quality"),
    (0, "The novelty test applied throughout:", TEAL_DK, True),
    (1, "NOT 'has this exact experiment been done in food?'"),
    (1, "BUT 'is the scientific principle proven ANYWHERE, and is the food application still missing?'"),
], size=13, gap=7)
_rect(s, Inches(6.95), Inches(1.4), Inches(5.85), Inches(5.35), fill=LIGHT, line=BORDER)
_text(s, Inches(7.2), Inches(1.6), Inches(5.4), Inches(0.4),
      [[("THE OPPORTUNITY EQUATION", 12, TEAL_DK, True, False)]])
_text(s, Inches(7.2), Inches(2.15), Inches(5.4), Inches(1.0),
      [[("Technology exists (elsewhere)", 15, INK, True, False)],
       [("+ biological / regulatory problem exists (in food)", 15, INK, True, False)],
       [("+ food application is missing", 15, INK, True, False)],
       [("= research opportunity", 16, AMBER, True, False)]], line_spacing=1.15)
_text(s, Inches(7.2), Inches(3.85), Inches(5.4), Inches(0.4),
      [[("HONESTY GUARDRAILS", 12, CRIMSON, True, False)]])
_bullets(s, Inches(7.2), Inches(4.25), Inches(5.4), Inches(2.3), [
    (0, "A topic is NOT novel just because it is absent from the 3 uploaded papers."),
    (0, "Every novelty claim is checked against the global landscape."),
    (0, "Publisher full-text was egress-limited; DOIs read from real result URLs, flagged where unconfirmed."),
], size=11.5, gap=8)

# ============================================================ 3. UPLOADED PAPERS
s = _blank(prs); header(s, "Starting point", "Your three uploaded papers — capability, and the recurring wall they hit", nxt(), prs)
rows = [
    ["Paper", "Method", "Establishes", "Its stated limitation → our opening"],
    [("Aravind Kumar 2024\nBuffalo in Haleem", PAPER), "TaqMan ddPCR + 2 linear regression models built on the finished product",
     "First regressions from the processed product; 10–17% buffalo in market Haleem",
     "No CRM, no traceable copy→mass conversion, no uncertainty budget → PROJECT 1"],
    [("Vishnuraj 2021\nGiblets (miRNA)", PAPER), "EvaGreen ddPCR on tissue-specific miRNAs; +2 SD cut-off",
     "Solves intra-species (tissue) fraud that DNA sequence cannot",
     "'All tissues share DNA sequence' + 'no quantitative CRMs'; methylation never tried → PROJECT 2"],
    [("Sahu 2021\nC. psittaci ddPCR", PAPER), "EvaGreen ddPCR; linearised vs circular plasmid control",
     "ddPCR 2.4 vs qPCR 38 copies; shows supercoiled-plasmid bias",
     "No viability (live/dead), no meat matrix, plasmid not certified → PROJECTS 3 & 4"],
]
add_table(s, Inches(0.5), Inches(1.45), Inches(12.35), rows, [1.05, 1.5, 1.7, 2.2], fs=10.5, hfs=11, row_h=1.15)
_text(s, Inches(0.5), Inches(6.7), Inches(12.3), Inches(0.4),
      [[("All three share one lineage (ICAR-NMRI, ISO 17025, QX200) and bump into the same 3 unmet needs: "
         "certified quantification RMs · traceable copy→mass conversion · discrimination beyond DNA sequence.", 11, SLATE, False, True)]])

# ============================================================ 4-5. GLOBAL STATUS
def status_slide(title, items):
    s = _blank(prs); header(s, "Global landscape", title, nxt(), prs)
    add_table(s, Inches(0.5), Inches(1.45), Inches(12.35), items, [2.3, 3.1, 1.5, 3.2], fs=10.5, hfs=11, row_h=0.9)
    return s
rows = [
    ["Domain", "Global status (all fields)", "Food status", "The live gap"],
    ["CRM (quantification-type)", "Well studied — GMO/clinical/genomic CRMs by dPCR (JRC, NMIJ, NIM, LGC)", ("MAJOR GAP", CRIMSON), "No certified meat-species quantification CRM (JRC 2025 flags it)"],
    ["Plasmid copy-number cert.", "Well studied — CCQM P154; Dong; Corbisier", ("Emerging", AMBER), "No certified dPCR copy-number standard for a food target"],
    ["Interlaboratory comparison", "Well studied at NMI level — CCQM K86/P154/P199b", ("MAJOR GAP", CRIMSON), "No food-lab ILC certifying a meat copy-number RM"],
    ["ISO 20395:2019", "Emerging / uneven adoption (Russo 2023; Griffiths 2023)", ("Unused", CRIMSON), "No food application; uncertainty/robustness/ratio omitted"],
    ["Multiplex ddPCR (probe-conc.)", "Saturated for 2–6plex; colour-combo frontier", ("Moderate", AMBER), "Meat quintuplex ALREADY exists (He 2022) — only gelatin/fish left"],
]
status_slide("Where the world actually is — part 1 of 2", rows)
rows = [
    ["Domain", "Global status (all fields)", "Food status", "The live gap"],
    ["DNA methylation + ddPCR", "Established — cancer, forensic tissue-ID, epigenetic age", ("MAJOR GAP", CRIMSON), "Zero use for meat species / tissue-origin / processing history"],
    ["CRISPR edit detection (ddPCR)", "Established & commercialised — drop-off assays", ("Emerging", AMBER), "GMO-vs-edited discrimination in processed food (feasibility-limited)"],
    ["Meat authenticity", "Well studied → saturated (beef/pork duplex)", ("SATURATED", CRIMSON), "Mass-fraction traceability; degraded-DNA bias; buffalo/goat"],
    ["Meat safety", "Well studied (Salmonella); PMA-viability in water/dairy", ("Moderate", AMBER), "PMA-viability MULTIPLEX ddPCR in solid meat (VBNC/injured)"],
    ["Meat quality", "Emerging — absolute 16S protocol exists", ("MAJOR GAP", CRIMSON), "Absolute spoilage-microbiome; mtDNA/RNA freshness index"],
]
status_slide("Where the world actually is — part 2 of 2", rows)

# ============================================================ 6. NOVELTY MATRIX
s = _blank(prs); header(s, "Novelty matrix", "Saturation vs opportunity — the whole landscape on one grid", nxt(), prs)
def nv(v):
    c = {"Very high": GREEN, "High": TEAL_DK, "Med–high": AMBER, "Medium": AMBER, "Low/High": SLATE, "High*": SLATE}.get(v, INK)
    return (v, c)
rows = [
    ["Topic", "Global", "Food", "Saturation", "Potential novelty"],
    ["CRM (quantification)", "Well studied", "Major gap", "Food: open", nv("Very high")],
    ["Plasmid certification", "Well studied", "Emerging", "Food: open", nv("High")],
    ["ILC / proficiency", "Well studied", "Major gap", "Food: open", nv("High")],
    ["ISO 20395:2019", "Emerging", "Unused", "Moderate", nv("Med–high")],
    ["Multiplex (probe-conc.)", "Saturated", "Moderate", "Global: full", nv("Medium")],
    ["DNA methylation", "Established", "None", "Food: open", nv("Very high")],
    ["CRISPR edit detection", "Established", "Emerging", "Food: thin", nv("High*")],
    ["Meat authenticity", "Well studied", "Saturated", "Full (pairs)", nv("Low/High")],
    ["Meat safety", "Well studied", "Moderate", "Moderate", nv("High")],
    ["Meat quality", "Emerging", "Major gap", "Open", nv("High*")],
]
add_table(s, Inches(0.7), Inches(1.4), Inches(11.9), rows, [2.6, 1.8, 1.6, 1.9, 2.4], fs=11, hfs=11, row_h=0.475)
_text(s, Inches(0.7), Inches(6.75), Inches(11.9), Inches(0.35),
      [[("Novelty key:  ", 10.5, SLATE, True, False), ("Very high ", 10.5, GREEN, True, False),
        ("· High ", 10.5, TEAL_DK, True, False), ("· Medium ", 10.5, AMBER, True, False),
        ("· * = high ceiling but feasibility/interpretation-limited today.", 10.5, SLATE, False, True)]])

# ============================================================ 7. CROSS-DISCIPLINARY LOGIC
s = _blank(prs); header(s, "Cross-disciplinary novelty", "Proven elsewhere · missing in food · becomes a project", nxt(), prs)
rows = [
    ["ddPCR combined with…", "Proven where (outside food)", "Missing in food", "Becomes"],
    ["CRM + metrology + uncertainty", "GMO (JRC ERM-BF), clinical (ERM-AD623), genomic mass (NMIJ 6205-a)", "No certified meat CRM; no copy→mass conversion", ("PROJECT 1", GREEN)],
    ["Methylation (tDMR, tissue-of-origin)", "Cancer cfDNA, forensic body-fluid ID, epigenetic age", "No DNA-based tissue-origin / processing authentication", ("PROJECT 2", GREEN)],
    ["PMA viability + multiplex + IAC", "Water / dairy / flour microbiology", "No viable-pathogen multiplex ddPCR in solid meat", ("PROJECT 3", GREEN)],
    ["ILC + ISO 20395 + plasmid copy-number", "CCQM key comparisons (NMI level)", "No food-lab ILC certifying a meat copy-number RM", ("PROJECT 4", GREEN)],
    ["Amplitude multiplex", "Oncology hyperplex; GMO 4-plex; MEAT quintuplex (He 2022)", "Only gelatin / degraded matrices remain", ("add-on", SLATE)],
    ["CRISPR drop-off", "Cell / animal editing labs", "Processed-food edited-vs-natural discrimination", ("watch-list", SLATE)],
]
add_table(s, Inches(0.5), Inches(1.45), Inches(12.35), rows, [2.5, 3.5, 3.2, 1.3], fs=10.5, hfs=11, row_h=0.82)

# ============================================================ 8. FUNNEL 10 -> 4
s = _blank(prs); header(s, "From 10 ideas to 4", "The funnel — what survives a global saturation check", nxt(), prs)
_text(s, Inches(0.55), Inches(1.35), Inches(6), Inches(0.4), [[("SELECTED (4)", 14, GREEN, True, False)]])
_bullets(s, Inches(0.55), Inches(1.8), Inches(6.1), Inches(4.6), [
    (0, "P1 · Meat-species quantification CRM + traceable copy→mass conversion", GREEN, True),
    (0, "P2 · Methylation-ddPCR for tissue-origin & processing-history authentication", GREEN, True),
    (0, "P3 · PMA-viability multiplex ddPCR for viable pathogens in solid meat", GREEN, True),
    (0, "P4 · ISO 20395 ILC certifying a meat-species plasmid copy-number RM", GREEN, True),
], size=13, gap=12)
_text(s, Inches(6.95), Inches(1.35), Inches(6), Inches(0.4), [[("ABSORBED / REJECTED / DEFERRED", 14, CRIMSON, True, False)]])
_bullets(s, Inches(6.95), Inches(1.8), Inches(5.9), Inches(4.9), [
    (0, "Degraded/autoclaved-DNA correction → folded into P1"),
    (0, "Fresh-vs-frozen/heat methylation marker → folded into P2"),
    (0, "Higher-order multiplex meat speciation → rejected: He 2022 quintuplex already published"),
    (0, "New beef/pork-type species pair → rejected: saturated (LOD ~0.1% routine)"),
    (0, "CRISPR edited-food ddPCR → deferred: needs edited RMs + edit-vs-natural confound"),
    (0, "Absolute spoilage-microbiome; mtDNA/RNA freshness index → deferred: weaker regulatory pull / validation-heavy"),
], size=12, gap=9)

# ============================================================ 9. SCORECARD
s = _blank(prs); header(s, "Weighted ranking", "Scored on your criteria (Novelty 25 · Pub 20 · Feasibility 15 · Industry 10 · Reg 10 · ddPCR-adv 10 · Future 10)", nxt(), prs)
rows = [
    ["Project", "Novelty", "Pub.", "Feasib.", "Industry", "Reg.", "ddPCR", "Future", "TOTAL /500"],
    [("P1 · Meat CRM + mass-fraction", INK), "125", "100", "60", "50", "50", "50", "50", ("485", GREEN)],
    [("P2 · Methylation tissue-origin", INK), "125", "100", "45", "40", "40", "40", "50", ("440", GREEN)],
    [("P3 · PMA-viability multiplex", INK), "100", "80", "60", "50", "50", "50", "40", ("430", TEAL_DK)],
    [("P4 · ISO 20395 ILC", INK), "100", "80", "45", "30", "50", "50", "50", ("405", TEAL_DK)],
]
add_table(s, Inches(0.5), Inches(1.6), Inches(12.35), rows, [3.0, 1.0, 0.8, 1.0, 1.0, 0.8, 0.9, 0.9, 1.3], fs=11, hfs=10.5, row_h=0.62)
_text(s, Inches(0.5), Inches(4.6), Inches(12.3), Inches(1.9),
      [[("Read-out:", 14, TEAL_DK, True, False)],
       [("P1 is the flagship — top on novelty, publication and relevance, and it seeds P4.", 13, INK, False, False)],
       [("P2 is the highest-ceiling scientific bet (genuine global white space).", 13, INK, False, False)],
       [("P3 is the most operationally safe high-impact project (clear gap, strong ddPCR advantage).", 13, INK, False, False)],
       [("P4 is the standardisation capstone chaining from P1.", 13, INK, False, False)]], line_spacing=1.25, space_after=6)

# ============================================================ 10. DIVIDER
s = _blank(prs)
_rect(s, 0, 0, EMU_W, EMU_H, fill=INK)
_rect(s, 0, Inches(3.2), EMU_W, Inches(1.1), fill=NAVY)
_rect(s, Inches(0.8), Inches(3.35), Inches(0.16), Inches(0.8), fill=AMBER)
_text(s, Inches(1.1), Inches(3.4), Inches(11), Inches(0.9),
      [[("The four selected projects — full specification", 30, PAPER, True, False)]], anchor=MSO_ANCHOR.MIDDLE)
_text(s, Inches(1.1), Inches(4.6), Inches(11), Inches(0.5),
      [[("Concept · global status · exact gap · novelty · hypothesis · design · validation · statistics · outcomes · journals", 13, RGBColor(0xC9,0xD4,0xDD), False, False)]])

# ============================================================ PROJECT SLIDES
def project_head_slide(pn, title, concept, status, gap, novelty, hypo, color=TEAL_DK):
    s = _blank(prs); header(s, f"Project {pn}  ·  concept & novelty", title, nxt(), prs)
    _rect(s, Inches(0.5), Inches(1.35), Inches(12.35), Inches(0.72), fill=LIGHT, line=BORDER)
    _text(s, Inches(0.7), Inches(1.44), Inches(12), Inches(0.6),
          [[("CONCEPT  ", 11, color, True, False), (concept, 12.5, INK, False, True)]], anchor=MSO_ANCHOR.MIDDLE)
    _bullets(s, Inches(0.55), Inches(2.25), Inches(12.1), Inches(4.6), [
        (0, "Global status", color, True), (1, status),
        (0, "Exact gap", color, True), (1, gap),
        (0, "Why genuinely novel", AMBER, True), (1, novelty),
        (0, "Hypothesis", color, True), (1, hypo),
    ], size=13, gap=6, lh=1.05)

def project_design_slide(pn, design, validation, stats, outcomes, dur, journals, color=TEAL_DK):
    s = _blank(prs); header(s, f"Project {pn}  ·  design, validation & outputs", "Experimental design, statistics, expected outcomes", nxt(), prs)
    _bullets(s, Inches(0.55), Inches(1.35), Inches(6.15), Inches(5.5), [
        (0, "Experimental design", color, True), *[(1, d) for d in design],
        (0, "Validation (ISO 20395 + dMIQE2020)", color, True), *[(1, v) for v in validation],
    ], size=11.5, gap=4, lh=1.03)
    _bullets(s, Inches(6.85), Inches(1.35), Inches(6.0), Inches(3.7), [
        (0, "Statistics (named methods)", color, True), *[(1, st) for st in stats],
        (0, "Expected outcomes", AMBER, True), *[(1, o) for o in outcomes],
    ], size=11.5, gap=4, lh=1.03)
    _rect(s, Inches(6.85), Inches(5.35), Inches(6.0), Inches(1.5), fill=LIGHT, line=BORDER)
    _text(s, Inches(7.05), Inches(5.45), Inches(5.7), Inches(1.4),
          [[("Duration:  ", 11, color, True, False), (dur, 11, INK, False, False)],
           [("Target journals:  ", 11, color, True, False), (journals, 10.5, INK, False, True)]], line_spacing=1.15, space_after=5)

# ---- P1
project_head_slide(1,
    "Traceable meat-species quantification CRM + copy-number→mass-fraction framework",
    "Build the meat analogue of the GMO ERM-BF system: dPCR-value-assigned, uncertainty-bearing, ISO Guide 35 / ISO 20395 reference materials + a validated copy→mass conversion.",
    "dPCR-certified CRMs mature for GMO/clinical/genomic mass; copy→mass conversion solved for GMO but OPEN for meat (JRC review 2025; closest attempt Temisak 2021).",
    "No ISO Guide 35 certified matrix CRM for meat-species quantification; no traceable conversion accounting for genome size, ploidy, fat-vs-lean cell density, and processing fragmentation — esp. buffalo/goat.",
    "First quantification-type meat CRM with a full GUM uncertainty budget AND the first fragmentation-aware copy→mass conversion (raw/cooked/autoclaved). Transplants a fully-solved GMO framework into a domain that lacks it.",
    "A gravimetric, homogenised, stability-tested meat matrix can be dPCR-value-assigned with expanded uncertainty ≤10%, and a fragmentation-corrected factor recovers true mass fraction to ±15% across raw/cooked/autoclaved.")
project_design_slide(1,
    ["Buffalo/cattle/sheep/goat single-species (Sanger-verified QCMs); gravimetric mixes at 0.1–50% w/w",
     "3 processing states: raw · cooked 100°C · autoclaved 121°C; lean/20%-fat/Haleem-type matrices",
     "CTAB (ISO 21571)+column; DIN/fragment size as covariate",
     "Single-copy nuclear target + universal reference; <120 bp amplicons; TaqMan duplex on QX200",
     "Homogeneity 10 bottles×3; isochronous stability −20/4/25/37°C 0–12 mo; triplicate wells ×3 days",
     "Dilute to 10–120 copies/µL; ≥12,000 droplets/well"],
    ["Specificity (≥10 non-targets)", "LOD (95%, Poisson) · LOQ (CV≤25%)",
     "Repeatability + reproducibility", "Trueness vs gravimetric truth",
     "Robustness (Plackett–Burman) · inhibition", "FULL GUM uncertainty budget + ISO Guide 35"],
    ["Homogeneity: between/within-bottle ANOVA → u_bb",
     "Stability: isochronous regression → u_sts/u_lts",
     "U = k·√(u_char²+u_bb²+u_sts²+u_lts²), k=2",
     "Conversion: weighted/segmented regression (DIN covariate) + prediction intervals",
     "Deming / Passing–Bablok vs qPCR; Bland–Altman"],
    ["Meat CRMs with assigned copy-number values (U≤10%)",
     "Fragmentation-aware conversion recovering mass to ±10–15%",
     "First proof that raw-meat regressions bias autoclaved products"],
    "24–30 months",
    "Anal. Bioanal. Chem. · Food Chemistry · Food Control · Foods · Metrologia · npj Sci. Food")

# ---- P2
project_head_slide(2,
    "DNA-methylation ddPCR for tissue-origin & processing-history authentication of meat",
    "Read tissue- and species-specific differentially methylated regions by absolute methylation-fraction ddPCR to resolve what DNA sequence cannot — is 'meat' really skeletal muscle, and how was it processed?",
    "Methylation-ddPCR established in oncology/cfDNA, forensic tissue-ID (tDMRs), epigenetic age; species methylation differences documented across 580 animals. ZERO use for meat authentication.",
    "Your own miRNA-giblet paper states DNA cannot detect tissue (offal) adulteration 'because all tissues share the same DNA sequence' — yet methylation IS a DNA-borne tissue-specific signal, never exploited for meat.",
    "First epigenetic, DNA-based route to (i) muscle-vs-offal tissue origin, (ii) species by methylation, (iii) fresh/frozen-thawed/heat processing history — a transfer of forensic tDMR science into food.",
    "Candidate tDMRs differ ≥30 percentage points in methylation between muscle and liver/heart/gizzard, are stable across freeze–thaw, and shift with defined heat treatment — all quantifiable by ddPCR at CV ≤10%.")
project_design_slide(2,
    ["Chicken & buffalo muscle/liver/heart/gizzard; admixtures 5–50% w/w, raw & cooked (mirrors giblet-paper design)",
     "Freeze–thaw series (0–5 cycles); heat gradient 60/72/100/121°C; n=10 biological reps/tissue",
     "Genomic DNA; MSRE arm (in-well HpaII, one-step) + bisulfite arm (conversion checked by dPCR)",
     "4–6 tDMRs (muscle/offal) + 2 species DMRs + methylation-independent copy denominator",
     "Duplex TaqMan (methylated vs unmethylated/digested) on QX200; fully-meth & unmeth control DNAs",
     "Triplicate wells ×3 days; 10–120 copies/µL; ≥12,000 droplets/well"],
    ["Specificity (target vs non-target tissue/species)", "LOD/LOQ of the minor (offal) fraction",
     "Repeatability + reproducibility of methylation %", "Trueness vs bisulfite-amplicon sequencing",
     "Robustness (enzyme/conversion lot, anneal ±2°C)", "Uncertainty (partition-vol + conversion terms)"],
    ["Methylation fraction = Cmeth/(Cmeth+Cunmeth) with ratio-error propagation (dMIQE)",
     "ANOVA + Tukey across tissues; ROC/Youden cut-offs",
     "Mixed models (tissue fixed, animal random) for %",
     "Lin's CCC + Bland–Altman vs BS-seq",
     "Segmented regression for heat dose–response"],
    ["Panel flagging undeclared offal at ≥10–25 g/100 g raw & cooked",
     "Chicken-vs-buffalo discrimination by methylation",
     "Monotonic methylation shift = heat/freeze–thaw marker"],
    "24 months",
    "Food Chemistry · npj Sci. Food · Food Control · J. Agric. Food Chem. · Forensic Sci. Int. Genetics · ABC")

# ---- P3
project_head_slide(3,
    "PMA-viability multiplex ddPCR for viable foodborne pathogens in solid meat",
    "Combine PMA viability treatment with a multiplex ddPCR panel + internal amplification control to count only LIVE Salmonella / Listeria / STEC directly in beef/buffalo/poultry homogenates.",
    "PMA-ddPCR viability proven in water/seawater/flour/dairy; Salmonella (invA) & quadruplex food ddPCR exist. In meat: only a Campylobacter chicken-RINSE ddPCR and a beef-burger PMA-qPCR.",
    "No PMA-viability MULTIPLEX ddPCR validated in SOLID meat homogenate, and no ddPCR discrimination of VBNC / heat- or HPP-injured cells in meat.",
    "First viable-pathogen multiplex ddPCR in real solid meat with injured-cell resolution + IAC — extends your single-target C. psittaci ddPCR into a viability multiplex for meat safety.",
    "PMA suppresses dead-cell signal ≥3 log in meat homogenate, enabling viable Salmonella/Listeria/STEC quantification to ≤10 CFU/g (recovery ±0.5 log) and injured-vs-dead discrimination after heat/HPP stress.")
project_design_slide(3,
    ["Sterile beef/buffalo/chicken homogenates spiked with live + heat-killed cocktails 10⁰–10⁶ CFU/g",
     "Defined live:dead ratios 100:0→0:100; sub-lethal stress arms (56°C, 300–600 MPa HPP)",
     "≥30 naturally-contaminated retail samples; PMA/PMAxx titration + photoactivation + matrix clarification",
     "Targets: invA · hlyA · stx1/stx2+eae + synthetic IAC; specificity vs ≥20 non-target strains",
     "Amplitude/colour multiplex (probe-conc. tiers) on QX200; NTC/live-only/dead-only/no-PMA controls",
     "Parallel ISO 6579 / ISO 11290 culture plate counts"],
    ["Specificity/selectivity (≥20 strains + flora)", "LOD/LOQ in CFU/g (95% at LOD)",
     "Repeatability + reproducibility", "Trueness vs plate counts (log CFU/g bias)",
     "Robustness (PMA lot, load, anneal)", "IAC inhibition flag + dilution linearity"],
    ["Live/dead suppression Δlog ± PMA; ROC viability threshold",
     "Mixed-effects regression copies vs CFU (matrix random)",
     "Deming ddPCR vs culture; Bland–Altman",
     "ANOVA across injury treatments; probit LOD"],
    ["≥3-log dead-cell suppression in meat; viable LOD ≤10 CFU/g",
     "Injured-cell detection where culture under-reports",
     "3 pathogens + IAC quantified in one well"],
    "18–24 months",
    "Food Control · Int. J. Food Microbiology · Food Microbiology · Foods · Appl. Environ. Microbiol.")

# ---- P4
project_head_slide(4,
    "ISO 20395-framed interlaboratory comparison certifying a meat-species plasmid copy-number RM",
    "Bring the CCQM key-comparison model down to food/regulatory labs: circulate a linearised meat-target plasmid, have labs assign copy-number by ddPCR under a common ISO 20395 protocol, derive a reference value + performance scores.",
    "Copy-number ILCs by dPCR established at NMI level (CCQM K86/P154/P199b); supercoiled-vs-linear plasmid effect well characterised (Dong; Corbisier; your C. psittaci paper).",
    "No published ILC in which routine food labs certify a meat-relevant copy-number RM under ISO 20395; no food-sector proficiency scheme for dPCR quantification.",
    "First ISO 20395-framed food-lab ILC + reference-value assignment for a meat target — yields a usable RM (feeds P1) AND the first food-dPCR proficiency dataset. A standardisation contribution, not just an assay.",
    "With a harmonised protocol + linearised plasmid, ≥8 labs assign copy-number at reproducibility CV ≤25% and a consensus reference value with U ≤15%, while circular-plasmid controls reproducibly bias results high.")
project_design_slide(4,
    ["Single meat-target insert (e.g. buffalo MC1R, reusing your validated assay) in a plasmid",
     "Linearised master + circular comparator; homogeneity 10 units×3; short/long-term stability",
     "Blind-coded aliquots at 2–3 levels across Poisson range; cold-chain + stability sentinel",
     "Harmonised protocol: fixed primer/probe/supermix/cycling/threshold rules",
     "Mandated NTC + linearised & circular controls; triplicate wells ×≥2 days per lab",
     "Standard data-return template (copies/µL, droplets, thresholds, operator, instrument)"],
    ["Per-lab LOD/LOQ + repeatability + droplet-count acceptance", "Inhibition control per lab",
     "Scheme-level outlier screening + reproducibility", "Traceability documentation",
     "Robustness of consensus to lab exclusion"],
    ["Reference value by robust estimators (ISO 13528 algorithm A / Q–Hampel)",
     "Lab performance by z- and ζ-scores (ISO 13528)",
     "sR & sr via nested ANOVA; Mandel h/k consistency",
     "Paired t / Wilcoxon for circular-vs-linear bias; Youden plot"],
    ["Consensus copy-number reference value + documented uncertainty",
     "z-score performance map of labs; reusable linearised RM",
     "Multi-lab confirmation of circular-plasmid positive bias"],
    "18–24 months",
    "Accred. Qual. Assur. · Anal. Bioanal. Chem. · Food Control · Metrologia · Food Anal. Methods")

# ============================================================ FINAL ANSWER
s = _blank(prs); header(s, "The bottom line", "If you start a ddPCR project today — start these four, in this order", nxt(), prs)
cards = [
    ("1", "Meat-species quantification CRM + copy→mass conversion", "THE FLAGSHIP — highest novelty & publication ceiling; food-authenticity + metrology + ISO 20395 sweet spot; feasible on your accredited QX200 lab; seeds P4. Fills a gap a 2025 JRC review names.", GREEN),
    ("2", "Methylation-ddPCR tissue-origin & processing history", "HIGHEST-CEILING BET — genuine global white space; DNA-based successor to your miRNA-giblet work; cross-disciplinary (forensic tDMR → food).", TEAL),
    ("3", "PMA-viability multiplex ddPCR in solid meat", "SAFEST HIGH-IMPACT — clear defensible gap; strongest ddPCR-over-qPCR/culture argument (live/dead + VBNC); direct regulatory pull.", TEAL_DK),
    ("4", "ISO 20395 ILC certifying a meat plasmid copy-number RM", "STANDARDISATION CAPSTONE — chains from P1; first food-dPCR proficiency dataset; citable metrology contribution.", AMBER),
]
y = 1.4
for num, t, d, col in cards:
    _rect(s, Inches(0.5), Inches(y), Inches(0.85), Inches(1.18), fill=col)
    _text(s, Inches(0.5), Inches(y), Inches(0.85), Inches(1.18), [[(num, 34, PAPER, True, False)]], align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    _rect(s, Inches(1.35), Inches(y), Inches(11.5), Inches(1.18), fill=LIGHT, line=BORDER)
    _text(s, Inches(1.55), Inches(y+0.08), Inches(11.1), Inches(0.4), [[(t, 14.5, INK, True, False)]])
    _text(s, Inches(1.55), Inches(y+0.5), Inches(11.1), Inches(0.62), [[(d, 11.5, SLATE, False, False)]], line_spacing=1.02)
    y += 1.32
_text(s, Inches(0.5), Inches(6.85), Inches(12.3), Inches(0.35),
      [[("Tight-resource minimum: P1 + P2 — inter-species quantification (metrology) + intra-species/processing authentication (epigenetics).", 11, TEAL_DK, True, True)]])

# ============================================================ REFERENCES (2)
def ref_slide(title, refs):
    s = _blank(prs); header(s, "Evidence base", title, nxt(), prs)
    _bullets(s, Inches(0.55), Inches(1.35), Inches(12.2), Inches(5.5), refs, size=10.5, gap=4, lh=1.02)
    return s
ref_slide("Key references justifying novelty — foundations & standards", [
    (0, "Legend: ✔ verified from source URL · ⚠ DOI unconfirmed · ▣ preprint · ◆ standard.", SLATE, True),
    (0, "Ulberth & Koeber 2025, Anal. Bioanal. Chem. 417:2427 — 'Reference materials for food authentication' ✔ 10.1007/s00216-025-05743-0 — GAP-DEFINING (no meat CRM).", INK, False),
    (0, "Pinheiro … Emslie 2012, Anal. Chem. 84:1003 — ddPCR copy-number validation ✔ 10.1021/ac202578x.", INK, False),
    (0, "Corbisier 2015, ABC 407:1831 — dPCR copy-number by CRMs (ERM-AD623) ✔ 10.1007/s00216-015-8458-z.", INK, False),
    (0, "Deprez 2016, BDQ 9:29 — dPCR validation with a CRM ✔ 10.1016/j.bdq.2016.08.002.", INK, False),
    (0, "Dong 2015/2016, Sci. Rep. — plasmid conformation bias / supercoiled quantification ✔ 10.1038/srep13174 · 10.1038/srep24230.", INK, False),
    (0, "NMIJ CRM 6205-a (Kase 2019, ABC 411) — orthogonal DNA-mass CRM ✔ 10.1007/s00216-019-01992-y.", INK, False),
    (0, "Temisak 2021, IJFST 56:6345 — meat mass-fraction by dPCR ✔ 10.1111/ijfs.15375 (closest to P1).", INK, False),
    (0, "Griffiths 2023, Foods 12:3839 — 7 dPCR animal-species assays + RM (NMI Australia) ✔ 10.3390/foods12203839.", INK, False),
    (0, "ISO 20395:2019 ◆ · dMIQE2020 (Huggett) ✔ 10.1093/clinchem/hvaa125 · MIQE 2009 ✔ 10.1373/clinchem.2008.112797.", INK, False),
    (0, "Pecoraro/JRC 2019, EUR 29673 EN — application of digital PCR ✔ 10.2760/192883 · Milavec 2022 ✔ 10.1007/s00216-021-03712-x.", INK, False),
    (0, "Russo 2023, JMM 213:106825 — full dPCR validation 'according to ISO 20395:2019' ✔ 10.1016/j.mimet.2023.106825.", INK, False),
])
ref_slide("Key references justifying novelty — methylation, CRISPR, meat, safety", [
    (0, "METHYLATION: Nell 2020 (MSRE+dPCR) ✔ 10.1002/humu.24111 · one-step MSRE-ddPCR 2024 ✔ 10.3892/ijmm.2024.5366 · freeze–thaw methylation stability 2024 ✔ 10.1089/bio.2022.0045 · vertebrate methylome 2022 ✔ 10.1186/s12915-022-01270-x · Angus tenderness methylation 2020 ✔ 10.3389/fgene.2020.00939.", INK, False),
    (0, "CRISPR: Miyaoka 2016 HDR/NHEJ ddPCR ⚠ 10.1038/srep23549 · Fraiture 2022 gene-edited plant ddPCR ⚠ (HAL hal-03672552) — flags SNV confound · MSTN cattle ddPCR 2025 ✔ 10.3390/biology14020203 · Cas-gene in edited food 2023 ✔ 10.3390/foods12193681.", INK, False),
    (0, "MULTIPLEX: Whale/Huggett/Tzonev 2016 ✔ 10.1016/j.bdq.2016.05.002 · McDermott 2013 ✔ 10.1021/ac403061n · Dobnik 2016 4-plex GMO ✔ 10.1038/srep35451 · He 2022 MEAT QUINTUPLEX ✔ 10.3390/foods11193034 (limits multiplex-meat novelty).", INK, False),
    (0, "MEAT AUTHENTICITY: Floren 2015 ✔ 10.1016/j.foodchem.2014.10.138 · Cai 2017 duplex ✔ 10.1371/journal.pone.0181949 · Ren 2017 (copy→mass factor) ✔ 10.1371/journal.pone.0173567 · Köppel 2019 6-species ✔ 10.1007/s00217-018-3220-3 · He 2023 ✔ 10.3389/fsufs.2023.1180301.", INK, False),
    (0, "MEAT SAFETY: Salmonella in meat 2026 ✔ 10.3390/foods15020337 · quadruplex 2025 ✔ 10.1038/s41598-025-17272-y · Campylobacter viable ddPCR (chicken rinse) 2022 ✔ 10.3390/app12115315 · PMA-qPCR STEC beef burger 2021 ✔ 10.1111/jfpp.15338 (the ddPCR gap) · Vibrio PMA multiplex ddPCR 2023 ✔ 10.3389/fmicb.2023.1149981.", INK, False),
    (0, "Full, grouped, verification-tagged list (≈60 refs) in the companion REPORT.md.", SLATE, True),
])

# ============================================================ ISO 20395 APPENDIX
s = _blank(prs); header(s, "Appendix", "ISO 20395:2019 — laboratory-friendly extract (the validation spine for P1–P4)", nxt(), prs)
_bullets(s, Inches(0.55), Inches(1.35), Inches(6.15), Inches(5.5), [
    (0, "Required parameters (with a practical dPCR target):", TEAL_DK, True),
    (1, "Trueness — %bias vs a reference value/CRM"),
    (1, "Precision — repeatability + intermediate/reproducibility (CV)"),
    (1, "Specificity — in silico (Primer-BLAST) + in vitro non-targets"),
    (1, "LOD — ≥95% detection, Poisson-based"),
    (1, "LOQ — CV ≤25% working rule"),
    (1, "Linearity/range — Poisson-valid ≈10–120 copies/µL, ≥~12,000 partitions"),
    (1, "Robustness — supermix ±20%, anneal ±2°C, lots (OFTEN OMITTED)"),
    (1, "Measurement uncertainty — partition-volume must propagate (GUM)"),
    (1, "Traceability to a CRM · Inhibition via IAC + dilution linearity"),
], size=12, gap=5)
_rect(s, Inches(6.95), Inches(1.35), Inches(5.9), Inches(5.5), fill=LIGHT, line=BORDER)
_text(s, Inches(7.2), Inches(1.5), Inches(5.4), Inches(0.4), [[("qPCR vs dPCR — why the standard separates them", 12.5, TEAL_DK, True, False)]])
_bullets(s, Inches(7.2), Inches(2.05), Inches(5.5), Inches(2.4), [
    (0, "qPCR: needs a calibration curve (efficiency, R², slope); ~7-log range; higher throughput; inhibitor-sensitive."),
    (0, "dPCR: calibration-free Poisson counting; higher precision + inhibitor tolerance at low copy number; ~4-log range/reaction."),
], size=11.5, gap=8)
_text(s, Inches(7.2), Inches(4.35), Inches(5.4), Inches(0.4), [[("Most-overlooked in food dPCR papers", 12.5, CRIMSON, True, False)]])
_bullets(s, Inches(7.2), Inches(4.9), Inches(5.5), Inches(1.9), [
    (0, "Full GUM uncertainty budget (not a single %RSD)"),
    (0, "Robustness testing"),
    (0, "Inter-lab reproducibility & traceability to a CRM"),
    (0, "→ make these your differentiators (P1 & P4)."),
], size=11.5, gap=6)

# ============================================================ CLOSING
s = _blank(prs)
_rect(s, 0, 0, EMU_W, EMU_H, fill=INK)
_rect(s, 0, Inches(2.9), EMU_W, Inches(0.05), fill=AMBER)
_text(s, Inches(0.9), Inches(1.4), Inches(11.5), Inches(1.4),
      [[("Two directions the world literature — not just", 26, PAPER, True, False)],
       [("your uploaded papers — leaves genuinely open:", 26, PAPER, True, False)]], line_spacing=1.05)
_text(s, Inches(0.9), Inches(3.3), Inches(11.5), Inches(1.6),
      [[("① Inter-species QUANTIFICATION with metrology — certified RMs + traceable copy→mass conversion (P1, P4)", 15, RGBColor(0xC9,0xD4,0xDD), False, False)],
       [("② Intra-species & PROCESSING authentication with epigenetics + viability — methylation & PMA-viability ddPCR (P2, P3)", 15, RGBColor(0xC9,0xD4,0xDD), False, False)]], line_spacing=1.4)
_text(s, Inches(0.9), Inches(5.4), Inches(11.5), Inches(0.5),
      [[("Everything else is either saturated, already published (He 2022 meat quintuplex), or not yet feasible.", 13, AMBER, False, True)]])
_text(s, Inches(0.9), Inches(6.6), Inches(11.5), Inches(0.4),
      [[("Companion: REPORT.md — full analysis, 10-idea funnel, all 15-point project specs, ≈60 verification-tagged references.", 11, RGBColor(0x9F,0xB0,0xBD), False, False)]])

prs.save("/home/user/BiGeo/research/ddpcr-novelty/ddPCR_Novelty_Strategy.pptx")
print("SLIDES:", IDX + 1)
print("saved ddPCR_Novelty_Strategy.pptx")
