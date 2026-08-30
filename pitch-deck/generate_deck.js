const pptxgen = require("pptxgenjs");
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
pres.author = "AcquaHT Labs";
pres.title = "AcquaHT Labs — Investor Deck";

const W = 13.3, H = 7.5;
const C = {
  bg:     "081420",  // deep midnight teal-navy
  bg2:    "0C1E2C",  // slightly raised
  panel:  "102838",  // card
  panel2: "16334A",  // raised card
  water:  "3AD1DB",  // cyan  — water / cold / product / proof
  waterD: "1E8D9C",
  amber:  "FFA24B",  // amber — waste heat / insight / moat
  amberD: "D97F2E",
  coral:  "F26D6D",  // coral — problem / cost / pain
  mint:   "58D6A6",  // positive / signed
  text:   "EEF6F8",  // off-white
  muted:  "9CB2BE",  // slate
  dim:    "62808D",  // dimmer slate
  line:   "233B4E",  // hairline
  white:  "FFFFFF",
};
const HEAD = "Arial";
const BODY = "Calibri";

// ---------- helpers ----------
function bg(slide, color) { slide.background = { color: color || C.bg }; }

function footer(slide, num, section) {
  slide.addText(
    [
      { text: "ACQUAHT", options: { color: C.water, bold: true } },
      { text: "  LABS", options: { color: C.dim, bold: false } },
    ],
    { x: 0.7, y: 7.02, w: 4, h: 0.3, fontSize: 9, fontFace: HEAD, charSpacing: 2, align: "left", isTextBox: true, margin: 0, valign: "middle" }
  );
  if (section) {
    slide.addText(section, { x: W/2 - 2.5, y: 7.02, w: 5, h: 0.3, fontSize: 9, fontFace: BODY, color: C.dim, align: "center", isTextBox: true, margin: 0, valign: "middle", charSpacing: 2 });
  }
  slide.addText(String(num).padStart(2, "0"), { x: W - 1.3, y: 7.02, w: 0.6, h: 0.3, fontSize: 9, fontFace: HEAD, color: C.dim, align: "right", isTextBox: true, margin: 0, valign: "middle" });
}

function eyebrow(slide, text, color, x, y) {
  slide.addText(text.toUpperCase(), {
    x: x ?? 0.7, y: y ?? 0.55, w: 8, h: 0.35, fontSize: 13, fontFace: HEAD, bold: true,
    color: color || C.water, charSpacing: 3, align: "left", isTextBox: true, margin: 0, valign: "middle",
  });
}

// small uppercase honesty/status tag chip
function tag(slide, text, x, y, color) {
  const w = 0.11 * text.length + 0.28;
  slide.addShape(pres.ShapeType.roundRect, { x, y, w, h: 0.28, fill: { color: C.panel }, line: { color: color || C.dim, width: 0.75 }, rectRadius: 0.05 });
  slide.addText(text.toUpperCase(), { x, y, w, h: 0.28, fontSize: 8.5, fontFace: BODY, bold: true, color: color || C.muted, align: "center", valign: "middle", charSpacing: 1.5, isTextBox: true, margin: 0 });
}

function card(slide, x, y, w, h, fill) {
  slide.addShape(pres.ShapeType.roundRect, { x, y, w, h, fill: { color: fill || C.panel }, line: { color: C.line, width: 1 }, rectRadius: 0.09 });
}

function arrow(slide, x, y, w, color) {
  slide.addShape(pres.ShapeType.line, { x, y, w, h: 0, line: { color: color || C.dim, width: 2.25, endArrowType: "triangle" } });
}

// ============================================================
// SLIDE 1 — TITLE / BIG IDEA
// ============================================================
(() => {
  const s = pres.addSlide(); bg(s);
  // right-side droplet motif (air condensing into a drop)
  s.addShape(pres.ShapeType.ellipse, { x: 9.55, y: 1.5, w: 3.1, h: 3.1, fill: { color: C.bg2 }, line: { color: C.line, width: 1 } });
  s.addShape(pres.ShapeType.ellipse, { x: 10.05, y: 2.0, w: 2.1, h: 2.1, fill: { color: C.panel }, line: { color: C.waterD, width: 1 } });
  // droplet
  s.addShape(pres.ShapeType.ellipse, { x: 10.55, y: 2.72, w: 1.1, h: 1.1, fill: { color: C.water }, line: { type: "none" } });
  s.addShape(pres.ShapeType.triangle, { x: 10.78, y: 2.18, w: 0.64, h: 0.72, fill: { color: C.water }, line: { type: "none" } });
  // scattered "air" dots converging
  const dots = [[9.7,1.75],[12.3,1.9],[9.6,3.9],[12.5,3.6],[9.9,4.4],[12.15,4.5],[9.5,2.9]];
  dots.forEach(([dx,dy]) => s.addShape(pres.ShapeType.ellipse, { x: dx, y: dy, w: 0.12, h: 0.12, fill: { color: C.waterD }, line: { type: "none" } }));

  eyebrow(s, "ACQUAHT LABS", C.water, 0.8, 0.85);
  s.addText(
    [
      { text: "Water from air.", options: { color: C.text, breakLine: true } },
      { text: "Even in ", options: { color: C.text } },
      { text: "dry", options: { color: C.amber } },
      { text: " air.", options: { color: C.text } },
    ],
    { x: 0.75, y: 2.25, w: 8.6, h: 2.2, fontSize: 60, fontFace: HEAD, bold: true, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 0.98 }
  );
  s.addText("We pull drinking water out of thin air — and keep working where every other machine gives up: dry, inland heat.",
    { x: 0.8, y: 4.75, w: 7.9, h: 1.0, fontSize: 19, fontFace: BODY, color: C.muted, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 1.1 });

  s.addText("Hyderabad, India      ·      Founded November 2023",
    { x: 0.8, y: 6.35, w: 8, h: 0.4, fontSize: 12.5, fontFace: BODY, color: C.dim, align: "left", isTextBox: true, margin: 0, charSpacing: 1 });
  s.addNotes("One line: we make drinking water from air, and we work in dry air where competitors can't. [Best slide for a real product/pilot hero photo — drop it into the right-hand circle.]");
})();

// ============================================================
// SLIDE 2 — THE PROBLEM (the collapse)
// ============================================================
(() => {
  const s = pres.addSlide(); bg(s);
  eyebrow(s, "The Problem", C.coral);
  s.addText(
    [
      { text: "In dry air, the same machine makes ", options: { color: C.text } },
      { text: "75% less water", options: { color: C.coral } },
      { text: ".", options: { color: C.text } },
    ],
    { x: 0.7, y: 1.0, w: 8.4, h: 1.4, fontSize: 33, fontFace: HEAD, bold: true, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 1.0 }
  );
  s.addText("Same machine. Same power bill. A quarter of the water.",
    { x: 0.7, y: 2.35, w: 8, h: 0.5, fontSize: 16, fontFace: BODY, color: C.muted, align: "left", isTextBox: true, margin: 0 });

  // Chart — output collapses
  s.addChart(pres.ChartType.bar, [
    { name: "Output (LPD)", labels: ["80% humidity", "60% humidity", "30% humidity"], values: [221.7, 120.2, 56.1] },
  ], {
    x: 0.55, y: 3.15, w: 7.6, h: 3.55,
    barDir: "col", chartColors: [C.water, C.amber, C.coral],
    showValue: true, dataLabelPosition: "outEnd", dataLabelColor: C.text, dataLabelFontFace: HEAD, dataLabelFontSize: 15, dataLabelFontBold: true,
    showTitle: true, title: "What our own 200 LPD unit actually makes (litres/day)", titleColor: C.dim, titleFontFace: BODY, titleFontSize: 11, titleAlign: "left",
    showLegend: false,
    catAxisLabelColor: C.muted, catAxisLabelFontFace: BODY, catAxisLabelFontSize: 13,
    valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" },
    valAxisMaxVal: 260, valAxisMinVal: 0,
    barGapWidthPct: 55,
  });

  // Right: cost per litre callout
  card(s, 8.55, 3.15, 4.1, 3.55, C.panel);
  s.addText("ELECTRICITY COST PER LITRE", { x: 8.85, y: 3.4, w: 3.5, h: 0.3, fontSize: 10.5, fontFace: HEAD, bold: true, color: C.dim, charSpacing: 1.5, isTextBox: true, margin: 0 });
  const rows = [["80% humidity","₹2.35", C.muted],["60% humidity","₹4.32", C.muted],["30% humidity","₹9.30", C.coral]];
  rows.forEach((r,i) => {
    const yy = 3.85 + i*0.52;
    s.addText(r[0], { x: 8.85, y: yy, w: 2.2, h: 0.4, fontSize: 13, fontFace: BODY, color: C.muted, align: "left", valign: "middle", isTextBox: true, margin: 0 });
    s.addText(r[1], { x: 10.85, y: yy, w: 1.5, h: 0.4, fontSize: 17, fontFace: HEAD, bold: true, color: r[2], align: "right", valign: "middle", isTextBox: true, margin: 0 });
  });
  s.addShape(pres.ShapeType.line, { x: 8.85, y: 5.55, w: 3.5, h: 0, line: { color: C.line, width: 1 } });
  s.addText("At 30% humidity, the electricity alone costs more per litre than bottled water in most Indian cities.",
    { x: 8.85, y: 5.7, w: 3.55, h: 0.9, fontSize: 12, fontFace: BODY, color: C.text, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 1.05 });

  tag(s, "Calculated · psychrometric", 9.48, 0.55, C.dim);
  footer(s, 2, "The Problem");
  s.addNotes("Every water-from-air machine cools air until water drops out. That works in humid air. As air dries, you must cool far more air for the same water — output collapses and the power cost per litre explodes.");
})();

