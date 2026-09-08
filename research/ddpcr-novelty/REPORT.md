# Global Research-Gap Analysis and Novel Project Portfolio for ddPCR in Food Molecular Analysis

**A senior-researcher strategy brief — food authenticity, meat/food safety, quantitative ddPCR, reference materials, metrology, validation and multiplexing**

Prepared: 2026-08-09 · Scope: worldwide literature (2009–2026), all disciplines translated toward food/meat science · Reference policy: **no fabricated citations or DOIs** — every reference is tagged with its verification status.

---

## 0. How to read this document

This brief follows the exact logic you requested:

> **Uploaded papers → Global literature → Technology outside food science → Research saturation → Research gap → Novel concept → Experimental feasibility → Publication potential.**

The headline deliverable is in **§8 (Final Answer)**: four ranked, fully-specified projects. Everything before it is the evidence chain that justifies why *those* four — and not the 20–30 obvious ideas — survive a comparison against the **worldwide** research landscape, not merely against your three uploaded papers.

A companion slide deck (`ddPCR_Novelty_Strategy.pptx`) condenses this into presentation form.

---

## 1. Analysis of the three uploaded papers

| # | Paper | Core method | What it establishes | Its own stated limitation (→ our opportunity) |
|---|-------|-------------|---------------------|-----------------------------------------------|
| 1 | Aravind Kumar et al. 2024, *J. Food Compos. Anal.* 126:105879 — buffalo in *Haleem* | TaqMan ddPCR (MC1R buffalo target) + **two linear regression models** (meat weight→DNA ng; input DNA→copies) built **directly from the processed product** | First regression models built on the *finished product* rather than fresh meat/powder; 10–17% buffalo substitution found in market Haleem | Regression is product-specific and empirical; **no certified reference material, no traceable copy-number→mass-fraction conversion, no measurement-uncertainty budget**. DNA yield assumed equal across species via a myostatin Cq check — an assumption, not a metrological correction. |
| 2 | Vishnuraj et al. 2021, *LWT* 140:110798 — giblets in chicken via **miRNA-ddPCR** | EvaGreen ddPCR on tissue-specific mature miRNAs (gizzard/heart/liver); cut-off = mean(non-target)+2 SD | Elegant solution to **intra-species** (tissue-origin) adulteration that DNA cannot resolve, because "all tissues have exactly the same DNA sequence" | The paper itself names two gaps: (i) **"non-availability of quantitative CRMs"** for tissue miRNA; (ii) tissue-origin is solved only via *RNA*. A **DNA-based, epigenetic route to tissue origin (methylation) is never considered** — directly motivates Project 2. |
| 3 | Sahu et al. 2021, *J. Microbiol. Methods* 190:106318 — *Chlamydia psittaci* ddPCR vs qPCR | EvaGreen ddPCR; **linearised vs circular plasmid** positive control; LOD, LOQ, robustness, specificity | ddPCR detects 2.4 copies vs qPCR 38 copies; **explicitly demonstrates the supercoiled-plasmid "rain"/bias problem** and fixes it by linearisation | Single-target pathogen detection; **no viability discrimination** (live vs dead), **no meat matrix**, plasmid used as control not as a *certified* copy-number standard. Motivates Projects 3 and 4. |

**Cross-cutting reading of the three papers.** All three come from the same ICAR–National Meat Research Institute lineage (ISO/IEC 17025-accredited, QX200 platform, buffalo/goat/poultry access, prior regression + miRNA + plasmid experience). They collectively demonstrate world-class *assay* capability but **repeatedly bump into the same three unmet needs: (a) certified quantification reference materials, (b) traceable copy-number→mass-fraction conversion, and (c) discrimination that DNA sequence alone cannot provide (tissue origin, viability, editing).** The strongest novel projects are precisely those that convert these recurring limitations into the research question.

---

## 2. Global literature analysis (worldwide, all disciplines)

Ratings use your scale: **Saturated · Well studied · Moderately explored · Emerging · Major research gap**.

### 2.A Quantification-type Certified Reference Materials (CRM) + dPCR
- **Global status — Well studied / consolidated foundation.** dPCR is accepted as a *primary reference measurement procedure* for DNA copy-number: enumeration by Poisson statistics, SI-traceable to the mole, no calibration curve. Established by Bhat/Emslie (NMI Australia, 2009–2010), Sanders/Huggett (LGC, 2011), Pinheiro/Emslie (2012), and formalised in ISO 20395:2019 + dMIQE2020. Institutes: **LGC (UK), NIST (USA), JRC-Geel (EU), NMIJ/AIST (Japan), NIM (China), KRISS (Korea)**, coordinated by the **BIPM CCQM Nucleic Acid Analysis Working Group**.
- **CRMs already characterised by dPCR:** GMO CRMs (JRC ERM-BF series — dual-certified for *copy-number ratio* **and** *copy-number concentration*, >25 yr); plasmid clinical calibrants (ERM-AD623 BCR-ABL1); genomic-mass CRMs (NMIJ CRM 6205-a, value-assigned orthogonally by LC-IDMS/ICP-MS); GM-crop genomic CRMs from China (Kefeng-6 rice, Zhonghuang-6106 soybean).
- **Dominant residual uncertainty** is **partition/droplet volume**, not counting statistics.
- **Food status — Major gap.** Only *research-grade single-species* genomic RMs exist (duck 2021; rat 2023). **No ISO Guide 35 certified matrix CRM for meat-species quantification exists** — flagged explicitly by the 2025 JRC review (Ulberth & Koeber, *Anal. Bioanal. Chem.*).

### 2.B Plasmid quantification, copy-number & DNA-mass conversion
- **Global — Well studied.** Consensus: **supercoiled/circular plasmid under-amplifies** in qPCR and droplet dPCR → over-reads samples calibrated against it; classic fix is restriction-linearisation (your Paper 3 shows it first-hand). Dong et al. (NIM, 2015/2016) mapped conformation bias across four platforms and showed dPCR can even quantify supercoiled DNA without linearisation. Mass↔copy conversion uses genome/plasmid size × Avogadro.
- **Food — Emerging.** Plasmids are widely used as *internal amplification controls*, but **certified copy-number plasmid standards for food targets, value-assigned by dPCR, are rare**.

### 2.C Interlaboratory comparison (ILC) / proficiency testing
- **Global — Well studied at NMI level.** CCQM key comparisons (K86 series on GM maize/rice/canola; P154 "absolute DNA quantification" that exposed the supercoiled-plasmid discrepancy across labs; P199b SARS-CoV-2 RNA). These are metrology-institute exercises.
- **Food — Major gap.** **Food-analysis / regulatory laboratories rarely participate in a structured dPCR copy-number ILC.** There is no published national ILC in which routine food labs certify a *meat-relevant* copy-number reference material under ISO 20395.

### 2.D ISO 20395:2019
- First horizontal standard covering **both qPCR and dPCR** performance evaluation (ISO/TC 276; revision ISO/CD 20395 in progress). Requires: analytical/counting strategy; controls (positive/negative/NTC/inhibition); assay design & specificity (*in silico* + *in vitro*); **validation parameters — precision (repeatability/reproducibility), linearity/working range, LOQ, LOD, trueness, robustness — with *separate* requirements for qPCR vs dPCR**; **metrological traceability**; **measurement uncertainty** (for dPCR, empirical partition-volume uncertainty must propagate into the combined budget). Annexes: spectrophotometry, nucleic-acid integrity, PCR efficiency.
- **Global adoption — Emerging/uneven.** Rare full worked examples (Russo/Ricchi 2023 — MAP in bovine faeces "according to ISO 20395:2019"; Griffiths 2023 — NMI Australia species assays + RM). **Commonly reported:** LOD, LOQ, linearity, repeatability, specificity. **Commonly omitted:** full GUM uncertainty budgets, robustness, inter-lab reproducibility, traceability to a CRM.
- **Food — Major gap.** Food/meat labs still lean on Codex CAC/GL 74-2010 and ENGL/JRC GMO criteria; **no food-specific application of ISO 20395** and no standardised copy-number→mass-fraction ratio measurement.

