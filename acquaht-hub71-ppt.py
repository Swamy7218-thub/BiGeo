from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt
import copy

# Brand colors
TEAL = RGBColor(0x0D, 0x94, 0x88)
DARK = RGBColor(0x0A, 0x16, 0x28)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
GRAY = RGBColor(0x6B, 0x72, 0x80)
LIGHT = RGBColor(0xF0, 0xFD, 0xFA)
RED = RGBColor(0xEF, 0x44, 0x44)
AMBER = RGBColor(0xF5, 0x9E, 0x0B)

prs = Presentation()
prs.slide_width = Inches(13.33)
prs.slide_height = Inches(7.5)

blank_layout = prs.slide_layouts[6]

def add_slide():
    return prs.slides.add_slide(blank_layout)

def bg(slide, color):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color

def box(slide, l, t, w, h, color, alpha=None):
    shape = slide.shapes.add_shape(1, Inches(l), Inches(t), Inches(w), Inches(h))
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    return shape

def txt(slide, text, l, t, w, h, size=18, bold=False, color=WHITE, align=PP_ALIGN.LEFT, wrap=True):
    txb = slide.shapes.add_textbox(Inches(l), Inches(t), Inches(w), Inches(h))
    tf = txb.text_frame
    tf.word_wrap = wrap
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    return txb

def label(slide, text, l, t):
    txb = slide.shapes.add_textbox(Inches(l), Inches(t), Inches(4), Inches(0.3))
    tf = txb.text_frame
    p = tf.paragraphs[0]
    run = p.add_run()
    run.text = text.upper()
    run.font.size = Pt(8)
    run.font.bold = True
    run.font.color.rgb = TEAL

def stat_block(slide, num, label_text, l, t, w=2.8, light=False):
    box(slide, l, t, w, 1.3, LIGHT if light else RGBColor(0x11, 0x5e, 0x59))
    txt(slide, num, l+0.15, t+0.08, w-0.3, 0.7, size=28, bold=True, color=DARK if light else TEAL)
    txt(slide, label_text, l+0.15, t+0.75, w-0.3, 0.45, size=9, color=GRAY if light else RGBColor(0xCC,0xFB,0xF1))

# ─── SLIDE 1: COVER ───────────────────────────────────────────────────────────
s1 = add_slide()
bg(s1, DARK)
box(s1, 0, 0, 13.33, 0.08, TEAL)
box(s1, 0, 7.42, 13.33, 0.08, TEAL)

txt(s1, "CLIMATE-TECH  ·  WATER INNOVATION  ·  INDIA", 0.6, 0.4, 12, 0.35, size=9, bold=True, color=TEAL)
txt(s1, "AcquaHT Labs", 0.6, 0.9, 10, 1.4, size=64, bold=True, color=WHITE)
txt(s1, "Making Water From Air", 0.6, 2.35, 10, 0.7, size=28, bold=False, color=RGBColor(0x99,0xF6,0xE4))
txt(s1, "Solar-powered Atmospheric Water Generators for a water-scarce world — starting with India.", 0.6, 3.1, 9, 0.8, size=16, color=GRAY)

# Key numbers row
for i, (n, l) in enumerate([("163M","Indians lack safe water"),("40%","less energy than rivals"),("₹2/L","delivered cost"),("$15B","market by 2030")]):
    stat_block(s1, n, l, 0.6 + i*3.15, 4.2, w=2.9)

txt(s1, "Swamynathan Jerra — Founder & CEO  |  admin@acquahtlabs.in  |  acquahtlabs.in", 0.6, 6.9, 12, 0.4, size=10, color=GRAY)
txt(s1, "Hub71+ ClimateTech Application  ·  2025", 9.5, 6.9, 3.5, 0.4, size=10, color=TEAL, align=PP_ALIGN.RIGHT)

# ─── SLIDE 2: PROBLEM ─────────────────────────────────────────────────────────
s2 = add_slide()
bg(s2, RGBColor(0xFF,0xFF,0xFF))
box(s2, 0, 0, 0.08, 7.5, TEAL)