// ============================================================
// SLIDE 3 — WHY IT'S HARD (wasted energy)
// ============================================================
(() => {
  const s = pres.addSlide(); bg(s);
  eyebrow(s, "Why it's hard", C.coral);
  s.addText("In dry air, most of the power cools air we just throw away.",
    { x: 0.7, y: 1.0, w: 8.7, h: 1.3, fontSize: 31, fontFace: HEAD, bold: true, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 1.0 });

  // stacked bar: condenses water vs wasted
  s.addChart(pres.ChartType.bar, [
    { name: "Condenses water", labels: ["80% humidity","60% humidity","30% humidity"], values: [96, 57, 25] },
    { name: "Cools air we throw away", labels: ["80% humidity","60% humidity","30% humidity"], values: [4, 43, 75] },
  ], {
    x: 0.55, y: 2.7, w: 7.7, h: 3.9,
    barDir: "col", barGrouping: "percentStacked", chartColors: [C.water, C.coral],
    showValue: true, dataLabelPosition: "ctr", dataLabelColor: "0A1622", dataLabelFontFace: HEAD, dataLabelFontSize: 12, dataLabelFontBold: true, dataLabelFormatCode: '0"%"',
    showTitle: true, title: "Where the cooling energy actually goes", titleColor: C.dim, titleFontFace: BODY, titleFontSize: 11, titleAlign: "left",
    showLegend: true, legendPos: "b", legendColor: C.muted, legendFontFace: BODY, legendFontSize: 11,
    catAxisLabelColor: C.muted, catAxisLabelFontFace: BODY, catAxisLabelFontSize: 12,
    valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" },
    barGapWidthPct: 55,
  });

  // Right callout
  s.addText("75%", { x: 8.5, y: 2.8, w: 4.2, h: 1.35, fontSize: 76, fontFace: HEAD, bold: true, color: C.coral, align: "left", isTextBox: true, margin: 0 });
  s.addText("of the energy is wasted at 30% humidity — spent cooling dry air that carries almost no water, then dumping it.",
    { x: 8.55, y: 4.35, w: 4.15, h: 1.1, fontSize: 15, fontFace: BODY, color: C.text, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 1.1 });
  s.addShape(pres.ShapeType.line, { x: 8.55, y: 5.55, w: 4.05, h: 0, line: { color: C.line, width: 1 } });
  s.addText("True of every refrigeration machine on the market. That's why every spec sheet — ours once included — is rated at 80% humidity.",
    { x: 8.55, y: 5.7, w: 4.15, h: 1.0, fontSize: 12.5, fontFace: BODY, color: C.muted, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 1.05 });

  footer(s, 3, "Why it's hard");
  s.addNotes("The whole industry quietly hides from dry air. Nobody publishes performance below 80% humidity because that's the only place the math works.");
})();

// ============================================================
// SLIDE 4 — THE INSIGHT (free waste heat)
// ============================================================
(() => {
  const s = pres.addSlide(); bg(s);
  eyebrow(s, "The Insight", C.amber);
  s.addText("The fix was already inside the machine.",
    { x: 0.7, y: 1.0, w: 9, h: 0.9, fontSize: 33, fontFace: HEAD, bold: true, color: C.text, align: "left", isTextBox: true, margin: 0 });
  s.addText(
    [
      { text: "A desiccant — think of a ", options: { color: C.muted } },
      { text: "sponge", options: { color: C.water, bold: true } },
      { text: " — grabs water from air at room temperature. Heat dries it out again. And the heat is ", options: { color: C.muted } },
      { text: "already there", options: { color: C.amber, bold: true } },
      { text: ": our own compressor throws it away.", options: { color: C.muted } },
    ],
    { x: 0.7, y: 1.85, w: 8.7, h: 0.9, fontSize: 16, fontFace: BODY, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 1.1 });

  // Waste-heat flow
  const fy = 3.35;
  card(s, 0.7, fy, 3.2, 1.75, C.panel);
  s.addText("Compressor\ndischarge gas", { x: 0.9, y: fy+0.22, w: 2.8, h: 0.7, fontSize: 14, fontFace: BODY, color: C.muted, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 0.95 });
  s.addText("~80°C", { x: 0.9, y: fy+0.95, w: 2.8, h: 0.6, fontSize: 30, fontFace: HEAD, bold: true, color: C.amber, align: "left", isTextBox: true, margin: 0 });

  arrow(s, 4.0, fy+0.87, 0.85, C.amberD);

  card(s, 4.95, fy, 3.2, 1.75, C.panel);
  s.addText("Cooled to\ncondensing temp", { x: 5.15, y: fy+0.22, w: 2.8, h: 0.7, fontSize: 14, fontFace: BODY, color: C.muted, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 0.95 });
  s.addText("45°C", { x: 5.15, y: fy+0.95, w: 2.8, h: 0.6, fontSize: 30, fontFace: HEAD, bold: true, color: C.muted, align: "left", isTextBox: true, margin: 0 });

  arrow(s, 8.25, fy+0.87, 0.85, C.amberD);

  card(s, 9.2, fy, 3.45, 1.75, C.panel2);
  s.addShape(pres.ShapeType.roundRect, { x: 9.2, y: fy, w: 3.45, h: 1.75, fill: { type: "none" }, line: { color: C.amber, width: 1.5 }, rectRadius: 0.09 });
  s.addText("Usable free heat", { x: 9.42, y: fy+0.22, w: 3.0, h: 0.4, fontSize: 14, fontFace: BODY, color: C.amber, align: "left", isTextBox: true, margin: 0 });
  s.addText("1.29 kW", { x: 9.42, y: fy+0.85, w: 3.1, h: 0.7, fontSize: 40, fontFace: HEAD, bold: true, color: C.amber, align: "left", isTextBox: true, margin: 0 });

  // bottom band — not first
  card(s, 0.7, 5.55, 11.95, 1.15, C.bg2);
  s.addText(
    [
      { text: "We're not first — the gap is cost, not physics.  ", options: { color: C.text, bold: true } },
      { text: "MOF harvesters (Berkeley, Water Harvesting Inc.) and salt-in-matrix composites already exist. None are built at Indian cost. None run on a compressor's own waste heat. That's the gap we build into.", options: { color: C.muted } },
    ],
    { x: 0.95, y: 5.72, w: 11.5, h: 0.85, fontSize: 13, fontFace: BODY, align: "left", isTextBox: true, margin: 0, valign: "middle", lineSpacingMultiple: 1.05 });

  footer(s, 4, "The Insight");
  s.addNotes("1.29 kW of high-grade heat comes off 147 kg/h of R407C cooled from 80°C to 45°C, out of 8.92 kW total condenser rejection. We were dumping heat that's exactly hot enough to regenerate a desiccant.");
})();

