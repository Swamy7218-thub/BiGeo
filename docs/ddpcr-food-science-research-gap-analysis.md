# Global Research-Gap Analysis for Novel ddPCR Research in Food Science

**A worldwide literature and research-landscape analysis, culminating in three carefully selected, publication-worthy research projects for a food molecular-analysis laboratory.**

*Prepared as a senior-researcher strategic analysis. Emphasis: food authenticity + meat/food safety + quantitative ddPCR + reference materials / validation / metrology / multiplexing.*

---

## How this analysis was produced (and a note on reference integrity)

The three uploaded papers were treated strictly as **starting material**. The analysis then went well beyond them into the **worldwide** dPCR/ddPCR literature (Europe, USA, Canada, China, Japan, Korea, Australia, India, and international metrology bodies) and into adjacent fields (clinical molecular diagnostics, metrology, GMO detection, forensics, epigenetics, gene-editing) to ask the correct novelty question:

> *Not "has this exact experiment been done in food?" but "has the underlying scientific principle been demonstrated anywhere in the world, and can it be translated into a genuinely new food-science application?"*

**Reference-integrity statement.** No references or DOIs were fabricated. Every citation corresponds to a real, locatable record. Because full-text publisher pages and the DOI resolver were not always machine-openable during compilation, DOIs are graded:
- **[verified]** — the DOI string appears literally in the located source URL (high confidence).
- **[DOI to confirm]** — the record was located (title/journal/URL/PubMed ID confirmed) but the exact DOI digits were not independently re-opened; confirm against the source before formal citation.

The three uploaded papers and the author-group's own prior work are cited from their own printed reference lists (authoritative).

---

# PART 1 — GLOBAL LITERATURE ANALYSIS

## 1.1 Analysis of the three uploaded papers

All three originate from the **ICAR–National Research Centre on Meat / National Meat Research Institute (NMRI), Hyderabad, India** — evidently the requesting laboratory. Shared operating envelope: **Bio-Rad QX200 AutoDG** platform; both **EvaGreen** and **TaqMan** chemistries; work performed in an **ISO/IEC 17025:2017-accredited** laboratory. This envelope is the single most important *feasibility filter* for the recommendations in Part 4.

**Paper A — Sahu et al. (2021),** *J. Microbiol. Methods* 190:106318. DOI 10.1016/j.mimet.2021.106318.
ddPCR vs qPCR for the zoonotic pathogen *Chlamydia psittaci* (poultry/meat-worker relevance). EvaGreen ddPCR; synthetic gene construct (locus *CPSIT_RS01985*) in pUC57-Amp. Central metrological observation: **linearising the plasmid (PstI) sharply reduced "rain"** versus the circular form (p < 0.0001), improving positive/negative droplet separation. LOD_abs 2.4 copies/20 µL vs qPCR ~38 copies; LOQ 17.8 copies (CV < 25%). Robustness probed by ±20% supermix; LOD_rel established against non-target avian background DNA; myostatin used as an amplifiability control. *Seeds:* linearised-vs-circular standard behaviour, low-copy metrology, formal LOD/LOQ/robustness per EU JRC dPCR recommendations, pathogen ddPCR inside a meat institute.

**Paper B — Vishnuraj et al. (2021),** *LWT* 140:110798. DOI 10.1016/j.lwt.2020.110798 (open access).
Detection of **giblets (offal: liver/heart/gizzard) in chicken products — an intra-species adulteration** that DNA-based methods cannot resolve because all tissues of one animal share the same genome. The solution used **tissue-specific microRNAs** (LNA primers, EvaGreen ddPCR): gizzard via gga-mir-148a-3p/-126-5p/-490-5p; heart via -218-5p/-499-3p; liver via -122-5p. Cut-offs set at (non-target mean + 2 SD); separate cut-offs for raw vs cooked; markers survived cooking. **The paper explicitly flags the absence of quantitative certified reference materials (CRMs) for tissue miRNA** as a barrier to true quantification. *Seeds:* tissue-of-origin authentication via **non-genomic markers**, the CRM gap, processing (cooking) effects on markers, EU QUID offal-labelling relevance.