label(s2, "The Problem", 0.3, 0.3)
txt(s2, "The water crisis is here. Now.", 0.3, 0.6, 8, 1.0, size=32, bold=True, color=DARK)
txt(s2, "2.1 billion people cannot access safe drinking water today. Every existing solution is making it worse.", 0.3, 1.65, 7.5, 0.7, size=14, color=GRAY)

crises = [
    ("2.1B", "people lack safe\ndrinking water globally", "WHO/UNICEF 2023"),
    ("163M", "Indians drink contaminated\nwater daily", "UNICEF India"),
    ("40%", "global water deficit\nprojected by 2030", "UN Water"),
    ("21", "Indian cities face\ngroundwater depletion", "NITI Aayog 2030"),
]
for i, (n, l, src) in enumerate(crises):
    x = 0.3 + i * 3.1
    box(s2, x, 2.55, 2.85, 2.2, DARK)
    txt(s2, n, x+0.2, 2.65, 2.5, 0.9, size=36, bold=True, color=TEAL)
    txt(s2, l, x+0.2, 3.5, 2.5, 0.7, size=10, color=WHITE)
    txt(s2, src, x+0.2, 4.2, 2.5, 0.4, size=8, color=GRAY)

problems = [
    ("Piped Infrastructure", "38% of rural India has no last-mile network. ₹2–5L per household to connect."),
    ("Bottled Water", "240,000 nanoplastics per litre. ₹15–20/L cost. Supply fails during floods."),
    ("Conventional AWGs", "500–600 Wh/L energy draw. Fails below 50% RH. No IoT. No service network."),
    ("Borewell / RO", "Groundwater refills in 75,000 years. 21 cities projected dry by 2030."),
]
txt(s2, "Every existing solution has a fatal flaw:", 0.3, 5.0, 12, 0.35, size=11, bold=True, color=DARK)
for i, (title, desc) in enumerate(problems):
    x = 0.3 + i * 3.1
    box(s2, x, 5.4, 2.85, 1.7, RGBColor(0xFE,0xF2,0xF2))
    txt(s2, "✕  " + title, x+0.15, 5.5, 2.6, 0.35, size=9, bold=True, color=RED)
    txt(s2, desc, x+0.15, 5.85, 2.6, 1.1, size=8, color=GRAY)

# ─── SLIDE 3: SOLUTION ────────────────────────────────────────────────────────
s3 = add_slide()
bg(s3, RGBColor(0x13,0x4E,0x4A))
box(s3, 0, 0, 13.33, 0.06, TEAL)

label(s3, "The Solution", 0.5, 0.25)
txt(s3, "We pull clean water directly from air.", 0.5, 0.55, 9, 0.9, size=34, bold=True, color=WHITE)
txt(s3, "No pipes. No plastic. No groundwater. Just solar energy and atmospheric humidity.", 0.5, 1.5, 8.5, 0.5, size=14, color=RGBColor(0x99,0xF6,0xE4))

steps = [
    ("01", "Air Intake & Filtration", "Pre-filters remove dust, bacteria, pollen, VOCs. Works at 30–95% RH, 10–45°C."),
    ("02", "Condensation Cycle", "Refrigeration cools air below dew point. COP up to 4.0 L/kWh — 40% better than average."),
    ("03", "Multi-Stage Purification", "Sediment → Carbon → RO → UF → Mineral → Ozone. Exceeds WHO & BIS standards."),
    ("04", "Storage & Delivery", "Food-grade SS304 tank. Biodegradable sugarcane-pulp bottles. Zero nanoplastics."),
    ("05", "IoT Smart Monitoring", "ESP32 cloud dashboard. Real-time TDS, RH, water level, fault alerts. 60% lower maintenance cost."),
]
for i, (num, title, desc) in enumerate(steps):
    y = 2.25 + i * 0.95
    txt(s3, num, 0.5, y, 0.5, 0.5, size=11, bold=True, color=TEAL)
    txt(s3, title, 1.05, y, 3.2, 0.35, size=11, bold=True, color=WHITE)
    txt(s3, desc, 1.05, y+0.35, 5.5, 0.5, size=9, color=RGBColor(0xCC,0xFB,0xF1))