// ============================================================
// SLIDE 5 — THE SOLUTION
// ============================================================
(() => {
  const s = pres.addSlide(); bg(s);
  eyebrow(s, "The Solution", C.water);
  s.addText(
    [
      { text: "A sponge grabs the water. ", options: { color: C.water } },
      { text: "Our own waste heat wrings it out.", options: { color: C.amber } },
    ],
    { x: 0.7, y: 1.05, w: 9.2, h: 1.4, fontSize: 34, fontFace: HEAD, bold: true, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 1.0 });

  // Big outcome
  card(s, 0.7, 3.0, 5.75, 3.55, C.panel);
  s.addText("SAME POWER, MORE WATER — AT 30% HUMIDITY", { x: 1.0, y: 3.3, w: 5.2, h: 0.35, fontSize: 11, fontFace: HEAD, bold: true, color: C.dim, charSpacing: 1.2, isTextBox: true, margin: 0 });
  s.addText("56", { x: 1.0, y: 3.85, w: 1.8, h: 1.3, fontSize: 66, fontFace: HEAD, bold: true, color: C.muted, align: "center", isTextBox: true, margin: 0 });
  s.addText("LPD today", { x: 1.0, y: 5.15, w: 1.8, h: 0.4, fontSize: 12, fontFace: BODY, color: C.dim, align: "center", isTextBox: true, margin: 0 });
  arrow(s, 2.95, 4.5, 1.0, C.water);
  s.addText("93", { x: 4.05, y: 3.85, w: 2.2, h: 1.3, fontSize: 66, fontFace: HEAD, bold: true, color: C.water, align: "center", isTextBox: true, margin: 0 });
  s.addText("LPD with the sponge", { x: 3.95, y: 5.15, w: 2.4, h: 0.4, fontSize: 12, fontFace: BODY, color: C.water, align: "center", isTextBox: true, margin: 0 });
  s.addShape(pres.ShapeType.line, { x: 1.0, y: 5.75, w: 5.15, h: 0, line: { color: C.line, width: 1 } });
  s.addText("+66% more water — no extra electricity.", { x: 1.0, y: 5.9, w: 5.2, h: 0.5, fontSize: 15, fontFace: BODY, bold: true, color: C.text, align: "left", isTextBox: true, margin: 0 });

  // Right: one-sentence what/why
  s.addText("What it is", { x: 6.9, y: 3.15, w: 5.5, h: 0.4, fontSize: 14, fontFace: HEAD, bold: true, color: C.water, isTextBox: true, margin: 0 });
  s.addText("A two-stage machine: a desiccant captures moisture straight from dry air, and the compressor's own waste heat releases it — so the fridge only has to condense a small, very wet stream instead of a mountain of dry air.",
    { x: 6.9, y: 3.6, w: 5.7, h: 1.6, fontSize: 16, fontFace: BODY, color: C.muted, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 1.15 });
  s.addText("Why it matters", { x: 6.9, y: 5.25, w: 5.5, h: 0.4, fontSize: 14, fontFace: HEAD, bold: true, color: C.water, isTextBox: true, margin: 0 });
  s.addText("It attacks the exact condition — dry air — where today's machines struggle most.",
    { x: 6.9, y: 5.7, w: 5.7, h: 0.9, fontSize: 16, fontFace: BODY, color: C.muted, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 1.15 });

  tag(s, "Projected · not yet built", 9.59, 0.55, C.amber);
  footer(s, 5, "The Solution");
  s.addNotes("The desiccant stage is the part we are raising to build and prove. 93 LPD / 1.43 L/kWh at 30% RH is the design target, up from 56 LPD / 0.86 today.");
})();

// ============================================================
// SLIDE 6 — HOW IT WORKS (3 steps)
// ============================================================
(() => {
  const s = pres.addSlide(); bg(s);
  eyebrow(s, "How it works", C.water);
  s.addText("Three steps.", { x: 0.7, y: 1.0, w: 9, h: 0.9, fontSize: 33, fontFace: HEAD, bold: true, color: C.text, align: "left", isTextBox: true, margin: 0 });

  const steps = [
    ["1", "The sponge grabs it", "A desiccant bed pulls water vapour straight out of dry air — at room temperature, no chilling.", C.water],
    ["2", "Waste heat lets it go", "The compressor's free 1.29 kW of heat dries the sponge, releasing a small, very wet stream.", C.amber],
    ["3", "The fridge makes water", "The existing refrigeration condenses that rich stream into clean drinking water.", C.water],
  ];
  const cw = 3.75, gap = 0.35, x0 = 0.7, yy = 2.5, chh = 3.5;
  steps.forEach((st, i) => {
    const x = x0 + i*(cw+gap);
    card(s, x, yy, cw, chh, C.panel);
    s.addShape(pres.ShapeType.ellipse, { x: x+0.35, y: yy+0.4, w: 0.85, h: 0.85, fill: { color: C.bg2 }, line: { color: st[3], width: 1.5 } });
    s.addText(st[0], { x: x+0.35, y: yy+0.4, w: 0.85, h: 0.85, fontSize: 30, fontFace: HEAD, bold: true, color: st[3], align: "center", valign: "middle", isTextBox: true, margin: 0 });
    s.addText(st[1], { x: x+0.35, y: yy+1.5, w: cw-0.7, h: 0.85, fontSize: 20, fontFace: HEAD, bold: true, color: C.text, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 0.95 });
    s.addText(st[2], { x: x+0.35, y: yy+2.35, w: cw-0.7, h: 1.0, fontSize: 14, fontFace: BODY, color: C.muted, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 1.1 });
    if (i < 2) s.addShape(pres.ShapeType.line, { x: x+cw+0.02, y: yy+0.82, w: gap-0.04, h: 0, line: { color: C.dim, width: 2, endArrowType: "triangle" } });
  });

  s.addText("Everyone else does step 3 only — and cools a mountain of dry air to get there. Steps 1 and 2 are what change the economics.",
    { x: 0.7, y: 6.25, w: 11.9, h: 0.6, fontSize: 14, fontFace: BODY, italic: true, color: C.dim, align: "left", isTextBox: true, margin: 0 });
  footer(s, 6, "How it works");
  s.addNotes("Step 2 — regeneration on the compressor's own waste heat — is the novel part and the part this round funds.");
})();

// ============================================================
// SLIDE 7 — PROOF / TRACTION  (strongest)
// ============================================================
(() => {
  const s = pres.addSlide(); bg(s);
  eyebrow(s, "Traction", C.water);
  s.addText("Real machines. Real water. First customer signed.",
    { x: 0.7, y: 1.0, w: 11, h: 0.9, fontSize: 32, fontFace: HEAD, bold: true, color: C.text, align: "left", isTextBox: true, margin: 0 });

  const stats = [
    ["210 L", "of water produced in the field", "Across 2 pilots in Telangana — tested to WHO & BIS IS 10500", "Measured", C.water],
    ["₹25.9L", "raised, non-dilutive", "Emergent Ventures · MeitY TIDE 2.0 · IIM Shillong", "Measured", C.mint],
    ["₹75,000", "first paying customer", "A food-processing company — bought for dehumidification, May 2026", "Signed", C.amber],
  ];
  const cw = 3.85, gap = 0.2, x0 = 0.7, yy = 2.25, chh = 3.35;
  stats.forEach((st,i) => {
    const x = x0 + i*(cw+gap);
    card(s, x, yy, cw, chh, C.panel);
    s.addText(st[0], { x: x+0.3, y: yy+0.35, w: cw-0.6, h: 1.15, fontSize: 52, fontFace: HEAD, bold: true, color: st[4], align: "left", isTextBox: true, margin: 0 });
    s.addText(st[1], { x: x+0.3, y: yy+1.55, w: cw-0.6, h: 0.75, fontSize: 17, fontFace: HEAD, bold: true, color: C.text, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 0.95 });
    s.addText(st[2], { x: x+0.3, y: yy+2.3, w: cw-0.6, h: 0.75, fontSize: 12.5, fontFace: BODY, color: C.muted, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 1.05 });
    tag(s, st[3], x+0.3, yy+chh-0.42, st[4]);
  });

  // honest gap band
  card(s, 0.7, 5.95, 11.95, 0.85, C.bg2);
  s.addShape(pres.ShapeType.ellipse, { x: 0.95, y: 6.18, w: 0.38, h: 0.38, fill: { color: C.amber }, line: { type: "none" } });
  s.addText("!", { x: 0.95, y: 6.16, w: 0.38, h: 0.38, fontSize: 18, fontFace: HEAD, bold: true, color: "0A1622", align: "center", valign: "middle", isTextBox: true, margin: 0 });
  s.addText(
    [
      { text: "The honest gap:  ", options: { color: C.amber, bold: true } },
      { text: "no sorbent has run in our machine yet. The dry-air upgrade is exactly what this round funds.", options: { color: C.text } },
    ],
    { x: 1.5, y: 5.95, w: 10.9, h: 0.85, fontSize: 14, fontFace: BODY, align: "left", valign: "middle", isTextBox: true, margin: 0 });

  footer(s, 7, "Traction");
  s.addNotes("Also in motion (signed / in discussion): MoU with Bala Vikasa for rural distribution; AIC AKASH Cohort 5, IIIT Hyderabad for hospital introductions; PIER71 Singapore via T-Hub in discussion. Kept off the hero slide to keep it to three big proofs.");
})();