### 2.E Multiplex ddPCR & probe chemistry (same probe at different concentrations)
- **Global — Well studied → Saturated for 2–6 targets.** Amplitude (probe-concentration) multiplexing is a *mature, vendor-supported technique*, not novel in itself: a second same-fluorophore probe at reduced concentration stacks a lower-amplitude cluster (Whale/Huggett 2016 framework; McDermott 2013 dye-amplitude; Dobnik 2016 4-plex GMO). The current frontier is **≥6-plex by colour-combination** (Stilla naica; 11–17-plex in oncology) and **ML cluster classification**.
- **Food — Moderately explored; a specific outlier exists.** Most meat/fish/gelatin ddPCR is singleplex/duplex. **He et al. 2022 (*Foods*) already demonstrated a meat quintuplex** (beef+mutton on HEX; pork+chicken+duck on FAM = same-fluorophore amplitude multiplexing). **This is decisive: "same probe at different concentrations for meat speciation" is *already published*** — so a generic multiplex-meat assay is **not** strongly novel. Residual openings: fish/seafood and **gelatin/collagen** (short/degraded amplicons make amplitude separation genuinely hard and unstudied), and amplitude×colour hyperplexing transferred from oncology.

### 2.F DNA methylation + ddPCR
- **Global — Established (methods) / Established–Emerging (applications).** Two mature chemistries: **bisulfite + ddPCR** (methylation-specific, MS-ddPCR) and **methylation-sensitive restriction enzyme + dPCR (MSRE-dPCR)**, incl. a 2024 one-step in-well digestion. Applications: cancer/cfDNA (mature), **tissue-of-origin deconvolution**, **forensic body-fluid/tissue identification via tissue-specific differentially methylated regions (tDMRs)**, **epigenetic-age clocks** (ddPCR-validated), and cross-species methylation atlases (580 animal species) proving species-discriminating methylation exists.
- **Food — Major gap (white space).** ddPCR in meat is used **only for sequence-based species quantification**. Meat *epigenetics* biology exists (tenderness, heat-stress methylation) but uses arrays/BS-seq, never ddPCR-for-authentication. Freeze–thaw studies show methylation is **stable across freeze–thaw** (supports feasibility). **No study uses methylation-ddPCR for meat species, muscle-vs-offal tissue origin, fresh-vs-frozen/thawed, heat-treatment history, or storage forensics.** Every enabling piece exists separately → a well-supported, not speculative, opportunity.

### 2.G CRISPR: cut vs uncut / edited vs wild-type by ddPCR
- **Global — Established & commercialised.** "Drop-off" ddPCR (reference probe counts all copies; drop-off probe over the cut site is lost on indel) quantifies NHEJ/HDR to ~0.1–0.5% AF from ~5 ng gDNA; large deletions/inversions too (Miyaoka 2016/2018; Bio-Rad Genome Edit Detection assays 2017). Known limit: misses edits removing both primer sites → complemented by long-read/amplicon sequencing.
- **Food — Emerging & thin.** Only just appearing (2022–2026), driven by EU treating gene-edited organisms as GMOs: gene-edited rice single-variation-point ddPCR (Sciensano/CIRAD 2022, which *itself warns a lone SNV cannot prove edited origin*); **MSTN-edited cattle ddPCR (2025)**; Cas-transgene screening in edited food (2023). **Open/novel:** GMO-vs-gene-edited *discrimination* in **processed** food with fragmented DNA, and any enforcement-grade quantitative food panel. Feasibility caveat: requires access to edited reference materials and confronts an intrinsic interpretation confound (edit vs natural variant).

### 2.H Meat authenticity / adulteration
- **Global & Food — Saturated for common species pairs.** Beef↔pork duplex ddPCR is done repeatedly (Floren 2015; Cai 2014/2017; Ren 2017; Köppel 6-species sausage 2019; He 2023; Basanisi 2020; Xu 2022). LOD ~0.1%, LOQ ~1% w/w are routine. **Avoid another species-pair assay.**
- **Live sub-gaps:** (i) **copy-number-ratio → mass-fraction traceability** (only ad-hoc multiplication factors + regression; the closest metrology paper is Temisak et al. 2021, NIMT Thailand); (ii) **degraded/autoclaved/retort DNA quantification bias** (fragmentation below amplicon length collapses counts species-differentially — highly relevant to South-Asian processed meat, only ever treated by qPCR); (iii) under-covered species (**buffalo, goat**).

### 2.I Meat safety (pathogens)
- **Global — Well studied for Salmonella; Moderately explored otherwise.** Salmonella (*invA*) ddPCR in meat (2026), quadruplex ddPCR (Salmonella/Staph/Listeria/Bacillus, 2025), STEC/Listeria/Campylobacter.
- **Major gap — PMA/viability-ddPCR in solid meat matrices.** Propidium-monoazide viability ddPCR (live vs dead / VBNC discrimination) is proven in water, seawater, flour, dairy — but in meat only a *Campylobacter chicken-rinse* ddPCR and a *beef-burger PMA-qPCR* exist. **No PMA-viability multiplex ddPCR panel validated in real solid meat homogenates with heat/HPP-injured-cell discrimination.** This is the highest-value safety gap and where ddPCR's inhibitor tolerance + absolute counting genuinely beat qPCR/culture.

### 2.J Meat quality / spoilage
- **Global & Food — Emerging / Major gap (thinnest area).** Absolute ddPCR 16S exists as a generic protocol but is **not fused with amplicon sequencing for absolute spoilage-microbiota abundance across chill storage**; **RT-ddPCR RNA-integrity and host-mtDNA-as-freshness indices are essentially untouched.** Blue-ocean but validation-heavy and with weaker regulatory pull.

---

## 3. Global Novelty Matrix

| Topic | Global research status | Food research status | Saturation | Major gap | Potential novelty |
|-------|------------------------|----------------------|------------|-----------|-------------------|
| **CRM (quantification-type)** | Well studied (GMO/clinical/genomic CRMs by dPCR; NMIs) | Only research-grade single-species RMs | Global: Well studied · Food: **Major gap** | No certified meat-species quantification CRM (JRC 2025 flags it) | **Very high** |
| **Plasmid copy-number certification** | Well studied (CCQM P154; Dong; Corbisier) | Plasmids used as IACs, not certified | Global: Well studied · Food: Emerging | Certified dPCR copy-number plasmid standard for a food target | **High** |
| **ILC / proficiency testing** | Well studied at NMI level (CCQM K86/P154/P199b) | Almost none for food dPCR quantification | Global: Well studied · Food: **Major gap** | Food-lab ILC certifying a meat-relevant copy-number RM under ISO 20395 | **High** |
| **ISO 20395:2019** | Emerging/uneven adoption | Essentially unused (rely on Codex/ENGL) | Moderately explored | No food application; uncertainty/robustness/ratio measurement omitted | **Medium–high** |
| **Multiplex ddPCR (probe-conc.)** | Well studied → Saturated (2–6plex); colour-combo frontier | Mostly duplex; **one quintuplex already exists (He 2022)** | Global: **Saturated** · Food: Moderately explored | Degraded-matrix multiplex (gelatin/collagen); amplitude×colour hyperplex for fish | **Medium** (meat speciation largely spent) |
| **DNA methylation + ddPCR** | Established (cancer/forensic/age/species) | **None for authentication** | Global: Well studied · Food: **Major gap** | Tissue-origin / species / processing-history authentication by methylation-ddPCR | **Very high** |
| **CRISPR edit detection (ddPCR)** | Established & commercialised (drop-off) | Emerging & thin (rice, MSTN cattle, Cas screen) | Global: Well studied · Food: Emerging | GMO-vs-edited discrimination in **processed** food | **High** (but feasibility/interpretation-limited) |
| **Meat authenticity** | Well studied → Saturated | Saturated for common pairs | **Saturated** | Mass-fraction traceability; degraded-DNA bias; buffalo/goat | Low (new pairs) / **High** (metrology + degraded DNA) |
| **Meat safety** | Well studied (Salmonella) | Moderately explored | Moderately explored | **PMA-viability multiplex ddPCR in solid meat** | **High** |
| **Meat quality** | Emerging | Major gap | Emerging / **Major gap** | Absolute spoilage-microbiome; mtDNA/RNA freshness index | High but speculative |

---

## 4. Cross-disciplinary novelty logic (the engine behind the picks)

> **Technology exists (elsewhere) + biological/regulatory problem exists (in food) + the food application is missing = opportunity.**