# Tech edge panel
box(s3, 7.3, 2.0, 5.7, 5.1, RGBColor(0x0F,0x76,0x6E))
txt(s3, "TECHNOLOGY EDGE", 7.6, 2.15, 5, 0.3, size=8, bold=True, color=TEAL)
edges = [
    ("≤260 Wh/L", "vs. 500–600 Wh/L industry average"),
    ("4.0 L/kWh", "COP — best-in-class condensation"),
    ("30% RH", "lowest operating humidity in India"),
    ("221 L/day", "max output per unit"),
    ("₹2–4/L", "delivered water cost"),
]
for i, (val, desc) in enumerate(edges):
    y = 2.55 + i * 0.9
    txt(s3, val, 7.6, y, 2.5, 0.45, size=20, bold=True, color=TEAL)
    txt(s3, desc, 7.6, y+0.42, 5.2, 0.35, size=9, color=RGBColor(0xCC,0xFB,0xF1))
    if i < 4:
        box(s3, 7.6, y+0.82, 5.0, 0.02, RGBColor(0x11,0x5E,0x59))

txt(s3, "Key moat: Only Indian AWG operating at 30% RH with solar-hybrid power — covers 60% of target geography", 7.6, 6.75, 5.2, 0.55, size=8, color=RGBColor(0x5E,0xEA,0xD4))

# ─── SLIDE 4: PRODUCTS ────────────────────────────────────────────────────────
s4 = add_slide()
bg(s4, RGBColor(0xFF,0xFF,0xFF))
box(s4, 0, 0, 0.08, 7.5, TEAL)

label(s4, "Products", 0.3, 0.3)
txt(s4, "Three products. One platform. Every segment.", 0.3, 0.6, 10, 0.7, size=28, bold=True, color=DARK)
txt(s4, "All models: Wi-Fi control · Auto-defrost · IP54 rated · Filter replacement every 3–6 months", 0.3, 1.35, 12, 0.35, size=10, color=GRAY)

products = [
    ("AcquaHT-80", "HOUSEHOLDS & CLINICS", "80 L/day", "5 kW", "₹2.8L", "Rural families · PHCs · NGO kiosks", False),
    ("AcquaHT-160", "COMMERCIAL & SCHOOLS", "150 L/day", "~9 kW", "₹3.2L", "Schools · Hotels · Corporate campuses", True),
    ("AcquaHT-240", "INDUSTRIAL & GOVT", "250 L/day", "~15 kW", "₹3.5L", "Municipalities · Military · Industry", False),
]
for i, (model, tier, output, power, price, seg, highlight) in enumerate(products):
    x = 0.3 + i * 4.2
    c = TEAL if highlight else RGBColor(0xF9,0xFA,0xFB)
    tc = WHITE if highlight else DARK
    gc = WHITE if highlight else GRAY
    box(s4, x, 1.85, 3.9, 4.8, c)
    if highlight:
        txt(s4, "★ MOST POPULAR", x+1.1, 1.9, 2, 0.3, size=7, bold=True, color=WHITE)
    txt(s4, tier, x+0.2, 2.2, 3.5, 0.3, size=7, bold=True, color=RGBColor(0xCC,0xFB,0xF1) if highlight else GRAY)
    txt(s4, model, x+0.2, 2.5, 3.5, 0.6, size=26, bold=True, color=tc)
    for j, (k, v) in enumerate([("Daily Output", output), ("Power Draw", power), ("Unit Price", price)]):
        bx = x + 0.2 + j*1.2
        box(s4, bx, 3.2, 1.1, 0.9, RGBColor(0x0F,0x76,0x6E) if highlight else RGBColor(0xF0,0xFD,0xFA))
        txt(s4, v, bx+0.07, 3.25, 1.0, 0.4, size=12, bold=True, color=WHITE if highlight else TEAL)
        txt(s4, k, bx+0.07, 3.6, 1.0, 0.3, size=7, color=RGBColor(0xCC,0xFB,0xF1) if highlight else GRAY)
    txt(s4, "Target segments:", x+0.2, 4.3, 3.5, 0.3, size=8, bold=True, color=gc)
    txt(s4, seg, x+0.2, 4.6, 3.5, 0.7, size=9, color=gc)
    txt(s4, "4.0 L/kWh efficiency", x+0.2, 5.4, 3.5, 0.3, size=9, bold=True, color=RGBColor(0x99,0xF6,0xE4) if highlight else TEAL)
    txt(s4, "Operating range 10–45°C · IP54 rated", x+0.2, 5.75, 3.5, 0.3, size=8, color=gc)