// ============================================================
// SLIDE 8 — CUSTOMER (who buys & why)
// ============================================================
(() => {
  const s = pres.addSlide(); bg(s);
  eyebrow(s, "Who buys", C.water);
  s.addText("We sell dehumidification. The water comes free.",
    { x: 0.7, y: 1.0, w: 11.5, h: 0.9, fontSize: 32, fontFace: HEAD, bold: true, color: C.text, align: "left", isTextBox: true, margin: 0 });
  s.addText("Factories already pay every month to dry their air. Our machine does that — and hands them drinking water on top.",
    { x: 0.7, y: 1.95, w: 11.5, h: 0.7, fontSize: 17, fontFace: BODY, color: C.muted, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 1.1 });

  // flow: pays for drying -> gets drying + free water
  const yy = 3.1, chh = 3.05;
  card(s, 0.7, yy, 3.55, chh, C.panel);
  s.addText("THEY ALREADY PAY FOR", { x: 0.95, y: yy+0.3, w: 3.1, h: 0.35, fontSize: 11, fontFace: HEAD, bold: true, color: C.dim, charSpacing: 1, isTextBox: true, margin: 0 });
  s.addText("Drying the air", { x: 0.95, y: yy+0.85, w: 3.1, h: 0.6, fontSize: 24, fontFace: HEAD, bold: true, color: C.text, isTextBox: true, margin: 0 });
  s.addText("A monthly line item they already budget for.", { x: 0.95, y: yy+1.55, w: 3.1, h: 1.2, fontSize: 14, fontFace: BODY, color: C.muted, isTextBox: true, margin: 0, lineSpacingMultiple: 1.1 });

  arrow(s, 4.35, yy+chh/2, 0.85, C.water);

  card(s, 5.3, yy, 3.55, chh, C.panel2);
  s.addShape(pres.ShapeType.roundRect, { x: 5.3, y: yy, w: 3.55, h: chh, fill: { type: "none" }, line: { color: C.water, width: 1.5 }, rectRadius: 0.09 });
  s.addText("WITH US THEY GET", { x: 5.55, y: yy+0.3, w: 3.1, h: 0.35, fontSize: 11, fontFace: HEAD, bold: true, color: C.water, charSpacing: 1, isTextBox: true, margin: 0 });
  s.addText("Dry air", { x: 5.55, y: yy+0.85, w: 3.1, h: 0.55, fontSize: 24, fontFace: HEAD, bold: true, color: C.text, isTextBox: true, margin: 0 });
  s.addText("+  free drinking water", { x: 5.55, y: yy+1.5, w: 3.1, h: 0.55, fontSize: 20, fontFace: HEAD, bold: true, color: C.water, isTextBox: true, margin: 0 });
  s.addText("Same box. Better economics than a water-only machine in dry air.", { x: 5.55, y: yy+2.15, w: 3.1, h: 0.8, fontSize: 13, fontFace: BODY, color: C.muted, isTextBox: true, margin: 0, lineSpacingMultiple: 1.05 });

  // Right: who
  card(s, 9.1, yy, 3.55, chh, C.panel);
  s.addText("FIRST BUYERS", { x: 9.35, y: yy+0.3, w: 3.1, h: 0.35, fontSize: 11, fontFace: HEAD, bold: true, color: C.dim, charSpacing: 1, isTextBox: true, margin: 0 });
  s.addText("Dry-climate factories, food processing & cold storage.",
    { x: 9.35, y: yy+0.8, w: 3.1, h: 1.3, fontSize: 18, fontFace: HEAD, bold: true, color: C.text, isTextBox: true, margin: 0, lineSpacingMultiple: 1.05 });
  s.addText("They run in exactly the dry, inland heat where we're strongest.",
    { x: 9.35, y: yy+2.15, w: 3.1, h: 0.8, fontSize: 13, fontFace: BODY, color: C.muted, isTextBox: true, margin: 0, lineSpacingMultiple: 1.05 });

  footer(s, 8, "Who buys");
  s.addNotes("This is the wedge: we don't ask customers to believe in water-from-air. We sell them something they already buy (dehumidification), and the water is upside.");
})();

// ============================================================
// SLIDE 9 — ECONOMICS / BUSINESS MODEL
// ============================================================
(() => {
  const s = pres.addSlide(); bg(s);
  eyebrow(s, "The Economics", C.water);
  s.addText(
    [
      { text: "Build for ₹1.78L. ", options: { color: C.text } },
      { text: "Sell for ₹3.75L.", options: { color: C.water } },
    ],
    { x: 0.7, y: 1.0, w: 11, h: 0.9, fontSize: 33, fontFace: HEAD, bold: true, align: "left", isTextBox: true, margin: 0 });

  // left: build -> sell -> profit
  const yy = 2.65, chh = 2.35;
  const blocks = [
    ["Cost to build one", "₹1,78,000", C.muted, "Measured", C.dim],
    ["Selling price", "₹3,75,000", C.water, "Assumed · confirm", C.amber],
    ["Gross profit / unit", "₹1,97,000", C.mint, "52.5% margin", C.mint],
  ];
  const cw = 3.85, gap = 0.2, x0 = 0.7;
  blocks.forEach((b,i) => {
    const x = x0 + i*(cw+gap);
    card(s, x, yy, cw, chh, i===2 ? C.panel2 : C.panel);
    if (i===2) s.addShape(pres.ShapeType.roundRect, { x, y: yy, w: cw, h: chh, fill: { type:"none" }, line: { color: C.mint, width: 1.5 }, rectRadius: 0.09 });
    s.addText(b[0].toUpperCase(), { x: x+0.3, y: yy+0.28, w: cw-0.6, h: 0.35, fontSize: 11, fontFace: HEAD, bold: true, color: C.dim, charSpacing: 1, isTextBox: true, margin: 0 });
    s.addText(b[1], { x: x+0.3, y: yy+0.75, w: cw-0.6, h: 0.9, fontSize: 34, fontFace: HEAD, bold: true, color: b[2], align: "left", isTextBox: true, margin: 0 });
    tag(s, b[3], x+0.3, yy+chh-0.5, b[4]);
  });

  // right: recurring
  card(s, 0.7, 5.2, 5.75, 1.5, C.panel);
  s.addText("+ RECURRING", { x: 1.0, y: 5.4, w: 3, h: 0.3, fontSize: 10.5, fontFace: HEAD, bold: true, color: C.dim, charSpacing: 1, isTextBox: true, margin: 0 });
  s.addText("₹2,500 / month", { x: 1.0, y: 5.75, w: 3.6, h: 0.7, fontSize: 26, fontFace: HEAD, bold: true, color: C.text, isTextBox: true, margin: 0 });
  s.addText("monitoring, per unit", { x: 4.5, y: 5.9, w: 1.85, h: 0.5, fontSize: 12, fontFace: BODY, color: C.muted, valign: "middle", isTextBox: true, margin: 0 });

  // right: customer payback
  card(s, 6.65, 5.2, 6.0, 1.5, C.bg2);
  s.addText("4 months", { x: 6.95, y: 5.4, w: 2.5, h: 1.1, fontSize: 32, fontFace: HEAD, bold: true, color: C.mint, valign: "middle", isTextBox: true, margin: 0 });
  s.addText("Customer payback when the water replaces branded bottled water, at 150 usable litres a day.",
    { x: 9.6, y: 5.35, w: 2.85, h: 1.2, fontSize: 13, fontFace: BODY, color: C.muted, valign: "middle", isTextBox: true, margin: 0, lineSpacingMultiple: 1.05 });

  footer(s, 9, "The Economics");
  s.addNotes("Full payback matrix (bottled water ~4 mo, tanker/jar water longer, or sold purely as a dehumidifier with water free) is in the appendix. Price ₹3.75L is not yet confirmed — flagged honestly.");
})();

// ============================================================
// SLIDE 10 — MARKET
// ============================================================
(() => {
  const s = pres.addSlide(); bg(s);
  eyebrow(s, "The Market", C.water);
  s.addText("75 sites we can name and reach — today.",
    { x: 0.7, y: 1.0, w: 11.5, h: 0.9, fontSize: 33, fontFace: HEAD, bold: true, color: C.text, align: "left", isTextBox: true, margin: 0 });
  s.addText("Not a top-down guess. A bottom-up count across three beachheads — each reachable through a relationship we already have.",
    { x: 0.7, y: 1.95, w: 11.5, h: 0.6, fontSize: 16, fontFace: BODY, color: C.muted, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 1.1 });

  // two revenue stats
  card(s, 0.7, 2.95, 3.0, 1.55, C.panel2);
  s.addText("₹2.81 Cr", { x: 0.95, y: 3.2, w: 2.6, h: 0.75, fontSize: 32, fontFace: HEAD, bold: true, color: C.water, isTextBox: true, margin: 0 });
  s.addText("hardware · 75 units", { x: 0.95, y: 3.95, w: 2.6, h: 0.4, fontSize: 12, fontFace: BODY, color: C.muted, isTextBox: true, margin: 0 });
  card(s, 0.7, 4.65, 3.0, 1.55, C.panel);
  s.addText("₹22.5L / yr", { x: 0.95, y: 4.9, w: 2.6, h: 0.75, fontSize: 30, fontFace: HEAD, bold: true, color: C.mint, isTextBox: true, margin: 0 });
  s.addText("service, at full deployment", { x: 0.95, y: 5.65, w: 2.6, h: 0.4, fontSize: 12, fontFace: BODY, color: C.muted, isTextBox: true, margin: 0 });

  // three beachheads
  const bh = [
    ["1", "Food processing & cold storage", "Telangana — direct relationships"],
    ["2", "Coastal, high-humidity sites", "Machine works well today; water pays back in months"],
    ["3", "Bala Vikasa villages", "Reached through the signed MoU"],
  ];
  bh.forEach((b,i) => {
    const yy = 2.95 + i*1.1;
    card(s, 3.95, yy, 8.7, 0.95, C.panel);
    s.addShape(pres.ShapeType.ellipse, { x: 4.2, y: yy+0.24, w: 0.48, h: 0.48, fill: { color: C.bg2 }, line: { color: C.water, width: 1.25 } });
    s.addText(b[0], { x: 4.2, y: yy+0.24, w: 0.48, h: 0.48, fontSize: 18, fontFace: HEAD, bold: true, color: C.water, align: "center", valign: "middle", isTextBox: true, margin: 0 });
    s.addText(b[1], { x: 4.9, y: yy+0.14, w: 7.5, h: 0.42, fontSize: 17, fontFace: HEAD, bold: true, color: C.text, isTextBox: true, margin: 0 });
    s.addText(b[2], { x: 4.9, y: yy+0.53, w: 7.5, h: 0.35, fontSize: 12.5, fontFace: BODY, color: C.muted, isTextBox: true, margin: 0 });
  });

  s.addText(
    [
      { text: "Beyond that:  ", options: { color: C.amber, bold: true } },
      { text: "once the dry-air stage is proven, the same economics reach every dry, inland industrial site priced out of water-from-air today.", options: { color: C.dim } },
    ],
    { x: 0.7, y: 6.4, w: 11.9, h: 0.5, fontSize: 13, fontFace: BODY, italic: true, align: "left", isTextBox: true, margin: 0 });
  footer(s, 10, "The Market");
  s.addNotes("Deliberately not a fake ₹X-billion TAM. The 75 sites are named and reachable. The larger dry-climate site count is still [DATA NEEDED] — kept honest, in the appendix.");
})();