| Intersection | Proven where (outside food) | Missing in food | Becomes |
|---|---|---|---|
| ddPCR + CRM + metrology + measurement uncertainty | GMO (JRC ERM-BF), clinical (ERM-AD623), genomic mass (NMIJ 6205-a) | No certified meat-species quantification CRM; no traceable copy→mass conversion | **Project 1** |
| ddPCR + interlaboratory comparison + ISO 20395 + plasmid copy-number | CCQM K86/P154 at NMI level | No food-lab ILC certifying a meat copy-number RM | **Project 4** |
| ddPCR + DNA methylation (tDMRs, tissue-of-origin, forensic body-fluid ID) | Cancer, forensics, epigenetic-age | No DNA-based tissue-origin / processing-history authentication for meat | **Project 2** |
| ddPCR + PMA viability + multiplex + IAC | Water/dairy/flour microbiology | No viable-pathogen multiplex ddPCR validated in solid meat | **Project 3** |
| ddPCR + amplitude multiplex | Oncology hyperplex; GMO 4-plex; **meat quintuplex (He 2022)** | Only gelatin/degraded matrices remain | Extension, not flagship |
| ddPCR + CRISPR drop-off | Cell/animal editing labs | Processed-food edited-vs-natural discrimination | Watch-list (feasibility-limited) |

---

## 5. Ten candidate ideas (screened)

Each scored qualitatively (H/M/L). Ideas that survive to §7 are marked **SELECT**; others carry a one-line elimination reason.

1. **Meat-species quantification CRM + traceable copy-number→mass-fraction conversion (buffalo/cattle/sheep/goat).** *Problem:* copies ≠ mass %, no certified meat RM. *Global:* GMO template solved this; JRC 2025 flags the meat gap. *Food gap:* no ISO Guide 35 meat CRM. *Novelty:* first metrologically-traceable meat CRM + conversion model for South-Asian species. *ddPCR:* calibration-free absolute counting, inhibitor-tolerant. *Complexity:* M. *Publication:* H. → **SELECT (P1)**
2. **Methylation-ddPCR for muscle-vs-offal tissue-origin (and species) authentication.** *Problem:* DNA sequence can't tell muscle from offal/giblets. *Global:* forensic tDMR + tissue-of-origin cfDNA established. *Food gap:* never applied. *Novelty:* first DNA-based epigenetic tissue-origin authentication of meat; directly succeeds your miRNA-giblet paper. *ddPCR:* absolute methylation fraction, no standard curve. *Complexity:* M–H. *Publication:* H–VH. → **SELECT (P2)**
3. **PMA-viability multiplex ddPCR panel for viable *Salmonella* + *L. monocytogenes* + STEC in solid meat.** *Problem:* culture misses VBNC/injured cells; qPCR can't tell live from dead. *Global:* PMA-ddPCR proven in water/dairy/flour. *Food gap:* not in solid meat. *Novelty:* first viability multiplex ddPCR validated in beef/buffalo/poultry homogenate with heat/HPP-injured discrimination + IAC. *ddPCR:* inhibitor tolerance + absolute low-count. *Complexity:* M. *Publication:* H. → **SELECT (P3)**
4. **National interlaboratory comparison (ILC) certifying a meat-species plasmid copy-number RM under ISO 20395.** *Problem:* food labs never do structured dPCR copy-number ILCs. *Global:* CCQM did it at NMI level. *Food gap:* none for food/meat. *Novelty:* first food-lab ILC + reference-value assignment for a meat target, ISO 20395-framed. *ddPCR:* primary reference method. *Complexity:* M–H (logistics). *Publication:* H (+ standardisation impact). → **SELECT (P4)**
5. **Fragmentation-correction model for ddPCR quantification of autoclaved/retort meat DNA.** Strong and regionally relevant, but overlaps P1's degraded-matrix arm → **fold into P1** as a work-package rather than a standalone.
6. **Higher-order amplitude (same-probe) multiplex for meat speciation.** **Eliminated as flagship** — He 2022 already published a meat quintuplex; residual novelty (gelatin/fish degraded-amplicon multiplex) is niche → mention as P1/P2 add-on only.
7. **CRISPR drop-off ddPCR to discriminate gene-edited vs natural variation in processed food.** High novelty but **eliminated from top tier** — needs access to edited reference materials and faces an intrinsic edit-vs-natural-variant interpretation confound; better as a 2-year watch-list follow-on.
8. **Methylation-ddPCR for fresh-vs-frozen/thawed & heat-treatment history.** Strong; **merged into P2** as a second objective (shared assay platform, shared samples).
9. **Absolute spoilage-microbiome (ddPCR-anchored 16S + amplicon sequencing) across chill storage.** Emerging and useful, but weaker regulatory pull and heavier sequencing dependency → **eliminated** (park for later).
10. **Host-mtDNA / RT-ddPCR RNA-integrity freshness & mechanically-separated-meat index.** Blue-ocean but speculative and validation-heavy → **eliminated** (highest risk).

**Result of the funnel: 10 → 4 selected (P1–P4), with ideas 5 and 8 absorbed as work-packages and 6/7/9/10 documented as deliberately rejected or deferred.**

---

## 6. Ranking scorecard (weighted per your criteria)

Weights: Novelty 25 · Publication 20 · Feasibility 15 · Food-industry 10 · Regulatory 10 · ddPCR-advantage 10 · Future potential 10. Scores are 1–5, ×weight, summed (max 500).

| Project | Novelty (25) | Pub (20) | Feasib (15) | Industry (10) | Regulatory (10) | ddPCR-adv (10) | Future (10) | **Weighted total** |
|---|---|---|---|---|---|---|---|---|
| **P1 — Meat CRM + mass-fraction traceability** | 5 (125) | 5 (100) | 4 (60) | 5 (50) | 5 (50) | 5 (50) | 5 (50) | **485** |
| **P2 — Methylation-ddPCR tissue-origin** | 5 (125) | 5 (100) | 3 (45) | 4 (40) | 4 (40) | 4 (40) | 5 (50) | **440** |
| **P3 — PMA-viability multiplex ddPCR in meat** | 4 (100) | 4 (80) | 4 (60) | 5 (50) | 5 (50) | 5 (50) | 4 (40) | **430** |
| **P4 — ISO 20395 ILC / plasmid copy-number certification** | 4 (100) | 4 (80) | 3 (45) | 3 (30) | 5 (50) | 5 (50) | 5 (50) | **405** |

Interpretation: **P1 is the flagship** (top on novelty, publication, relevance, and it seeds P4). P2 is the highest-ceiling scientific bet. P3 is the most operationally safe high-impact project. P4 is the standardisation capstone that chains from P1.

---

## 7. The four selected projects (full specification)

> Each project is specified against the 15-point template you requested. Sample sizes, replication, dilution and statistics are concrete, not placeholders. All are sized for the uploaded team's demonstrated capability (QX200 ddPCR, ISO/IEC 17025 accreditation, buffalo/goat/poultry access).

---

### PROJECT 1 — *A metrologically traceable, quantification-type certified reference material and copy-number-to-mass-fraction conversion framework for meat-species authentication*

**1. Title.** Development and interlaboratory-supported characterization of matrix-matched, quantification-type certified reference materials (CRMs) for buffalo, cattle, sheep and goat, with a traceable ddPCR copy-number-to-mass-fraction conversion model for processed-meat authentication.

**2. One-sentence concept.** Build the meat-science analogue of the GMO ERM-BF reference-material system: dPCR-value-assigned, uncertainty-bearing, ISO Guide 35 / ISO 20395-compliant reference materials plus a validated conversion that turns copy-number ratios into defensible % (w/w) meat.

**3. Global status.** dPCR-certified CRMs are mature for GMO/clinical/genomic-mass targets (JRC, NMIJ, NIM, LGC); the copy-number-ratio→mass-fraction conversion factor is *solved for GMO* but **open for meat** (JRC review, Ulberth & Koeber 2025; closest attempt Temisak et al. 2021).

**4. Exact gap.** No ISO Guide 35 certified matrix CRM exists for meat-species quantification, and there is no traceable conversion accounting for genome size, ploidy, cell density (fat vs lean), and processing-induced fragmentation — especially for South-Asian species (buffalo, goat).

**5. Why genuinely novel.** First *quantification-type* meat CRM with a full uncertainty budget and traceability chain, and first conversion model that is *fragmentation-aware* (autoclaved/retort matrices). It transplants a fully-solved metrology framework (GMO) into a domain that lacks it.

**6. Hypothesis.** A gravimetrically-formulated, homogenised, stability-tested meat matrix can be assigned a copy-number-concentration value by ddPCR with expanded uncertainty ≤10%, and a species-specific, fragmentation-corrected conversion factor can recover true mass fraction to within ±15% across raw, cooked and autoclaved matrices.