txt(s4, "Unit Economics (AcquaHT-80): COGS ~₹2.0L  ·  ASP ₹2.8–3.5L  ·  Gross Margin 28–32%  ·  Customer payback: 18–24 months vs. bottled water", 0.3, 7.0, 12.5, 0.35, size=9, bold=True, color=TEAL)

# ─── SLIDE 5: MARKET ──────────────────────────────────────────────────────────
s5 = add_slide()
bg(s5, DARK)
box(s5, 0, 0, 13.33, 0.06, TEAL)

label(s5, "Market Opportunity", 0.5, 0.25)
txt(s5, "India First. Then the World.", 0.5, 0.55, 9, 0.8, size=32, bold=True, color=WHITE)

markets = [
    ("TAM", "$15.3B", "Global AWG Market by 2030\n19.2% CAGR — Spherical Insights"),
    ("SAM", "$2.8B", "India AWG Addressable Market\nCoastal + semi-arid priority states"),
    ("SOM", "₹47Cr", "3-Year Revenue Target FY2028\n500 units × avg ₹3.1L/unit"),
]
for i, (label_t, num, desc) in enumerate(markets):
    x = 0.5 + i * 4.1
    box(s5, x, 1.6, 3.7, 2.5, RGBColor(0x0D,0x94,0x88) if i==2 else RGBColor(0x11,0x5E,0x59))
    txt(s5, label_t, x+0.2, 1.7, 1, 0.35, size=10, bold=True, color=TEAL)
    txt(s5, num, x+0.2, 2.05, 3.3, 0.8, size=34, bold=True, color=WHITE)
    txt(s5, desc, x+0.2, 2.85, 3.3, 0.9, size=9, color=RGBColor(0xCC,0xFB,0xF1))

txt(s5, "India Revenue by Segment — FY2028 Target", 0.5, 4.3, 6, 0.35, size=11, bold=True, color=TEAL)
segs = [("Government / Municipalities", "35%", 0), ("Hospitality (Hotels / Resorts)", "28%", 1), ("NGO / Social Sector", "20%", 2), ("Commercial / Industrial", "17%", 3)]
for i, (seg, pct, _) in enumerate(segs):
    y = 4.75 + i * 0.55
    w = float(pct.replace('%','')) / 100 * 5.5
    box(s5, 0.5, y, w, 0.38, TEAL)
    txt(s5, pct + "  " + seg, 0.5, y+0.04, 6, 0.3, size=9, color=WHITE)

txt(s5, "Why MENA & Abu Dhabi:", 7.5, 4.3, 5.5, 0.35, size=11, bold=True, color=TEAL)
mena = [
    "UAE imports 90% of food & water — AWG is strategic national infrastructure",
    "GCC water stress index: highest in world (Maplecroft 2024)",
    "Abu Dhabi targets net zero by 2050 — AWG aligns with decarbonisation mandate",
    "Hub71+ ClimateTech pilot pipeline: direct access to Abu Dhabi Dept of Energy",
    "MENA AWG market: $420M by 2028, 22% CAGR — zero dominant local player",
]
for i, m in enumerate(mena):
    txt(s5, "·  " + m, 7.5, 4.75 + i*0.52, 5.5, 0.45, size=9, color=RGBColor(0xCC,0xFB,0xF1))

# ─── SLIDE 6: TRACTION ────────────────────────────────────────────────────────
s6 = add_slide()
bg(s6, RGBColor(0xFF,0xFF,0xFF))
box(s6, 0, 0, 0.08, 7.5, TEAL)

label(s6, "Traction", 0.3, 0.3)
txt(s6, "MVP built. IP in filing. Won rooms that took others years.", 0.3, 0.6, 10, 0.7, size=26, bold=True, color=DARK)