// ============================================================
// SLIDE 11 — COMPETITION
// ============================================================
(() => {
  const s = pres.addSlide(); bg(s);
  eyebrow(s, "Competition", C.amber);
  s.addText("We're the only ones who even measure dry air.",
    { x: 0.7, y: 1.0, w: 11.5, h: 0.9, fontSize: 33, fontFace: HEAD, bold: true, color: C.text, align: "left", isTextBox: true, margin: 0 });
  s.addText("Everyone else rates their machines at 80% humidity — and stops there.",
    { x: 0.7, y: 1.95, w: 11.5, h: 0.6, fontSize: 16, fontFace: BODY, color: C.muted, align: "left", isTextBox: true, margin: 0 });

  // left: everyone else vs us
  const yy = 2.95, chh = 2.35;
  card(s, 0.7, yy, 5.75, chh, C.panel);
  s.addText("EVERYONE ELSE", { x: 1.0, y: yy+0.28, w: 5.1, h: 0.35, fontSize: 12, fontFace: HEAD, bold: true, color: C.coral, charSpacing: 1.5, isTextBox: true, margin: 0 });
  s.addText("Rated only at 80% humidity", { x: 1.0, y: yy+0.75, w: 5.1, h: 0.6, fontSize: 22, fontFace: HEAD, bold: true, color: C.text, isTextBox: true, margin: 0 });
  s.addText("Maithri, Watergen, SkyWater — most imported and priced in dollars. None publish what happens in dry air, because it isn't good.",
    { x: 1.0, y: yy+1.4, w: 5.1, h: 0.85, fontSize: 13.5, fontFace: BODY, color: C.muted, isTextBox: true, margin: 0, lineSpacingMultiple: 1.05 });

  card(s, 6.65, yy, 6.0, chh, C.panel2);
  s.addShape(pres.ShapeType.roundRect, { x: 6.65, y: yy, w: 6.0, h: chh, fill: { type:"none" }, line: { color: C.water, width: 1.5 }, rectRadius: 0.09 });
  s.addText("ACQUAHT", { x: 6.95, y: yy+0.28, w: 5.3, h: 0.35, fontSize: 12, fontFace: HEAD, bold: true, color: C.water, charSpacing: 1.5, isTextBox: true, margin: 0 });
  s.addText("We publish 30% humidity — and build for it", { x: 6.95, y: yy+0.75, w: 5.4, h: 0.9, fontSize: 22, fontFace: HEAD, bold: true, color: C.text, isTextBox: true, margin: 0, lineSpacingMultiple: 0.95 });
  s.addText("We already beat Hyderabad incumbent Maithri's premium unit on efficiency — 3.41 vs 3.13 L/kWh — at their own best condition, before the dry-air upgrade.",
    { x: 6.95, y: yy+1.62, w: 5.4, h: 0.7, fontSize: 13.5, fontFace: BODY, color: C.muted, isTextBox: true, margin: 0, lineSpacingMultiple: 1.05 });

  // bottom: real alternative
  card(s, 0.7, 5.55, 11.95, 1.15, C.bg2);
  s.addText(
    [
      { text: "The real competitor is the water tanker.  ", options: { color: C.amber, bold: true } },
      { text: "Tankers and bottled water are what our customers use before they buy any machine. We beat the tanker on cost in dry air — that's the fight that matters.", options: { color: C.muted } },
    ],
    { x: 0.95, y: 5.55, w: 11.5, h: 1.15, fontSize: 14, fontFace: BODY, align: "left", valign: "middle", isTextBox: true, margin: 0, lineSpacingMultiple: 1.05 });

  footer(s, 11, "Competition");
  s.addNotes("Full spec comparison table (Maithri vs AcquaHT, and the imported players) is in the appendix.");
})();

// ============================================================
// SLIDE 12 — MOAT
// ============================================================
(() => {
  const s = pres.addSlide(); bg(s);
  eyebrow(s, "Why it's hard to copy", C.amber);
  s.addText("The hard part isn't the physics. It's doing it at Indian cost.",
    { x: 0.7, y: 1.0, w: 11.9, h: 1.25, fontSize: 30, fontFace: HEAD, bold: true, color: C.text, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 1.0 });

  const pillars = [
    ["Cheap sponge", "Named research partnership with Prof. Soumyajit Roy, IISER Kolkata (FRSC, 100+ papers) — sorbent access competitors don't have.", C.water],
    ["Free heat", "We run the desiccant on the compressor's own waste heat — nobody else does. No external heater to pay for.", C.amber],
    ["Real cost, this early", "An itemized ₹1.78L build cost via our RYLT partnership — most seed hardware startups can't quote theirs yet.", C.water],
    ["First to measure", "The only maker publishing performance below 80% humidity — the exact segment everyone else's spec sheet hides.", C.mint],
  ];
  const cw = 2.9, gap = 0.22, x0 = 0.7, yy = 2.45, chh = 3.1;
  pillars.forEach((p,i) => {
    const x = x0 + i*(cw+gap);
    card(s, x, yy, cw, chh, C.panel);
    s.addShape(pres.ShapeType.ellipse, { x: x+0.3, y: yy+0.35, w: 0.5, h: 0.5, fill: { color: p[2] }, line: { type: "none" } });
    s.addText(p[0], { x: x+0.3, y: yy+1.05, w: cw-0.6, h: 0.8, fontSize: 19, fontFace: HEAD, bold: true, color: C.text, isTextBox: true, margin: 0, lineSpacingMultiple: 0.95 });
    s.addText(p[1], { x: x+0.3, y: yy+1.85, w: cw-0.6, h: 1.15, fontSize: 12.5, fontFace: BODY, color: C.muted, isTextBox: true, margin: 0, lineSpacingMultiple: 1.08 });
  });

  s.addText(
    [
      { text: "Honest gap:  ", options: { color: C.amber, bold: true } },
      { text: "no patents filed yet. Today the moat is partnerships, real cost data, and being first to measure — not IP.", options: { color: C.dim } },
    ],
    { x: 0.7, y: 5.85, w: 11.9, h: 0.5, fontSize: 13, fontFace: BODY, italic: true, align: "left", isTextBox: true, margin: 0 });
  footer(s, 12, "Moat");
  s.addNotes("The defensibility is being first into a segment nobody else even measures, with cost and distribution relationships already in place.");
})();