**7. Objectives.** (O1) Select single-copy nuclear target + one cross-species reference assay per species; (O2) produce candidate CRMs at defined mass fractions; (O3) assess homogeneity & stability (ISO Guide 35); (O4) assign copy-number values by ddPCR with GUM uncertainty; (O5) derive & validate the fragmentation-aware conversion; (O6) demonstrate on market samples (incl. Haleem-type products).

**8. Experimental design.**
- *Sample types:* Sanger-verified single-species buffalo/cattle/sheep/goat (your existing QCMs); gravimetric binary and quaternary mixtures at 0.1, 0.5, 1, 5, 10, 25, 50% (w/w); three processing states — raw, cooked (100 °C/30 min), autoclaved (121 °C/15 min); ≥20 market products.
- *Matrices:* lean muscle, 20%-fat blend, and a standardised spice-bearing product (Haleem-type) to capture inhibitor load.
- *DNA extraction:* CTAB (ISO 21571) + column clean-up (your published workflow); DIN/fragment-size measured (TapeStation/fragment analyzer) as a covariate.
- *Target/primer/probe design:* single-copy nuclear genes (avoid mtDNA copy-number variability); short amplicons (<120 bp) for degraded-DNA robustness; one universal single-copy reference (e.g. myostatin-class) as the denominator; specificity checked *in silico* (Primer-BLAST) + *in vitro* against ≥10 non-target species.
- *ddPCR chemistry:* TaqMan (probe) duplex (species FAM / reference HEX) on QX200; linearised plasmid + gBlocks as positive controls; NTC and extraction-blank each run.
- *Controls/replicates:* per CRM candidate — 10 bottles × 3 intra-bottle replicates for homogeneity; stability at −20/4/25/37 °C over 0–12 months (isochronous design); every ddPCR point in triplicate wells, ≥3 independent days.
- *Dilution strategy:* dilute to 10–120 copies/µL (optimal Poisson working range; ≥12,000 accepted droplets/well).
- *Calibration/RM:* value-assign against NMIJ CRM 6205-a-style mass anchor where possible; document traceability path.

**9. Validation strategy (ISO 20395 + dMIQE2020).** Specificity (≥10 non-target species, zero false positives); LOD (≥95% detection, Poisson-based); LOQ (CV ≤25%); precision — repeatability (intra-day CV) and intermediate/reproducibility (operator×day×instrument); trueness vs gravimetric truth (bias %); robustness (±20% supermix, ±2 °C anneal, two extraction lots — Plackett–Burman); inhibition (spike-and-recovery, dilution linearity); **full GUM measurement-uncertainty budget** with partition-volume, dilution, extraction and calibration components; homogeneity & stability per ISO Guide 35.