**Paper C — Aravind Kumar et al. (2024),** *J. Food Compos. Anal.* 126:105879. DOI 10.1016/j.jfca.2023.105879.
First ddPCR **regression models built directly from a processed product** ("Haleem", a cooked delicacy) rather than from fresh meat/powder, to quantify buffalo substitution. TaqMan; buffalo MC1R target. Model 1: buffalo meat % → buffalo DNA (ng), R² = 0.9917. Model 2: theoretical input DNA → copies/20 µL, R² = 0.9973. A myostatin qPCR check (equal Cq across buffalo/cattle/sheep, CV ± 1.01%) was used to **justify a mass↔copy equivalence assumption**. Validated (in the group's prior work) per **ISO 20395:2019** and CAC/GL 74-2010. Market Haleem showed 10–17% buffalo mislabelled as mutton/beef/chicken. The paper notes processed products yield **low DNA → narrow dynamic range**, so raw-meat models are unsuitable for products. *Seeds:* matrix/product-specific calibration, copy↔mass conversion and its assumptions, degraded-DNA quantification, ISO 20395 as an *invoked* framework.

**The recurring pain points the group itself surfaces** (Papers B and C, reinforced by Paper A) are the richest, most feasible gap targets because the laboratory can actually execute against them:
1. **No quantitative CRMs** for meat/tissue targets (stated in B *and* C).
2. **Copy↔mass-fraction conversion rests on assumptions** (equal DNA yield across species; genome copies/cell; single- vs multi-copy targets) that are not rigorously bounded with uncertainty.
3. **Processing/degradation** narrows dynamic range and demands product-specific calibration.
4. **Linearised vs circular plasmid** standard behaviour (a copy-number-assignment metrology issue).
5. **Tissue-of-origin / intra-species adulteration** needs non-genomic markers (miRNA in B; **DNA methylation is the untried epigenetic extension**).
6. **ISO 20395:2019** is cited but has not been used as a *full experimental framework* study in food.

## 1.2 The worldwide landscape beyond the uploaded papers

**Meat species identification & absolute quantification is a saturated space.** From Floren et al. (2015, Germany) through the Shanghai group (Cai et al. 2014, 2017; Ren et al. 2017), Switzerland (Köppel et al. 2018/2019), Italy (Basanisi et al. 2020), Canada (Shehata et al. 2017) and multiple 2020–2023 Chinese studies (Chen et al. 2020 duck-in-beef; He et al. 2022 quintuplex; He et al. 2023 six-species), nearly every new paper re-derives a single-copy species assay at LOD ≈ 0.1% and LOQ ≈ 1%. **A further routine single-species or simple-duplex livestock assay is not novel.** The frontier has moved to (a) correct mass conversion, (b) higher-order multiplexing, (c) non-standard species/matrices, and (d) metrological comparability (CRMs, uncertainty, proficiency testing).

**Metrology has built the infrastructure that food has not adopted.** National metrology institutes (JRC-Geel, NIM China, KRISS, NMIJ, LGC, NIST) have established dPCR as a **primary reference measurement procedure** for SI-traceable copy-number value assignment, certified linearised-plasmid and synthetic-DNA CRMs (Corbisier et al. 2015; Dong et al. 2015; Kato et al. 2019; Liang et al. 2016), consolidated **GUM-based uncertainty frameworks** (Dube et al. 2008; Košir et al. 2017; Emslie et al. 2019; Milavec et al. 2022), and run robust **interlaboratory comparisons/proficiency testing** — but almost entirely for clinical, viral and **GMO** targets (Dobnik et al. 2018; Bogožalec Košir et al. 2017; Whale et al. 2018). **The translation of this metrology into food-authentication measurement science is largely missing.**

**Adjacent fields hold ready-to-transfer technologies.** Amplitude/probe-concentration multiplexing (McDermott et al. 2013; Dobnik et al. 2016; Whale, Huggett & Tzonev 2016) and 6-colour higher-order multiplexing (Bogožalec Košir et al. 2023) are mature in GMO/clinical work; methylation-specific ddPCR for tissue-of-origin and biological age is mature in clinical and forensic science (Lehmann-Werman et al. 2016; Moss et al. 2018; Shemer et al. 2019; Correia Dias et al. 2024) and livestock methylation biology is established (Klughammer et al. 2023; Venkatesh et al. 2023; Hayes et al. 2021); CRISPR-edit ddPCR (drop-off/ddXR) is off-the-shelf (Miyaoka et al. 2016; Watry et al. 2020). Each of these has a **thin or absent food/meat translation.**

---

# PART 2 — INVESTIGATION OF THE REQUESTED RESEARCH AREAS

Each area below reports **global status**, **food status**, and the **specific translatable gap**. Verdicts use the scale *Saturated / Well studied / Moderately explored / Emerging / Major gap.*

## 2.A Quantification-type Certified Reference Materials (CRMs)

**Global status — mature (clinical/GMO/viral).** dPCR value-assigns copy-number concentration to aqueous DNA CRMs with traceability to SI via molecular counting ÷ metrologically characterised partition volume (no calibration curve). Certified formats: **linearised plasmid** (dominant — e.g. JRC's ERM-AD623 series, Corbisier et al. 2015), **synthetic/artificial-sequence dsDNA** (NMIJ CRM 6205-a, Kato et al. 2019), **genomic DNA**, and food-safety-adjacent **plasmid CRMs** (STEC stx/fliC, Liang et al. 2016). Homogeneity/stability follow ISO Guide 35; traceability is counting→amount-of-substance.

**Food status — Emerging → Major gap.** The only clear food-authentication examples are a **duck genomic reference material** value-assigned by dPCR across eight labs (Foods 2021) and LGC's **seven-assay + MSTN-reference material** for species-ratio measurement (Foods 2023). **There is no suite of matrix-matched, %-species adulteration CRMs** (e.g., a certified "5% pork in beef, retorted" material). Every food laboratory today prepares *ad-hoc gravimetric mixtures*, which undermines the cross-lab comparability of the very quantification ddPCR is prized for.

**Translatable gap:** matrix-matched, uncertainty-budgeted, traceable **food/meat adulteration CRMs**, and species genomic copy-number RMs beyond duck.

## 2.B Plasmid quantification, copy number & interlaboratory comparison (ILC)

**Global status — mechanism well studied.** Consensus: **supercoiled/circular plasmid is under-counted by dPCR and over-counted as a qPCR standard → linearise before use** (Hou et al. 2010; Dong et al. 2016; Beinhauerova et al. 2020 — the last cited by uploaded Paper A). Mass↔copy conversion uses length(bp) × 650 g/mol/bp and Avogadro's number; genome-equivalents from haploid genome mass. dPCR-anchored ILC/PT is robust for GMO (Dobnik et al. 2018) and clinical targets (Whale et al. 2018; CCQM key comparisons K86/P154/P199/K181).
> *Correction to the brief:* CCQM-**K120** is a greenhouse-gas comparison (CO₂ in air), **not** a nucleic-acid comparison. The relevant NA comparisons are **K86 (+a/b/c), P154, P199/P199b, K181**.

**Food status — Moderately explored (GMO) / Major gap (non-GMO food).** No established dPCR ILC/PT exists for non-GMO food domains (meat %, allergen copy-number, botanical authentication). **A food-focused plasmid copy-number ILC is genuinely novel** — CCQM-P154 was metrological/clinical, not food.

## 2.C ISO 20395:2019

**ISO 20395:2019** (Biotechnology — Requirements for evaluating the performance of quantification methods for nucleic-acid target sequences — qPCR and dPCR; ISO/TC 276) is **method-agnostic and fully supports dPCR**, codifying assay design & specificity, sample quality, and validation of **precision, linearity, LOD, LOQ, trueness, robustness**, plus explicit clauses on **traceability and measurement-uncertainty**. A revision is in progress (ISO/CD 20395). Complementary: ISO 21571 (extraction), ISO 24276 (GMO framework), **ISO 22174:2024** (now covers pathogen *quantification*, not just detection), CAC/GL 74-2010, and **dMIQE 2020** (Huggett et al.).

**Food status — Moderately explored; codification gap.** The food/Codex suite (ISO 21569/21570/21571, CAC/GL 74) was written around **qPCR** and has not been updated to embed dPCR counting-based quantification or dMIQE reporting. **Opportunity:** studies that *operationalise* ISO 20395 as the experimental backbone for food methods (full parameter set + uncertainty budget), rather than merely citing it — exactly the posture uploaded Paper C gestured toward.

## 2.D ddPCR multiplexing & probe chemistry

**Global status — well studied.** **Amplitude/probe-concentration multiplexing** (same fluorophore at different concentrations → vertically-stacked clusters; McDermott et al. 2013; Dobnik et al. 2016 four-plex-in-two-channels; conceptualised in Whale, Huggett & Tzonev 2016) and **6-colour higher-order multiplexing** (QX600/Naica; Bogožalec Košir et al. 2023, seven GM soybean lines) are established, with inter-lab validation in GMO work (Bogožalec Košir et al. 2017) and 6–9-plex assays in virology/oncology.

**Food/meat status — duplex colour Moderately explored; amplitude/higher-order Emerging.** The dominant meat paradigm is **colour duplex** (one probe per channel: Cai et al. 2017; Köppel et al. 2019; Basanisi et al. 2020; Shehata et al. 2017). **Important nuance (avoids an over-claim):** amplitude multiplexing of meat species has *begun* to appear — **He et al. 2022 (quintuplex, QX200, amplitude+probe approach)** and **Xi et al. 2026 (four species in a single fluorescence channel by amplitude "barcoding" on a custom biochip)**. So "same-probe-different-concentration for meat" is **not** a blank slate.

**Translatable gap (sharpened):** an **inter-laboratory-validated, higher-order (6-colour QX600/Naica or ≥6-species amplitude) multiplex** for simultaneous multi-species meat quantification, with **formal rain/cluster-competition characterisation under skewed adulteration ratios** — none exists.

## 2.E DNA methylation + ddPCR

**Global status — Well studied → approaching saturated.** Methylation-specific ddPCR on bisulfite-converted DNA is a mature clinical tool for cfDNA **tissue-of-origin** deconvolution and cell-death monitoring (Lehmann-Werman et al. 2016; Moss et al. 2018; Shemer et al. 2019), **forensic body-fluid/tissue identification** (Forat et al. 2016), and **biological-age estimation by ddPCR** (Correia Dias et al. 2024; multiplex age ddPCR). Livestock methylation biology is established: cross-species tissue-conserved methylation (Klughammer et al. 2023, 580 species), **production-system "epigenetic fingerprints"** in chicken/salmon/shrimp (Venkatesh et al. 2023), and **cattle epigenetic clocks** (Hayes et al. 2021).

**Food/meat status — Major gap / Underexplored.** The enabling components each exist *separately*, but **methylation-specific ddPCR has never been applied to meat** for tissue-of-origin (offal vs muscle), fresh-vs-frozen-thawed, heat/processing history, or species. Established → Emerging → **Underexplored → Potentially novel** applies cleanly here.
- *Feasibility caveat:* cooking severely fragments DNA and bisulfite conversion fragments it further — a **heat-history-by-methylation** assay is the riskiest target. **Offal-vs-muscle tissue-of-origin** and **fresh-vs-frozen-thawed** are the defensible novelty targets.

## 2.F CRISPR: cut vs uncut DNA using ddPCR

**Global status — Well studied / crowded.** Drop-off/dual-probe ddPCR (Miyaoka et al. 2016), large-excision reporters (**ddXR**, Watry et al. 2020), and large-deletion quantification (Park et al. 2022) are an off-the-shelf toolkit for edited-vs-WT, indels, and copy-number changes.

**Food status — Emerging.** Crops: a few methods exist (ddPCR gene-edited rice, Fraiture et al. 2022; qPCR canola, Chhalliyil et al. 2020). **Gene-edited livestock: a single ddPCR precedent** (Wang et al. 2025, MSTN-edited cattle). **Hard limitation (ENGL/JRC EUR 31521, 2023):** for edits carrying **no foreign DNA**, ddPCR can detect the *sequence variant* but **cannot prove genome-editing origin** versus a naturally occurring or conventionally bred identical mutation. This interpretation ceiling — not mere crowding — is why this direction is *not* recommended as a flagship for a food-authentication laboratory.

## 2.G Meat authenticity, adulteration & food fraud

**Status — Saturated (common-livestock single/duplex assays); Emerging for the frontier.** See §1.2. **Do not** propose another routine species-specific assay. Live sub-gaps: standardized cross-lab comparability (→ Area A/B), correct copy→mass conversion (→ below), degraded/processed-DNA quantification, gelatin/collagen and non-standard species, and higher-order multiplex (→ Area D).

**The copy→mass conversion problem (Moderately explored; the central methodological bottleneck).** ddPCR counts copies, but species differ in cells/gram, genome size, and (for mtDNA) copies/cell; tissue type (muscle vs offal/fat), age, and processing shift the copy↔mass relationship. Competing, non-interoperable strategies: empirical regression (Cai et al. 2014; Chen et al. 2020; uploaded Paper C), fixed per-species constants (He et al. 2023), and internal/cross-species reference genes (turkey reference; MSTN single-copy reference, LGC 2023; recombinant-plasmid IC, Shehata et al. 2017). **No agreed, matrix-independent conversion with a formal uncertainty budget exists** — a genuinely fillable gap.

## 2.H Meat safety (foodborne pathogens)

**Status — Well studied and fast-growing; viability & multiplex Emerging.** ddPCR pathogen quantification is established for *Salmonella* (Öz et al. 2020; Foods 2025), *Listeria*, STEC (multiple 2018–2022), *Campylobacter* (Peruzy et al. 2020), and *Vibrio*. **PMA/PMAxx viability-ddPCR** (live-vs-dead, VBNC) is emerging (VBNC *Salmonella* 2024; viable *Listeria* 2025 preprint) but validated **mostly for single organisms in simple matrices**. **Gaps:** validated PMA-ddPCR viability in *real, fatty, heat-damaged meat* with inhibitor/recovery controls; ≥4-plex panels on *naturally* contaminated meat; consistent internal amplification controls/matrix-inhibition correction; linkage of ddPCR counts to regulatory limits.

## 2.I Meat quality, spoilage & traceability

**Status — Major gap for ddPCR.** Spoilage/freshness/microbiome work is dominated by qPCR, 16S metabarcoding and metagenomics. Genuine ddPCR examples are scarce (a *Pseudomonas aeruginosa/fragi* duplex, Foods 2024; *Listeria* biofilm quantification, AMB Express 2020). **Wide-open niches:** a ddPCR **freshness index** validated against TVC/TVB-N; **host-DNA : microbial-DNA ratio** as a spoilage/traceability metric; absolute loads of specific spoilage organisms (Brochothrix, Photobacterium, LAB, Enterobacteriaceae) over shelf-life.

---

# PART 3 — CROSS-DISCIPLINARY NOVELTY SCAN

The formula: **technology exists (elsewhere) + biological/analytical problem exists (in meat) + food application missing = opportunity.**

| Cross-disciplinary combination | Exists where (verified) | Translated to meat? | Opportunity |
|---|---|---|---|
| ddPCR + **CRM / metrology / SI traceability** | JRC, NIM, NMIJ, LGC, NIST (Corbisier 2015; Milavec 2022) | Almost no (duck RM; LGC RM) | **High — flagship** |
| ddPCR + **measurement uncertainty (GUM)** | Clinical/GMO (Košir 2017; Emslie 2019) | Not for food matrices | **High** |
| ddPCR + **interlaboratory comparison / PT** | GMO, clinical (Dobnik 2018; Whale 2018) | Not for non-GMO food | **High** |
| ddPCR + **DNA methylation (tissue-of-origin)** | Clinical/forensic (Moss 2018; Shemer 2019) | **Never** | **High — flagship** |
| ddPCR + **DNA-integrity / degradation index** | Forensics (triplex degradation-rate, 2025) | Near-absent for food | **High — flagship** |
| ddPCR + **amplitude / 6-colour multiplex** | GMO/clinical (Dobnik 2016; Bogožalec Košir 2023) | Emerging (He 2022; Xi 2026) | Medium (novelty partly used) |
| ddPCR + **PMA viability** | Microbiology (VBNC 2024) | Thin in real meat | Medium |
| ddPCR + **CRISPR / gene-editing** | Genome-editing (Miyaoka 2016) | 1 livestock paper (Wang 2025) | Low for food (cannot prove GE origin — EUR 31521) |
| ddPCR + **spoilage/freshness/traceability** | qPCR/metagenomics dominate | Near-absent | Medium–High |

---

# PART 4 — GLOBAL NOVELTY MATRIX

*Scale: Saturated / Well studied / Moderately explored / Emerging / Major research gap.*

| Topic | Global Research Status | Food Research Status | Saturation (food) | Major Gap | Potential Novelty |
|---|---|---|---|---|---|
| **CRM** (copy-number/matrix) | Well studied | Emerging | Low | Matrix-matched %-species meat CRMs | **Very high** |
| **Plasmid certification** (linear vs supercoiled) | Well studied | Emerging | Low | Food-domain copy-number ILC | High |
| **ILC / proficiency testing** | Well studied (GMO/clinical) | Major research gap (non-GMO food) | Very low | No meat-authenticity dPCR PT scheme | **Very high** |
| **ISO 20395** | Well studied (standard exists) | Moderately explored | Low | Operationalised (not cited) framework + uncertainty | High |
| **Multiplex ddPCR** | Well studied | Emerging | Low–Medium | Inter-lab-validated ≥6-species / 6-colour meat panel | Medium–High |
| **DNA methylation** | Well studied → saturated | Major research gap | Very low | Methylation-ddPCR tissue-of-origin / fresh-vs-thawed | **Very high** |
| **CRISPR** | Well studied → saturated | Emerging | Very low | Gene-edited food animals (bounded by "cannot prove GE origin") | Medium (capped) |
| **Meat authenticity** | Saturated (single/duplex) | Well studied | **High** | Copy→mass conversion + comparability | Medium (only if methodological) |
| **Meat safety** | Well studied | Moderately explored | Medium | Viability (PMA) multiplex in real meat | Medium |
| **Meat quality/spoilage** | Emerging (ddPCR) | Major research gap | Very low | ddPCR freshness/host:microbe index | Medium–High |

---

# PART 5 — TEN INITIAL RESEARCH IDEAS (then narrowed)

For each: *problem · existing global research · food gap · exact novelty · why ddPCR · experimental complexity · expected publication strength.*

**Idea 1 — Matrix-matched %-species adulteration CRMs + GUM uncertainty budget for meat ddPCR.**
Problem: no traceable reference materials for meat adulteration quantification. Global: JRC/NIM/LGC CRM methods (Corbisier 2015; LGC 2023) + duck RM (2021). Food gap: no matrix-matched %-species CRM. Novelty: first certified "X% species-in-species (raw + retorted)" materials with full uncertainty/traceability. Why ddPCR: calibration-curve-free counting = the reference procedure. Complexity: Medium. Publication: **Very high** (*Anal. Bioanal. Chem.*, *Food Chem.*). → **SELECT (Project 1 core).**

**Idea 2 — Standardized, uncertainty-quantified copy→mass conversion for meat tissues.**
Problem: species/tissue/processing shift the copy↔mass relationship; assumptions unbounded. Global: competing models (Cai 2014; He 2023; LGC 2023). Food gap: no consensus + no uncertainty budget; genome/mtDNA copies-per-cell rarely measured for meat tissues. Novelty: empirical per-tissue genome- and mtDNA-copy determination feeding a GUM conversion. Why ddPCR: absolute counting enables direct ratio metrology. Complexity: Medium. Publication: High. → **SELECT (folded as Project 1, Objective 3).**

**Idea 3 — Methylation-specific ddPCR for offal/organ-vs-skeletal-muscle tissue-of-origin authentication.**
Problem: intra-species offal substitution is invisible to DNA (uploaded Paper B). Global: methylation-ddPCR tissue-of-origin mature clinically (Moss 2018; Shemer 2019); livestock tissue-specific methylation established (Klughammer 2023). Food gap: never applied to meat. Novelty: first epigenetic (DNA-level, not RNA) tissue-of-origin ddPCR for meat; complements the group's miRNA assay with a stable DNA target. Why ddPCR: absolute methylated-copy fraction, no standard curve, robust to inhibitors. Complexity: Medium–High (bisulfite + marker discovery). Publication: **Very high** (*Food Chem.*, *npj Sci. Food*). → **SELECT (Project 2).**

**Idea 4 — Methylation-ddPCR discrimination of fresh vs frozen-thawed / storage history.**
Problem: fresh meat relabelled from thawed is common fraud; no molecular test. Global: freeze-thaw methylation-stability data (mixed). Food gap: untested by ddPCR. Novelty: moderate; **feasibility risk** (methylation may be too stable to freezing to give signal). Publication: Medium. → **Fold as a secondary objective / exploratory arm of Project 2, honestly flagged.**

**Idea 5 — A ddPCR DNA-integrity ("processing-history") index + matrix-corrected mass-fraction quantification in thermally processed meat.**
Problem: cooking/retorting fragments DNA, biasing quantification (uploaded Paper C's narrow dynamic range). Global: forensic triplex "degradation-rate" ddPCR (2025); GMO heat-treated ddPCR (2020). Food gap: no ddPCR DNA-integrity index for canned/retorted meat, and degradation's effect on copy→mass is unquantified. Novelty: a multi-amplicon integrity index that both *classifies processing severity* and *corrects the adulteration estimate*. Why ddPCR: partition-level robustness to inhibitors + absolute short/long-amplicon ratios. Complexity: Medium. Publication: High (*Food Control*, *Food Chem.*). → **SELECT (Project 3).**

**Idea 6 — Inter-lab-validated higher-order (6-colour/≥6-species) amplitude-multiplex meat panel.**
Problem: single-species assays don't scale; colour duplex dominates. Global: 6-colour GMO (Bogožalec Košir 2023); meat amplitude multiplex begun (He 2022; Xi 2026). Food gap: no inter-lab-validated ≥6-species panel with rain/cluster metrology under skewed ratios. Novelty: **partly pre-empted** — must be framed as validation/higher-order. Why ddPCR: partitioning enables amplitude coding. Complexity: High (may need QX600/Naica). Publication: High. → **Runner-up.**

**Idea 7 — Multiplex PMA/viability-ddPCR for viable foodborne pathogens in real meat matrices.**
Problem: culture is slow; qPCR counts dead cells. Global: PMA-ddPCR emerging (VBNC 2024). Food gap: few validations in real fatty/heat-damaged meat with recovery controls. Novelty: Medium. Why ddPCR: absolute viable counts + inhibitor tolerance. Complexity: Medium–High (BSL-2). Publication: Medium–High. → **Runner-up (strong safety pivot).**

**Idea 8 — ddPCR meat-freshness / host:microbe-ratio spoilage index over shelf-life.**
Problem: no molecular absolute freshness metric. Global: ddPCR spoilage scarce (Foods 2024). Food gap: major. Novelty: High but further from the group's authentication core. Complexity: Medium. Publication: Medium–High. → **Runner-up.**

**Idea 9 — Event-specific ddPCR panel for gene-edited food animals beyond MSTN cattle.**
Problem: gene-edited livestock entering food chains. Global: Wang 2025 (sole precedent); toolkit mature. Food gap: real but **capped by EUR 31521 (cannot prove GE origin without foreign DNA)** and low feasibility for this lab. → **ELIMINATE as flagship.**

**Idea 10 — Food-domain plasmid copy-number ILC (linearised vs supercoiled) across Indian food labs.**
Problem: food labs build qPCR plasmid standards without dPCR verification/topology control. Global: mechanism known (Beinhauerova 2020); GMO ILCs exist. Food gap: no food-domain copy-number ILC. Novelty: High as a national metrology study. → **Fold into Project 1 (Objective 4 / dissemination).**

**Elimination logic:** #9 removed (interpretation ceiling + feasibility). #2, #4, #10 absorbed into the three flagships (stronger as objectives than as standalone thin papers). #6, #7, #8 retained as **runners-up** — each is publishable, but each is either partly pre-empted (#6) or further from the laboratory's demonstrated authentication strength (#7, #8).

---

# PART 6 — THE TOP THREE SELECTED PROJECTS

**Weighted ranking** (Novelty 25 · Publication 20 · Feasibility 15 · Food-industry 10 · Regulatory 10 · ddPCR-advantage 10 · Future-research 10):

| Project | Nov. /25 | Pub. /20 | Feas. /15 | Ind. /10 | Reg. /10 | ddPCR /10 | Future /10 | **Total** |
|---|---|---|---|---|---|---|---|---|
| **P1 — Meat-authenticity CRM + uncertainty + national ILC** | 23 | 19 | 14 | 9 | 10 | 10 | 10 | **95** |
| **P2 — Methylation-ddPCR tissue-of-origin (offal vs muscle)** | 24 | 19 | 11 | 9 | 9 | 9 | 9 | **90** |
| **P3 — ddPCR DNA-integrity index + processing-corrected quantification** | 20 | 17 | 14 | 9 | 8 | 10 | 8 | **86** |

The three are **complementary and mutually reinforcing**: P1 supplies the reference materials and uncertainty framework that P2 and P3 both consume; P3's integrity index feeds P1's processed-matrix CRMs; P2 extends the group's tissue-origin line into DNA-stable epigenetic markers. Together they form a coherent 3–4-year *"quantitative and metrologically-defensible meat authentication"* programme.

---

## PROJECT 1 — Matrix-matched certified reference materials, measurement-uncertainty framework, and a national interlaboratory comparison for quantitative meat-species ddPCR

**1. Proposed scientific title.** *"Development and interlaboratory validation of matrix-matched certified reference materials and an ISO 20395/GUM-based measurement-uncertainty framework for droplet digital PCR quantification of meat-species adulteration."*

**2. One-sentence concept.** Create the first traceable, uncertainty-budgeted, matrix-matched %-species reference materials (raw and thermally processed) for meat adulteration and prove their fitness through a multi-laboratory ddPCR comparison, converting today's ad-hoc gravimetric mixtures into metrologically defensible calibrants.

**3. Global research status.** dPCR is an accepted primary reference procedure for SI-traceable copy-number CRMs (Corbisier et al. 2015; Dong et al. 2015; Kato et al. 2019; Milavec et al. 2022); GMO dPCR ILC/PT is mature (Dobnik et al. 2018; Bogožalec Košir et al. 2017). In food authentication only a **duck genomic RM** (Foods 2021) and LGC's **species-ratio RM** (Foods 2023) exist; **no matrix-matched %-species adulteration CRM and no meat-authenticity dPCR PT scheme exist anywhere.**

**4. Exact research gap.** (i) Absence of certified "X% species-A-in-species-B" materials in real matrices (raw + retorted); (ii) no consensus, uncertainty-bounded copy→mass conversion for meat tissues; (iii) no food-domain plasmid copy-number ILC / meat-authenticity PT scheme.

**5. Why genuinely novel.** It is the *first* translation of NMI-grade CRM/uncertainty/ILC methodology into meat authenticity — not a new assay but new **measurement infrastructure**. Uniquely feasible for this laboratory because of its ISO/IEC 17025 accreditation and existing in-house traceable QCMs (uploaded Paper C).

**6. Hypothesis.** Gravimetrically formulated, homogeneity- and stability-characterised meat mixtures can be value-assigned in SI-traceable copy-number and mass-fraction terms by ddPCR with an expanded uncertainty ≤ 15% (k=2) that remains valid after thermal processing, and independent laboratories will agree within the assigned uncertainty.

**7. Objectives.**
- O1. Produce candidate matrix RMs: binary and ternary mixtures (e.g., buffalo/cattle/sheep/pork/chicken) at 0.5, 1, 2, 5, 10, 25, 50% (w/w), each as **raw** and **retorted (121 °C/15 min)** sublots.
- O2. Assess **homogeneity** (between/within-unit, ISO Guide 35) and **stability** (isochronous, 4 °C/25 °C/37 °C over 12 months).
- O3. Value-assign copy-number and derive **mass-fraction** via an empirically determined, tissue-specific copy→mass model (genome and mtDNA copies-per-cell measured directly); build a full **GUM uncertainty budget** (Poisson counting, partition-volume variability, extraction yield, dilution/gravimetry, inhibition).
- O4. Run a **national ILC** (8–12 accredited/food-testing labs), assign a reference value and pool uncertainty, and score laboratory performance.

**8. Detailed experimental design.**
- *Sample/matrix types:* Sanger-authenticated single-species stocks → gravimetric binary/ternary mixtures; raw and retorted sublots; a linearised-plasmid copy-number calibrant per target for anchoring.
- *Number of samples:* ~7 levels × 2 processing states × ≥3 mixture systems ≈ 42 candidate materials; homogeneity ≥ 10 units × duplicate; stability 3 temperatures × 5 timepoints × duplicate.
- *DNA extraction:* CTAB (ISO 21571) + spin-column clean-up (as in uploaded Paper C), with an extraction-yield uncertainty component quantified across ≥6 replicates.
- *Target & primer/probe design:* single-copy nuclear species targets (avoid mtDNA for quantification, per Floren 2015) plus a **single-copy cross-species reference (MSTN)** for ratio anchoring (LGC 2023); short amplicons (<120 bp) for processed-matrix compatibility.
- *ddPCR chemistry:* TaqMan (probes) for species specificity; QX200 AutoDG; ≥12,000 accepted droplets; ≥3 positive-droplet call; NTC + linearised-plasmid positive control each run.
- *Controls/replicates:* ISO 20395 parameter set; ≥3 technical + ≥3 biological replicates; inhibition control via dilution linearity.
- *Dilution strategy:* dilute to the reliable-confidence-interval window (Lievens-style); confirm linearity across the working range.
- *Calibration/RM:* linearised-plasmid anchor value-assigned in-house and cross-checked against a commercial genomic RM where available.
- *Data analysis:* QuantaSoft copy-number export → mass-fraction via the O3 model.

**9. Validation strategy.** Full ISO 20395: **specificity** (in-silico + cross-reactivity panel), **selectivity** (background non-target DNA), **LOD/LOQ** (probit / ≥95% detection; CV<25%), **linearity/dynamic range**, **trueness** (recovery vs gravimetric value), **precision** (repeatability + intermediate reproducibility; ILC reproducibility), **robustness** (±20% supermix as in uploaded Paper A; annealing ±1 °C), **inhibition** (spike/recovery), and **measurement uncertainty** (documented GUM budget).

**10. Statistical analysis.** Homogeneity/stability by **one-way ANOVA** (between-unit) and **linear-regression trend testing** (stability slope vs zero); reference-value assignment by **weighted mean / DerSimonian–Laird random-effects** across labs; **En-scores and z-scores** for laboratory performance (ISO 13528); uncertainty propagation by GUM (with Monte-Carlo cross-check, GUM Supplement 1); mixed-effects models for variance components; Bland–Altman and Passing–Bablok for method agreement.

**11. Expected results.** A validated suite of matrix RMs with certified copy-number and mass-fraction values and expanded uncertainties; a defensible tissue-specific copy→mass model; ILC showing inter-lab reproducibility within assigned uncertainty for most labs and flagging outliers/matrix effects; evidence that raw-meat calibration under-performs on processed matrices (quantifying uploaded Paper C's qualitative observation).

**12. Potential limitations.** Formal SI-traceable *certification* may require partnership with an NMI (e.g., CSIR-NPL India) — otherwise deliver "reference materials with characterised uncertainty" rather than legally "certified"; ILC recruitment/logistics; retorting-induced fragmentation may widen uncertainty at low levels.

**13. Estimated duration.** 30–36 months (RM production/characterisation 12–15; value assignment 6; ILC 9–12; reporting).

**14. Required resources.** QX200 AutoDG (in place); ISO 17025 lab; retort/processing facility; NABL-network partner labs; spectrophotometry; optional NMI collaboration; a statistician.

**15. Target journals.** *Analytical and Bioanalytical Chemistry*; *Food Chemistry*; *Food Control*; *Accreditation and Quality Assurance*; *Metrologia* (for the ILC).

---

## PROJECT 2 — Methylation-specific droplet digital PCR for intra-species tissue-of-origin authentication of meat (offal/organ versus skeletal muscle)

**1. Proposed scientific title.** *"Epigenetic authentication of meat: a methylation-specific droplet digital PCR assay for detecting and quantifying offal/organ substitution within a single species."*

**2. One-sentence concept.** Exploit tissue-specific DNA-methylation signatures — read directly by methylation-specific ddPCR on bisulfite-converted DNA — to detect and quantify undeclared offal (liver/heart/kidney) in skeletal-muscle meat products, a fraud that is invisible to conventional DNA testing.

**3. Global research status.** Tissue-of-origin by DNA methylation is mature in clinical (Lehmann-Werman et al. 2016; Moss et al. 2018) and forensic (Forat et al. 2016) science, with **methylation-specific ddPCR protocols established** (Shemer et al. 2019); tissue-specific methylation is conserved across animals (Klughammer et al. 2023) and documented in livestock (Venkatesh et al. 2023). **This has never been applied to meat authentication.** The requesting group solved the same fraud with tissue-specific miRNA (uploaded Paper B) — establishing both the problem and their capability.

**4. Exact research gap.** No DNA-level (epigenetic) method for intra-species tissue-of-origin in meat; the existing solution relies on RNA (miRNA), which is less stable and harder to standardise than bisulfite-read DNA.

**5. Why genuinely novel.** First union of two mature-but-separate literatures — methylation tissue-of-origin and ddPCR meat quantification — into a DNA-stable epigenetic authentication assay. It answers the *"principle demonstrated elsewhere → new food application"* test precisely.

**6. Hypothesis.** Differentially methylated regions (DMRs) distinguishing offal from skeletal muscle within a species are stable enough post-slaughter and post-cooking to yield a methylation-specific ddPCR signal whose methylated-copy fraction scales monotonically with offal inclusion down to ≤ 5% (w/w).

**7. Objectives.** (O1) Mine species-specific tissue-DMRs (offal vs muscle) from public WGBS/array data + targeted confirmation; (O2) design and optimise methylation-specific / methylation-sensitive-restriction ddPCR assays; (O3) validate on gravimetric offal-in-muscle mixtures, raw and cooked; (O4) pilot on market products; (O5, exploratory, honestly flagged as higher-risk) test whether the same platform discriminates fresh vs frozen-thawed.

**8. Detailed experimental design.**
- *Sample types:* chicken and buffalo/cattle as primary species; liver/heart/kidney/gizzard vs breast/thigh skeletal muscle; gravimetric mixtures at 1, 2, 5, 10, 25, 50%; raw + boiled (100 °C/30 min) + retorted sublots; ≥10 biological animals/species.
- *DNA extraction & bisulfite:* high-MW DNA extraction; **bisulfite conversion** with conversion-efficiency controls; a methylation-sensitive restriction-enzyme (MSRE) variant tested as a non-bisulfite alternative to preserve fragment length.
- *Target selection:* candidate DMRs prioritised by |Δβ| and conservation; validate 6–10 candidates, retain 2–3 per tissue.
- *Primer/probe design:* methylation-specific dual-probe (methylated/unmethylated) ddPCR (Shemer-style, several CpGs/amplicon); short amplicons (<100 bp) for cooked DNA.
- *ddPCR chemistry:* TaqMan duplex (FAM methylated / HEX unmethylated) → **methylated fraction**; QX200 AutoDG; NTC, fully-methylated and unmethylated bisulfite controls each run.
- *Controls/replicates:* per-tissue reference methylation; ≥3 technical × ≥3 biological; cut-offs = non-target mean + 2 SD (consistent with uploaded Paper B), separate for raw vs cooked.
- *Data analysis:* methylated fraction vs offal % regression per marker.

**9. Validation strategy.** ISO 20395-aligned: specificity (marker discriminates target tissue across species panel); selectivity (skeletal-muscle background); LOD/LOQ (lowest reliably detected/quantified offal %); precision (repeatability + intermediate reproducibility); trueness (recovery vs gravimetric); robustness (bisulfite batch, annealing ±1 °C); inhibition; measurement uncertainty (incl. bisulfite-conversion-efficiency component). Orthogonal confirmation of DMRs by targeted bisulfite sequencing on a subset.

**10. Statistical analysis.** Marker selection by moderated t-tests / **limma** on β-values with Benjamini–Hochberg FDR; discrimination by **ROC/AUC** and logistic regression with cross-validation; quantification by **weighted linear / segmented regression** (methylated fraction vs %offal) with prediction intervals; **LMM** for animal/tissue variance; agreement with the group's miRNA assay by Bland–Altman.

**11. Expected results.** A validated 2–3-marker methylation-ddPCR panel detecting offal at ≤5% in raw and cooked meat; a DNA-stable complement to miRNA authentication; demonstration (or honest negative result) on fresh-vs-thawed.

**12. Potential limitations.** Bisulfite fragments already-degraded cooked DNA (mitigated by MSRE variant + short amplicons); DMR portability across breeds/individuals must be checked; heat-history discrimination is the highest-risk arm and is scoped as exploratory.

**13. Estimated duration.** 24–30 months (marker discovery/optimisation 9–12; validation 9; market pilot 6).

**14. Required resources.** QX200 AutoDG; bisulfite kits + conversion controls; access to WGBS/array reference data; targeted bisulfite sequencing (in-house or outsourced); slaughter/processing facility (in place).

**15. Target journals.** *Food Chemistry*; *npj Science of Food*; *Food Control*; *Journal of Agricultural and Food Chemistry*; *Food Chemistry: Molecular Sciences*.

---

## PROJECT 3 — A droplet digital PCR DNA-integrity ("processing-history") index and its integration into matrix-corrected adulterant quantification in thermally processed meat

**1. Proposed scientific title.** *"A multi-amplicon droplet digital PCR DNA-integrity index for classifying thermal processing severity and correcting species mass-fraction estimates in processed meat products."*

**2. One-sentence concept.** Measure the ratio of short-, medium-, and long-amplicon copy numbers by ddPCR to derive a quantitative DNA-integrity index that both grades a product's processing severity and mathematically corrects the copy→mass conversion that degradation otherwise biases.

**3. Global research status.** ddPCR is repeatedly asserted to tolerate degraded/processed DNA (Floren 2015; Ren 2017; He 2023) but this is rarely quantified; a **forensic triplex "degradation-rate" ddPCR** (2025) and a **GMO heat-treated ddPCR/qPCR comparison** (2020) prove the multi-amplicon integrity-index principle **outside food authentication**. The requesting group directly hit the problem — processed Haleem gave low DNA and a narrow dynamic range, and raw-meat models were judged unsuitable for products (uploaded Paper C).

**4. Exact research gap.** No ddPCR DNA-integrity index exists for canned/retorted meat authenticity, and the effect of degradation on the copy→mass conversion is unquantified — so quantitative adulteration figures on processed products currently rest on an uncontrolled bias.

**5. Why genuinely novel.** Turns degradation from a nuisance into a *measured, correcting covariate*: the first food-authentication method that reports both "how processed is this?" and a processing-corrected adulteration percentage, with an uncertainty budget.

**6. Hypothesis.** The short:long amplicon copy-number ratio at a conserved single-copy locus is a monotonic function of thermal-processing severity, and incorporating this ratio as a covariate reduces the bias of ddPCR mass-fraction estimates in processed meat by a quantifiable margin.

**7. Objectives.** (O1) Design a same-locus amplicon ladder (~60/120/200/300 bp); (O2) characterise the integrity index across controlled thermal/pressure treatments and storage; (O3) model degradation's effect on species copy→mass conversion and derive a correction; (O4) validate on gravimetric processed mixtures and market products (incl. Haleem-type matrices).

**8. Detailed experimental design.**
- *Sample types:* single-species and binary species mixtures subjected to a controlled matrix of treatments — raw; boiled 100 °C (15/30/60 min); autoclaved 121 °C (15/30 min); 133 °C retort; plus frozen-storage series; and real market processed products.
- *Number of samples:* ~6 treatments × ≥3 mixtures × ≥3 levels × triplicate + ≥20 market products.
- *DNA extraction:* CTAB + clean-up (uploaded Paper C); DNA integrity cross-checked by capillary electrophoresis/TapeStation (independent reference for the ddPCR index).
- *Target/primer design:* nested/tiling primers on one conserved single-copy nuclear locus giving 4 amplicon lengths sharing a 3′ boundary; plus species targets from Project 1.
- *ddPCR chemistry:* EvaGreen (amplicon-length ladder) and/or TaqMan; QX200 AutoDG; NTC + linearised-plasmid control (linearisation rationale per uploaded Paper A).
- *Controls/replicates:* enzymatically/sonication-fragmented DNA standards of known size distribution to calibrate the index; ≥3 technical × ≥3 biological.
- *Data analysis:* integrity index = copies(long)/copies(short); regression vs processing severity and vs electrophoretic DIN.
- *Calibration/RM:* uses Project 1 materials where available (mutual reinforcement).

**9. Validation strategy.** ISO 20395-aligned for the species assays; for the index: **trueness** vs orthogonal DIN (TapeStation), **precision** (repeatability/intermediate reproducibility), **robustness** (extraction batch, ±20% supermix), **inhibition** (spice/curing-salt spikes: Maillard products, NaNO₂, collagen), LOD/LOQ of the corrected mass-fraction, and a full **uncertainty budget** with the correction term propagated.

**10. Statistical analysis.** **Nonlinear/segmented regression** and **ANCOVA** (integrity index as covariate) for the copy→mass correction; **multiple linear regression / random-forest** to predict processing class from the index; before/after bias reduction quantified by **RMSE and Bland–Altman**; treatment effects by **two-way ANOVA** with Tukey HSD; bootstrap CIs for the index.

**11. Expected results.** A calibrated, orthogonally-validated ddPCR integrity index that grades processing severity; a correction that measurably reduces mass-fraction bias in processed matrices; quantified inhibitor-robustness of ddPCR vs qPCR in real meat matrices.

**12. Potential limitations.** Very severe processing may fragment below even the short amplicon (index floor); locus copy-number assumptions must hold across species; correction is empirical and matrix-family-specific (mitigated by broad treatment matrix).

**13. Estimated duration.** 18–24 months.

**14. Required resources.** QX200 AutoDG; retort/autoclave; capillary electrophoresis / TapeStation; fragmented-DNA size standards.

**15. Target journals.** *Food Control*; *Food Chemistry*; *Food Analytical Methods*; *Analytical and Bioanalytical Chemistry*.

---

# PART 7 — KEY REFERENCES

*Grading: [verified] = DOI appears in the located source URL; [DOI to confirm] = record located, exact DOI to be re-checked against source. Uploaded papers and the group's prior work cited from their printed reference lists.*

### Uploaded papers & requesting group
1. **Sahu R, Vishnuraj MR, Srinivas Ch, et al. (2021).** Development and comparative evaluation of droplet digital PCR and quantitative PCR for the detection and quantification of *Chlamydia psittaci*. *J. Microbiol. Methods* 190:106318. DOI 10.1016/j.mimet.2021.106318 [verified]. *India (ICAR-NRC Meat).* — Linearised-vs-circular plasmid rain reduction; low-copy LOD/LOQ/robustness. Anchors P1/P3 plasmid-standard rationale.
2. **Vishnuraj MR, Devatkal S, Vaithiyanathan S, et al. (2021).** Detection of giblets in chicken meat products using microRNA markers and droplet digital PCR assay. *LWT* 140:110798. DOI 10.1016/j.lwt.2020.110798 [verified]. *India.* — The intra-species tissue-of-origin problem + the CRM gap. Direct precursor to P2.
3. **Aravind Kumar N, Vishnuraj MR, Vaithiyanathan S, et al. (2024).** First report on ddPCR-based regression models for quantifying buffalo substitution in 'Haleem'. *J. Food Compos. Anal.* 126:105879. DOI 10.1016/j.jfca.2023.105879 [verified]. *India.* — Product-specific calibration, copy↔mass assumptions, processed-matrix dynamic range. Core motivation for P1/P3.
4. **Aravind Kumar N, Vishnuraj MR, Vaithiyanathan S, et al. (2023).** Droplet digital PCR assay with linear regression models for quantification of buffalo-derived materials in different food matrices. *Food Anal. Methods* 16:615–625. DOI 10.1007/s12161-022-02441-w [verified]. *India.*

### Metrology, CRM, ISO, uncertainty
5. **Corbisier P, Pinheiro L, Mazoua S, et al. (2015).** DNA copy number concentration measured by digital and droplet digital quantitative PCR using certified reference materials. *Anal. Bioanal. Chem.* 407(7):1831–1840. DOI 10.1007/s00216-015-8458-z [verified]. *EU (JRC-IRMM)/Australia.* — ERM-AD623 linearised-plasmid CRM certification; P1 foundation.
6. **Dong L, Meng Y, Sui Z, et al. (2015).** Comparison of four digital PCR platforms for accurate quantification of DNA copy number of a certified plasmid DNA reference material. *Sci. Rep.* 5:13174. DOI 10.1038/srep13174 [verified]. *NIM China.*
7. **Kato M, et al. (2019).** Development of certified reference material NMIJ CRM 6205-a … artificial-sequence 600-bp DNA. *Anal. Bioanal. Chem.* 411. DOI 10.1007/s00216-019-01992-y [verified]. *NMIJ Japan.*
8. **Liang W, Xu L, Sui Z, et al. (2016).** Quantification of plasmid DNA reference materials for Shiga toxin-producing *E. coli* based on UV, HR-ICP-MS and digital PCR. *BMC Chemistry* 10:55. DOI 10.1186/s13065-016-0201-0 [verified]. *China.* — Food-safety-relevant plasmid CRM.
9. **ISO 20395:2019.** Biotechnology — Requirements for evaluating the performance of quantification methods for nucleic-acid target sequences — qPCR and dPCR. ISO/TC 276. iso.org/standard/67893.html. — Framework for all three projects' validation.
10. **ISO 22174:2024** (pathogen detection *and quantification*); **ISO 21571:2005**; **ISO 24276:2006**; **CAC/GL 74-2010** (Codex).
11. **Huggett JF, et al. (the dMIQE Group) (2020).** The Digital MIQE Guidelines Update (dMIQE 2020). *Clin. Chem.* 66(8):1012–1029. DOI 10.1093/clinchem/hvaa125 [DOI to confirm]. *International.*
12. **Hou Y, Zhang H, Miranda L, Lin S (2010).** Serious overestimation in quantitative PCR by circular (supercoiled) plasmid standard. *PLoS ONE* 5(3):e9545. DOI 10.1371/journal.pone.0009545 [verified]. *USA.*
13. **Dong L, et al. (2016).** Accurate quantification of supercoiled DNA by digital PCR. *Sci. Rep.* 6:24230. DOI 10.1038/srep24230 [verified]. *NIM China.*
14. **Beinhauerova M, Babak V, Bertasi B, Boniotti MB, Kralik P (2020).** Utilization of digital PCR in quantity verification of plasmid standards used in quantitative PCR. *Front. Mol. Biosci.* 7:155. DOI 10.3389/fmolb.2020.00155 [verified]. *Czech Republic/Italy.* — Cited by uploaded Paper A.
15. **Dobnik D, Demšar T, Huber I, et al. (2018).** Inter-laboratory analysis of selected genetically modified plant reference materials with digital PCR. *Anal. Bioanal. Chem.* 410(1):211–221. DOI 10.1007/s00216-017-0711-1 [verified]. *EU.* — ILC template for P1.
16. **Whale AS, De Spiegelaere W, Huggett JF, et al. (2018).** Assessment of digital PCR as a primary reference measurement procedure … *Clin. Chem.* 64(9):1296–1307. DOI 10.1373/clinchem.2017.285478 [DOI to confirm]. *UK/international.*
17. **Dube S, Qin J, Ramakrishnan R (2008).** Mathematical analysis of copy number variation … digital PCR. *PLoS ONE* 3(8):e2876. DOI 10.1371/journal.pone.0002876 [verified]. *USA.* — Poisson model for uncertainty.
18. **Košir AB, Divieto C, Pavarelli S, et al. (2017).** Droplet volume variability as a critical factor for accuracy of absolute quantification using ddPCR. *Anal. Bioanal. Chem.* 409. DOI 10.1007/s00216-017-0625-y [DOI to confirm]. *Slovenia/Italy.*
19. **Emslie KR, et al. (2019).** Droplet volume variability and impact on digital PCR copy-number concentration measurements. *Anal. Chem.* 91. DOI 10.1021/acs.analchem.8b05828 [verified]. *Australia.*
20. **Milavec M, Cleveland MH, Bae Y-K, et al. (2022).** Metrological framework to support accurate, reliable, and reproducible nucleic-acid measurements. *Anal. Bioanal. Chem.* 414(2):791–806. DOI 10.1007/s00216-021-03712-x [verified]. *International NMIs.*

### Multiplexing
21. **McDermott GP, Do D, Litterst CM, et al. (2013).** Multiplexed target detection using DNA-binding dye chemistry in droplet digital PCR. *Anal. Chem.* 85(23):11619–11627. DOI 10.1021/ac403061n [DOI to confirm]. *USA (Bio-Rad).* — Amplitude-multiplexing foundation.
22. **Dobnik D, Štebih D, Blejec A, Morisset D, Žel J (2016).** Multiplex quantification of four DNA targets in one reaction with Bio-Rad droplet digital PCR system for GMO detection. *Sci. Rep.* 6:35451. DOI 10.1038/srep35451 [verified]. *Slovenia.*
22b. **Whale AS, Huggett JF, Tzonev S (2016).** Fundamentals of multiplexing with digital PCR. *Biomol. Detect. Quantif.* 10:15–23. DOI 10.1016/j.bdq.2016.05.002 [DOI to confirm]. *UK/USA.*
23. **Bogožalec Košir A, Spilsberg B, Holst-Jensen A, Žel J, Dobnik D (2017).** Development and inter-laboratory assessment of ddPCR assays for multiplex quantification of 15 GM soybean lines. *Sci. Rep.* 7:8601. DOI 10.1038/s41598-017-09377-w [verified]. *Slovenia/Norway.*
24. **Bogožalec Košir A, Müller S, Žel J, Milavec M, Mallory AC, Dobnik D (2023).** Fast and accurate multiplex identification and quantification of seven GM soybean lines using six-colour digital PCR. *Foods* 12(22):4156. DOI 10.3390/foods12224156 [verified]. *Slovenia.*
25. **He C, et al. (2022).** Detection and quantification of adulterated beef and mutton products by multiplex droplet digital PCR. *Foods* 11(19):3034. DOI 10.3390/foods11193034 [verified]. *China.* — Quintuplex amplitude meat (bounds the multiplex-novelty claim).
26. **Xi K, Pan Z, Qiu X, et al. (2026).** Barcode-enabled detection of multiple meat adulterants by single-fluorescence-channel digital PCR on a self-digitalization biochip. *Nanotechnol. Precis. Eng.* 9(2):023010 [DOI to confirm]. *China.*

### Meat authenticity & quantification
27. **Floren C, Wiedemann I, Brenig B, Schütz E, Beck J (2015).** Species identification and quantification in meat and meat products using droplet digital PCR. *Food Chem.* 173:1054–1058. DOI 10.1016/j.foodchem.2014.10.138 [DOI to confirm]. *Germany.*
28. **Cai Y, Li X, Lv R, et al. (2014).** Quantitative analysis of pork and chicken products by droplet digital PCR. *BioMed Res. Int.* 2014:810209. DOI 10.1155/2014/810209 [verified]. *China.*
29. **Cai Y, He Y, Lv R, Chen H, Wang Q, Pan L (2017).** Detection and quantification of beef and pork materials in meat products by duplex droplet digital PCR. *PLoS ONE* 12(8):e0181949. DOI 10.1371/journal.pone.0181949 [verified]. *China.*
30. **Ren J, Deng T, Huang W, Chen Y, Ge Y (2017).** A digital PCR method for identifying and quantifying adulteration of meat species in raw and processed food. *PLoS ONE* 12(3):e0173567. DOI 10.1371/journal.pone.0173567 [verified]. *China.*
31. **Shehata HR, Li J, Chen S, et al. (2017).** ddPCR assays integrated with an internal control for quantification of bovine, porcine, chicken and turkey species in food and feed. *PLoS ONE* 12(8):e0182872. DOI 10.1371/journal.pone.0182872 [verified]. *Canada.*
32. **Köppel R, et al. (2019).** Duplex digital PCR for the determination of meat proportions of sausages containing chicken, turkey, horse, cow, pig and sheep. *Eur. Food Res. Technol.* 245:853–862. DOI 10.1007/s00217-018-3220-3 [verified]. *Switzerland.*
33. **Chen C, Chen J, Zhang Y, et al. (2020).** Quantitative detection of beef adulteration by the addition of duck meat using micro-drop digital PCR. *J. Food Quality* 2020:2843056. DOI 10.1155/2020/2843056 [verified]. *China.*
34. **He Y, Yan W, Dong L, et al. (2023).** An effective droplet digital PCR method for identifying and quantifying meat adulteration in raw and processed food of beef and lamb. *Front. Sustain. Food Syst.* 7:1180301. DOI 10.3389/fsufs.2023.1180301 [verified]. *China.*
35. **"Development of seven new dPCR animal-species assays and a reference material to support quantitative ratio measurements of food and feed products" (2023).** *Foods* 12(20):3839. DOI 10.3390/foods12203839 [verified]. *UK (LGC).* — MSTN single-copy reference; ratio RM; key for P1's normalization.
36. **"Development of a duck genomic reference material by digital PCR platforms for the detection of meat adulteration" (2021).** *Foods* 10(8):1890. DOI 10.3390/foods10081890 [verified]. *China.* — One of the only food species RMs value-assigned by dPCR.
37. **Deconinck D, Hostens K, Taverniers I, et al. (2021).** Identification and semi-quantification of Atlantic salmon in processed and mixed seafood products using ddPCR. *Food Chem. Toxicol.* 154:112329. DOI 10.1016/j.fct.2021.112329 [DOI to confirm]. *Belgium.*
38. **Duplex ddPCR for bovine and porcine gelatin in capsules (2023).** *Food Sci. Biotechnol.* 32. DOI 10.1007/s10068-022-01204-x [verified]. *Thailand.*
39. **Nanoplate dPCR for pork targeting multi-copy nuclear & mitochondrial genes (2024).** *Food Addit. Contam. A* 41(2). DOI 10.1080/19440049.2023.2298476 [verified]. — Single- vs multi-copy target trade-off relevant to P1's copy→mass model.

### Methylation
40. **Lehmann-Werman R, Neiman D, … Dor Y, et al. (2016).** Identification of tissue-specific cell death using methylation patterns of circulating DNA. *PNAS* 113(13):E1826–E1834. DOI 10.1073/pnas.1519286113 [verified]. *Israel.* — Tissue-of-origin by methylation; principle behind P2.
41. **Moss J, Magenheim J, … Dor Y, Kaplan T, et al. (2018).** Comprehensive human cell-type methylation atlas reveals origins of circulating cell-free DNA. *Nat. Commun.* 9:5068. DOI 10.1038/s41467-018-07466-6 [verified]. *Israel.*
42. **Shemer R, Magenheim J, Dor Y (2019).** Digital droplet PCR for monitoring tissue-specific cell death using DNA-methylation patterns of cfDNA. *Curr. Protoc. Mol. Biol.* 127:e90. DOI 10.1002/cpmb.90 [verified]. *Israel.* — The methylation+ddPCR protocol P2 adapts.
43. **Forat S, Huettel B, Reinhardt R, et al. (2016).** Methylation markers for the identification of body fluids and tissues from forensic trace evidence. *PLoS ONE* 11(2):e0147973. DOI 10.1371/journal.pone.0147973 [verified]. *Germany.*
44. **Klughammer J, … Bock C, et al. (2023).** Comparative analysis of genome-scale, base-resolution DNA-methylation profiles across 580 animal species. *Nat. Commun.* 14:232. DOI 10.1038/s41467-022-34828-y [verified]. *Austria.* — Conserved tissue-specific methylation across animals; supports marker portability for P2.
45. **Venkatesh G, Tönges S, … Lyko F (2023).** Context-dependent DNA-methylation signatures in animal livestock. *Environ. Epigenet.* 9(1):dvad001. DOI 10.1093/eep/dvad001 [verified]. *Germany.* — Production-system epigenetic fingerprints (chicken/salmon/shrimp).
46. **Hayes BJ, Nguyen LT, Forutan M, et al. (2021).** An epigenetic aging clock for cattle using portable sequencing technology. *Front. Genet.* 12:760450. DOI 10.3389/fgene.2021.760450 [verified]. *Australia.*
47. **Correia Dias H, et al. (2024).** Predicting age from blood by droplet digital PCR using ELOVL2, FHL2, PDE4C methylation markers. *Forensic Sci. Int.* [DOI to confirm; PubMed 38301433]. *Portugal.* — Methylation-by-ddPCR is quantitatively mature.

### CRISPR / gene-editing (context; not a flagship)
48. **Miyaoka Y, Berman JR, … Conklin BR, et al. (2016).** Systematic quantification of HDR and NHEJ reveals effects of locus, nuclease, and cell type on genome editing. *Sci. Rep.* 6:23549. DOI 10.1038/srep23549 [verified]. *USA.* — Drop-off ddPCR.
49. **Fraiture M-A, Guiderdoni E, Meunier A-C, Papazova N, Roosens NHC (2022).** ddPCR strategy to detect a gene-edited plant carrying a single variation point … *Food Control* 137:108904. DOI 10.1016/j.foodcont.2022.108904 [verified]. *Belgium/France.*
50. **Wang K, Ji Y, Peng C, et al. (2025).** A novel quantification method for gene-edited animal detection based on ddPCR (MSTN cattle). *Biology* 14(2):203. DOI 10.3390/biology14020203 [verified]. *China.* — Sole gene-edited-livestock ddPCR precedent.
51. **ENGL/JRC (2023).** Detection of food and feed plant products obtained by targeted mutagenesis and cisgenesis. **EUR 31521 EN / JRC133689.** — "Cannot distinguish a gene-edited product from a conventional one carrying the same mutation" (the interpretation ceiling).

### Safety, quality, degraded DNA
52. **Öz E, et al. (2020).** Rapid and sensitive detection of *Salmonella* spp. in raw minced meat using droplet digital PCR. *Eur. Food Res. Technol.* 246:1895–1907. DOI 10.1007/s00217-020-03531-x [verified]. *Turkey.*
53. **Peruzy MF, et al. (2020).** Detection and quantification of *Campylobacter* in foods … *Ital. J. Food Saf.* 9(2):8591. DOI 10.4081/ijfs.2020.8591 [verified]. *Italy.* — Cited by uploaded Paper A.
54. **"Droplet digital PCR assay for quantifying *Salmonella* in meat samples" (2025).** *Foods* 15(2):337. DOI 10.3390/foods15020337 [DOI to confirm]. — Recent meat viability/quantification.
55. **"An evaluation of a ddPCR assay to simultaneously detect *Pseudomonas aeruginosa* and *Pseudomonas fragi* in foods" (2024).** *Foods* 13(10):1453. DOI 10.3390/foods13101453 [verified]. *China.* — Rare ddPCR meat-spoilage example.
56. **"A novel droplet digital PCR method for assessing the quantity and quality of degraded samples" (2025).** *Forensic Sci. Int.* [DOI to confirm; PII S0379073825003627]. — Triplex "degradation-rate" index; principle behind P3.
57. **Deprez L, Corbisier P, Kortekaas A-M, et al. (2016).** Validation of a digital PCR method for quantification of DNA copy-number concentrations by using a certified reference material. *Biomol. Detect. Quantif.* 9:29–39. DOI 10.1016/j.bdq.2016.08.002 [verified]. *EU (JRC).* — Cited by uploaded Paper A; robustness/validation template.
58. **Pecoraro S, et al. (2019).** Overview and recommendations for the application of digital PCR. **EUR 29673 EN**, Publications Office of the EU. DOI 10.2760/192883 [verified]. — LOD/LOQ/validation basis used in uploaded papers.

---

# FINAL ANSWER

> **"If I were starting a new ddPCR research project today in a food molecular-analysis laboratory, which 2–4 projects would give me the best combination of genuine novelty, feasibility, scientific depth, and high-quality publication potential?"**

**Start these three — in this order — as one coherent programme:**

1. **Matrix-matched certified reference materials + a GUM measurement-uncertainty framework + a national interlaboratory comparison for quantitative meat-species ddPCR (Project 1).** This is the single strongest move. The world's metrology institutes have built SI-traceable dPCR copy-number CRM/uncertainty/ILC infrastructure for clinical, viral and GMO targets but have **not translated it to food authentication** — there is no matrix-matched %-species meat CRM and no meat-authenticity dPCR proficiency scheme anywhere. Your ISO/IEC 17025 accreditation and existing in-house traceable QCMs make you one of the few laboratories positioned to fill it. Highest novelty × feasibility × regulatory relevance.

2. **Methylation-specific ddPCR for intra-species tissue-of-origin authentication — offal/organ vs skeletal muscle (Project 2).** A clean cross-disciplinary translation: methylation tissue-of-origin ddPCR is mature in clinical/forensic science and tissue-specific methylation is established in livestock, yet the combination has **never been applied to meat.** It extends your own miRNA giblet work into a DNA-stable epigenetic marker. Highest pure novelty of the three.

3. **A ddPCR DNA-integrity ("processing-history") index that also corrects adulterant mass-fraction estimates in processed meat (Project 3).** It converts the degradation problem you hit in the Haleem study from a nuisance into a measured, correcting covariate — a genuinely new food-authentication capability with the shortest path to publication and direct synergy with Projects 1 and 3's shared materials.

**Deliberately not recommended as flagships:** yet another single-species/duplex livestock assay (saturated); a gene-edited-livestock ddPCR assay (bounded by the ENGL/JRC finding that ddPCR cannot prove genome-editing origin for edits carrying no foreign DNA). **Strong runners-up** if you want a fourth, safety-oriented direction: multiplex **PMA/viability-ddPCR for viable pathogens in real meat matrices**, or a **ddPCR meat-freshness / host:microbe-ratio spoilage index** — both address real gaps but sit slightly outside your demonstrated authentication strength.

*All novelty claims above were tested against the worldwide research landscape, not merely against the uploaded papers, following the required chain: uploaded papers → global literature → technology outside food science → research saturation → research gap → novel concept → experimental feasibility → publication potential.*