// ============================================================
// SLIDE 13 — SCALE / PLAN
// ============================================================
(() => {
  const s = pres.addSlide(); bg(s);
  eyebrow(s, "The Plan", C.water);
  s.addText("1 machine today. 250 a year by FY29.",
    { x: 0.7, y: 1.0, w: 11.5, h: 0.9, fontSize: 33, fontFace: HEAD, bold: true, color: C.text, align: "left", isTextBox: true, margin: 0 });

  s.addChart(pres.ChartType.bar, [
    { name: "Units / year", labels: ["FY26", "FY27", "FY28", "FY29"], values: [1, 45, 120, 250] },
  ], {
    x: 0.55, y: 2.4, w: 7.7, h: 3.4,
    barDir: "col", chartColors: [C.waterD, C.water, C.water, C.water],
    showValue: true, dataLabelPosition: "outEnd", dataLabelColor: C.text, dataLabelFontFace: HEAD, dataLabelFontSize: 14, dataLabelFontBold: true,
    showTitle: false, showLegend: false,
    catAxisLabelColor: C.muted, catAxisLabelFontFace: BODY, catAxisLabelFontSize: 14,
    valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" },
    valAxisMaxVal: 290, barGapWidthPct: 60,
  });

  // right: revenue + roadmap
  const rev = [["FY26","₹0.75L","actual"],["FY27","₹1.69 Cr","plan"],["FY28","₹4.50 Cr","plan"],["FY29","₹9.38 Cr","plan"]];
  s.addText("REVENUE", { x: 8.5, y: 2.35, w: 4, h: 0.3, fontSize: 11, fontFace: HEAD, bold: true, color: C.dim, charSpacing: 1.5, isTextBox: true, margin: 0 });
  rev.forEach((r,i) => {
    const yy = 2.75 + i*0.62;
    s.addText(r[0], { x: 8.5, y: yy, w: 1.1, h: 0.5, fontSize: 14, fontFace: BODY, color: C.muted, valign: "middle", isTextBox: true, margin: 0 });
    s.addText(r[1], { x: 9.55, y: yy, w: 2.0, h: 0.5, fontSize: 20, fontFace: HEAD, bold: true, color: i===0?C.mint:C.text, valign: "middle", align: "right", isTextBox: true, margin: 0 });
    s.addText(r[2], { x: 11.65, y: yy, w: 1.0, h: 0.5, fontSize: 10, fontFace: BODY, color: C.dim, valign: "middle", isTextBox: true, margin: 0 });
  });
  s.addShape(pres.ShapeType.line, { x: 8.5, y: 5.28, w: 4.15, h: 0, line: { color: C.line, width: 1 } });
  s.addText("Breakeven at ~90 units.", { x: 8.5, y: 5.4, w: 4.15, h: 0.4, fontSize: 14, fontFace: BODY, bold: true, color: C.mint, isTextBox: true, margin: 0 });

  // roadmap strip
  card(s, 0.7, 6.05, 11.95, 0.85, C.bg2);
  s.addText(
    [
      { text: "This round: ", options: { color: C.water, bold: true } },
      { text: "prove the dry-air unit + 10/month capacity + certification", options: { color: C.muted } },
      { text: "    →    FY27: ", options: { color: C.water, bold: true } },
      { text: "sell into the 3 beachheads", options: { color: C.muted } },
      { text: "    →    FY28: ", options: { color: C.water, bold: true } },
      { text: "breakeven", options: { color: C.muted } },
      { text: "    →    FY29: ", options: { color: C.water, bold: true } },
      { text: "coastal + international", options: { color: C.muted } },
    ],
    { x: 0.95, y: 6.05, w: 11.5, h: 0.85, fontSize: 12.5, fontFace: BODY, align: "left", valign: "middle", isTextBox: true, margin: 0, lineSpacingMultiple: 1.0 });

  tag(s, "FY27–FY29 projected", 10.25, 0.55, C.dim);
  footer(s, 13, "The Plan");
  s.addNotes("Built bottom-up from unit counts, not a smooth growth curve. FY26 is actual (1 unit); FY27–29 are plan.");
})();

// ============================================================
// SLIDE 14 — TEAM
// ============================================================
(() => {
  const s = pres.addSlide(); bg(s);
  eyebrow(s, "Team", C.water);
  s.addText("The founder ran innovation policy for the exact district these machines are built for.",
    { x: 0.7, y: 1.0, w: 11.7, h: 1.3, fontSize: 27, fontFace: HEAD, bold: true, color: C.text, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 1.0 });

  // founder card
  card(s, 0.7, 2.55, 6.4, 3.5, C.panel2);
  s.addShape(pres.ShapeType.ellipse, { x: 1.0, y: 2.9, w: 1.35, h: 1.35, fill: { color: C.bg2 }, line: { color: C.water, width: 1.5 } });
  s.addText("SJ", { x: 1.0, y: 2.9, w: 1.35, h: 1.35, fontSize: 34, fontFace: HEAD, bold: true, color: C.water, align: "center", valign: "middle", isTextBox: true, margin: 0 });
  s.addText("Swamynathan Jerra", { x: 2.55, y: 2.95, w: 4.4, h: 0.5, fontSize: 22, fontFace: HEAD, bold: true, color: C.text, isTextBox: true, margin: 0 });
  s.addText("Founder · 100% ownership", { x: 2.55, y: 3.48, w: 4.4, h: 0.4, fontSize: 13, fontFace: BODY, color: C.water, isTextBox: true, margin: 0 });
  s.addText(
    [
      { text: "Mechanical engineer from Siddipet, Telangana.", options: { color: C.text, breakLine: true } },
      { text: "Mercedes-Benz beVisioneers Fellow, 2025.", options: { color: C.text, breakLine: true } },
      { text: "Former District Innovation Coordinator for Siddipet, under the Telangana Chief Secretary's office — the district our first pilots run in.", options: { color: C.muted } },
    ],
    { x: 1.0, y: 4.45, w: 5.85, h: 1.5, fontSize: 14, fontFace: BODY, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 1.2, paraSpaceAfter: 6 });

  // advisors + partners
  card(s, 7.35, 2.55, 5.3, 3.5, C.panel);
  s.addText("ADVISORS & MANUFACTURING PARTNER", { x: 7.65, y: 2.8, w: 4.8, h: 0.35, fontSize: 11, fontFace: HEAD, bold: true, color: C.dim, charSpacing: 1, isTextBox: true, margin: 0 });
  const adv = [
    ["Prof. Soumyajit Roy", "IISER Kolkata — sorbent materials, FRSC, 100+ papers"],
    ["Vijender Mogili", "Bala Vikasa — rural distribution"],
    ["RYLT", "Refrigeration engineering & manufacturing"],
  ];
  adv.forEach((a,i) => {
    const yy = 3.3 + i*0.78;
    s.addShape(pres.ShapeType.ellipse, { x: 7.65, y: yy+0.08, w: 0.16, h: 0.16, fill: { color: C.water }, line: { type: "none" } });
    s.addText(a[0], { x: 7.95, y: yy-0.06, w: 4.5, h: 0.4, fontSize: 15, fontFace: HEAD, bold: true, color: C.text, isTextBox: true, margin: 0 });
    s.addText(a[1], { x: 7.95, y: yy+0.3, w: 4.5, h: 0.4, fontSize: 12, fontFace: BODY, color: C.muted, isTextBox: true, margin: 0 });
  });

  s.addText("Technical staff (water quality, hardware, monitoring) work part-time — no equity, not co-founders.",
    { x: 0.7, y: 6.2, w: 11.9, h: 0.5, fontSize: 12.5, fontFace: BODY, italic: true, color: C.dim, align: "left", isTextBox: true, margin: 0 });
  footer(s, 14, "Team");
  s.addNotes("Founder's district-government background is the unfair advantage for deploying in Telangana. [Swap the 'SJ' circle for a real founder photo.]");
})();

// ============================================================
// SLIDE 15 — THE ASK
// ============================================================
(() => {
  const s = pres.addSlide(); bg(s);
  eyebrow(s, "The Ask", C.amber);
  s.addText(
    [
      { text: "We're raising ", options: { color: C.text } },
      { text: "$250,000", options: { color: C.amber } },
      { text: ".", options: { color: C.text } },
    ],
    { x: 0.7, y: 1.0, w: 11, h: 0.95, fontSize: 40, fontFace: HEAD, bold: true, align: "left", isTextBox: true, margin: 0 });
  s.addText("Non-dilutive. 24 months of runway to a proven dry-air machine.",
    { x: 0.7, y: 2.0, w: 11.5, h: 0.5, fontSize: 17, fontFace: BODY, color: C.muted, align: "left", isTextBox: true, margin: 0 });

  const use = [
    ["$100k", "Sorbent development & testing", "Get the sponge running at 30% humidity — target 93 LPD.", C.water],
    ["$50k", "Waste-heat regeneration loop", "Recover the 1.29 kW off the compressor — no external heater.", C.amber],
    ["$62.5k", "Manufacturing & certification", "10 units/month with RYLT; drive build cost below ₹1.5L.", C.water],
    ["$37.5k", "Deployment & operations", "Put 75 paid units in the field — ₹2.81 Cr in revenue.", C.mint],
  ];
  const cw = 2.9, gap = 0.22, x0 = 0.7, yy = 2.85, chh = 2.75;
  use.forEach((u,i) => {
    const x = x0 + i*(cw+gap);
    card(s, x, yy, cw, chh, C.panel);
    s.addText(u[0], { x: x+0.28, y: yy+0.3, w: cw-0.56, h: 0.75, fontSize: 32, fontFace: HEAD, bold: true, color: u[3], isTextBox: true, margin: 0 });
    s.addText(u[1], { x: x+0.28, y: yy+1.1, w: cw-0.56, h: 0.7, fontSize: 15, fontFace: HEAD, bold: true, color: C.text, isTextBox: true, margin: 0, lineSpacingMultiple: 0.95 });
    s.addText(u[2], { x: x+0.28, y: yy+1.78, w: cw-0.56, h: 0.85, fontSize: 12, fontFace: BODY, color: C.muted, isTextBox: true, margin: 0, lineSpacingMultiple: 1.08 });
  });

  card(s, 0.7, 5.85, 11.95, 0.9, C.bg2);
  s.addText(
    [
      { text: "The next raise unlocks when:   ", options: { color: C.amber, bold: true } },
      { text: "90+ LPD at 30% humidity in the field   ·   75 customers paid in full   ·   unit cost under ₹1.5L", options: { color: C.text } },
    ],
    { x: 0.95, y: 5.85, w: 11.5, h: 0.9, fontSize: 13.5, fontFace: BODY, align: "left", valign: "middle", isTextBox: true, margin: 0 });

  footer(s, 15, "The Ask");
  s.addNotes("$250k ≈ ₹2.2 Cr, split across the four workstreams. Certification body/date is still [DATA NEEDED].");
})();