traction = [
    ("ISB AIC Social Impact 3.0", "Accelerator", "12 of 700 applicants selected"),
    ("MeitY TIDE 2.0 — IIM Calcutta", "Government", "EiR · Equity-free grant · Lab access"),
    ("Mercedes-Benz beVisioneers 2025", "Fellowship", "1 of 1,000 global innovators selected"),
    ("IIM Shillong + Meghalaya Govt", "1st Prize", "₹2L prize + 3yr incubation + state water board intro"),
    ("UN Habitat Youth Assembly", "Global", "Top 40 globally · 12 countries · Multilateral funding access"),
    ("UNDP / Citi Youth Co:Lab 2026", "National", "National Springboard Final 50"),
    ("Intinta Innovator — TSIC Award", "State Govt", "Telangana State Innovation Cell · Govt pilot channel"),
    ("T-Hub · NVIDIA Inception · IIT Hyd", "Ecosystem", "Hardware labs · Cloud credits · Deep-tech talent"),
]
colors_map = {"Accelerator": RGBColor(0xED,0xE9,0xFE), "Government": RGBColor(0xDB,0xEA,0xFE),
              "Fellowship": RGBColor(0xFE,0xF3,0xC7), "1st Prize": RGBColor(0xD1,0xFA,0xE5),
              "Global": RGBColor(0xCF,0xFA,0xFC), "National": RGBColor(0xFF,0xED,0xD5),
              "State Govt": RGBColor(0xE0,0xE7,0xFF), "Ecosystem": RGBColor(0xCC,0xFB,0xF1)}
tc_map = {"Accelerator": RGBColor(0x5B,0x21,0xB6), "Government": RGBColor(0x1D,0x4E,0xD8),
          "Fellowship": RGBColor(0x92,0x40,0x0E), "1st Prize": RGBColor(0x06,0x5F,0x46),
          "Global": RGBColor(0x0E,0x75,0x90), "National": RGBColor(0x92,0x40,0x0E),
          "State Govt": RGBColor(0x31,0x2E,0x81), "Ecosystem": RGBColor(0x0F,0x76,0x6E)}

for i, (name, tag, detail) in enumerate(traction):
    row, col = divmod(i, 4)
    x = 0.3 + col * 3.2
    y = 1.5 + row * 2.7
    box(s6, x, y, 3.0, 2.4, RGBColor(0xF9,0xFA,0xFB))
    # tag pill
    box(s6, x+0.15, y+0.15, 1.3, 0.28, colors_map[tag])
    txt(s6, tag, x+0.2, y+0.16, 1.2, 0.24, size=7, bold=True, color=tc_map[tag])
    txt(s6, name, x+0.15, y+0.55, 2.7, 0.6, size=10, bold=True, color=DARK)
    txt(s6, detail, x+0.15, y+1.15, 2.7, 1.0, size=9, color=GRAY)

# ─── SLIDE 7: TEAM ────────────────────────────────────────────────────────────
s7 = add_slide()
bg(s7, DARK)
box(s7, 0, 0, 13.33, 0.06, TEAL)

label(s7, "Team", 0.5, 0.25)
txt(s7, "Founder-market fit at every position.", 0.5, 0.55, 10, 0.7, size=28, bold=True, color=WHITE)
txt(s7, "A team that lived the problem, built the hardware, and won the rooms that matter.", 0.5, 1.25, 10, 0.4, size=12, color=GRAY)

team = [
    ("SJ", "Swamynathan Jerra", "Founder & CEO", "EiR IIMCIP · Mercedes-Benz beVisioneers\nEx: TGIC, inSIG 2025. B.Tech Mechanical.\nGrew up in Siddipet — lived the water\nproblem firsthand.", RGBColor(0x0D,0x94,0x88)),
    ("VS", "Vaidhatri Sanugula", "Co-Founder — Water Quality", "M.Sc Biotechnology. Leads purification R&D\n& WHO compliance. Designed multi-stage\nfiltration with >6-log pathogen kill.", RGBColor(0x1D,0x4E,0xD8)),
    ("SM", "Sumanth Malyala", "Co-Founder — R&D", "B.Tech Mechanical. Optimised AWG COP\nfrom 2.5→4.0 L/kWh in 18 months.\nDesigned AcquaHT-80 specs. Manages\nSTPI IoT OpenLab & MeitY labs.", RGBColor(0x7C,0x3A,0xED)),
    ("SN", "Sai Smaran Nalla", "Co-Founder — BD & IoT", "B.Tech CS. Built ESP32 cloud monitoring\nstack from scratch. Manages T-Hub,\nNVIDIA Inception, Microsoft Founders Hub.\nDrives NGO/CSR & govt pipeline.", RGBColor(0xEA,0x58,0x0C)),
]

