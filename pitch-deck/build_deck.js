// AcquaHT seed pitch deck generator.
// Run: NODE_PATH=<dir with pptxgenjs, react, react-dom, react-icons, sharp> node build_deck.js
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");

const APPLY_THEME = process.env.APPLY_THEME_JS;
const OUT = path.join(__dirname, "AcquaHT_Seed_Pitch_Deck.pptx");

// ---------- Theme ----------
const HEX = {
  ink: "13202B",      // dk1 body text
  navy: "0A2E4D",     // dk2 deep water
  white: "FFFFFF",    // lt1
  ice: "EAF4FA",      // lt2
  blue: "1273B5",     // accent1 water
  aqua: "3FB6D9",     // accent2
  amber: "F2A124",    // accent3 solar / thermal
  green: "2E9E6A",    // accent4 good
  gray: "5B6B78",     // accent5 muted
  red: "D9534F",      // accent6 risk
  line: "D5E3EC",
  orange: "E8702A",
};
const THEME = {
  name: "AcquaHT",
  headFontFace: "Arial",
  bodyFontFace: "Calibri",
  colors: {
    dk1: HEX.ink, lt1: HEX.white, dk2: HEX.navy, lt2: HEX.ice,
    accent1: HEX.blue, accent2: HEX.aqua, accent3: HEX.amber,
    accent4: HEX.green, accent5: HEX.gray, accent6: HEX.red,
    hlink: HEX.blue, folHlink: HEX.gray,
  },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "AcquaHT — Seed Pitch Deck";
pres.author = "AcquaHT";
pres.company = "AcquaHT";
const C = pres.SchemeColor;
const COL = {
  ink: C.text1, navy: C.text2, white: C.background1, ice: C.background2,
  blue: C.accent1, aqua: C.accent2, amber: C.accent3, green: C.accent4, gray: C.accent5, red: C.accent6,
};

const W = 13.333, H = 7.5, MX = 0.5, CW = W - 2 * MX;

// ---------- Layouts ----------
pres.defineSlideMaster({
  title: "TITLE_DARK",
  background: { color: COL.navy },
  objects: [],
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: COL.white },
  margin: [0.5, 0.5, 0.6, 0.5],
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: MX, y: 0.35, w: CW, h: 0.95, fontSize: 30, bold: true, color: COL.navy, valign: "middle", margin: 0, fontFace: "Arial" }, text: "" } },
    { text: { text: "AcquaHT  ·  Water from air  ·  Seed 2026", options: { x: MX, y: 7.08, w: 6, h: 0.28, fontSize: 10, color: COL.gray, margin: 0 } } },
  ],
  slideNumber: { x: W - MX - 0.6, y: 7.08, w: 0.6, h: 0.28, fontSize: 10, color: COL.gray, align: "right" },
});
pres.defineSlideMaster({
  title: "CONTENT_DARK",
  background: { color: COL.navy },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: MX, y: 0.35, w: CW, h: 0.95, fontSize: 30, bold: true, color: COL.white, valign: "middle", margin: 0, fontFace: "Arial" }, text: "" } },
    { text: { text: "AcquaHT  ·  Water from air  ·  Seed 2026", options: { x: MX, y: 7.08, w: 6, h: 0.28, fontSize: 10, color: COL.aqua, margin: 0 } } },
  ],
  slideNumber: { x: W - MX - 0.6, y: 7.08, w: 0.6, h: 0.28, fontSize: 10, color: COL.aqua, align: "right" },
});

// ---------- Icons ----------
const iconCache = {};
async function icon(name, hex) {
  const key = name + hex;
  if (iconCache[key]) return iconCache[key];
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(fa[name], { color: "#" + hex, size: 256 }));
  const buf = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
  iconCache[key] = "image/png;base64," + buf.toString("base64");
  return iconCache[key];
}

// ---------- Helpers ----------
let objId = 0;
const oid = (p) => `${p}-${++objId}`;
const T = (slide, text, o) => slide.addText(text, Object.assign({ isTextBox: true, objectName: oid("text"), margin: 0, valign: "top", fontSize: 14, color: COL.ink }, o));
const shadow = () => ({ type: "outer", color: "0A2E4D", opacity: 0.12, blur: 8, offset: 2, angle: 90 });

function card(slide, x, y, w, h, o = {}) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: o.r ?? 0.12, objectName: oid("card"),
    fill: { color: o.fill ?? COL.white },
    line: o.line === false ? { type: "none" } : { color: o.lineColor ?? HEX.line, width: 0.75 },
    shadow: o.shadow === false ? undefined : shadow(),
  });
}
async function iconCircle(slide, name, x, y, d, fill, iconHex = HEX.white) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" }, objectName: oid("icon-bg") });
  const p = d * 0.26;
  slide.addImage({ data: await icon(name, iconHex), x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p, objectName: oid("icon") });
}
async function keyMsg(slide, text, dark = false) {
  const y = 6.3, h = 0.62;
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX, y, w: CW, h, rectRadius: 0.1, fill: { color: dark ? COL.white : COL.ice, transparency: dark ? 88 : 0 }, line: { type: "none" }, objectName: oid("keymsg-bg") });
  await iconCircle(slide, "FaTint", MX + 0.14, y + 0.11, 0.4, COL.amber, HEX.navy);
  T(slide, text, { x: MX + 0.7, y, w: CW - 0.9, h, fontSize: 16, bold: true, italic: true, color: dark ? COL.white : COL.navy, valign: "middle" });
}
function pill(slide, text, x, y, w, h, fill, color = COL.white, fs = 12) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: h / 2, fill: { color: fill }, line: { type: "none" }, objectName: oid("pill") });
  T(slide, text, { x, y, w, h, fontSize: fs, bold: true, color, align: "center", valign: "middle" });
}
function arrow(slide, x, y, w, color = HEX.gray, wt = 2) {
  slide.addShape(pres.shapes.LINE, { x, y, w, h: 0, line: { color, width: wt, endArrowType: "triangle" }, objectName: oid("arrow") });
}
// Table helper. rows: array of arrays of strings or {text, options}
function table(slide, header, rows, o) {
  const fs = o.fontSize ?? 12;
  const head = header.map((t) => ({ text: t, options: { bold: true, color: HEX.white, fill: { color: o.headFill ?? HEX.navy }, fontSize: fs, valign: "middle" } }));
  const body = rows.map((r, i) => r.map((c) => {
    const base = { fontSize: fs, color: HEX.ink, fill: { color: i % 2 ? HEX.ice : HEX.white }, valign: "middle" };
    if (typeof c === "object") return { text: c.text, options: Object.assign(base, c.options) };
    return { text: c, options: base };
  }));
  if (o.boldLast) body[body.length - 1].forEach((c) => { c.options.bold = true; c.options.fill = { color: "FDEBCC" }; });
  slide.addTable([head, ...body], {
    x: o.x, y: o.y, w: o.w, colW: o.colW, rowH: o.rowH ?? 0.36, margin: [0.04, 0.08, 0.04, 0.08],
    border: { type: "solid", pt: 0.5, color: HEX.line }, fontFace: "Calibri", autoPage: false, objectName: oid("table"),
  });
}
const chartBase = (title) => ({
  showTitle: !!title, title, titleFontSize: 14, titleColor: HEX.navy, titleFontFace: "+mj-lt",
  catAxisLabelColor: HEX.gray, valAxisLabelColor: HEX.gray, catAxisLabelFontSize: 12, valAxisLabelFontSize: 11,
  catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt",
  valGridLine: { color: "E3ECF2", size: 0.75 }, catGridLine: { style: "none" },
  dataLabelColor: HEX.ink, dataLabelFontSize: 12, dataLabelFontFace: "+mn-lt", dataLabelFontBold: true,
  showLegend: false,
});

let section = "";
function newSlide(master, sec) {
  if (sec && sec !== section) { pres.addSection({ title: sec }); section = sec; }
  return pres.addSlide({ masterName: master, sectionTitle: section });
}