// ============================================================
// SLIDE 16 — CLOSING / VISION
// ============================================================
(() => {
  const s = pres.addSlide(); bg(s, C.bg);
  // motif — corner bleed droplet
  s.addShape(pres.ShapeType.ellipse, { x: 11.1, y: 5.3, w: 2.2, h: 2.2, fill: { color: C.bg2 }, line: { type: "none" } });
  s.addShape(pres.ShapeType.ellipse, { x: 11.65, y: 5.85, w: 1.1, h: 1.1, fill: { color: C.waterD }, line: { type: "none" } });

  eyebrow(s, "The Vision", C.water, 0.8, 1.2);
  s.addText(
    [
      { text: "The whole industry hides from dry air.", options: { color: C.text, breakLine: true } },
      { text: "We're building the fix.", options: { color: C.water } },
    ],
    { x: 0.75, y: 2.3, w: 10.6, h: 2.5, fontSize: 42, fontFace: HEAD, bold: true, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 1.02 });
  s.addText("If a compressor's own waste heat fixes dry-air economics for us, it fixes them for every refrigeration machine in the world. It starts with 75 machines in Telangana. It doesn't end there.",
    { x: 0.8, y: 5.05, w: 10.0, h: 1.2, fontSize: 18, fontFace: BODY, color: C.muted, align: "left", isTextBox: true, margin: 0, lineSpacingMultiple: 1.15 });
  s.addText(
    [
      { text: "ACQUAHT", options: { color: C.water, bold: true } },
      { text: "  LABS", options: { color: C.dim } },
      { text: "      ·      Hyderabad, India      ·      Founded 2023", options: { color: C.dim } },
    ],
    { x: 0.8, y: 6.45, w: 11, h: 0.4, fontSize: 12.5, fontFace: HEAD, charSpacing: 1, align: "left", isTextBox: true, margin: 0, valign: "middle" });
  s.addNotes("Close on the industry-wide vision, then the modest, credible first step. [Add founder contact / email here before sending.]");
})();

// ============================================================
// APPENDIX DIVIDER
// ============================================================
(() => {
  const s = pres.addSlide(); bg(s, C.bg2);
  s.addText("Appendix", { x: 0.8, y: 3.0, w: 8, h: 1.0, fontSize: 46, fontFace: HEAD, bold: true, color: C.text, isTextBox: true, margin: 0 });
  s.addText("The detail behind the story — evidence table, full economics, competition specs, go-to-market, and open questions.",
    { x: 0.8, y: 4.1, w: 9.5, h: 0.9, fontSize: 16, fontFace: BODY, color: C.muted, isTextBox: true, margin: 0, lineSpacingMultiple: 1.15 });
  s.addText("A", { x: 11.2, y: 2.7, w: 1.5, h: 1.6, fontSize: 90, fontFace: HEAD, bold: true, color: C.line, align: "center", valign: "middle", isTextBox: true, margin: 0 });
})();

// ============================================================
// APPENDIX A1 — EVIDENCE TABLE (honesty grid)
// ============================================================
(() => {
  const s = pres.addSlide(); bg(s);
  eyebrow(s, "Appendix · What's proven vs projected", C.muted);
  s.addText("Every number in this deck, labelled honestly.",
    { x: 0.7, y: 1.0, w: 11.5, h: 0.6, fontSize: 24, fontFace: HEAD, bold: true, color: C.text, isTextBox: true, margin: 0 });

  const cols = [
    ["MEASURED", C.mint, ["₹1,78,000 unit build cost (BOM)","Emerson CR30K7ME compressor: 6.89 kW, COP 3.39","7-row SS304 coil, 20\", R407C","6-stage treatment, WHO & BIS IS 10500","210 L produced across 2 field pilots"]],
    ["CALCULATED", C.water, ["Output 221.7 / 120.2 / 56.1 LPD (80/60/30% RH)","~3,000 kJ/kg water desorption energy","1.29 kW usable compressor waste heat","2.71 kW total system draw"]],
    ["PROJECTED", C.amber, ["93 LPD / 1.43 L/kWh at 30% RH with sponge","+66% output at the same power","Unit cost under ₹1.5L after DFM","10 units/month capacity with RYLT"]],
    ["ASSUMED", C.coral, ["₹3,75,000 selling price (to confirm)","Sorbent 0.8 g/g, ~8 kg bed, 6 cycles/day","Total dry-climate site count [DATA NEEDED]"]],
  ];
  const cw = 2.98, gap = 0.12, x0 = 0.55, yy = 1.9, chh = 4.75;
  cols.forEach((col,i) => {
    const x = x0 + i*(cw+gap);
    card(s, x, yy, cw, chh, C.panel);
    s.addShape(pres.ShapeType.roundRect, { x: x+0.2, y: yy+0.22, w: cw-0.4, h: 0.4, fill: { color: C.bg2 }, line: { color: col[1], width: 1 }, rectRadius: 0.05 });
    s.addText(col[0], { x: x+0.2, y: yy+0.22, w: cw-0.4, h: 0.4, fontSize: 11.5, fontFace: HEAD, bold: true, color: col[1], align: "center", valign: "middle", charSpacing: 1.5, isTextBox: true, margin: 0 });
    col[2].forEach((item,j) => {
      const iy = yy + 0.85 + j*0.78;
      s.addShape(pres.ShapeType.ellipse, { x: x+0.22, y: iy+0.06, w: 0.1, h: 0.1, fill: { color: col[1] }, line: { type: "none" } });
      s.addText(item, { x: x+0.42, y: iy-0.05, w: cw-0.62, h: 0.75, fontSize: 11, fontFace: BODY, color: C.text, isTextBox: true, margin: 0, lineSpacingMultiple: 1.0, valign: "top" });
    });
  });
  footer(s, "A1", "Appendix · Evidence");
  s.addNotes("This slide is the trust-builder in diligence: the founder pre-empts 'which of these have you actually measured?'");
})();

// ============================================================
// APPENDIX A2 — FULL UNIT ECONOMICS & PAYBACK
// ============================================================
(() => {
  const s = pres.addSlide(); bg(s);
  eyebrow(s, "Appendix · Unit economics", C.muted);
  s.addText("Full economics & customer payback.",
    { x: 0.7, y: 1.0, w: 11.5, h: 0.6, fontSize: 24, fontFace: HEAD, bold: true, color: C.text, isTextBox: true, margin: 0 });

  // left: our economics
  card(s, 0.7, 1.95, 5.5, 4.7, C.panel);
  s.addText("OUR ECONOMICS, PER UNIT", { x: 1.0, y: 2.2, w: 5, h: 0.35, fontSize: 12, fontFace: HEAD, bold: true, color: C.dim, charSpacing: 1, isTextBox: true, margin: 0 });
  const econ = [
    ["Cost to build (measured)","₹1,78,000", C.text],
    ["Selling price (assumed)","₹3,75,000", C.text],
    ["Gross profit / unit","₹1,97,000", C.mint],
    ["Gross margin","52.5%", C.mint],
    ["Monitoring (recurring)","₹2,500 / mo", C.text],
  ];
  econ.forEach((e,i) => {
    const yy = 2.75 + i*0.72;
    s.addText(e[0], { x: 1.0, y: yy, w: 3.3, h: 0.55, fontSize: 14, fontFace: BODY, color: C.muted, valign: "middle", isTextBox: true, margin: 0 });
    s.addText(e[1], { x: 4.3, y: yy, w: 1.65, h: 0.55, fontSize: 18, fontFace: HEAD, bold: true, color: e[2], align: "right", valign: "middle", isTextBox: true, margin: 0 });
    if (i<4) s.addShape(pres.ShapeType.line, { x: 1.0, y: yy+0.63, w: 4.95, h: 0, line: { color: C.line, width: 0.75 } });
  });

  // right: customer payback
  card(s, 6.45, 1.95, 6.2, 4.7, C.panel);
  s.addText("CUSTOMER PAYBACK  ·  AT 150 USABLE LITRES/DAY", { x: 6.75, y: 2.2, w: 5.7, h: 0.35, fontSize: 12, fontFace: HEAD, bold: true, color: C.dim, charSpacing: 0.5, isTextBox: true, margin: 0 });
  const pay = [
    ["Replaces branded bottled water","₹20 / L","~4 months", C.mint],
    ["Replaces bulk jar water","₹4 / L","~25 months", C.amber],
    ["Replaces tanker water","₹0.40 / L","~4 years, or never", C.coral],
    ["Sold as a dehumidifier","₹15,000 / mo","water is free", C.water],
  ];
  pay.forEach((p,i) => {
    const yy = 2.8 + i*0.92;
    s.addText(p[0], { x: 6.75, y: yy, w: 3.4, h: 0.75, fontSize: 14, fontFace: HEAD, bold: true, color: C.text, valign: "middle", isTextBox: true, margin: 0, lineSpacingMultiple: 0.95 });
    s.addText(p[1], { x: 6.75, y: yy+0.42, w: 3.4, h: 0.35, fontSize: 11.5, fontFace: BODY, color: C.dim, isTextBox: true, margin: 0 });
    s.addText(p[2], { x: 10.2, y: yy, w: 2.35, h: 0.75, fontSize: 15, fontFace: HEAD, bold: true, color: p[3], align: "right", valign: "middle", isTextBox: true, margin: 0 });
    if (i<3) s.addShape(pres.ShapeType.line, { x: 6.75, y: yy+0.82, w: 5.8, h: 0, line: { color: C.line, width: 0.75 } });
  });
  footer(s, "A2", "Appendix · Economics");
})();