for i, (init, name, role, bio, color) in enumerate(team):
    x = 0.4 + i * 3.2
    box(s7, x, 1.9, 3.0, 5.2, RGBColor(0x0D,0x1F,0x3C))
    box(s7, x+0.2, 2.05, 0.7, 0.7, color)
    txt(s7, init, x+0.32, 2.1, 0.6, 0.55, size=16, bold=True, color=WHITE)
    txt(s7, name, x+0.2, 2.85, 2.65, 0.45, size=11, bold=True, color=WHITE)
    txt(s7, role, x+0.2, 3.3, 2.65, 0.35, size=9, color=TEAL)
    txt(s7, bio, x+0.2, 3.75, 2.65, 2.8, size=8.5, color=GRAY)

txt(s7, "Backed by: IIT Hyderabad  ·  T-Hub  ·  NVIDIA Inception  ·  Microsoft Founders Hub  ·  STPI IoT OpenLab  ·  MeitY TIDE 2.0", 0.5, 7.1, 12.5, 0.3, size=9, color=TEAL)

# ─── SLIDE 8: WHY NOW ─────────────────────────────────────────────────────────
s8 = add_slide()
bg(s8, RGBColor(0xFF,0xFF,0xFF))
box(s8, 0, 0, 0.08, 7.5, TEAL)

label(s8, "Why Now", 0.3, 0.3)
txt(s8, "Three forces converging. This window opens once.", 0.3, 0.6, 10, 0.7, size=28, bold=True, color=DARK)

forces = [
    ("🌡️", "Climate Acceleration", "India's monsoon variability up 42% in 15 years. 2024: hottest year on record. Atmospheric humidity at all-time highs. Water-stress events cost India ₹2.5T/year — structural demand for alternatives."),
    ("☀️", "Solar Cost Collapse", "Indian solar module prices down 85% since 2015. Our core energy cost dropped with it. PM Kusum scheme provides subsidised solar for rural installs. Grid parity crossed 2023 — off-grid solar cheaper than diesel in 70% of rural India."),
    ("📋", "Policy & Market Pull", "Jal Jeevan Mission: ₹3.6L Crore committed to water access — creates institutional procurement demand. NITI Aayog declared water a national emergency 2019. Budget allocation doubled. State govts actively tendering decentralised water infra."),
]

for i, (icon, title, desc) in enumerate(forces):
    x = 0.3 + i * 4.2
    box(s8, x, 1.6, 4.0, 4.0, RGBColor(0xF0,0xFD,0xFA) if i%2==0 else RGBColor(0xF0,0xFD,0xFA))
    txt(s8, icon, x+0.2, 1.75, 0.5, 0.5, size=22)
    txt(s8, title, x+0.2, 2.3, 3.6, 0.45, size=14, bold=True, color=DARK)
    txt(s8, desc, x+0.2, 2.85, 3.6, 2.5, size=10, color=GRAY)