**10. Statistics.** Homogeneity: one-way ANOVA between-bottle vs within-bottle → *u*bb. Stability: isochronous regression (slope test for degradation) → *u*sts/*u*lts. Value assignment: characterisation mean with combined standard uncertainty *u*char; *U* = k·√(*u*char²+*u*bb²+*u*sts²+*u*lts²), k=2. Conversion model: weighted linear/segmented regression of copy-ratio vs mass-fraction with fragmentation covariate (DIN), reported with prediction intervals; Deming/Passing–Bablok for method comparison vs qPCR; Bland–Altman for agreement.

**11. Expected results.** A set of buffalo/cattle/sheep/goat CRMs with assigned copy-number values (U ≤10%), a validated fragmentation-aware conversion recovering mass fraction to ±10–15%, and demonstration that raw-meat-derived regressions (your 2024 Haleem model) systematically bias autoclaved products — quantified for the first time.

**12. Limitations.** True ISO-Guide-35 "certification" ideally needs accreditation as an RM producer (ISO 17034) — interim output is a "reference material / in-house QCM with assigned values"; genome-size/ploidy assumptions need per-species genomic confirmation; full certification benefits from the P4 ILC.

**13. Duration.** 24–30 months (6 formulation/homogeneity; 12 stability; 6 value assignment/validation; 6 conversion + application).

**14. Resources.** QX200 + AutoDG; fragment analyzer; gravimetric prep + cryomill; −80 storage; linearised plasmids/gBlocks; ISO/IEC 17025 environment (in place); optional NMI collaboration (NPL-India/CSIR, LGC, NMIJ, JRC).

**15. Target journals.** *Analytical & Bioanalytical Chemistry*; *Food Chemistry*; *Food Control*; *Foods*; *Metrologia* (for the uncertainty/traceability paper); *npj Science of Food*.

---

### PROJECT 2 — *DNA-methylation droplet digital PCR for tissue-origin and processing-history authentication of meat*

**1. Title.** Methylation-ddPCR for DNA-based authentication of tissue origin (muscle vs offal/giblets), species, and thermal/freeze–thaw processing history in meat products.

**2. One-sentence concept.** Use tissue- and species-specific differentially methylated regions read by absolute methylation-fraction ddPCR to resolve what DNA sequence cannot — whether "meat" is actually skeletal muscle, and how it was processed.

**3. Global status.** Methylation-ddPCR is established in oncology/cfDNA, forensic body-fluid/tissue identification (tDMRs), and epigenetic-age; cross-species methylation differences are documented across 580 animal species. **Zero** use for meat authentication.

**4. Exact gap.** Your own miRNA-giblet paper states DNA cannot detect intra-species (tissue) adulteration "because all tissues have exactly the same DNA sequence." Methylation *is* a DNA-borne, tissue-specific signal — never exploited for meat, and RNA/miRNA assays are labile and lack CRMs.

**5. Why genuinely novel.** First epigenetic, DNA-based route to (i) muscle-vs-offal tissue origin, (ii) species differentiation via methylation, and (iii) processing-history (fresh vs frozen–thawed vs heat-treated) — a conceptual transfer from forensic tDMR science into food authentication.

**6. Hypothesis.** Candidate tDMRs show ≥30-percentage-point methylation differences between skeletal muscle and liver/heart/gizzard within species, are stable across freeze–thaw, and shift measurably with defined heat treatment — all quantifiable by ddPCR with CV ≤10%.

**7. Objectives.** (O1) Mine public WGBS/RRBS + targeted screening to shortlist muscle-vs-offal and species tDMRs; (O2) build MSRE-ddPCR and bisulfite-ddPCR assays; (O3) validate tissue-origin discrimination in raw & cooked admixtures (mirroring your 5/25/50 g/100 g giblet design); (O4) test freeze–thaw and heat-treatment methylation shifts as processing markers.

**8. Experimental design.**
- *Samples:* chicken and buffalo muscle, liver, heart, gizzard (offal); admixtures at 5, 10, 25, 50% (w/w), raw and cooked (100 °C/30 min); freeze–thaw series (0–5 cycles); heat gradient (60/72/100/121 °C). n=10 biological replicates/tissue (matching your giblet-paper sampling).
- *Extraction:* genomic DNA (column); bisulfite conversion (for MS-ddPCR arm) with conversion efficiency checked by dPCR; MSRE arm uses HpaII/other methylation-sensitive enzymes in-well (one-step MSRE-ddPCR).
- *Targets:* 4–6 tDMRs (muscle-hypo/offal-hyper and vice-versa) + 2 species-discriminating DMRs; short amplicons; a methylation-independent single-copy locus as the copy-number denominator.
- *Chemistry:* duplex TaqMan (methylated vs unmethylated or digested vs reference) on QX200; linearised fully-methylated & unmethylated control DNAs as anchors; NTC + no-enzyme control (MSRE arm) + no-conversion control (bisulfite arm).
- *Replicates/dilution:* triplicate wells × 3 days; dilute to 10–120 copies/µL; ≥12,000 droplets/well.

**9. Validation.** Specificity (target vs non-target tissue/species); LOD/LOQ of the minor (offal) fraction; precision (repeatability + reproducibility of methylation fraction); trueness vs bisulfite-amplicon-sequencing reference; robustness (enzyme lot, conversion lot, anneal ±2 °C); inhibition (spice matrix spike-recovery); measurement uncertainty of methylation fraction (partition-volume + conversion-efficiency terms).

**10. Statistics.** Methylation fraction = Cmeth/(Cmeth+Cunmeth) with Poisson/ratio-error propagation (as in dMIQE); ANOVA + Tukey across tissues; ROC/Youden-index cut-offs for offal presence (parallel to your +2 SD cut-off but statistically optimised); logistic/linear mixed models (tissue fixed, animal random) for admixture %; concordance vs BS-seq by Lin's CCC and Bland–Altman; segmented regression for heat-treatment dose–response.

**11. Expected results.** A validated panel that flags undeclared offal at ≥10–25 g/100 g in raw and cooked product, distinguishes chicken vs buffalo by methylation, and yields a monotonic methylation shift usable as a heat-treatment/freeze–thaw marker — the first DNA-based tissue-origin authentication in food.

**12. Limitations.** tDMR discovery is the critical-path risk (mitigated by targeted screening + public methylomes); severe autoclaving may erase some signals (turns into a "processing marker" rather than a species marker — still informative); bisulfite arm consumes DNA and adds a conversion-uncertainty term (MSRE arm mitigates).

**13. Duration.** 24 months (6 marker discovery/screen; 8 assay build/optimise; 6 validation; 4 processing-history study).

**14. Resources.** QX200; bisulfite kits + methylation-sensitive enzymes; methylated/unmethylated control DNA; access to a BS-amplicon-sequencing service for the trueness reference; tissue sampling (in place).

**15. Target journals.** *Food Chemistry*; *npj Science of Food*; *Food Control*; *Journal of Agricultural and Food Chemistry*; *Forensic Science International: Genetics* (methods cross-over); *Analytical and Bioanalytical Chemistry*.

---

### PROJECT 3 — *Propidium-monoazide viability multiplex ddPCR for viable foodborne pathogens in solid meat matrices*

**1. Title.** A propidium-monoazide (PMA) viability multiplex droplet digital PCR assay for absolute quantification of viable *Salmonella enterica*, *Listeria monocytogenes* and Shiga-toxin-producing *E. coli* (STEC) in raw and processed meat, with heat/high-pressure-injured-cell discrimination.

**2. One-sentence concept.** Combine PMA viability treatment with a multiplex ddPCR panel + internal amplification control to count only *live* pathogens directly in beef/buffalo/poultry homogenates — resolving the live/dead ambiguity that defeats qPCR and the VBNC cells that defeat culture.

**3. Global status.** PMA-ddPCR viability quantification is established in water/seawater/flour/dairy; Salmonella (*invA*) ddPCR and quadruplex food-pathogen ddPCR exist. In meat, only a *Campylobacter* chicken-*rinse* ddPCR and a *beef-burger PMA-qPCR* have been reported.

**4. Exact gap.** No PMA-viability *multiplex ddPCR* validated in *solid meat homogenates*, and no systematic discrimination of viable-but-non-culturable / heat- or HPP-injured cells in meat by ddPCR.

**5. Why genuinely novel.** First viable-pathogen multiplex ddPCR in real solid meat with injured-cell resolution and an internal amplification control (extending your *Chlamydia* single-target ddPCR into a viability multiplex for meat safety).

**6. Hypothesis.** PMA pre-treatment suppresses dead-cell signal by ≥3 log in meat homogenate, allowing the multiplex ddPCR to quantify viable Salmonella/Listeria/STEC to ≤10 CFU/g with recovery within ±0.5 log, and to distinguish injured-but-viable from dead cells after defined heat/HPP stress.

**7. Objectives.** (O1) optimise PMA dose/light/matrix clarification for meat; (O2) build 3-target + IAC multiplex (amplitude/colour) on QX200; (O3) validate live/dead discrimination with defined live:dead spikes; (O4) characterise injured-cell (heat, HPP) detection vs culture and qPCR.

**8. Experimental design.**
- *Samples:* sterile beef, buffalo and chicken homogenates spiked with quantified live and heat-killed pathogen cocktails at 10⁰–10⁶ CFU/g; defined live:dead ratios (100:0 → 0:100); sub-lethal stress arms (56 °C, 300–600 MPa HPP); ≥30 naturally-contaminated retail samples.
- *Viability step:* PMA/PMAxx titration (µM) + photoactivation; matrix clarification tuned to meat.
- *Targets:* *invA* (Salmonella), *hlyA* (L. monocytogenes), *stx1/stx2*+*eae* (STEC) + synthetic IAC; specificity vs ≥20 non-target strains.
- *Chemistry:* amplitude/colour multiplex (FAM/HEX + probe-concentration tiers) on QX200; NTC, live-only, dead-only, and no-PMA controls each run.
- *Replicates/dilution:* triplicate wells × ≥3 days; template in Poisson range; ≥12,000 droplets/well.
- *Reference methods:* ISO 6579 (Salmonella)/ISO 11290 (Listeria) culture + plate counts in parallel.

**9. Validation.** Specificity/selectivity (≥20 strains + background flora); LOD/LOQ (CFU/g, ≥95% at LOD); precision (repeatability + reproducibility); trueness vs plate counts (bias in log CFU/g); robustness (PMA lot, homogenate load, anneal); inhibition (IAC suppression flag + dilution linearity); measurement uncertainty (partition-volume + PMA-suppression terms).

**10. Statistics.** Live/dead suppression quantified as Δlog copies ± PMA; ROC to set a viability threshold; mixed-effects regression of copies vs CFU (matrix random effect); Deming regression ddPCR vs culture; Bland–Altman agreement; ANOVA across injury treatments; probit LOD.

**11. Expected results.** ≥3-log dead-cell suppression in meat, viable-cell LOD ≤10 CFU/g, injured-cell detection where culture under-reports, and demonstrated multiplex quantification of three pathogens + IAC in one well — a directly deployable regulatory screening tool.

**12. Limitations.** PMA is imperfect in dense/fatty matrices (dead-cell leak) — mitigated by dose optimisation + IAC; multiplex amplitude crowding with 3 targets + IAC needs careful cluster design; naturally-contaminated positives may be scarce (supplement with spiked field-mimics).

**13. Duration.** 18–24 months (6 PMA/matrix optimisation; 6 multiplex build; 6 validation; 3–6 field/injured-cell study).

**14. Resources.** QX200 + AutoDG; BSL-2 with pathogen cultures; PMA/PMAxx + photoactivation; HPP access (collaboration) for the injury arm; culture reference capability (in place).

**15. Target journals.** *Food Control*; *International Journal of Food Microbiology*; *Food Microbiology*; *Foods*; *Applied and Environmental Microbiology*.

---

### PROJECT 4 — *An ISO 20395-framed interlaboratory comparison certifying a meat-species plasmid copy-number reference material*

**1. Title.** Design and execution of a national/regional interlaboratory comparison for ddPCR-based copy-number reference-value assignment of a meat-species (buffalo/cattle) plasmid reference material, framed by ISO 20395:2019.

**2. One-sentence concept.** Bring the CCQM key-comparison model down to food/regulatory laboratories: circulate a linearised meat-target plasmid, have participating labs assign copy-number concentration by ddPCR under a common ISO 20395 protocol, and derive a reference value + laboratory-performance scores.

**3. Global status.** Copy-number ILCs by dPCR are established at NMI level (CCQM K86/P154/P199b) and the supercoiled-vs-linear plasmid effect is well characterised (Dong; Corbisier; your *Chlamydia* paper). Food/regulatory-lab ILCs for dPCR copy-number are essentially absent.

**4. Exact gap.** No published ILC in which routine food labs certify a meat-relevant copy-number reference material under ISO 20395, and no food-sector proficiency scheme for dPCR quantification.

**5. Why genuinely novel.** First ISO 20395-framed food-laboratory ILC + reference-value assignment for a meat target; produces both a usable RM (feeding Project 1) and the first food-dPCR proficiency dataset — a standardisation contribution, not just an assay.

**6. Hypothesis.** With a harmonised protocol and a linearised plasmid, ≥8 laboratories can assign copy-number concentration with inter-laboratory reproducibility (CV) ≤25% and produce a consensus reference value with expanded uncertainty ≤15%, while circular-plasmid controls reproducibly bias results high.

**7. Objectives.** (O1) construct & linearise the meat-target plasmid; homogeneity/stability per ISO Guide 35; (O2) write the harmonised ISO 20395 protocol + reporting template; (O3) recruit ≥8 labs; (O4) assign the reference value + score labs; (O5) quantify the circular-vs-linear bias across labs as a teaching output.

**8. Experimental design.**
- *Material:* single meat-target insert (e.g. buffalo MC1R, reusing your validated assay) in a plasmid; linearised master + circular comparator; homogeneity (10 units × 3) & short/long-term stability.
- *Distribution:* blind-coded aliquots at 2–3 concentration levels spanning the Poisson working range; cold-chain shipping with a stability sentinel.
- *Common protocol:* fixed primer/probe, supermix, cycling, droplet-count and threshold-setting rules; mandated NTC, linearised & circular controls; triplicate wells × ≥2 days per lab.
- *Data return:* standard template capturing copies/µL, accepted droplets, thresholds, operator, instrument.

**9. Validation / quality.** Per-lab: LOD/LOQ check, repeatability, droplet-count acceptance, inhibition control; scheme-level: outlier screening, reproducibility, and traceability documentation; robustness of the consensus to lab exclusion.

**10. Statistics.** Reference value by robust estimators (algorithm A / Q–Hampel per ISO 13528) with consensus uncertainty; laboratory performance by z- and ζ-scores (ISO 13528); between-lab reproducibility SD (sR) and repeatability SD (sr) via nested ANOVA; paired t / Wilcoxon for circular-vs-linear bias; Mandel h/k statistics for consistency; Youden plot for systematic vs random error.

**11. Expected results.** A consensus copy-number reference value with documented uncertainty, z-score performance map of participating labs, a reusable linearised meat-target RM, and a quantified, multi-lab confirmation of the circular-plasmid positive bias — a citable standardisation milestone.

**12. Limitations.** Success depends on recruiting and disciplining ≥8 labs (logistics/timeline risk); plasmid (not genomic matrix) certifies the *assay/counting* step, not whole-matrix conversion — that is Project 1's remit (the two are explicitly complementary).

**13. Duration.** 18–24 months (4 material prep; 3 protocol/recruitment; 6 round + repeats; 5 analysis/reporting).

**14. Resources.** Plasmid construction + restriction linearisation; QX200 (coordinating lab); ISO 13528 statistical tooling; a network of food/veterinary/regulatory labs (FSSAI/ICAR/university partners); cold-chain logistics.

**15. Target journals.** *Accreditation and Quality Assurance*; *Analytical and Bioanalytical Chemistry*; *Food Control*; *Metrologia* (comparison report); *Food Analytical Methods*.

---

## 8. FINAL ANSWER

> **"If I were starting a new ddPCR research project today in a food molecular-analysis laboratory, which 2–4 projects would give the best combination of genuine novelty, feasibility, scientific depth and high-quality publication potential?"**

**Start these four, in this order of priority:**

1. **Meat-species quantification CRM + traceable copy-number→mass-fraction conversion (buffalo/cattle/sheep/goat).** *The flagship* — highest novelty and publication ceiling, squarely in the food-authenticity + metrology + ISO 20395 sweet spot, feasible with your existing accredited QX200 lab and QCMs, and it seeds Project 4. Fills a gap a 2025 JRC review names explicitly.
2. **Methylation-ddPCR for tissue-origin (muscle vs offal) and processing-history authentication.** *The highest-ceiling scientific bet* — genuine white space worldwide, a direct DNA-based successor to your own miRNA-giblet work, and cross-disciplinary (forensic tDMR science → food).
3. **PMA-viability multiplex ddPCR for viable pathogens in solid meat.** *The safest high-impact project* — clear, defensible gap; strongest ddPCR-over-qPCR/culture argument (live/dead + VBNC); direct regulatory pull.
4. **ISO 20395-framed ILC certifying a meat-species plasmid copy-number RM.** *The standardisation capstone* — chains from Project 1, delivers the first food-dPCR proficiency dataset, and is a citable metrology contribution.

**A recommended two-project minimum** (if resources are tight): **P1 + P2** — together they cover inter-species quantification (metrology) and intra-species/processing authentication (epigenetics), the two directions where the world literature — not just your uploaded papers — shows real, defensible gaps.

**Deliberately NOT recommended as flagships (and why):** another same-probe multiplex meat-speciation assay (**already published — He et al. 2022 quintuplex**); another beef/pork-type species-pair ddPCR (**saturated**); a stand-alone CRISPR edited-food ddPCR (**feasibility- and interpretation-limited today** — keep as a watch-list follow-on).

---

## 9. Reference list (with verification status)

**Verification legend:** ✔ = DOI/identifier read from a real search-result or publisher URL; ⚠ = reference is real but **DOI could not be independently confirmed — verify before citing**; ▣ = preprint (not peer-reviewed); ◆ = standard/guidance (no DOI). *Publisher full-text was egress-blocked during research, so ✔ means "seen in a real result URL/snippet," not "full page re-fetched." No reference or DOI here was invented.*

### Uploaded papers (DOIs from the supplied PDFs)
- Aravind Kumar N, Vishnuraj MR, et al. 2024. First report on ddPCR-based regression models for quantifying buffalo substitution in 'Haleem'. *J. Food Compos. Anal.* 126:105879. ✔ 10.1016/j.jfca.2023.105879 — India (ICAR-NMRI).
- Vishnuraj MR, Devatkal S, et al. 2021. Detection of giblets in chicken meat products using microRNA markers and ddPCR. *LWT* 140:110798. ✔ 10.1016/j.lwt.2020.110798 — India.
- Sahu R, Vishnuraj MR, et al. 2021. Development and comparative evaluation of ddPCR and qPCR for *Chlamydia psittaci*. *J. Microbiol. Methods* 190:106318. ✔ 10.1016/j.mimet.2021.106318 — India.

### Metrology / CRM / dPCR foundations
- Bhat S, Herrmann J, Armishaw P, Corbisier P, Emslie KR. 2009. Single molecule detection in nanofluidic digital array enables accurate measurement of DNA copy number. *Anal. Bioanal. Chem.* ✔ 10.1007/s00216-009-2729-5 — Australia/EU.
- Bhat S, Emslie KR, et al. 2010. Comparison of methods for accurate quantification of DNA mass concentration with traceability to the SI. *Anal. Chem.* ✔ 10.1021/ac100845m — Australia.
- Sanders R, Huggett JF, Bushell CA, Cowen S, Scott DJ, Foy CA. 2011. Evaluation of digital PCR for absolute DNA quantification. *Anal. Chem.* 83:6474–6484. ✔ 10.1021/ac103230c — UK (LGC).
- Pinheiro LB, Coleman VA, Hindson CM, Herrmann J, Hindson BJ, Bhat S, Emslie KR. 2012. Evaluation of a droplet digital PCR format for DNA copy number quantification. *Anal. Chem.* 84:1003–1011. ✔ 10.1021/ac202578x — Australia/USA.
- Corbisier P, Pinheiro L, Mazoua S, et al. 2015. DNA copy number concentration measured by digital and droplet digital quantitative PCR using certified reference materials. *Anal. Bioanal. Chem.* 407:1831–1840. ✔ 10.1007/s00216-015-8458-z — EU (JRC-IRMM).
- Deprez L, Corbisier P, Kortekaas A-M, et al. 2016. Validation of a digital PCR method for quantification of DNA copy number concentrations by using a certified reference material. *Biomol. Detect. Quantif.* 9:29–39. ✔ 10.1016/j.bdq.2016.08.002 — EU (JRC-Geel).
- Dong L, Meng Y, Wang J, Liu Y. 2015. Comparison of four digital PCR platforms for accurate quantification of DNA copy number of a certified plasmid DNA reference material. *Sci. Rep.* 5:13174. ✔ 10.1038/srep13174 — China (NIM).
- Dong L, Meng Y, Sui Z, Wang J, Wu L, Fu B. 2016. Accurate quantification of supercoiled DNA by digital PCR. *Sci. Rep.* 6:24230. ✔ 10.1038/srep24230 — China (NIM).
- Whale AS, Jones GM, Pavšič J, et al. 2018. Assessment of digital PCR as a primary reference measurement procedure to support advances in precision medicine. *Clin. Chem.* 64(9):1296–1307. ⚠ 10.1373/clinchem.2017.285478 — EU/UK.
- Milavec M, Cleveland MH, Bae Y-K, Wielgosz RI, Vonsky M, Huggett JF. 2022. Metrological framework to support accurate, reliable, reproducible nucleic acid measurements. *Anal. Bioanal. Chem.* 414(2):791–806. ✔ 10.1007/s00216-021-03712-x — international.
- NMIJ CRM 6205-a: Kase et al. 2019. Development of certified reference material NMIJ CRM 6205-a … accurate mass concentrations of 600-bp DNA solutions. *Anal. Bioanal. Chem.* 411. ✔ 10.1007/s00216-019-01992-y — Japan (NMIJ/AIST).
- Lin C-H, Hou Y, Zhang H, et al. 2011. Serious overestimation in quantitative PCR by circular (supercoiled) plasmid standard. *PLoS ONE*. ✔ 10.1371/journal.pone.0009545 — establishes supercoiled-standard bias.
- Ulberth F, Koeber R. 2025. Reference materials for food authentication. *Anal. Bioanal. Chem.* 417(12):2427–2438. ✔ 10.1007/s00216-025-05743-0 — EU (JRC). **Gap-defining review.**

### GMO CRMs / ILC template
- Corbisier P, et al. 2017. Interlaboratory analysis of selected genetically modified plant reference materials with digital PCR. *Anal. Bioanal. Chem.* 409. ✔ 10.1007/s00216-017-0711-1 — EU.
- Collaborative trial to assess performance of digital PCR in GMO analysis using an artificial sample material. 2016. *Eur. Food Res. Technol.* 242. ✔ 10.1007/s00217-016-2824-8.
- Development of genomic DNA CRM for GM rice Kefeng-6. 2020. *ACS Omega*. ✔ 10.1021/acsomega.0c02274 — China.
- Digital PCR-based characterization of a Zhonghuang-6106 soybean genomic DNA reference material. 2025. *Sci. Rep.* ✔ 10.1038/s41598-025-18096-6 — China.
- Trapmann S, Linsinger T, Koeber R, et al. 2025. 25+ years of GMO CRM production at EC JRC. *Anal. Bioanal. Chem.* ⚠ DOI not captured (PubMed 39843712) — EU.
- CCQM-K86/P113.1 (Corbisier P, et al. 2012). Relative quantification of genomic DNA fragments. *Metrologia* 49:1A. ✔ 10.1088/0026-1394/49/1A/08002.
- CCQM-P199b interlaboratory comparability study of SARS-CoV-2 RNA copy number. 2024. ▣ 10.1101/2024.03.27.584106 (preprint).

### Standards / guidance
- ISO 20395:2019. Biotechnology — Requirements for evaluating the performance of quantification methods for nucleic acid target sequences — qPCR and dPCR. ◆ ISO Std 67893 (revision ISO/CD 20395, #91706).
- ISO/IEC 17025:2017. ◆ ISO 66912. · ISO Guide 35:2017. ◆ ISO 60281. · ISO 13528 (proficiency-testing statistics). ◆
- Codex Alimentarius CAC/GL 74-2010. ◆ FAO/WHO.
- JCGM 100:2008 (GUM). ◆ 10.59161/jcgm100-2008e (verified) — BIPM.
- Bustin SA, et al. 2009. The MIQE guidelines. *Clin. Chem.* 55(4):611–622. ✔ 10.1373/clinchem.2008.112797.
- Bustin SA, et al. 2025. MIQE 2.0. *Clin. Chem.* 71(6):634–651. ✔ 10.1093/clinchem/hvaf043.
- Huggett JF, et al. 2013. The digital MIQE guidelines. *Clin. Chem.* 59(6):892–902. ✔ 10.1373/clinchem.2013.206375.
- The dMIQE Group / Huggett JF. 2020. dMIQE2020. *Clin. Chem.* 66(8):1012–1029. ✔ 10.1093/clinchem/hvaa125.
- Pecoraro S, Berben G, Burns M, Corbisier P, et al. 2019. Overview and recommendations for the application of digital PCR. EUR 29673 EN. ✔ 10.2760/192883 — EU (JRC/ENGL).
- Russo S, Cortimiglia C, Filippi A, et al. 2023. Validation of digital PCR assay for quantification of *M. avium* subsp. *paratuberculosis* in bovine faeces according to ISO 20395:2019. *J. Microbiol. Methods* 213:106825. ✔ 10.1016/j.mimet.2023.106825 — Italy (IZSLER).
- Griffiths KR, McLaughlin JLH, Hall F, et al. 2023. Development of seven new dPCR animal species assays and a reference material to support quantitative ratio measurements of food and feed products. *Foods* 12(20):3839. ✔ 10.3390/foods12203839 — Australia (NMI).

### Multiplex / probe-concentration chemistry
- Whale AS, Huggett JF, Tzonev S. 2016. Fundamentals of multiplexing with digital PCR. *Biomol. Detect. Quantif.* 10:15–23. ✔ 10.1016/j.bdq.2016.05.002 — UK/USA.
- McDermott GP, Do D, Litterst CM, et al. 2013. Multiplexed target detection using DNA-binding dye chemistry in droplet digital PCR. *Anal. Chem.* 85(23):11619–11627. ✔ 10.1021/ac403061n — USA (Bio-Rad).
- Dobnik D, Štebih D, Blejec A, Morisset D, Žel J. 2016. Multiplex quantification of four DNA targets in one reaction with Bio-Rad droplet digital PCR for GMO detection. *Sci. Rep.* 6:35451. ✔ 10.1038/srep35451 — Slovenia.
- Hughesman CB, Lu XJD, Liu KYP, et al. 2016. A robust protocol for using multiplexed ddPCR to quantify somatic copy number alterations. *PLoS ONE* 11(8):e0161274. ✔ 10.1371/journal.pone.0161274 — Canada.
- Nyaruaba R, Li C, Mwaliko C, et al. 2021. Developing multiplex ddPCR assays for SARS-CoV-2 based on probe mix and amplitude-based multiplexing. *Expert Rev. Mol. Diagn.* 21(1):119–129. ✔ 10.1080/14737159.2021.1865807 — China/Kenya.
- He C, Bai L, Chen Y, et al. 2022. Detection and quantification of adulterated beef and mutton products by multiplex droplet digital PCR. *Foods* 11(19):3034. ✔ 10.3390/foods11193034 — China. **(Meat quintuplex — limits multiplex-meat novelty.)**

### DNA methylation + dPCR
- Nell RJ, et al. 2020. Quantification of DNA methylation independent of sodium bisulfite conversion using methylation-sensitive restriction enzymes and digital PCR. *Hum. Mutat.* ✔ 10.1002/humu.24111.
- MSRE-ddPCR one-step assay for DNA methylation hotspots. 2024. *Int. J. Mol. Med.* ✔ 10.3892/ijmm.2024.5366 — Italy.
- Robust internal control for high-precision methylation ddPCR. 2018. *Clin. Epigenetics.* ✔ 10.1186/s13148-018-0456-5.
- ddPCR methylation assay of prenatal tobacco exposure. 2022. *BioTechniques.* ✔ 10.2144/btn-2021-0099.
- New targeted approaches for epigenetic age predictions. 2020. *BMC Biol.* ✔ 10.1186/s12915-020-00807-2 — Germany.
- Comparative methylome across vertebrates. 2022. *BMC Biol.* ✔ 10.1186/s12915-022-01270-x.
- DNA methylation profiling of divergent tenderness in Angus beef cattle. 2020. *Front. Genet.* ✔ 10.3389/fgene.2020.00939 — nearest meat-quality/methylation link (array/seq, not ddPCR).
- Effects of repeated freeze–thaw cycles on genome-wide DNA methylation. 2024. *Biopreserv. Biobank.* ✔ 10.1089/bio.2022.0045 — supports frozen/thawed-meat feasibility.

### CRISPR edit detection + food
- Miyaoka Y, et al. 2016. Systematic quantification of HDR and NHEJ reveals effects of locus, nuclease, and cell type on genome editing. *Sci. Rep.* 6:23549. ⚠ 10.1038/srep23549 (DOI from article-ID convention) — USA.
- Miyaoka Y, et al. 2018. Detection and quantification of HDR and NHEJ induced by genome editing at endogenous gene loci using ddPCR. *Methods Mol. Biol.* ✔ 10.1007/978-1-4939-7778-9_20.
- Digital PCR-based screening of genome-edited cells. 2016. *PLoS ONE.* ✔ 10.1371/journal.pone.0153901.
- Fraiture M-A, et al. 2022. A ddPCR strategy to detect a gene-edited plant carrying a single variation point: technical feasibility and interpretation issues. *Food Control.* ⚠ DOI not captured (HAL hal-03672552) — Belgium/France. **Flags SNV interpretation confound.**
- A novel quantification method for gene-edited animal detection based on ddPCR (MSTN cattle). 2025. *Biology* 14(2):203. ✔ 10.3390/biology14020203 — China.
- Qualitative and quantitative detection of CRISPR-associated Cas gene in gene-edited foods. 2023. *Foods* 12(19):3681. ✔ 10.3390/foods12193681 — China.
- Bio-Rad ddPCR Genome Edit Detection Assays (drop-off). 2017. ◆ Bulletin 6872 — vendor literature.

### Meat authenticity / mass-fraction / safety / quality
- Floren C, Wiedemann I, Brenig B, Schütz E, Beck J. 2015. Species identification and quantification in meat and meat products using ddPCR. *Food Chem.* 173:1054–1058. ✔ 10.1016/j.foodchem.2014.10.138 — Germany.
- Cai Y, Li X, et al. 2014. Quantitative analysis of pork and chicken products by droplet digital PCR. *BioMed Res. Int.* 2014:810209. ✔ 10.1155/2014/810209 — China.
- Cai Y, He Y, Lv R, Chen H, Wang Q, Pan L. 2017. Detection and quantification of beef and pork materials in meat products by duplex ddPCR. *PLoS ONE* 12(8):e0181949. ✔ 10.1371/journal.pone.0181949 — China.
- Ren J, Deng T, Huang W, Chen Y, Ge Y. 2017. A digital PCR method for identifying and quantifying adulteration of meat species in raw and processed food. *PLoS ONE* 12(3):e0173567. ✔ 10.1371/journal.pone.0173567 — China/Japan. **(Copy-ratio→mass multiplication factor.)**
- Droplet digital PCR method for detection and quantification of goat and sheep derivatives in commercial meat products. 2017. *Eur. Food Res. Technol.* ✔ 10.1007/s00217-017-3000-5 — China.
- Köppel R, et al. 2019. Duplex digital PCR for determination of meat proportions of sausages containing chicken, turkey, horse, cow, pig and sheep. *Eur. Food Res. Technol.* 245:853–862. ✔ 10.1007/s00217-018-3220-3 — Switzerland. **(6-species sausage.)**
- Basanisi MG, et al. 2020. Application of the novel ddPCR technology for identification of meat species. *Int. J. Food Sci. Technol.* 55. ✔ 10.1111/ijfs.14486 — Italy.
- Xu Z, et al. 2022. A ddPCR-based approach for identification and quantification of porcine and chicken derivatives in beef. *Foods* 11(20):3265. ⚠ 10.3390/foods11203265 (from summary) — China.
- He Y, Yan W, Dong L, et al. 2023. An effective ddPCR method for identifying and quantifying meat adulteration in raw and processed beef and lamb. *Front. Sustain. Food Syst.* 7:1180301. ✔ 10.3389/fsufs.2023.1180301 — China.
- Aravind Kumar N, et al. 2023. Droplet digital PCR assay with linear regression models for quantification of buffalo-derived materials in different food matrices. *Food Anal. Methods.* ✔ 10.1007/s12161-022-02441-w — India.
- Fur-bearing animal ddPCR. 2021. *Food Chem.* ⚠ 10.1016/j.foodchem.2021.129525 (from summary) — China.
- Duplex ddPCR for bovine + porcine gelatin in capsules. 2023. *Food Sci. Biotechnol.* 32. ✔ 10.1007/s10068-022-01204-x.
- Deconinck D, et al. 2021. Identification and semi-quantification of Atlantic salmon in processed and mixed seafood products using ddPCR. *Food Chem. Toxicol.* 154:112329. ⚠ 10.1016/j.fct.2021.112329 (from summary) — Belgium.
- Ma X, et al. 2023. A ddPCR-based approach for quantitative analysis of adulteration of Atlantic salmon with rainbow trout. *Foods* 12(23):4309. ✔ 10.3390/foods12234309 — China.
- Temisak S, et al. 2021. Accurate determination of meat mass fractions using DNA measurements for quantifying meat adulteration by digital PCR. *Int. J. Food Sci. Technol.* 56(12):6345. ✔ 10.1111/ijfs.15375; preprint ▣ 10.1101/2020.06.14.150375 — Thailand (NIMT). **(Closest mass-fraction-traceability paper.)**
- Mammalian and avian species quantification in homogenized foods: real-time PCR and dPCR for label-compliance controls. 2024. *Sci. Rep.* 14. ✔ 10.1038/s41598-024-61009-2.
- Liang Y, et al. 2026. Droplet digital PCR assay for quantifying *Salmonella* in meat samples. *Foods* 15(2):337. ✔ 10.3390/foods15020337 — China.
- Quadruplex ddPCR for simultaneous detection of *Salmonella enterica*, *Staphylococcus aureus*, *L. monocytogenes*, *Bacillus cereus* in foods. 2025. *Sci. Rep.* 15. ✔ 10.1038/s41598-025-17272-y.
- Digital droplet-PCR for quantification of viable *Campylobacter jejuni/coli* in chicken meat rinses. 2022. *Appl. Sci.* 12(11):5315. ✔ 10.3390/app12115315. **(Rare meat-matrix viability ddPCR.)**
- VBNC *Salmonella* Typhimurium in flour quantified by ddPCR + intercalating dyes. 2024. *Microbiol. Spectr.* ✔ 10.1128/spectrum.00249-24.
- *Vibrio cholerae* PMA multiplex ddPCR. 2023. *Front. Microbiol.* 14:1149981. ✔ 10.3389/fmicb.2023.1149981.
- Rey MdlS, et al. 2021. Evaluation of PMA-qPCR to detect/quantify viable STEC in beef burgers. *J. Food Process. Preserv.* 45. ✔ 10.1111/jfpp.15338. **(PMA in beef by qPCR — the ddPCR gap.)**
- *Pseudomonas aeruginosa*/*P. fragi* simultaneous ddPCR in foods. 2024. *Foods* 13(10):1453. ✔ 10.3390/foods13101453.
- Absolute quantification of 16S rRNA copy number by ddPCR (protocol). 2025. *Methods Mol. Biol.* ✔ 10.1007/978-1-0716-4767-7_14. **(Generic — not yet meat spoilage.)**
- Singh P, et al. 2024. Twenty-three years of PCR-based seafood authentication assay development. *Compr. Rev. Food Sci. Food Saf.* ✔ 10.1111/1541-4337.13401.