// ============================================================
// APPENDIX A3 — COMPETITION SPECS
// ============================================================
(() => {
  const s = pres.addSlide(); bg(s);
  eyebrow(s, "Appendix · Competition", C.muted);
  s.addText("Head-to-head specs.",
    { x: 0.7, y: 1.0, w: 11.5, h: 0.6, fontSize: 24, fontFace: HEAD, bold: true, color: C.text, isTextBox: true, margin: 0 });

  const rows = [
    { text: [ {text:"",options:{}}, {text:"Output",options:{}}, {text:"Power",options:{}}, {text:"L/kWh @ 80% RH",options:{}} ] },
  ];
  // build a simple table
  const tbl = [
    ["", "Output", "Power", "L/kWh @ 80% RH"],
    ["Maithri MEGHDOOT Premium", "150 LPD", "2.0 kW", "3.13"],
    ["AcquaHT 200 LPD", "221.7 LPD", "2.71 kW", "3.41"],
  ];
  const colX = [0.7, 5.4, 7.6, 9.6];
  const colW = [4.7, 2.2, 2.0, 3.0];
  const yTop = 2.05, rh = 0.72;
  tbl.forEach((r,i) => {
    const yy = yTop + i*rh;
    if (i===0) {
      s.addShape(pres.ShapeType.rect, { x: 0.7, y: yy, w: 11.9, h: rh, fill: { color: C.bg2 }, line: { type: "none" } });
    } else if (i===2) {
      s.addShape(pres.ShapeType.rect, { x: 0.7, y: yy, w: 11.9, h: rh, fill: { color: C.panel2 }, line: { type: "none" } });
    }
    r.forEach((cell,c) => {
      const isHead = i===0;
      const isUs = i===2;
      s.addText(cell, { x: colX[c], y: yy, w: colW[c], h: rh, fontSize: isHead?12:15, fontFace: isHead?BODY:HEAD, bold: !isHead, color: isHead?C.dim:(isUs&&c>0?C.water:C.text), align: c===0?"left":"center", valign: "middle", isTextBox: true, margin: c===0?0.15:0, charSpacing: isHead?1:0 });
    });
    s.addShape(pres.ShapeType.line, { x: 0.7, y: yy+rh, w: 11.9, h: 0, line: { color: C.line, width: 0.75 } });
  });

  s.addText("AcquaHT's 200 LPD unit is already more efficient than Maithri's premium model at 80% humidity — before the dry-air upgrade.",
    { x: 0.7, y: 4.5, w: 11.9, h: 0.6, fontSize: 15, fontFace: BODY, color: C.text, isTextBox: true, margin: 0, lineSpacingMultiple: 1.1 });
  s.addText(
    [
      { text: "Imported players:  ", options: { color: C.muted, bold: true } },
      { text: "Watergen, SkyWater — priced in dollars, also rated only at high humidity. Not a factor in the dry-air segment we build for. And nobody but AcquaHT publishes performance below 80% RH.", options: { color: C.muted } },
    ],
    { x: 0.7, y: 5.3, w: 11.9, h: 1.0, fontSize: 14, fontFace: BODY, isTextBox: true, margin: 0, lineSpacingMultiple: 1.15 });
  footer(s, "A3", "Appendix · Competition");
})();

// ============================================================
// APPENDIX A4 — GO-TO-MARKET
// ============================================================
(() => {
  const s = pres.addSlide(); bg(s);
  eyebrow(s, "Appendix · Go-to-market", C.muted);
  s.addText("How the sales motion actually works.",
    { x: 0.7, y: 1.0, w: 11.5, h: 0.6, fontSize: 24, fontFace: HEAD, bold: true, color: C.text, isTextBox: true, margin: 0 });

  const qa = [
    ["Who buys first?", "Dry-climate industrial & food-processing sites that already pay monthly for dehumidification."],
    ["Why do they buy?", "They already budget for drying. We give them that plus water — better economics than a water-only machine in dry air."],
    ["How do we reach them?", "Direct relationships today: RYLT's industrial network, the Bala Vikasa MoU (rural), T-Hub / PIER71 Singapore (international interest)."],
    ["What expands it?", "Once the dry-air stage is field-proven, sell into coastal / humid sites where water displaces bottled water — ~4-month payback."],
  ];
  const cw = 5.9, gap = 0.15, chh = 2.05;
  qa.forEach((q,i) => {
    const x = 0.7 + (i%2)*(cw+gap);
    const yy = 1.95 + Math.floor(i/2)*(chh+0.2);
    card(s, x, yy, cw, chh, C.panel);
    s.addText(q[0], { x: x+0.3, y: yy+0.25, w: cw-0.6, h: 0.5, fontSize: 17, fontFace: HEAD, bold: true, color: C.water, isTextBox: true, margin: 0 });
    s.addText(q[1], { x: x+0.3, y: yy+0.8, w: cw-0.6, h: 1.1, fontSize: 13.5, fontFace: BODY, color: C.muted, isTextBox: true, margin: 0, lineSpacingMultiple: 1.12 });
  });
  tag(s, "Decision-maker, sales cycle & CAC not yet tracked · DATA NEEDED", 0.7, 6.4, C.amber);
  footer(s, "A4", "Appendix · GTM");
})();

// ============================================================
// APPENDIX A5 — OPEN QUESTIONS / DATA NEEDED
// ============================================================
(() => {
  const s = pres.addSlide(); bg(s);
  eyebrow(s, "Appendix · Open questions", C.muted);
  s.addText("What we still owe you — flagged, not hidden.",
    { x: 0.7, y: 1.0, w: 11.5, h: 0.6, fontSize: 24, fontFace: HEAD, bold: true, color: C.text, isTextBox: true, margin: 0 });

  const items = [
    ["The sponge hasn't run yet", "No sorbent has been cycled in our machine. Every dry-air number is a design target until this round proves it. This is the core risk — and the core use of funds."],
    ["Selling price not confirmed", "₹3,75,000 drives the margin and revenue math but isn't yet locked with a customer."],
    ["Total addressable count unknown", "We can name 75 sites. The full dry-climate industrial site count is not yet sized."],
    ["Certification specifics open", "Which certificate, which body, which month — still to be pinned down."],
    ["Sales motion not yet instrumented", "Decision-maker title, sales-cycle length and customer acquisition cost aren't tracked yet."],
  ];
  items.forEach((it,i) => {
    const yy = 1.95 + i*0.97;
    card(s, 0.7, yy, 11.95, 0.85, C.panel);
    s.addShape(pres.ShapeType.ellipse, { x: 0.95, y: yy+0.24, w: 0.38, h: 0.38, fill: { color: C.amber }, line: { type: "none" } });
    s.addText(String(i+1), { x: 0.95, y: yy+0.24, w: 0.38, h: 0.38, fontSize: 15, fontFace: HEAD, bold: true, color: "0A1622", align: "center", valign: "middle", isTextBox: true, margin: 0 });
    s.addText(it[0], { x: 1.5, y: yy+0.13, w: 3.7, h: 0.6, fontSize: 15, fontFace: HEAD, bold: true, color: C.text, valign: "middle", isTextBox: true, margin: 0, lineSpacingMultiple: 0.95 });
    s.addText(it[1], { x: 5.3, y: yy+0.1, w: 7.15, h: 0.65, fontSize: 12.5, fontFace: BODY, color: C.muted, valign: "middle", isTextBox: true, margin: 0, lineSpacingMultiple: 1.02 });
  });
  footer(s, "A5", "Appendix · Open questions");
  s.addNotes("Leading with your own risk list is disarming in a Demo Day setting and signals a founder who won't surprise investors later.");
})();

pres.writeFile({ fileName: "AcquaHT_YC_Deck.pptx" }).then(f => console.log("WROTE", f));