txt(s8, "Why Abu Dhabi & Hub71 — Now:", 0.3, 5.85, 12, 0.35, size=11, bold=True, color=DARK)
reasons = ["UAE imports 90% of water — AWG is strategic national infrastructure, not just a startup", "Hub71+ ClimateTech = direct pipeline to Abu Dhabi Dept of Energy and Mubadala Investment", "MENA AWG market: $420M by 2028, 22% CAGR — zero dominant local player today", "AED 250K incentive + WeWork office + visa support = de-risked international expansion from Day 1"]
for i, r in enumerate(reasons):
    txt(s8, "→  " + r, 0.3 + (i//2)*6.5, 6.25 + (i%2)*0.45, 6.2, 0.4, size=9, color=GRAY)

# ─── SLIDE 9: IMPACT & ASK ────────────────────────────────────────────────────
s9 = add_slide()
bg(s9, RGBColor(0x13,0x4E,0x4A))
box(s9, 0, 0, 13.33, 0.06, TEAL)

label(s9, "Impact + The Ask", 0.5, 0.25)
txt(s9, "Every unit is a measurable development outcome.", 0.5, 0.55, 9, 0.7, size=26, bold=True, color=WHITE)

impacts = [("40,150 L","safe water/unit/year"),("40,000+","plastic bottles eliminated"),("~50","people served per unit"),("₹3–6L","saved vs. bottled water"),("1.2 tCO₂e","carbon offset/unit")]
for i, (n, l) in enumerate(impacts):
    x = 0.5 + i * 2.45
    stat_block(s9, n, l, x, 1.45, w=2.2)

txt(s9, "UN SDGs: 6 Clean Water  ·  3 Good Health  ·  13 Climate Action  ·  11 Sustainable Cities  ·  10 Reduced Inequalities", 0.5, 3.0, 12.5, 0.35, size=9, color=RGBColor(0x5E,0xEA,0xD4))

box(s9, 0.5, 3.5, 12.3, 0.04, RGBColor(0x0F,0x76,0x6E))

txt(s9, "Raising ₹10 Lakh Seed Round", 0.5, 3.7, 8, 0.55, size=22, bold=True, color=WHITE)
txt(s9, "To complete IP filings, finish integrations, and ship our first pilot — unlocking a milestone-linked growth-stage tranche of ₹50L–₹1Cr", 0.5, 4.3, 9, 0.5, size=10, color=RGBColor(0x99,0xF6,0xE4))

alloc = [("40%","₹4.0L","IP & Patents"),("30%","₹3.0L","Integrations & MVP-to-Pilot"),("20%","₹2.0L","Compliance & Testing"),("10%","₹1.0L","First Pilot Deployment")]
for i, (pct, amt, use) in enumerate(alloc):
    x = 0.5 + i * 3.1
    box(s9, x, 4.95, 2.9, 1.7, RGBColor(0x0F,0x76,0x6E))
    txt(s9, pct, x+0.15, 5.0, 1, 0.55, size=26, bold=True, color=TEAL)
    txt(s9, amt, x+0.15, 5.55, 2.6, 0.35, size=11, bold=True, color=WHITE)
    txt(s9, use, x+0.15, 5.9, 2.6, 0.6, size=9, color=RGBColor(0xCC,0xFB,0xF1))

txt(s9, "Growth-stage triggers (6–9 months): 1–2 pilots live · ≥1 patent filed · ≥1 institutional LOI → ₹50L–₹1Cr tranche", 0.5, 6.85, 12.5, 0.4, size=9, bold=True, color=TEAL)

# ─── SLIDE 10: CLOSE ──────────────────────────────────────────────────────────
s10 = add_slide()
bg(s10, DARK)
box(s10, 0, 0, 13.33, 0.06, TEAL)
box(s10, 0, 7.44, 13.33, 0.06, TEAL)

txt(s10, "Clean water shouldn't depend on your pin code.", 1.5, 1.5, 10, 1.6, size=40, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
txt(s10, "We are solving India's water crisis from the air down.", 1.5, 3.3, 10, 0.6, size=18, color=RGBColor(0x99,0xF6,0xE4), align=PP_ALIGN.CENTER)
txt(s10, "Join us.", 1.5, 3.95, 10, 0.6, size=18, bold=True, color=TEAL, align=PP_ALIGN.CENTER)

for i, (num, label_t) in enumerate([("2.1B","people without safe water"),("$15B","market by 2030"),("19.2%","CAGR"),("Window","is now")]):
    stat_block(s10, num, label_t, 0.5 + i * 3.1, 5.0, w=2.9)

txt(s10, "Swamynathan Jerra  |  Founder & CEO  |  admin@acquahtlabs.in  |  acquahtlabs.in  |  Hyderabad, Telangana, India", 1.5, 6.85, 10.5, 0.4, size=10, color=GRAY, align=PP_ALIGN.CENTER)

# Save
out = "/home/user/BiGeo/AcquaHT_Labs_Hub71_Application.pptx"
prs.save(out)
print(f"Saved: {out}")