// ======================================================================
async function build() {
  // ---------------- 1. Title ----------------
  {
    const s = newSlide("TITLE_DARK", "Opening");
    T(s, "ACQUAHT", { x: 0.7, y: 0.7, w: 6, h: 0.4, fontSize: 16, bold: true, color: COL.amber, charSpacing: 6, fontFace: "Arial" });
    T(s, "Drinking water from air at ₹0.40–₹0.80 per litre", { x: 0.7, y: 1.25, w: 7.3, h: 2.1, fontSize: 40, bold: true, color: COL.white, fontFace: "Arial", valign: "middle" });
    T(s, "We extract, filter and deliver potable water from atmospheric humidity using ultra-low-cost sorbents, solar thermal desorption and waste-heat recovery — at 1/20th the cost of bottled water.", { x: 0.7, y: 3.5, w: 7.0, h: 1.2, fontSize: 16, color: COL.ice });
    T(s, "We are not building another AWG. We are building the cheapest water source on Earth.", { x: 0.7, y: 4.85, w: 7.0, h: 0.8, fontSize: 16, italic: true, bold: true, color: COL.amber });
    T(s, "Raising $650,000 Seed  |  [Founder Name]  |  [Email]  |  [Phone]  |  [Website]", { x: 0.7, y: 6.6, w: 9, h: 0.4, fontSize: 13, color: COL.aqua });
    // Right: the chain sun + sorbent -> water
    const cx = 9.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx - 0.3, y: 0.9, w: 4.1, h: 5.2, rectRadius: 0.2, fill: { color: COL.white, transparency: 90 }, line: { color: HEX.aqua, width: 1 }, objectName: oid("panel") });
    const steps = [
      ["FaSun", COL.amber, "Solar thermal", "Vacuum tubes reach 134°C"],
      ["FaLeaf", COL.green, "Jute / CaCl₂ sorbent", "Agri-waste, <$0.50/kg"],
      ["FaTint", COL.aqua, "Clean water", "$0.005–$0.01 per litre"],
    ];
    for (let i = 0; i < steps.length; i++) {
      const y = 1.25 + i * 1.6;
      await iconCircle(s, steps[i][0], cx, y, 0.95, steps[i][1], HEX.navy);
      T(s, steps[i][2], { x: cx + 1.15, y: y + 0.08, w: 2.5, h: 0.4, fontSize: 16, bold: true, color: COL.white });
      T(s, steps[i][3], { x: cx + 1.15, y: y + 0.48, w: 2.5, h: 0.4, fontSize: 13, color: COL.ice });
      if (i < 2) s.addShape(pres.shapes.LINE, { x: cx + 0.475, y: y + 1.0, w: 0, h: 0.55, line: { color: HEX.aqua, width: 2, endArrowType: "triangle" }, objectName: oid("arrow") });
    }
    s.addNotes("OPEN WITH TENSION (Slides 1–3). Lead with ₹0.40/L. Let it land. Then explain why nobody has done it: because everyone used MOFs and electric heaters. We did neither.\n\nVisual to add: split image — left: jute/CaCl₂ sorbent composite and solar vacuum tube collector; right: clean water pouring into a glass at an Indian railway station. Use real photos, not stock water droplets.\n\nWhat changed in this version: technology strategy is now sorption-first with ultra-low-cost sorbents, solar thermal desorption and waste-heat recovery. Headline LCOW target drops from $0.02–$0.04/L to $0.005–$0.01/L. MVP plan (100 → 1,000 L/day) is embedded. Unit economics, use of funds and financials revised accordingly.");
  }

  // ---------------- 2. Problem ----------------
  {
    const s = newSlide("CONTENT", "The Story");
    s.addText("Safe water is scarce, expensive and logistically broken", { placeholder: "title" });
    // Left: 2.2B stat
    card(s, MX, 1.5, 3.8, 3.1);
    T(s, "2.2B", { x: MX + 0.3, y: 1.65, w: 3.3, h: 1.1, fontSize: 60, bold: true, color: COL.blue, fontFace: "Arial" });
    T(s, "people lack safely managed drinking water", { x: MX + 0.3, y: 2.75, w: 3.3, h: 0.6, fontSize: 15, color: COL.ink });
    T(s, "Indian cities approaching “Day Zero”:", { x: MX + 0.3, y: 3.45, w: 3.3, h: 0.35, fontSize: 13, bold: true, color: COL.gray });
    ["Bengaluru", "Chennai", "Delhi"].forEach((c, i) => pill(s, c, MX + 0.3 + i * 1.1, 3.9, 1.0, 0.36, COL.red, COL.white, 11));
    // Middle: price ladder
    const mx = 4.6;
    card(s, mx, 1.5, 4.1, 3.1);
    T(s, "What people pay today", { x: mx + 0.3, y: 1.65, w: 3.5, h: 0.4, fontSize: 16, bold: true, color: COL.navy });
    const bars = [["Bottled", "₹15–20/L", 3.5, COL.red, "Plastic waste"], ["Tanker", "₹5–10/L", 1.75, COL.amber, "Unreliable, often contaminated"]];
    bars.forEach((b, i) => {
      const y = 2.2 + i * 1.15;
      T(s, b[0], { x: mx + 0.3, y, w: 2, h: 0.3, fontSize: 13, bold: true, color: COL.gray });
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: mx + 0.3, y: y + 0.32, w: b[2], h: 0.42, rectRadius: 0.06, fill: { color: b[3] }, line: { type: "none" }, objectName: oid("bar") });
      T(s, b[1], { x: mx + 0.4, y: y + 0.32, w: 1.6, h: 0.42, fontSize: 14, bold: true, color: COL.white, valign: "middle" });
      if (i === 1) T(s, b[4], { x: mx + 2.15, y: y + 0.32, w: 1.8, h: 0.42, fontSize: 11, italic: true, color: COL.gray, valign: "middle" });
    });
    // Right: existing fixes fail
    const rx = 9.0;
    card(s, rx, 1.5, 3.83, 3.1);
    T(s, "Existing fixes fail", { x: rx + 0.3, y: 1.65, w: 3.3, h: 0.4, fontSize: 16, bold: true, color: COL.navy });
    T(s, [
      { text: "Desalination", options: { bold: true, breakLine: true } },
      { text: "Only works on the coast", options: { color: COL.gray, breakLine: true } },
      { text: " ", options: { fontSize: 6, breakLine: true } },
      { text: "Reverse osmosis (RO)", options: { bold: true, breakLine: true } },
      { text: "Needs a source water supply", options: { color: COL.gray, breakLine: true } },
      { text: " ", options: { fontSize: 6, breakLine: true } },
      { text: "Both fail where groundwater is depleted.", options: { bold: true, color: COL.red } },
    ], { x: rx + 0.3, y: 2.15, w: 3.3, h: 2.3, fontSize: 14 });
    // Railways card
    card(s, MX, 4.8, CW, 1.25, { fill: COL.ice, line: false, shadow: false });
    await iconCircle(s, "FaTrain", MX + 0.25, 5.0, 0.85, COL.navy);
    T(s, [
      { text: "Demand already exists. ", options: { bold: true, color: COL.navy } },
      { text: "Indian Railways has directed zonal railways, hospitals, staff colonies and remote level crossings to install atmospheric water generators (AWGs) where water scarcity exists." },
    ], { x: MX + 1.35, y: 4.8, w: CW - 1.6, h: 1.25, fontSize: 15, valign: "middle" });
    await keyMsg(s, "The problem is not scarcity. It is the cost and logistics of delivering clean water.");
    s.addNotes("Keep the problem emotional but data-backed — railway stations and Day Zero cities are concrete, not abstract.\n\nVisual to add if available: map of India's groundwater depletion zones; photo of a water tanker beside a stack of plastic bottles.");
  }

  // ---------------- 3. Why Now ----------------
  {
    const s = newSlide("CONTENT", "The Story");
    s.addText("Three forces make ultra-low-cost atmospheric water inevitable", { placeholder: "title" });
    const items = [
      ["FaLeaf", COL.green, "Sorbent cost collapse", "40–200x cheaper", "Agri-waste and recycled-polymer sorbents cost $0.46–$2.50/kg vs $100+/kg for MOFs."],
      ["FaSun", COL.amber, "Free desorption energy", "134°C from the sun", "Solar thermal regenerates sorbents at zero marginal electricity. Photothermal hydrogels self-regenerate at 71°C under 0.5 sun."],
      ["FaIndustry", HEX.orange, "Waste heat everywhere", "−34.4% energy", "Hybrid systems hit 315 Wh/kg (50% RH, 30°C). Passive hybrid designs reach 0.2 kWh/L."],
      ["FaLandmark", COL.blue, "Policy tailwind", "Govt. demand now", "Indian Railways AWG mandate = immediate government procurement demand."],
    ];
    for (let i = 0; i < 4; i++) {
      const x = MX + (i % 2) * 3.95, y = 1.5 + Math.floor(i / 2) * 2.35;
      card(s, x, y, 3.8, 2.2);
      await iconCircle(s, items[i][0], x + 0.2, y + 0.2, 0.6, items[i][1]);
      T(s, items[i][2], { x: x + 0.95, y: y + 0.2, w: 2.7, h: 0.3, fontSize: 13, bold: true, color: COL.gray });
      T(s, items[i][3], { x: x + 0.95, y: y + 0.47, w: 2.75, h: 0.4, fontSize: 18, bold: true, color: COL.navy });
      T(s, items[i][4], { x: x + 0.2, y: y + 0.98, w: 3.45, h: 1.15, fontSize: 12.5, color: COL.ink });
    }
    // Market chart
    card(s, 8.45, 1.5, 4.38, 4.55);
    s.addChart(pres.charts.BAR, [{ name: "Global AWG market ($M)", labels: ["2025", "2034"], values: [548.6, 1158] }], Object.assign(chartBase("Global AWG market ($M)"), {
      x: 8.6, y: 1.65, w: 4.1, h: 3.6, barDir: "col", chartColors: [HEX.aqua, HEX.blue], showValue: true, dataLabelPosition: "outEnd",
      dataLabelFormatCode: "$#,##0.0", valAxisHidden: true, valGridLine: { style: "none" }, barGapWidthPct: 60, valAxisMaxVal: 1350, valAxisMinVal: 0, objectName: "chart-awg-market",
    }));
    T(s, "8.70% CAGR → $1.158B by 2034", { x: 8.65, y: 5.35, w: 4.0, h: 0.5, fontSize: 15, bold: true, color: COL.blue, align: "center" });
    await keyMsg(s, "The economics flipped. Water from air is no longer a premium product — it is the cheap one.");
    s.addNotes("Visual intent: three-panel infographic — falling sorbent cost curve, solar thermal collector, waste-heat recovery diagram. Inset: AWG market growth chart ($548.6M in 2025 → $1.158B in 2034, 8.70% CAGR).\n\nWaste-heat detail: hybrid systems recover waste heat and cut specific energy consumption by 34.4% (315 Wh/kg at 50% RH, 30°C).");
  }

  // ---------------- 4. Solution ----------------
  {
    const s = newSlide("CONTENT", "The Story");
    s.addText("Hybrid sorption + solar thermal + waste heat + 5-stage filtration, as a service", { placeholder: "title" });
    const flow = [["FaWind", COL.aqua, "Air"], ["FaLeaf", COL.green, "Sorbent bed"], ["FaSun", COL.amber, "Solar / waste-heat desorption"], ["FaSnowflake", COL.blue, "Condenser"], ["FaFilter", COL.navy, "5-stage filtration"], ["FaTint", COL.aqua, "Potable water"], ["FaUsers", COL.green, "Customer"]];
    const step = CW / 7;
    for (let i = 0; i < flow.length; i++) {
      const x = MX + i * step + (step - 0.85) / 2;
      await iconCircle(s, flow[i][0], x, 1.5, 0.85, flow[i][1]);
      T(s, flow[i][2], { x: MX + i * step, y: 2.42, w: step, h: 0.55, fontSize: 12, bold: true, color: COL.navy, align: "center" });
      if (i < 6) arrow(s, x + 0.92, 1.925, step - 1.0, HEX.gray, 1.75);
    }
    const cards = [
      ["Extract", "Ultra-low-cost sorbent captures moisture from ambient air at 30–80% RH."],
      ["Regenerate", "Solar thermal (134°C) and recovered waste heat release the vapour at near-zero marginal energy cost."],
      ["Condense & filter", "5 stages: sediment, activated carbon, optional RO, UV sterilisation, mineralisation."],
      ["Deliver", "Water-as-a-Service subscriptions, equipment leasing, franchise deployment."],
      ["Certify", "ASSE 1090, BIS, NSF/ANSI 372, WHO Guidelines."],
    ];
    const cw = (CW - 4 * 0.2) / 5;
    cards.forEach((c, i) => {
      const x = MX + i * (cw + 0.2);
      card(s, x, 3.2, cw, 2.85);
      T(s, String(i + 1).padStart(2, "0"), { x: x + 0.2, y: 3.35, w: 1, h: 0.45, fontSize: 22, bold: true, color: COL.amber, fontFace: "Arial" });
      T(s, c[0], { x: x + 0.2, y: 3.85, w: cw - 0.4, h: 0.4, fontSize: 16, bold: true, color: COL.navy });
      T(s, c[1], { x: x + 0.2, y: 4.3, w: cw - 0.35, h: 1.65, fontSize: 13, color: COL.ink });
    });
    await keyMsg(s, "We do not sell machines. We sell certified water at a fraction of bottled-water cost.");
    s.addNotes("EXPLAIN THE SYSTEM AS A CHAIN, NOT A MACHINE (Slides 4–6). The audience needs to understand that condensation and sorption are not competitors in our design — they are stages.");
  }

  // ---------------- 5. Cost breakthrough ----------------
  {
    const s = newSlide("CONTENT", "Technology");
    s.addText("$0.005–$0.01 per litre. Here is exactly how we get there", { placeholder: "title" });
    card(s, MX, 1.5, 3.5, 4.55, { fill: COL.navy, line: false });
    T(s, "LCOW at scale", { x: MX + 0.3, y: 1.75, w: 3, h: 0.35, fontSize: 14, bold: true, color: COL.aqua });
    T(s, "$0.005–\n$0.01", { x: MX + 0.3, y: 2.15, w: 3.0, h: 1.6, fontSize: 44, bold: true, color: COL.amber, fontFace: "Arial" });
    T(s, "per litre", { x: MX + 0.3, y: 3.75, w: 3, h: 0.35, fontSize: 16, color: COL.white });
    T(s, [{ text: "75–87% ", options: { bold: true, color: COL.amber } }, { text: "below conventional AWG ($0.02–$0.04/L)", options: { color: COL.white } }], { x: MX + 0.3, y: 4.35, w: 2.95, h: 0.8, fontSize: 14 });
    T(s, "= ₹0.40–₹0.80 per litre", { x: MX + 0.3, y: 5.25, w: 3, h: 0.4, fontSize: 14, bold: true, color: COL.aqua });
    // rows
    const rows = [
      ["Sorbent material", "MOF: $100+/kg", "Jute/CaCl₂ <$0.50/kg · PANSAP $2.50/kg · Starch-PEG/CaCl₂ $0.46/kg", "40–200x"],
      ["Desorption energy", "0.84–2.1 kWh/L electrical", "Solar thermal + waste heat: near-zero marginal", "~90%"],
      ["Specific energy (system)", "1.5–2.1 kWh/L", "0.2–0.5 kWh/L (passive / hybrid)", "70–85%"],
      ["System CapEx (100 L/day)", "$8,000–$12,000", "$2,030–$3,950 (BOM)", "60–75%"],
      ["LCOW", "$0.02–$0.04/L", "$0.005–$0.01/L", "75–87%"],
    ];
    const rx = 4.25, rw = W - MX - rx;
    T(s, "COST DRIVER", { x: rx + 0.15, y: 1.5, w: 2.2, h: 0.3, fontSize: 11, bold: true, color: COL.gray });
    T(s, "CONVENTIONAL AWG", { x: rx + 2.35, y: 1.5, w: 2.0, h: 0.3, fontSize: 11, bold: true, color: COL.gray });
    T(s, "ACQUAHT", { x: rx + 4.65, y: 1.5, w: 2.6, h: 0.3, fontSize: 11, bold: true, color: COL.blue });
    T(s, "CUT", { x: rx + rw - 1.25, y: 1.5, w: 1.1, h: 0.3, fontSize: 11, bold: true, color: COL.green, align: "center" });
    rows.forEach((r, i) => {
      const y = 1.85 + i * 0.84, last = i === 4;
      card(s, rx, y, rw, 0.74, { fill: last ? "FDEBCC" : COL.white, shadow: false });
      T(s, r[0], { x: rx + 0.15, y, w: 2.15, h: 0.74, fontSize: 13, bold: true, color: COL.navy, valign: "middle" });
      T(s, r[1], { x: rx + 2.35, y, w: 2.0, h: 0.74, fontSize: 12.5, color: COL.gray, valign: "middle", strike: "sngStrike" });
      arrow(s, rx + 4.3, y + 0.37, 0.28, HEX.gray, 1.5);
      T(s, r[2], { x: rx + 4.65, y, w: rw - 6.0, h: 0.74, fontSize: 12.5, bold: true, color: COL.blue, valign: "middle" });
      pill(s, r[3], rx + rw - 1.25, y + 0.19, 1.1, 0.36, COL.green, COL.white, 12);
    });
    await keyMsg(s, "Two levers do almost all the work: sorbent cost and desorption energy. We attack both.");
    s.addNotes("Make the LCOW the hero metric on this slide (also slides 12 and 20).\n\nVisual intent from brief: waterfall chart MOF → agricultural-waste sorbent → solar thermal → waste-heat recovery → PANSAP scale → $0.005/L. The lever-by-lever LCOW waterfall with real numbers is on the Unit Economics slide.");
  }

  // ---------------- 6. Architecture ----------------
  {
    const s = newSlide("CONTENT", "Technology");
    s.addText("A four-stage hybrid system that wastes nothing", { placeholder: "title" });
    const st = [
      ["FaSnowflake", COL.blue, "Stage 1", "Condensation", "Vapour compression makes water in humid air — and waste heat as a by-product."],
      ["FaFlask", COL.green, "Stage 2", "Sorption", "CaCl₂ salt-solution circuit uses Stage 1’s waste heat to capture extra water with no major external energy."],
      ["FaSun", COL.amber, "Stage 3", "Solar thermal desorption", "Double-ended vacuum tubes (4.86 m², 134.2°C peak) drive daytime desorption at zero marginal electricity."],
      ["FaBatteryFull", COL.navy, "Stage 4", "Thermal storage", "Low-cost phase-change material or sand bed stores solar heat for night and cloudy days."],
    ];
    const bw = 2.6, gap = (CW - 4 * bw) / 3;
    for (let i = 0; i < 4; i++) {
      const x = MX + i * (bw + gap);
      card(s, x, 1.5, bw, 2.85);
      await iconCircle(s, st[i][0], x + 0.2, 1.68, 0.6, st[i][1]);
      T(s, st[i][2], { x: x + 0.95, y: 1.7, w: 1.5, h: 0.25, fontSize: 11, bold: true, color: COL.gray });
      T(s, st[i][3], { x: x + 0.95, y: 1.93, w: 1.6, h: 0.55, fontSize: 14, bold: true, color: COL.navy });
      T(s, st[i][4], { x: x + 0.2, y: 2.55, w: bw - 0.35, h: 1.7, fontSize: 12.5 });
    }
    const labels = [["waste heat", HEX.orange], ["+ solar heat", HEX.amber], ["excess heat", HEX.amber]];
    for (let i = 0; i < 3; i++) {
      const x = MX + (i + 1) * bw + i * gap;
      arrow(s, x + 0.05, 2.85, gap - 0.1, labels[i][1], 3);
      T(s, labels[i][0], { x: x - 0.1, y: 2.45, w: gap + 0.2, h: 0.3, fontSize: 10, bold: true, color: labels[i][1] === HEX.orange ? HEX.orange : COL.amber, align: "center" });
    }
    // Night loop: stage 4 back to stage 2
    const x2 = MX + 1 * (bw + gap) + bw / 2, x4 = MX + 3 * (bw + gap) + bw / 2;
    s.addShape(pres.shapes.LINE, { x: x4, y: 4.35, w: 0, h: 0.35, line: { color: HEX.orange, width: 2.5, dashType: "dash" }, objectName: oid("loop") });
    s.addShape(pres.shapes.LINE, { x: x2, y: 4.7, w: x4 - x2, h: 0, line: { color: HEX.orange, width: 2.5, dashType: "dash" }, objectName: oid("loop") });
    s.addShape(pres.shapes.LINE, { x: x2, y: 4.38, w: 0, h: 0.32, flipV: true, line: { color: HEX.orange, width: 2.5, dashType: "dash", endArrowType: "triangle" }, objectName: oid("loop") });
    T(s, "Stored heat drives overnight / cloudy-day desorption", { x: x2 + 0.3, y: 4.4, w: x4 - x2 - 0.6, h: 0.28, fontSize: 11, bold: true, italic: true, color: HEX.orange, align: "center" });
    // Result stats
    const stats = [["315 Wh/kg", "hybrid operation"], ["34.4%", "energy saving vs basic vapour compression"], ["0.2 kWh/L", "passive configurations"]];
    const sw = (CW - 0.4) / 3;
    stats.forEach((t, i) => {
      const x = MX + i * (sw + 0.2);
      card(s, x, 4.95, sw, 1.15, { fill: COL.ice, line: false, shadow: false });
      T(s, t[0], { x: x + 0.25, y: 4.98, w: sw - 0.4, h: 0.62, fontSize: 28, bold: true, color: COL.blue, fontFace: "Arial", valign: "middle" });
      T(s, t[1], { x: x + 0.25, y: 5.6, w: sw - 0.4, h: 0.4, fontSize: 13, color: COL.gray });
    });
    await keyMsg(s, "We do not choose between condensation and sorption. We chain them so each stage powers the next.");
    s.addNotes("The waste-heat loop is the most counterintuitive and most impressive part. Draw it on a whiteboard if you can.\n\nVisual intent: cutaway schematic of the four stages with energy flows labelled. Waste-heat loop in orange, solar loop in yellow/amber.");
  }

  // ---------------- 7. Sorbent lever ----------------
  {
    const s = newSlide("CONTENT", "Technology");
    s.addText("We replaced $100/kg MOFs with agricultural waste and recycled polymer", { placeholder: "title" });
    card(s, MX, 1.5, 7.4, 4.6);
    s.addChart(pres.charts.BAR, [{ name: "Sorbent cost ($/kg, log scale)", labels: ["MOF-801/303  $100+", "PANSAP  $2.50", "Silica gel  $1–3", "Jute/CaCl₂  <$0.50", "Starch-PEG/CaCl₂  $0.46", "Succulent biomass  ~$0"], values: [100, 2.5, 2, 0.5, 0.46, 0.01] }], Object.assign(chartBase("Sorbent cost per kg (USD, log scale)"), {
      x: MX + 0.15, y: 1.6, w: 7.1, h: 4.4, barDir: "bar", valAxisLogScaleBase: 10, valAxisMinVal: 0.001, valAxisMaxVal: 1000, catAxisLabelFontSize: 11,
      chartColors: [HEX.red, HEX.blue, "9AA9B5", HEX.green, HEX.green, HEX.green], showValue: false,
      catAxisOrientation: "maxMin", valAxisLabelFormatCode: "$#,##0.###", barGapWidthPct: 45, objectName: "chart-sorbent-cost",
    }));
    const rx = 8.15, rw = W - MX - rx;
    card(s, rx, 1.5, rw, 2.55, { fill: COL.navy, line: false });
    T(s, "MVP PROOF POINT", { x: rx + 0.25, y: 1.65, w: rw - 0.5, h: 0.3, fontSize: 12, bold: true, color: COL.aqua });
    T(s, "5,850 ml/day", { x: rx + 0.25, y: 1.95, w: rw - 0.5, h: 0.7, fontSize: 34, bold: true, color: COL.amber, fontFace: "Arial" });
    T(s, "from 12 kg of Jute/CaCl₂ composite at $0.086/L — published testing.", { x: rx + 0.25, y: 2.7, w: rw - 0.5, h: 1.2, fontSize: 15, color: COL.white });
    card(s, rx, 4.25, rw, 1.85);
    await iconCircle(s, "FaCheck", rx + 0.25, 4.45, 0.55, COL.green);
    T(s, "Beats silica gel", { x: rx + 0.95, y: 4.48, w: rw - 1.1, h: 0.5, fontSize: 17, bold: true, color: COL.navy });
    T(s, "4–5x the water uptake of silica gel (0.26 g/g) — at a fraction of the cost.", { x: rx + 0.25, y: 5.1, w: rw - 0.45, h: 0.9, fontSize: 14 });
    await keyMsg(s, "The sorbent is the single biggest cost line in any AWG. We cut it by up to 200x — and it works better than silica gel.");
    s.addNotes("THIS IS YOUR TECHNICAL CREDIBILITY (Slides 7–8). Spend real time here. Name the sorbents. Quote the costs. Explain why Jute/CaCl₂ works better than silica gel (4–5x uptake at a fraction of the cost). If an investor asks one deep technical question, it will be here.\n\nChart note: must stay on a log scale, or the Jute/CaCl₂ bar is invisible next to MOF. Succulent biomass is ~$0 (plotted at $0.01 because log scales cannot show zero). Jute/CaCl₂ is <$0.50/kg.\n\nVisual to add: photo of actual sorbent samples.");
  }

  // ---------------- 8. Sorbent table ----------------
  {
    const s = newSlide("CONTENT", "Technology");
    s.addText("Our sorbent line-up: tested, ranked and costed", { placeholder: "title" });
    const st = (t, c) => ({ text: t, options: { bold: true, color: c } });
    table(s, ["Sorbent", "Water uptake", "Regeneration temp", "Cost", "Status"], [
      [{ text: "Jute/CaCl₂ composite", options: { bold: true } }, "High at moderate RH", "134°C (solar thermal)", "$0.086/L water cost", st("MVP primary", HEX.green)],
      [{ text: "Starch-PEG/CaCl₂ hydrogel", options: { bold: true } }, "1.47 g/g", "71.1°C at 0.5 sun", "$0.46/kg", st("Parallel validation", HEX.blue)],
      [{ text: "Unprocessed succulent biomass", options: { bold: true } }, "1.28 g/g (CR) · 1.08 g/g (AC)", "65°C", "~$0", st("Lab-validated", HEX.blue)],
      [{ text: "Agricultural straw waste", options: { bold: true } }, "0.50–1.29 g/g", "Solar-driven", "Waste product", st("Lab-validated", HEX.blue)],
      [{ text: "PANSAP (recycled polymer)", options: { bold: true } }, "Moderate–high at >40% RH", "0.9–1.2 kWh/L", "~$2.50/kg", st("Scale-up phase", HEX.amber)],
      [{ text: "Silica gel (baseline)", options: { bold: true } }, "0.26 g/g", "80–120°C", "$1–3/kg", st("Reference only", HEX.gray)],
      [{ text: "MOF-801/303 (industry std.)", options: { bold: true } }, "High at low RH", "60–80°C", "$100+/kg", st("Rejected on cost", HEX.red)],
    ], { x: MX, y: 1.5, w: CW, colW: [3.3, 2.8, 2.3, 2.0, 1.93], rowH: 0.56, fontSize: 14 });
    await keyMsg(s, "Five sorbents beat silica gel on uptake or cost. We run the cheapest as primary and keep the rest in parallel.");
    s.addNotes("Primary MVP sorbent: Jute/CaCl₂. Parallel: Starch-PEG/CaCl₂ hydrogel. Scale-up: PANSAP. Silica gel is the reference. MOFs are rejected on cost.");
  }

  // ---------------- 9. Solar & waste heat ----------------
  {
    const s = newSlide("CONTENT", "Technology");
    s.addText("We deleted the electricity bill from the desorption step", { placeholder: "title" });
    const tw = (CW - 0.3) / 2;
    await iconCircle(s, "FaSun", MX, 1.45, 0.5, COL.amber, HEX.navy);
    T(s, "Solar thermal", { x: MX + 0.65, y: 1.45, w: 4, h: 0.5, fontSize: 18, bold: true, color: COL.navy, valign: "middle" });
    table(s, ["Method", "Temp", "Source", "Cost impact"], [
      ["Double-ended vacuum tube collector", "134.2°C peak", "Solar thermal", "Zero electrical desorption energy"],
      ["Photothermal hydrogel (MXene)", "71.1°C at 0.5 sun", "Passive solar", "Self-regenerating under sunlight"],
      ["Passive solar-driven desorption", "Ambient", "Passive", "Near-zero energy cost"],
      ["Thermal storage (PCM / sand)", "Overnight release", "Stored solar heat", "Eliminates peak power demand"],
    ], { x: MX, y: 2.05, w: tw, colW: [2.0, 1.2, 1.1, 1.715], rowH: 0.5, fontSize: 11.5, headFill: "B97300" });
    const rx = MX + tw + 0.3;
    await iconCircle(s, "FaIndustry", rx, 1.45, 0.5, HEX.orange);
    T(s, "Waste-heat recovery", { x: rx + 0.65, y: 1.45, w: 4, h: 0.5, fontSize: 18, bold: true, color: COL.navy, valign: "middle" });
    table(s, ["Configuration", "Energy savings", "Optimal conditions"], [
      ["Hybrid VCC + salt-solution circuit", "34.4%", "35–50% RH, 30°C"],
      ["Condenser waste-heat recovery", "Up to 67% less electricity", "Various"],
      ["Multicyclic sorption + waste heat", "Desorption in <10 min", "90°C waste heat"],
      ["Passive hybrid with sorption", "0.2 kWh/L achieved", "Moderate humidity"],
    ], { x: rx, y: 2.05, w: tw, colW: [2.5, 1.85, 1.665], rowH: 0.5, fontSize: 11.5, headFill: "B4521A" });
    // Flow: both feed same chamber
    const fy = 5.3;
    await iconCircle(s, "FaSun", 3.2, fy - 0.05, 0.8, COL.amber, HEX.navy);
    arrow(s, 4.1, fy + 0.4, 1.4, HEX.amber, 3);
    card(s, 5.65, fy - 0.05, 2.05, 0.9, { fill: COL.navy, line: false });
    T(s, "Desorption chamber", { x: 5.65, y: fy - 0.05, w: 2.05, h: 0.9, fontSize: 14, bold: true, color: COL.white, align: "center", valign: "middle" });
    s.addShape(pres.shapes.LINE, { x: 7.85, y: fy + 0.4, w: 1.4, h: 0, flipH: true, line: { color: HEX.orange, width: 3, endArrowType: "triangle" }, objectName: oid("arrow") });
    await iconCircle(s, "FaIndustry", 9.35, fy, 0.8, HEX.orange);
    T(s, "Integration targets: data centres, industrial facilities, commercial buildings with HVAC — anywhere waste heat already exists.", { x: MX, y: 4.75, w: CW, h: 0.45, fontSize: 14, italic: true, color: COL.gray, align: "center" });
    await keyMsg(s, "Desorption is the energy hog in every sorption AWG. We made it free with sunlight and waste heat.");
    s.addNotes("Explain the 134°C solar collector and the 34.4% waste-heat saving.\n\nVisual intent: two-panel diagram — solar collector loop on the left, waste-heat recovery loop on the right, both feeding the same desorption chamber.");
  }

  // ---------------- 10. Water quality ----------------
  {
    const s = newSlide("CONTENT", "Proof");
    s.addText("Water from air is pure at condensation. We make it potable and great-tasting", { placeholder: "title" });
    const stages = [["Sediment filter (5–10 µm)", "particulates", "9BD3EA"], ["Activated carbon block", "VOCs, odours, chlorine", "6FC0E0"], ["Reverse osmosis (optional)", "arid / dusty, higher TDS", "3FA6D3"], ["UV sterilisation (254 nm)", "bacteria and viruses", "1E86C0"], ["Mineralisation cartridge", "Ca + Mg for taste and health", "0A5E96"]];
    T(s, "5-stage filtration", { x: MX, y: 1.45, w: 4.2, h: 0.35, fontSize: 16, bold: true, color: COL.navy });
    stages.forEach((st, i) => {
      const y = 1.88 + i * 0.73;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX, y, w: 4.3, h: 0.64, rectRadius: 0.08, fill: { color: st[2] }, line: { type: "none" }, objectName: oid("stage") });
      T(s, String(i + 1), { x: MX + 0.12, y, w: 0.35, h: 0.64, fontSize: 18, bold: true, color: i < 2 ? COL.navy : COL.white, valign: "middle" });
      T(s, [{ text: st[0], options: { bold: true, breakLine: true } }, { text: st[1], options: { fontSize: 11 } }], { x: MX + 0.5, y, w: 3.7, h: 0.64, fontSize: 13, color: i < 2 ? COL.navy : COL.white, valign: "middle" });
    });
    const rx = 5.1, rw = W - MX - rx;
    T(s, "Testing protocol", { x: rx, y: 1.45, w: 4, h: 0.35, fontSize: 16, bold: true, color: COL.navy });
    table(s, ["Parameter", "Standard", "Method", "Frequency"], [
      ["pH", "6.5–8.5 (WHO)", "IoT pH sensor", "Daily"],
      ["TDS", "< 500 mg/L", "IoT TDS sensor", "Daily"],
      ["Turbidity", "< 5 NTU", "Turbidity meter", "Weekly"],
      ["Microbial", "0 CFU/100 mL", "Membrane filtration", "Monthly (3rd-party lab)"],
      ["Heavy metals", "Below WHO limits", "ICP-MS", "Quarterly (3rd-party lab)"],
    ], { x: rx, y: 1.88, w: rw, colW: [1.5, 1.85, 2.0, 2.383], rowH: 0.42, fontSize: 12.5 });
    T(s, "Certifications", { x: rx, y: 4.55, w: 2, h: 0.3, fontSize: 12, bold: true, color: COL.gray });
    ["ASSE 1090", "BIS (India)", "NSF/ANSI 372", "WHO Guidelines"].forEach((c, i) => pill(s, c, rx + i * 1.95, 4.88, 1.8, 0.38, COL.blue, COL.white, 12));
    T(s, "New sorbents: PANSAP condensate validated against Brazilian potable standards. Post-treatment with remineralisation is standard.", { x: rx, y: 5.4, w: rw, h: 0.6, fontSize: 12, italic: true, color: COL.gray });
    await keyMsg(s, "Cheap water is worthless if it is unsafe. Certification is a cost of entry, not an afterthought.");
    s.addNotes("PROVE YOU ARE RIGOROUS, NOT JUST CLEVER (Slides 9–11). Cheap water that fails a microbial test is a liability. Walk through the 5-stage filtration and the testing frequency.\n\nVisual to add: photo of a real lab water-quality report.");
  }

  // ---------------- 11. MVP ----------------
  {
    const s = newSlide("CONTENT", "Proof");
    s.addText("The MVP: two prototypes, one validation plan, a clear path to scale", { placeholder: "title" });
    table(s, ["Metric", "MVP: 100 L/day", "Scale-up: 1,000 L/day"], [
      ["Water output", "100 L/day @ 30°C, 60% RH", "1,000 L/day @ 30°C, 60% RH"],
      ["Specific energy", "< 1.5 kWh/L", "< 1.0 kWh/L"],
      ["Water quality", "WHO/EPA potable", "WHO/EPA potable"],
      ["Uptime", "> 90%", "> 95%"],
      ["Unit cost", "< $8,000 all-in", "< $40,000 all-in"],
    ], { x: MX, y: 1.5, w: 5.6, colW: [1.5, 2.05, 2.05], rowH: 0.62, fontSize: 12.5 });
    T(s, "Scale the same architecture 10x.", { x: MX, y: 5.35, w: 5.6, h: 0.5, fontSize: 15, bold: true, italic: true, color: COL.blue });
    const pw = (W - MX - 6.4 - 0.25) / 2;
    const protos = [
      ["FaSnowflake", COL.blue, "Prototype A", "Condensation · humid climates", "Hermetic rotary compressor (1.5 HP, R410A), microchannel evaporator + condenser coils, thermostatic expansion valve, 120–200 CFM axial fan, ESP32 IoT controller. Airflow 500–800 m³/h; evaporator coil at 5–10°C."],
      ["FaLeaf", COL.green, "Prototype B", "Sorption · arid climates", "Dual chamber, continuous: Chamber A adsorbs while Chamber B desorbs. 12 kg Jute/CaCl₂ sorbent. Solar thermal collector + waste-heat loop for desorption."],
    ];
    for (let i = 0; i < 2; i++) {
      const x = 6.4 + i * (pw + 0.25);
      card(s, x, 1.5, pw, 4.55);
      await iconCircle(s, protos[i][0], x + 0.25, 1.7, 0.7, protos[i][1]);
      T(s, protos[i][2], { x: x + 1.1, y: 1.72, w: pw - 1.2, h: 0.35, fontSize: 18, bold: true, color: COL.navy });
      T(s, protos[i][3], { x: x + 1.1, y: 2.07, w: pw - 1.2, h: 0.35, fontSize: 12, bold: true, color: protos[i][1] });
      T(s, protos[i][4], { x: x + 0.25, y: 2.65, w: pw - 0.45, h: 3.2, fontSize: 13 });
    }
    await keyMsg(s, "We prove the technology at 100 L/day for under $4,000 in materials — then scale the same architecture to 1,000 L/day.");
    s.addNotes("Visual to add: two side-by-side prototype renders with labelled subsystems (or real photos once built). Full sorption-unit BOM is on the next slide.");
  }

  // ---------------- 12. BOM ----------------
  {
    const s = newSlide("CONTENT", "Proof");
    s.addText("Sorption MVP bill of materials: under $4,000", { placeholder: "title" });
    const bom = [["Sorbent (Jute/CaCl₂, 12 kg)", "$50–100"], ["Adsorption chambers + heat exchangers", "$400–800"], ["Solar thermal collector (4.86 m²)", "$300–500"], ["Condenser coil", "$150–300"], ["Fans", "$80–150"], ["Valves & controls", "$200–400"], ["Thermal storage", "$100–200"], ["5-stage filtration", "$300–600"], ["Storage tank (100–200 L)", "$100–200"], ["IoT controller", "$50–100"], ["Enclosure & frame", "$200–400"], ["Miscellaneous", "$100–200"]];
    const tw = 4.15;
    table(s, ["Component", "Cost (USD)"], bom.slice(0, 6), { x: MX, y: 1.5, w: tw, colW: [2.9, 1.25], rowH: 0.62, fontSize: 12.5 });
    table(s, ["Component", "Cost (USD)"], bom.slice(6), { x: MX + tw + 0.25, y: 1.5, w: tw, colW: [2.9, 1.25], rowH: 0.62, fontSize: 12.5 });
    const rx = MX + 2 * tw + 0.5, rw = W - MX - rx;
    card(s, rx, 1.5, rw, 4.55, { fill: COL.navy, line: false });
    T(s, "TOTAL BOM", { x: rx + 0.3, y: 1.75, w: rw - 0.6, h: 0.3, fontSize: 13, bold: true, color: COL.aqua });
    T(s, "$2,030–\n$3,950", { x: rx + 0.3, y: 2.1, w: rw - 0.6, h: 1.5, fontSize: 40, bold: true, color: COL.amber, fontFace: "Arial" });
    T(s, "vs $8,000–$12,000 for a conventional 100 L/day AWG", { x: rx + 0.3, y: 3.75, w: rw - 0.6, h: 0.75, fontSize: 15, color: COL.white });
    T(s, [{ text: "Sorbent is just ", options: {} }, { text: "$50–100", options: { bold: true, color: COL.amber } }, { text: " of it.", options: {} }], { x: rx + 0.3, y: 4.8, w: rw - 0.6, h: 0.9, fontSize: 15, color: COL.white });
    await keyMsg(s, "60–75% lower CapEx than a conventional AWG — and the costliest parts (chambers, filtration) get cheaper with volume.");
    s.addNotes("Have the full BOM ready in the appendix for both condensation and sorption units.");
  }

  // ---------------- 13. Validation roadmap ----------------
  {
    const s = newSlide("CONTENT", "Proof");
    s.addText("MVP validation: lab → field → certification in 12 months", { placeholder: "title" });
    const ph = [
      ["Design & simulation", "M 0–2", "Thermodynamic modelling, CAD, component sourcing", "Design package, BOM"],
      ["Prototype build", "M 2–4", "Assemble condensation MVP and sorption MVP", "Two working prototypes"],
      ["Lab testing", "M 4–6", "Controlled chamber: 20/25/30/35°C × 30–80% RH (6 steps)", "Performance curves, optimisation report"],
      ["Field pilot", "M 6–9", "1 humid site (Mumbai/Chennai) + 1 arid site (Delhi/Ahmedabad), 3 months continuous", "Field data, MTBF, water quality reports"],
      ["Certification", "M 9–12", "ASSE 1090, BIS, third-party water testing", "Certifications, validated unit economics"],
      ["Scale-up design", "M 12–18", "Design 1,000 L/day unit from MVP learnings", "Scale-up design, manufacturing plan"],
    ];
    const cw = (CW - 5 * 0.15) / 6;
    s.addShape(pres.shapes.LINE, { x: MX + cw / 2, y: 1.85, w: CW - cw, h: 0, line: { color: HEX.aqua, width: 3 }, objectName: oid("timeline") });
    ph.forEach((p, i) => {
      const x = MX + i * (cw + 0.15);
      const fill = i === 5 ? COL.amber : COL.blue;
      s.addShape(pres.shapes.OVAL, { x: x + cw / 2 - 0.22, y: 1.63, w: 0.44, h: 0.44, fill: { color: fill }, line: { color: HEX.white, width: 2 }, objectName: oid("gate") });
      T(s, p[1], { x, y: 1.3, w: cw, h: 0.3, fontSize: 12, bold: true, color: COL.gray, align: "center" });
      card(s, x, 2.3, cw, 3.75);
      T(s, p[0], { x: x + 0.12, y: 2.4, w: cw - 0.24, h: 0.6, fontSize: 14, bold: true, color: COL.navy });
      T(s, p[2], { x: x + 0.12, y: 3.0, w: cw - 0.24, h: 1.6, fontSize: 12 });
      T(s, [{ text: "Delivers", options: { bold: true, color: COL.green, breakLine: true } }, { text: p[3] }], { x: x + 0.12, y: 4.65, w: cw - 0.24, h: 1.3, fontSize: 12 });
    });
    await keyMsg(s, "We do not claim performance. We measure it: L/h, kWh/L, TDS and pH, and mean time between failures.");
    s.addNotes("This slide is what separates you from a hobbyist: two prototypes, two climates, 12 months, measurable gates.\n\nKey measurements: water production rate (L/h), energy consumption (kWh/L), condensate quality (TDS, pH), mean time between failures (MTBF).\n\nLab matrix: 20/25/30/35°C × 30/40/50/60/70/80% RH.\n\nVisual to add: photos of the test chamber and field sites.");
  }

  // ---------------- 14. Unit economics hero ----------------
  {
    const s = newSlide("CONTENT", "Business");
    s.addText("Under 24-month payback. 70–85% gross margin at scale", { placeholder: "title" });
    card(s, MX, 1.5, 7.2, 4.6);
    s.addChart(pres.charts.BAR, [{ name: "LCOW ($/L)", labels: ["Published Jute/CaCl₂", "Our sorption MVP", "MVP + waste heat", "Scaled + waste heat", "PANSAP + passive solar"], values: [0.086, 0.045, 0.035, 0.028, 0.0075] }], Object.assign(chartBase("Every lever compounds: LCOW in $ per litre"), {
      x: MX + 0.15, y: 1.6, w: 6.9, h: 4.15, barDir: "col", chartColors: ["9AA9B5", HEX.blue, HEX.blue, HEX.blue, HEX.amber],
      showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "$0.000", valAxisHidden: true, valGridLine: { style: "none" }, valAxisMinVal: 0, valAxisMaxVal: 0.1, barGapWidthPct: 40, catAxisLabelFontSize: 11, objectName: "chart-lcow-waterfall",
    }));
    T(s, "Last bar = $0.005–$0.01/L range (midpoint shown)", { x: MX + 0.2, y: 5.72, w: 6.8, h: 0.3, fontSize: 10, italic: true, color: COL.gray, align: "right" });
    const rx = 8.0, rw = W - MX - rx;
    const stats = [["<24 mo", "payback"], ["70–85%", "gross margin at scale"], ["₹5–8/L", "price in India ($0.06–$0.10)"]];
    stats.forEach((t, i) => {
      const x = rx + i * ((rw - 0.3) / 3 + 0.15), w = (rw - 0.3) / 3;
      card(s, x, 1.5, w, 1.3, { fill: COL.ice, line: false, shadow: false });
      T(s, t[0], { x: x + 0.1, y: 1.58, w: w - 0.2, h: 0.6, fontSize: 21, bold: true, color: COL.blue, fontFace: "Arial", align: "center", valign: "middle" });
      T(s, t[1], { x: x + 0.1, y: 2.18, w: w - 0.2, h: 0.55, fontSize: 11, color: COL.gray, align: "center" });
    });
    T(s, "LCOW by climate (our system)", { x: rx, y: 3.0, w: rw, h: 0.3, fontSize: 13, bold: true, color: COL.navy });
    table(s, ["Climate", "Grid", "Existing solar", "Solar thermal + waste heat"], [
      ["Tropical", "$0.06/L", "$0.02/L", { text: "$0.008/L", options: { bold: true, color: HEX.green } }],
      ["Temperate", "$0.09/L", "$0.04/L", { text: "$0.010/L", options: { bold: true, color: HEX.green } }],
      ["Arid", "$0.17/L", "$0.09/L", { text: "$0.012/L", options: { bold: true, color: HEX.green } }],
    ], { x: rx, y: 3.35, w: rw, colW: [1.05, 0.95, 1.1, 1.733], rowH: 0.62, fontSize: 12 });
    await keyMsg(s, "Every cost-reduction lever compounds. Sorbent + solar thermal + waste heat takes us from competitive to unbeatable.");
    s.addNotes("THE COMMERCIAL CORE (Slides 12–14). The LCOW waterfall is the single most important visual in the deck. Walk from $0.086/L (published Jute/CaCl₂ result) to $0.005/L lever by lever:\n• $0.086 published Jute/CaCl₂ result\n• $0.045 our sorption MVP\n• $0.035 MVP with waste-heat recovery (−34%)\n• $0.028 scaled system with waste heat\n• $0.005–0.01 PANSAP + passive solar\n\nRevenue: ₹5–8/L in India ($0.06–$0.10/L). Gross margin 70–85% at scale. Visual to add: payback timeline.");
  }

  // ---------------- 15. Unit economics table ----------------
  {
    const s = newSlide("CONTENT", "Business");
    s.addText("Unit economics in detail", { placeholder: "title" });
    T(s, "Assumptions: 100 L/day unit · 300 days/year = 30,000 L/year · 5-year CapEx amortisation", { x: MX, y: 1.3, w: CW, h: 0.3, fontSize: 13, italic: true, color: COL.gray });
    const hl = (t) => ({ text: t, options: { bold: true, color: HEX.blue } });
    table(s, ["Parameter", "Conventional AWG", "Our sorption MVP", "Our scaled system"], [
      ["CapEx", "$8,000–12,000", "$4,000", "$3,500 (at volume)"],
      ["Annual production", "30,000 L", "30,000 L", "30,000 L"],
      ["Amortised CapEx / year", "$1,600–2,400", "$800", "$700"],
      ["Sorbent replacement", "—", "$50/yr (2-yr cycle)", "$25/yr (PANSAP, 3-yr cycle)"],
      ["Filters", "$300/yr", "$300/yr", "$250/yr"],
      ["Labour", "$200/yr", "$200/yr", "$150/yr"],
      ["Electricity", "$1,200–2,500/yr", "$0–200/yr", "$0–100/yr"],
      [{ text: "Total annual OpEx", options: { bold: true } }, "$3,300–5,400", hl("$1,350"), hl("$1,125")],
      [{ text: "LCOW", options: { bold: true } }, "$0.06–$0.09/L", hl("$0.045/L"), hl("$0.037/L")],
      [{ text: "LCOW with waste-heat recovery (−34%)", options: { bold: true } }, "—", hl("$0.035/L"), hl("$0.028/L")],
      [{ text: "LCOW with PANSAP + passive solar", options: { bold: true } }, "—", "—", { text: "$0.005–0.01/L", options: { bold: true, color: HEX.ink } }],
    ], { x: MX, y: 1.65, w: CW, colW: [3.9, 2.8, 2.8, 2.833], rowH: 0.35, fontSize: 12.5, boldLast: true });
    await keyMsg(s, "Electricity is the line we delete: $1,200–2,500/yr for a conventional AWG vs $0–200/yr for ours.");
    s.addNotes("Investors need to see that this is a business, not a research project. Note that the conventional AWG LCOW here ($0.06–0.09/L) includes amortised CapEx, filters and labour.");
  }

  // ---------------- 16. Market ----------------
  {
    const s = newSlide("CONTENT", "Business");
    s.addText("A billion-dollar market with a government-backed beachhead", { placeholder: "title" });
    const fun = [["TAM", "$1.158B", "Global AWG market by 2034 · 8.70% CAGR", 4.3, COL.navy], ["SAM", "$250M+", "India + UAE + Philippines + Africa institutional water", 3.5, COL.blue], ["SOM", "$8M", "2,000 units by Year 3", 2.7, COL.aqua]];
    fun.forEach((f, i) => {
      const y = 1.5 + i * 1.5, x = MX + (4.3 - f[3]) / 2;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: f[3], h: 1.35, rectRadius: 0.12, fill: { color: f[4] }, line: { type: "none" }, objectName: oid("funnel") });
      T(s, [{ text: f[0] + "  ", options: { fontSize: 13, color: i === 2 ? COL.navy : COL.aqua } }, { text: f[1], options: { fontSize: 26 } }], { x: x + 0.1, y: y + 0.1, w: f[3] - 0.2, h: 0.6, bold: true, color: i === 2 ? COL.navy : COL.white, align: "center", valign: "middle", fontFace: "Arial" });
      T(s, f[2], { x: x + 0.15, y: y + 0.7, w: f[3] - 0.3, h: 0.6, fontSize: 11.5, color: i === 2 ? COL.navy : COL.white, align: "center" });
    });
    const rx = 5.1, rw = W - MX - rx;
    const pr = (t) => ({ text: t, options: { bold: true, color: t === "Tier 1" ? HEX.green : t === "Tier 2" ? HEX.blue : HEX.gray } });
    table(s, ["Segment", "Water need", "Willingness to pay", "Priority"], [
      ["Railway stations (India)", "500–5,000 L/day", "₹3.5–5/L", pr("Tier 1")],
      ["Hospitals & clinics", "200–2,000 L/day", "₹5–8/L", pr("Tier 1")],
      ["Corporate campuses", "1,000–10,000 L/day", "₹4–6/L", pr("Tier 2")],
      [{ text: "Data centres (waste-heat sites)", options: { bold: true, color: HEX.orange } }, "5,000–50,000 L/day", "$0.10–0.20/L", pr("Tier 2")],
      ["Residential (off-grid)", "10–50 L/day", "$0.20–0.40/L", pr("Tier 3")],
      ["Events & hospitality", "100–1,000 L/day", "₹8–15/L", pr("Tier 3")],
    ], { x: rx, y: 1.5, w: rw, colW: [2.65, 1.85, 1.85, 1.383], rowH: 0.48, fontSize: 12.5 });
    T(s, [{ text: "Why data centres: ", options: { bold: true, color: HEX.orange } }, { text: "they make continuous waste heat and already pay for cooling water. We turn their waste heat into free desorption energy." }], { x: rx, y: 5.0, w: rw, h: 0.95, fontSize: 13 });
    await keyMsg(s, "Start with Indian Railways tenders. Expand into waste-heat-rich facilities where our economics are strongest.");
    s.addNotes("Visual intent: TAM → SAM → SOM funnel, icons per segment, with the data-centre waste-heat loop highlighted.");
  }

  // ---------------- 17. Business model ----------------
  {
    const s = newSlide("CONTENT", "Business");
    s.addText("Four revenue streams. One recurring-margin engine", { placeholder: "title" });
    card(s, MX, 1.5, 4.0, 4.6);
    s.addChart(pres.charts.DOUGHNUT, [{ name: "Revenue mix", labels: ["WaaS subscriptions", "Equipment sales / leasing", "Franchise fees & royalties"], values: [60, 25, 15] }], Object.assign(chartBase("Revenue mix"), {
      x: MX + 0.1, y: 1.6, w: 3.8, h: 3.1, chartColors: [HEX.blue, HEX.aqua, HEX.amber], holeSize: 55, showValue: false, showPercent: true, dataLabelColor: HEX.white, dataLabelFontSize: 12, objectName: "chart-revenue-mix",
    }));
    T(s, [
      { text: "60% ", options: { bold: true, color: COL.blue } }, { text: "WaaS — monthly fee for guaranteed water volume", options: { breakLine: true } },
      { text: "25% ", options: { bold: true, color: COL.aqua } }, { text: "Sale or lease-to-own, 15%+ ROI", options: { breakLine: true } },
      { text: "15% ", options: { bold: true, color: COL.amber } }, { text: "Local entrepreneurs deploy and maintain", options: { breakLine: true } },
      { text: "+ Premium bottled water (optional): hotels, airlines, events", options: { italic: true, color: COL.gray } },
    ], { x: MX + 0.2, y: 4.7, w: 3.6, h: 1.35, fontSize: 11.5 });
    // Pricing comparison
    const mx = 4.75, mw = 4.0;
    card(s, mx, 1.5, mw, 4.6);
    T(s, "Price per litre in India", { x: mx + 0.25, y: 1.65, w: mw - 0.5, h: 0.35, fontSize: 14, bold: true, color: COL.navy });
    const pb = [["Bottled", "₹15–20/L", 2.2, COL.red], ["Tanker", "₹5–10/L", 1.1, COL.amber], ["AcquaHT", "₹3.5–8/L", 0.88, COL.blue]];
    pb.forEach((b, i) => {
      const y = 2.15 + i * 0.85;
      T(s, b[0], { x: mx + 0.25, y, w: 2, h: 0.3, fontSize: 12, bold: true, color: COL.gray });
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: mx + 0.25, y: y + 0.3, w: b[2], h: 0.4, rectRadius: 0.06, fill: { color: b[3] }, line: { type: "none" }, objectName: oid("bar") });
      T(s, b[1], { x: mx + 0.25 + b[2] + 0.1, y: y + 0.3, w: 1.6, h: 0.4, fontSize: 13, bold: true, color: b[3], valign: "middle" });
    });
    T(s, [{ text: "Undercuts bottled water by 60–80%.", options: { bold: true, breakLine: true } }, { text: "UAE / Saudi: $0.10–$0.15/L — below desalinated delivery in remote areas.", options: { color: COL.gray } }], { x: mx + 0.25, y: 4.75, w: mw - 0.5, h: 1.2, fontSize: 12.5 });
    // Sorbent licensing
    const rx = 9.0, rw = W - MX - rx;
    card(s, rx, 1.5, rw, 4.6, { fill: COL.navy, line: false });
    await iconCircle(s, "FaKey", rx + 0.25, 1.7, 0.6, COL.amber, HEX.navy);
    T(s, "NEW: Sorbent-as-a-Component", { x: rx + 0.25, y: 2.4, w: rw - 0.5, h: 0.7, fontSize: 16, bold: true, color: COL.amber });
    T(s, "License our Jute/CaCl₂ and PANSAP formulations to existing AWG makers as a drop-in efficiency upgrade. Follows the EU-funded ThinAirWater model. High-margin, capital-light — monetises our IP independent of unit sales.", { x: rx + 0.25, y: 3.1, w: rw - 0.45, h: 2.85, fontSize: 13, color: COL.white });
    await keyMsg(s, "We own the distribution and the sorbent IP. Both generate recurring revenue.");
    s.addNotes("Show the revenue model and the sorbent-licensing upside. ThinAirWater (EU-funded) is launching its technology as a material component inside existing generators — the same model we follow for licensing.");
  }

  // ---------------- 18. GTM ----------------
  {
    const s = newSlide("CONTENT", "Business");
    s.addText("Beachhead: Indian Railways. Then waste-heat sites, hospitals, franchises", { placeholder: "title" });
    const ph = [
      ["FaTrain", COL.blue, "Phase 1 · Beachhead", "Months 0–9", ["Bid for Indian Railways AWG tenders: zonal railways, hospitals, colonies, level crossings", "10-unit pilot in Mumbai/Chennai (humid) + Delhi (arid)", "Publish validated LCOW + water quality report"]],
      ["FaIndustry", HEX.orange, "Phase 2 · Scale", "Months 9–18", ["Hospitals, corporate campuses, data centres with existing waste heat", "Sign 3 franchise partners", "Break-even on pilot units"]],
      ["FaGlobeAsia", COL.green, "Phase 3 · Expand", "Months 18–30", ["Enter UAE and Philippines", "PANSAP sorbent line for arid India", "Start sorbent-as-a-component licensing", "Raise Series A"]],
    ];
    const cw = (CW - 0.4) / 3;
    for (let i = 0; i < 3; i++) {
      const x = MX + i * (cw + 0.2);
      card(s, x, 1.5, cw, 3.55);
      await iconCircle(s, ph[i][0], x + 0.25, 1.68, 0.65, ph[i][1]);
      T(s, ph[i][2], { x: x + 1.05, y: 1.7, w: cw - 1.2, h: 0.35, fontSize: 16, bold: true, color: COL.navy });
      T(s, ph[i][3], { x: x + 1.05, y: 2.05, w: cw - 1.2, h: 0.3, fontSize: 12, bold: true, color: COL.gray });
      T(s, ph[i][4].map((b, j) => ({ text: b, options: { bullet: true, breakLine: j < ph[i][4].length - 1 } })), { x: x + 0.25, y: 2.5, w: cw - 0.45, h: 2.45, fontSize: 13, paraSpaceAfter: 6 });
      if (i < 2) arrow(s, x + cw - 0.05, 3.25, 0.3, HEX.gray, 2);
    }
    T(s, "Sales funnel", { x: MX, y: 5.2, w: 2, h: 0.3, fontSize: 12, bold: true, color: COL.gray });
    const fn = ["Tender", "Pilot", "Scale", "Franchise", "License"];
    fn.forEach((f, i) => {
      pill(s, f, MX + 1.5 + i * 2.15, 5.15, 1.7, 0.42, [COL.navy, COL.blue, COL.aqua, COL.green, COL.amber][i], i === 4 ? COL.navy : COL.white, 13);
      if (i < 4) arrow(s, MX + 1.5 + i * 2.15 + 1.75, 5.36, 0.35, HEX.gray, 1.5);
    });
    T(s, "Channels: government tenders · direct enterprise sales · franchise network · OEM sorbent licensing", { x: MX, y: 5.7, w: CW, h: 0.35, fontSize: 12.5, italic: true, color: COL.gray });
    await keyMsg(s, "Tenders give volume. Waste-heat sites give margins. Franchising gives speed. Licensing gives capital-light upside.");
    s.addNotes("SHOW YOU CAN SELL AND DEFEND (Slides 15–17). Government tenders give volume with low customer-acquisition cost. Waste-heat sites give the best margins. Franchising gives speed.\n\nVisual to add: map of India with pilot cities (Mumbai, Chennai, Delhi) and expansion arrows to UAE and Philippines.");
  }

  // ---------------- 19. Traction ----------------
  {
    const s = newSlide("CONTENT", "Business");
    s.addText("Traction & validation: [insert current traction here]", { placeholder: "title" });
    const items = [
      ["FaFileContract", COL.blue, "Pipeline", "[X] letters of intent from hospitals, corporates or data centres"],
      ["FaLandmark", COL.navy, "Government", "[Y] railway tender submitted or pre-qualified"],
      ["FaTools", COL.amber, "Prototypes", "Condensation + sorption MVP build status: [status]"],
      ["FaMicroscope", COL.green, "Sorbent validation", "Jute/CaCl₂ and PANSAP lab performance data: [data]"],
      ["FaCertificate", COL.blue, "Certifications", "ASSE 1090 and BIS applications: [in progress]"],
      ["FaHandshake", COL.aqua, "Partnerships", "[HVAC manufacturer], [solar thermal supplier], [waste-heat host site]"],
      ["FaTint", COL.navy, "Water quality", "Third-party test results from pilot units: [results]"],
      ["FaChartLine", COL.green, "Next milestone", "[Insert the next proof point and its date]"],
    ];
    const cw = (CW - 0.6) / 4;
    for (let i = 0; i < 8; i++) {
      const x = MX + (i % 4) * (cw + 0.2), y = 1.5 + Math.floor(i / 4) * 2.35;
      card(s, x, y, cw, 2.2);
      await iconCircle(s, items[i][0], x + 0.2, y + 0.2, 0.6, items[i][1]);
      T(s, items[i][2], { x: x + 0.95, y: y + 0.25, w: cw - 1.05, h: 0.5, fontSize: 15, bold: true, color: COL.navy, valign: "middle" });
      T(s, items[i][3], { x: x + 0.2, y: y + 0.95, w: cw - 0.4, h: 1.15, fontSize: 13 });
    }
    await keyMsg(s, "We are not starting from zero — we have a validation plan with measurable milestones.");
    s.addNotes("FILL THIS IN BEFORE PRESENTING. Replace every [bracket] with real numbers. YC partners look at traction first.\n\nVisual to add: partner logos, photo of prototype, water quality certificate, sorbent performance chart.");
  }

  // ---------------- 20. Competition ----------------
  {
    const s = newSlide("CONTENT", "Business");
    s.addText("We win on cost and defend on sorbent IP and system architecture", { placeholder: "title" });
    // 2x2
    const gx = MX + 0.45, gy = 1.55, gw = 4.4, gh = 4.1;
    card(s, MX, 1.45, 5.0, 4.65, { shadow: false });
    s.addShape(pres.shapes.LINE, { x: gx, y: gy + gh / 2, w: gw, h: 0, line: { color: HEX.line, width: 1 }, objectName: oid("axis") });
    s.addShape(pres.shapes.LINE, { x: gx + gw / 2, y: gy, w: 0, h: gh, line: { color: HEX.line, width: 1 }, objectName: oid("axis") });
    T(s, "Low cost →", { x: gx, y: gy + gh + 0.05, w: gw, h: 0.3, fontSize: 11, bold: true, color: COL.gray, align: "right" });
    T(s, "Scalability →", { x: MX + 0.05, y: gy + gh - 1.2, w: 0.35, h: 1.2, fontSize: 11, bold: true, color: COL.gray, vert: "vert270" });
    const dots = [["Bottled water", 0.12, 0.62, HEX.red], ["Tanker water", 0.42, 0.30, HEX.gray], ["RO / Desal", 0.18, 0.18, HEX.gray], ["Conventional AWG", 0.30, 0.82, HEX.aqua], ["Watergen · Akvo · Uravu", 0.42, 0.55, HEX.blue], ["AcquaHT", 0.88, 0.85, HEX.amber]];
    dots.forEach((d) => {
      const x = gx + d[1] * gw, y = gy + (1 - d[2]) * gh;
      const big = d[0] === "AcquaHT";
      const r = big ? 0.32 : 0.2;
      s.addShape(pres.shapes.OVAL, { x: x - r / 2, y: y - r / 2, w: r, h: r, fill: { color: d[3] }, line: { type: "none" }, objectName: oid("dot") });
      T(s, d[0], { x: big ? x - 1.6 : x + 0.15, y: y + (big ? 0.2 : -0.15), w: 1.9, h: 0.3, fontSize: big ? 14 : 11, bold: true, color: big ? COL.navy : COL.ink, align: big ? "right" : "left" });
    });
    const rx = 5.75, rw = W - MX - rx;
    table(s, ["Competitor", "Weakness", "Our advantage"], [
      ["Bottled water", "₹15–20/L, plastic waste", "₹0.40–0.80/L production cost, zero plastic"],
      ["Tanker water", "Unreliable, contaminated", "On-site, certified, IoT-monitored"],
      ["RO / Desalination", "Needs source water, coastal only", "Works anywhere RH >30%"],
      ["Conventional AWG", "$0.06–0.17/L, high CapEx", "$0.005–0.01/L, 60–75% lower CapEx"],
      ["Watergen, Akvo, Uravu", "Strong brands, MOF/silica-based", "Agri-waste sorbents, solar thermal, waste heat"],
    ], { x: rx, y: 1.45, w: rw, colW: [1.9, 2.5, 2.683], rowH: 0.72, fontSize: 12 });
    await keyMsg(s, "Anyone can buy a compressor. Nobody else has our sorbent cost structure or our hybrid thermal architecture.");
    s.addNotes("Positions on the 2×2 are qualitative (cost vs scalability). AcquaHT sits top-right.");
  }

  // ---------------- 21. Moat ----------------
  {
    const s = newSlide("CONTENT", "Business");
    s.addText("Our moat has three layers", { placeholder: "title" });
    const layers = [
      ["FaFlask", COL.green, "1. Sorbent formulation IP", "Jute/CaCl₂ composite and PANSAP processing know-how. Patentable, hard to reverse-engineer and licensable."],
      ["FaCogs", COL.blue, "2. Hybrid system architecture", "The four-stage condensation → sorption → solar thermal → storage chain, including the waste-heat recovery loop. Patentable as a system claim."],
      ["FaDatabase", COL.navy, "3. Deployment data", "Climate-specific performance curves from lab and field testing. Every unit sold improves our optimisation models."],
    ];
    for (let i = 0; i < 3; i++) {
      const inset = i * 0.6, y = 1.5 + i * 1.5;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: MX + inset, y, w: CW - 2 * inset, h: 1.35, rectRadius: 0.14, fill: { color: [HEX.ice, "D3E8F4", "BBDCEF"][i] }, line: { type: "none" }, objectName: oid("layer") });
      await iconCircle(s, layers[i][0], MX + inset + 0.3, y + 0.3, 0.75, layers[i][1]);
      T(s, layers[i][2], { x: MX + inset + 1.3, y: y + 0.15, w: 4.5, h: 0.45, fontSize: 18, bold: true, color: COL.navy, valign: "middle" });
      T(s, layers[i][3], { x: MX + inset + 1.3, y: y + 0.6, w: CW - 2 * inset - 1.6, h: 0.7, fontSize: 14 });
    }
    await keyMsg(s, "Cost is our attack. IP, architecture and data are our defence.");
    s.addNotes("Hit the three-layer moat hard — sorbent IP, system architecture and deployment data.");
  }

  // ---------------- 22. Financials ----------------
  {
    const s = newSlide("CONTENT", "The Ask");
    s.addText("$8M revenue by Year 3. Break-even by Month 18–20", { placeholder: "title" });
    card(s, MX, 1.5, 7.4, 4.6);
    s.addChart(pres.charts.BAR, [{ name: "Revenue", labels: ["Year 1", "Year 2", "Year 3"], values: [0.4, 2.0, 8.0] }], Object.assign(chartBase("Revenue ($M)"), {
      x: MX + 0.15, y: 1.6, w: 7.1, h: 4.4, barDir: "col", chartColors: [HEX.blue, HEX.blue, HEX.amber], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "$0.0\"M\"",
      valAxisHidden: true, valGridLine: { style: "none" }, valAxisMinVal: 0, valAxisMaxVal: 9.5, barGapWidthPct: 55, objectName: "chart-revenue",
    }));
    const rx = 8.15, rw = W - MX - rx;
    table(s, ["Year", "Units", "Revenue", "Net margin"], [
      ["Year 1", "100", "$400,000", { text: "−15%", options: { color: HEX.red, bold: true } }],
      ["Year 2", "500", "$2,000,000", { text: "15%", options: { color: HEX.green, bold: true } }],
      ["Year 3", "2,000", "$8,000,000", { text: "30%+", options: { color: HEX.green, bold: true } }],
    ], { x: rx, y: 1.5, w: rw, colW: [0.95, 0.9, 1.6, 1.233], rowH: 0.55, fontSize: 13 });
    T(s, [
      { text: "Blended model: ", options: { bold: true } }, { text: "60% WaaS, 25% equipment, 15% franchise/licensing.", options: { breakLine: true } },
      { text: "Avg revenue per unit: ", options: { bold: true } }, { text: "$4,000/year.", options: { breakLine: true } },
      { text: "Margin grows with: ", options: { bold: true } }, { text: "falling sorbent costs and the shift to PANSAP at volume." },
    ], { x: rx, y: 3.85, w: rw, h: 2.2, fontSize: 13, paraSpaceAfter: 6 });
    await keyMsg(s, "Year 1 loses money on purpose: it buys the proof. Margins expand as sorbent costs fall.");
    s.addNotes("FINANCIALS AND ROADMAP (Slides 18–20). Be honest about Year 1 losses. Be specific about what this round buys.");
  }

  // ---------------- 23. The Ask ----------------
  {
    const s = newSlide("CONTENT_DARK", "The Ask");
    s.addText("Raising $650,000 to prove the tech and ship the first units", { placeholder: "title" });
    s.addChart(pres.charts.DOUGHNUT, [{ name: "Use of funds", labels: ["MVP build, lab & field pilot", "Certification", "Manufacturing & tooling", "Pilot deployment (25–50 units)", "Working capital", "Marketing, sales & tenders"], values: [150, 80, 150, 150, 80, 40] }], Object.assign(chartBase(""), {
      x: MX, y: 1.45, w: 3.4, h: 3.4, chartColors: [HEX.aqua, HEX.amber, HEX.blue, "7FD0E8", HEX.green, "F7C873"], holeSize: 60, showValue: false, showPercent: false, objectName: "chart-use-of-funds",
    }));
    T(s, "$650K", { x: MX, y: 2.75, w: 3.4, h: 0.8, fontSize: 30, bold: true, color: COL.white, align: "center", valign: "middle", fontFace: "Arial" });
    const sw = ["3FB6D9", "F2A124", "1273B5", "7FD0E8", "2E9E6A", "F7C873"];
    const rows = [["MVP build, lab testing & field pilot (2 prototypes, 2 sites)", "$150,000", "23%"], ["Certification (ASSE 1090, BIS, WHO validation)", "$80,000", "12%"], ["Manufacturing partnership & tooling", "$150,000", "23%"], ["Pilot deployment (25–50 units, humid + arid)", "$150,000", "23%"], ["Working capital", "$80,000", "12%"], ["Marketing, sales & government tenders", "$40,000", "7%"]];
    const tx = 4.1;
    rows.forEach((r, i) => {
      const y = 1.5 + i * 0.56;
      s.addShape(pres.shapes.OVAL, { x: tx, y: y + 0.13, w: 0.22, h: 0.22, fill: { color: sw[i] }, line: { type: "none" }, objectName: oid("swatch") });
      T(s, r[0], { x: tx + 0.35, y, w: 3.95, h: 0.5, fontSize: 12.5, color: COL.white, valign: "middle" });
      T(s, r[1], { x: tx + 4.3, y, w: 0.95, h: 0.5, fontSize: 13, bold: true, color: COL.amber, valign: "middle", align: "right" });
      T(s, r[2], { x: tx + 5.25, y, w: 0.5, h: 0.5, fontSize: 12, color: COL.aqua, valign: "middle", align: "right" });
    });
    const mx = 10.15, mw = W - MX - mx;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: mx, y: 1.45, w: mw, h: 4.65, rectRadius: 0.14, fill: { color: COL.white, transparency: 90 }, line: { color: HEX.aqua, width: 1 }, objectName: oid("panel") });
    T(s, "This round buys", { x: mx + 0.2, y: 1.6, w: mw - 0.4, h: 0.35, fontSize: 15, bold: true, color: COL.amber });
    const ms = ["Two validated 100 L/day MVPs", "Field data: humid + arid", "ASSE 1090 + BIS certification", "25–50 deployed units", "Break-even unit economics proven", "Series A readiness"];
    for (let i = 0; i < ms.length; i++) {
      const y = 2.05 + i * 0.66;
      await iconCircle(s, "FaCheck", mx + 0.2, y + 0.06, 0.34, COL.green);
      T(s, ms[i], { x: mx + 0.65, y, w: mw - 0.8, h: 0.5, fontSize: 12.5, color: COL.white, valign: "middle" });
    }
    T(s, "Milestones: validated MVPs (M12) → break-even (M18–20) → Series A (M18–30)", { x: MX, y: 5.0, w: 9.4, h: 0.9, fontSize: 13, italic: true, color: COL.aqua, valign: "middle" });
    await keyMsg(s, "This round funds the technology proof and the first commercial deployments. Series A scales it.", true);
    s.addNotes("Be specific about what this round buys. Read the six milestones out loud.");
  }

  // ---------------- 24. Team ----------------
  {
    const s = newSlide("CONTENT", "The Ask");
    s.addText("Operators who can build, validate and scale", { placeholder: "title" });
    const team = [["CEO", "[Name]", "Water, energy or operations background"], ["CTO", "[Name]", "Thermodynamics, HVAC/refrigeration or materials science"], ["COO", "[Name]", "Supply chain, franchise operations or government sales"], ["Head of Materials", "Key hire", "Sorbent chemistry and composite formulation"]];
    const cw = (CW - 0.6) / 4;
    for (let i = 0; i < 4; i++) {
      const x = MX + i * (cw + 0.2);
      card(s, x, 1.5, cw, 2.6);
      await iconCircle(s, "FaUser", x + cw / 2 - 0.5, 1.68, 1.0, i === 3 ? COL.amber : COL.blue);
      T(s, t2(team[i]), { x: x + 0.15, y: 2.8, w: cw - 0.3, h: 1.25, fontSize: 12.5, align: "center" });
    }
    function t2(t) { return [{ text: t[0], options: { bold: true, fontSize: 16, color: COL.navy, breakLine: true } }, { text: t[1], options: { bold: true, color: COL.blue, breakLine: true } }, { text: t[2], options: { color: COL.gray } }]; }
    const hw = (CW - 0.2) / 2;
    card(s, MX, 4.3, hw, 1.8, { fill: COL.ice, line: false, shadow: false });
    T(s, "Advisors", { x: MX + 0.25, y: 4.4, w: 3, h: 0.35, fontSize: 15, bold: true, color: COL.navy });
    T(s, ["Water policy expert (India regulation & tenders)", "Solar thermal engineer", "Certification consultant (ASSE 1090 / BIS)", "Waste-heat integration specialist (industrial & data centre)"].map((t, i, a) => ({ text: t, options: { bullet: true, breakLine: i < a.length - 1 } })), { x: MX + 0.25, y: 4.8, w: hw - 0.4, h: 1.25, fontSize: 12.5 });
    const hx = MX + hw + 0.2;
    card(s, hx, 4.3, hw, 1.8, { fill: COL.ice, line: false, shadow: false });
    T(s, "Hiring plan (funded by this round)", { x: hx + 0.25, y: 4.4, w: hw - 0.4, h: 0.35, fontSize: 15, bold: true, color: COL.navy });
    T(s, ["2 engineers (AWG systems, IoT)", "1 materials scientist (sorbent formulation)", "1 government sales lead", "1 franchise manager"].map((t, i, a) => ({ text: t, options: { bullet: true, breakLine: i < a.length - 1 } })), { x: hx + 0.25, y: 4.8, w: hw - 0.4, h: 1.25, fontSize: 12.5 });
    await keyMsg(s, "We have the thermodynamic depth, the materials expertise and the government sales experience to execute.");
    s.addNotes("Replace placeholders with real headshots and previous company logos. List advisors by name once confirmed.");
  }

  // ---------------- 25. Roadmap ----------------
  {
    const s = newSlide("CONTENT", "The Ask");
    s.addText("From two prototypes to 2,000 units in 48 months", { placeholder: "title" });
    const lab = ["MVP & Pilot", "Cost Red. I", "Scale-Up", "Cost Red. II", "Expansion", "Cost Red. III", "Scale"];
    s.addChart(pres.charts.LINE, [{ name: "Target LCOW ($/L)", labels: lab, values: [0.045, 0.03, 0.02, 0.015, 0.01, 0.0075, 0.005] }], Object.assign(chartBase("Target LCOW falls every phase ($/L)"), {
      x: MX, y: 1.35, w: 5.4, h: 4.75, chartColors: [HEX.amber], lineSize: 3, lineDataSymbol: "circle", lineDataSymbolSize: 9, showValue: true, dataLabelPosition: "t", dataLabelFormatCode: "$0.000",
      valAxisHidden: true, valGridLine: { style: "none" }, valAxisMinVal: 0, valAxisMaxVal: 0.052, catAxisLabelFontSize: 10, objectName: "chart-lcow-roadmap",
    }));
    const rx = 6.1, rw = W - MX - rx;
    const lc = (t) => ({ text: t, options: { bold: true, color: HEX.blue } });
    table(s, ["Phase", "Months", "Milestones", "LCOW"], [
      ["Foundation", "0–3", "Incorporate; secure pilot sites; file ASSE 1090; source sorbents", "—"],
      ["MVP & Pilot", "3–12", "2 prototypes; lab + field validation; certifications; validate $0.04/L", lc("$0.045")],
      ["Cost Reduction I", "6–12", "Solar thermal collector; waste-heat recovery loop", lc("$0.03")],
      ["Scale-Up", "12–18", "100 units; 3 franchise partners; break-even", lc("$0.02")],
      ["Cost Reduction II", "15–24", "PANSAP; modular hydrocell; photothermal MXene", lc("$0.015")],
      ["Expansion", "18–30", "UAE, Philippines; sorbent licensing; Series A", lc("$0.01")],
      ["Cost Reduction III", "24–36", "Thermal storage for overnight desorption; passive hybrid", lc("$0.005–0.01")],
      ["Scale", "30–48", "2,000+ units deployed", lc("$0.005")],
    ], { x: rx, y: 1.4, w: rw, colW: [1.55, 0.75, 3.33, 1.103], rowH: 0.5, fontSize: 11 });
    await keyMsg(s, "Every phase has a cost target, not just a volume target. Cost reduction and scale happen in parallel.");
    s.addNotes("The roadmap is your closing visual — units up, LCOW down — it shows cost reduction and scale are the same strategy, not two plans. (Brief asked for a dual-axis chart; unit counts are in the table: 100 units by M18, 2,000+ by M48.) Cost Reduction III plotted at $0.0075 = midpoint of $0.005–0.01.");
  }

  // ---------------- 26. Risks ----------------
  {
    const s = newSlide("CONTENT", "The Ask");
    s.addText("We have a plan for every major risk", { placeholder: "title" });
    const im = (t) => ({ text: t, options: { bold: true, color: HEX.white, align: "center", fill: { color: t === "High" ? HEX.red : t === "Medium" ? "D98A1C" : HEX.green } } });
    table(s, ["Risk", "Impact", "Mitigation"], [
      ["Low humidity in arid markets", im("High"), "Sorption MVP validated at 30% RH in lab; sorption is the primary tech, not a fallback"],
      ["Water quality from new sorbents", im("High"), "PANSAP condensate validated vs potable standards. 5-stage filtration + remineralisation. Weekly testing"],
      ["Sorbent degradation over cycles", im("Medium"), "Jute/CaCl₂ is chemically stable; PANSAP shows cycling stability. Test 1,000+ cycles in lab"],
      ["Solar thermal variability", im("Medium"), "PCM / sand-bed thermal storage for night and cloudy days. Hybrid with waste heat"],
      ["Waste-heat availability", im("Medium"), "Prioritise sites with HVAC or industrial waste heat. Baseline economics do not depend on it"],
      ["Component supply chain", im("Medium"), "Multi-source. Prioritise Indian HVAC makers (Godrej, Kirloskar)"],
      ["Regulatory ban on AWG", im("Medium"), "Position as “Monsoon Resilience Units”. Engage policy makers early"],
      ["Competition from incumbents", im("Medium"), "Defend on sorbent IP and hybrid architecture patents. Move fast on certification"],
      ["Technology obsolescence", im("Low"), "Roadmap already targets the theoretical minimum. Hydrogel is upside, not a dependency"],
    ], { x: MX, y: 1.4, w: CW, colW: [3.4, 1.1, 7.833], rowH: 0.46, fontSize: 12.5 });
    await keyMsg(s, "We are not betting on one technology, one climate or one revenue stream.");
    s.addNotes("ADDRESS RISK HEAD-ON (Slides 21–22). Do not hide the sorbent degradation risk or the humidity risk. Show the mitigation.\n\nVisual intent from brief: risk matrix (likelihood vs impact) with mitigation arrows — likelihood ratings not yet defined, so impact is shown.");
  }

  // ---------------- 27. Impact ----------------
  {
    const s = newSlide("CONTENT", "The Ask");
    s.addText("Water access, less plastic, carbon credits and heat reuse", { placeholder: "title" });
    const chain = [["FaCogs", COL.navy, "1 unit", "100 L/day"], ["FaTint", COL.blue, "30,000 L", "per year"], ["FaRecycle", COL.green, "~60,000", "500 ml bottles avoided"], ["FaLeaf", COL.amber, "[X] t CO₂", "avoided per year"]];
    const cw = 2.6, gap = (CW - 4 * cw) / 3;
    for (let i = 0; i < 4; i++) {
      const x = MX + i * (cw + gap);
      card(s, x, 1.5, cw, 2.3);
      await iconCircle(s, chain[i][0], x + cw / 2 - 0.4, 1.65, 0.8, chain[i][1]);
      T(s, chain[i][2], { x, y: 2.55, w: cw, h: 0.6, fontSize: 26, bold: true, color: COL.navy, align: "center", fontFace: "Arial" });
      T(s, chain[i][3], { x, y: 3.15, w: cw, h: 0.5, fontSize: 13, color: COL.gray, align: "center" });
      if (i < 3) arrow(s, x + cw + 0.08, 2.65, gap - 0.16, HEX.gray, 2.5);
    }
    const im = [["FaIndustry", HEX.orange, "Energy", "We use heat that would be vented — a net efficiency gain for host sites."], ["FaHospital", COL.blue, "Water access", "Off-grid communities, hospitals, railway stations, remote level crossings."], ["FaCertificate", COL.green, "Carbon credits", "Solar-thermal-powered AWG generates verifiable credits."], ["FaGlobeAsia", COL.navy, "UN SDGs", "SDG 6 Clean Water · SDG 7 Clean Energy · SDG 13 Climate Action"]];
    const iw = (CW - 0.6) / 4;
    for (let i = 0; i < 4; i++) {
      const x = MX + i * (iw + 0.2);
      card(s, x, 4.0, iw, 2.1, { fill: COL.ice, line: false, shadow: false });
      await iconCircle(s, im[i][0], x + 0.2, 4.15, 0.5, im[i][1]);
      T(s, im[i][2], { x: x + 0.8, y: 4.15, w: iw - 0.9, h: 0.5, fontSize: 15, bold: true, color: COL.navy, valign: "middle" });
      T(s, im[i][3], { x: x + 0.2, y: 4.75, w: iw - 0.35, h: 1.3, fontSize: 12.5 });
    }
    await keyMsg(s, "A profitable business with measurable social and environmental returns — that makes host facilities more efficient, not less.");
    s.addNotes("Close on impact: we are not just selling cheaper water, we are converting waste heat into drinking water.\n\nFill in [X] tonnes CO₂ avoided per unit per year before presenting.");
  }

  // ---------------- 28. Closing ----------------
  {
    const s = newSlide("TITLE_DARK", "The Ask");
    T(s, "ACQUAHT", { x: 0.7, y: 0.8, w: 6, h: 0.4, fontSize: 16, bold: true, color: COL.amber, charSpacing: 6, fontFace: "Arial" });
    T(s, "We turn waste heat and sunlight into drinking water.", { x: 0.7, y: 1.4, w: 11.5, h: 1.6, fontSize: 40, bold: true, color: COL.white, fontFace: "Arial", valign: "middle" });
    const st = [["$0.005–0.01", "per litre at scale"], ["1/20th", "the cost of bottled water"], ["$650K", "seed round"]];
    st.forEach((t, i) => {
      const x = 0.7 + i * 4.0;
      T(s, t[0], { x, y: 3.4, w: 3.8, h: 0.9, fontSize: 36, bold: true, color: i === 2 ? COL.amber : COL.aqua, fontFace: "Arial" });
      T(s, t[1], { x, y: 4.3, w: 3.8, h: 0.4, fontSize: 16, color: COL.ice });
    });
    T(s, "[Founder Name]  ·  [Email]  ·  [Phone]  ·  [Website]", { x: 0.7, y: 6.3, w: 11, h: 0.45, fontSize: 15, color: COL.white });
    s.addNotes("Pause. Restate the ask: $650,000 seed. Then take questions. Have the appendix ready — use it only on request.");
  }

  // ---------------- 29. Appendix ----------------
  {
    const s = newSlide("CONTENT", "Appendix");
    s.addText("Appendix", { placeholder: "title" });
    const items = [["FaBox", "Detailed BOM and cost per unit (condensation + sorption)"], ["FaChartLine", "LCOW methodology and full assumption set"], ["FaFlask", "Sorbent data: Jute/CaCl₂, PANSAP, starch-PEG/CaCl₂, succulent biomass, straw"], ["FaSun", "Solar thermal and waste-heat integration schematics"], ["FaMicroscope", "Lab test protocol and field pilot design"], ["FaCertificate", "Certification path: ASSE 1090, BIS, WHO, NSF/ANSI 372"], ["FaTint", "Pilot water quality data"], ["FaShieldAlt", "Competitive matrix and patent landscape summary"], ["FaHandshake", "Franchise agreement summary and sorbent licensing term sheet"], ["FaDatabase", "Full financial model (Excel on request)"]];
    const cw = (CW - 0.3) / 2;
    for (let i = 0; i < items.length; i++) {
      const x = MX + (i % 2) * (cw + 0.3), y = 1.5 + Math.floor(i / 2) * 0.92;
      card(s, x, y, cw, 0.78, { shadow: false });
      await iconCircle(s, items[i][0], x + 0.15, y + 0.14, 0.5, COL.blue);
      T(s, items[i][1], { x: x + 0.8, y, w: cw - 0.95, h: 0.78, fontSize: 14, valign: "middle" });
    }
    await keyMsg(s, "Every claim in this deck is backed by a testable assumption or a published result.");
    s.addNotes("Use only on request. Have the full BOM, the sorbent test data and the financial model ready. Do not present them unless asked.");
  }

  // ---------------- 30. Executive summary ----------------
  {
    const s = newSlide("CONTENT", "Appendix");
    s.addText("One-page executive summary", { placeholder: "title" });
    const rows = [
      ["What", "Atmospheric water from ultra-low-cost agri-waste and recycled-polymer sorbents, solar thermal desorption and waste-heat recovery, plus 5-stage filtration."],
      ["Cost", "$0.005–$0.01/L at scale (₹0.40–₹0.80/L). 75–87% below conventional AWG. 60–80% below bottled water."],
      ["Where", "India first (Indian Railways, hospitals, corporates, data centres), then UAE, Philippines, Africa."],
      ["Tech", "Hybrid 4-stage: condensation → sorption → solar thermal → thermal storage. Jute/CaCl₂ and PANSAP at $0.46–$2.50/kg. 134°C collectors. 34.4% saving from waste heat."],
      ["MVP", "Two 100 L/day prototypes (condensation + sorption), validated in lab and field, scaling to 1,000 L/day."],
      ["Model", "60% WaaS · 25% equipment sales · 15% franchise + sorbent licensing."],
      ["Traction", "[Insert LOIs, prototype status, certifications]"],
      ["Financials", "Y1 $400K · Y2 $2M · Y3 $8M. Break-even M18–20. Gross margin 70–85% at scale."],
      ["Ask", "$650,000 Seed  ·  Contact: [Name] · [Email] · [Phone] · [Website]"],
    ];
    table(s, ["", "AcquaHT"], rows.map((r) => [{ text: r[0], options: { bold: true, color: HEX.navy } }, r[1]]), { x: MX, y: 1.35, w: CW, colW: [1.6, 10.733], rowH: 0.58, fontSize: 14 });
    s.addNotes("Print this slide as the one-page handout.\n\nVISUAL DESIGN NOTES: Deep water blue, warm solar amber, clean white. Amber for anything thermal, blue for anything water. One number per slide — LCOW is the hero metric. Use real data and photos of actual prototypes, sorbent samples and water quality reports; avoid stock water droplets. Log scales where the gap is huge. Show the loop — every architecture diagram should make the waste-heat and solar loops obvious.");
  }

  await pres.writeFile({ fileName: OUT });
  if (APPLY_THEME) {
    const { applyTheme } = require(APPLY_THEME);
    await applyTheme(OUT, THEME);
  }
  console.log("wrote", OUT);
}

build().catch((e) => { console.error(e); process.exit(1); });