**Explicitly unverified / could not be matched (do not cite without checking):** Iwobi et al. 2015 triplex qPCR beef/pork (PubMed 25236231, DOI not found); "Wang 2018 goat/sheep ddPCR", "Kang/Noh salmon ddPCR" — could not confirm as distinct verified records; several viability/quality items flagged ⚠ in the working notes.

---

## 10. Appendix — Salient, laboratory-friendly extract of ISO 20395:2019

**Purpose:** the first horizontal standard evaluating performance of *both* qPCR and dPCR for nucleic-acid target quantification (ISO/TC 276). Use it as the validation spine of P1–P4.

**Parameters it requires (and the practical target for a food dPCR lab):**
- *Trueness/accuracy* — bias vs a reference value/CRM (report %bias).
- *Precision* — repeatability (intra-day) **and** intermediate/reproducibility (operator×day×instrument); report CV.
- *Specificity/selectivity* — *in silico* (Primer-BLAST) + *in vitro* against non-target species.
- *LOD* — ≥95% detection; Poisson-based for dPCR.
- *LOQ* — lowest concentration with acceptable trueness+precision (CV ≤25% is the common working rule).
- *Linearity/working range* — for dPCR, the Poisson-valid range (≈10–120 copies/µL, ≥~12,000 partitions).
- *Robustness* — deliberate small changes (supermix ±20%, anneal ±2 °C, lots) — **frequently omitted; make it a differentiator.**
- *Measurement uncertainty* — for dPCR, empirically-measured **partition-volume** uncertainty must propagate into the combined budget (GUM) — **the single most-overlooked requirement in food dPCR papers.**
- *Metrological traceability* — to a CRM where possible (the P1/P4 output).
- *Inhibition* — internal amplification control + dilution-linearity check.

**qPCR vs dPCR (why the standard writes them separately):** qPCR needs a calibration curve (document efficiency, R², slope) and spans ~7 logs; dPCR is calibration-curve-free (Poisson counting), higher precision and inhibitor tolerance at low copy number, but ~4-log range/reaction and lower throughput — exactly the trade-offs your uploaded *Chlamydia* paper observed.

*Note:* clause-level wording should be checked against the purchased standard; the above is synthesised from official catalogue descriptions and worked examples, not quoted verbatim.
