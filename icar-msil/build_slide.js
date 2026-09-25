// Builds ICAR-MSIL_National_Impact.pptx — one editable 16:9 slide.
// Run: npm install pptxgenjs react react-dom react-icons sharp && node build_slide.js
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const gi = require("react-icons/gi");

// Palette: ICAR navy + blue, teal, green, subtle gold
const C = {
  navy: "0B2545",
  blue: "134B7F",
  teal: "0E7C86",
  green: "2E7D32",
  gold: "C9A227",
  goldSoft: "E9D8A6",
  bg: "F4F7FB",
  card: "FFFFFF",
  line: "D6DEE8",
  ink: "1B2A3A",
  muted: "5A6B7D",
  tealTint: "E3F2F2",
  white: "FFFFFF",
};
const HEAD = "Cambria";
const BODY = "Calibri";

async function icon(Comp, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Comp, { color: "#" + color, size: String(size) })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

const shadow = () => ({ type: "outer", color: "0B2545", blur: 6, offset: 1.5, angle: 90, opacity: 0.12 });

async function main() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
  pres.title = "ICAR–MSIL: From Molecular Science to National Food Authenticity";
  pres.company = "ICAR–National Meat Research Institute, Hyderabad";

  const s = pres.addSlide();
  s.background = { color: C.bg };

  const T = (text, o) => s.addText(text, { isTextBox: true, fontFace: BODY, color: C.ink, margin: 0, ...o });
  const card = (x, y, w, h, fill = C.card) =>
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: C.line, width: 0.75 }, shadow: shadow(),
    });
  const iconDot = async (Comp, x, y, d, bg, fg) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: bg }, line: { color: bg } });
    const p = d * 0.26;
    s.addImage({ data: await icon(Comp, fg), x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p });
  };

  // ───────────── HEADER ─────────────
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 13.333, h: 1.2, fill: { color: C.navy }, line: { color: C.navy } });
  // faint DNA motif
  s.addImage({ data: await icon(gi.GiDna1, "FFFFFF"), x: 8.35, y: 0.08, w: 1.05, h: 1.05, transparency: 85 });
  // ICAR identity badge (swap for the official ICAR logo)
  s.addShape(pres.shapes.OVAL, { x: 0.4, y: 0.18, w: 0.84, h: 0.84, fill: { color: C.white }, line: { color: C.gold, width: 2 } });
  T("ICAR", { x: 0.4, y: 0.18, w: 0.84, h: 0.84, fontFace: HEAD, fontSize: 15, bold: true, color: C.navy, align: "center", valign: "middle" });

  T("ICAR–MSIL", { x: 1.45, y: 0.1, w: 6.8, h: 0.46, fontFace: HEAD, fontSize: 27, bold: true, color: C.white, valign: "middle" });
  T("From Molecular Science to National Food Authenticity", {
    x: 1.45, y: 0.55, w: 6.8, h: 0.32, fontFace: HEAD, fontSize: 17, bold: true, color: C.gold, valign: "middle",
  });
  T("Scientific testing  •  Regulatory support  •  Food authenticity  •  National service", {
    x: 1.45, y: 0.87, w: 6.8, h: 0.24, fontSize: 11, italic: true, color: "C9D6E6", valign: "middle",
  });
  T([
    { text: "Meat Species Identification Laboratory", options: { bold: true, fontSize: 12.5, color: C.white, breakLine: true } },
    { text: "ICAR–National Meat Research Institute", options: { fontSize: 11, color: "C9D6E6", breakLine: true } },
    { text: "Hyderabad", options: { fontSize: 11, color: "C9D6E6" } },
  ], { x: 9.55, y: 0.2, w: 3.38, h: 0.8, align: "right", valign: "middle" });

  // ───────────── JOURNEY STRIP ─────────────
  const cols = { c1: [0.4, 3.1], c2: [3.7, 3.2], c3: [7.1, 3.1], c4: [10.4, 2.533] };
  const jy = 1.3, jh = 0.3;
  const chev = (x, w, label, fill, color = C.white) => {
    s.addShape(pres.shapes.CHEVRON, { x, y: jy, w, h: jh, fill: { color: fill }, line: { color: fill } });
    T(label, { x: x + 0.14, y: jy, w: w - 0.28, h: jh, fontSize: 9.5, bold: true, color, align: "center", valign: "middle", charSpacing: 1.5 });
  };
  chev(cols.c1[0], 1.6, "SCIENCE", C.blue);
  chev(cols.c1[0] + 1.5, 1.6, "QUALITY", C.teal);
  chev(cols.c2[0], cols.c2[1], "NATIONAL SERVICE", C.green);
  chev(cols.c3[0], cols.c3[1], "IMPACT", C.navy);
  chev(cols.c4[0], cols.c4[1], "FUTURE", C.gold, C.navy);

  const top = 1.72, mainH = 3.06;

  // ───────────── 1. SCIENCE & QUALITY FOUNDATION ─────────────
  {
    const [x, w] = cols.c1;
    card(x, top, w, mainH);
    await iconDot(fa.FaDna, x + 0.15, top + 0.13, 0.36, C.blue, C.white);
    T("MULTIPLE MOLECULAR\nTECHNOLOGIES", { x: x + 0.6, y: top + 0.1, w: w - 0.7, h: 0.42, fontSize: 11, bold: true, color: C.navy, valign: "middle" });

    const techs = ["Real-time PCR / qPCR", "Conventional PCR", "Duplex PCR", "PCR-RFLP & advanced molecular approaches"];
    T(techs.map((t, i) => ({
      text: t, options: { bullet: { indent: 12 }, breakLine: i < techs.length - 1 },
    })), { x: x + 0.18, y: top + 0.56, w: w - 0.28, h: 0.88, fontSize: 10, bold: true, color: C.ink, paraSpaceAfter: 1, valign: "top" });

    // accreditation badge
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.15, y: top + 1.5, w: w - 0.3, h: 0.34, rectRadius: 0.06, fill: { color: C.navy }, line: { color: C.gold, width: 1.25 },
    });
    T([
      { text: "ISO/IEC 17025:2017", options: { bold: true, color: C.white } },
      { text: "  •  ", options: { color: C.gold } },
      { text: "NABL Accredited", options: { bold: true, color: C.gold } },
    ], { x: x + 0.15, y: top + 1.5, w: w - 0.3, h: 0.34, fontSize: 10.5, align: "center", valign: "middle" });

    T("MULTIPLE-SPECIES IDENTIFICATION", { x: x + 0.15, y: top + 1.93, w: w - 0.3, h: 0.2, fontSize: 9, bold: true, color: C.teal, charSpacing: 0.5 });
    const species = ["Cattle", "Buffalo", "Sheep", "Goat", "Pig", "Chicken", "Turkey", "Donkey", "Mithun", "Camel", "Wildlife & others"];
    let cx = x + 0.15, cy = top + 2.2;
    const chipH = 0.22, maxX = x + w - 0.15;
    for (const sp of species) {
      const cw = sp.length * 0.062 + 0.18;
      if (cx + cw > maxX) { cx = x + 0.15; cy += chipH + 0.06; }
      const last = sp.startsWith("Wildlife");
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: cx, y: cy, w: cw, h: chipH, rectRadius: 0.1,
        fill: { color: last ? C.green : C.tealTint }, line: { color: last ? C.green : "B9DCDC", width: 0.5 },
      });
      T(sp, { x: cx, y: cy, w: cw, h: chipH, fontSize: 8.5, bold: last, color: last ? C.white : C.navy, align: "center", valign: "middle" });
      cx += cw + 0.06;
    }
  }

  // ───────────── 2. NATIONAL TESTING & REGULATORY IMPACT ─────────────
  {
    const [x, w] = cols.c2;
    card(x, top, w, mainH);
    T(">1,000", { x: x + 0.15, y: top + 0.08, w: 1.85, h: 0.66, fontFace: HEAD, fontSize: 44, bold: true, color: C.navy, valign: "middle" });
    T([
      { text: "SAMPLES ANALYSED", options: { fontSize: 11.5, bold: true, color: C.teal, breakLine: true } },
      { text: "2018–2026", options: { fontSize: 13, bold: true, color: C.gold } },
    ], { x: x + 2.0, y: top + 0.14, w: w - 2.1, h: 0.56, valign: "middle" });

    // hub-and-spoke network: MSIL → agencies
    const agencies = [
      [fa.FaUtensils, "Food Safety Authorities"],
      [fa.FaUserShield, "Police"],
      [fa.FaPassport, "Customs"],
      [gi.GiCow, "Animal Husbandry"],
      [fa.FaTree, "Forest / Wildlife Departments"],
      [fa.FaClipboardCheck, "Animal Quarantine"],
      [fa.FaSearch, "Directorate of Revenue Intelligence"],
    ];
    const ny = top + 0.86, rowH = 0.235, d = 0.2;
    const hubD = 0.66, hubX = x + 0.2, hubY = ny + (agencies.length * rowH) / 2 - hubD / 2;
    const nodeX = x + 1.2;
    agencies.forEach((_, i) => {
      const ay = ny + i * rowH + d / 2;
      s.addShape(pres.shapes.LINE, {
        x: hubX + hubD, y: Math.min(hubY + hubD / 2, ay), w: nodeX - (hubX + hubD),
        h: Math.max(Math.abs(ay - (hubY + hubD / 2)), 0.001),
        flipV: ay < hubY + hubD / 2, line: { color: "9FB6CC", width: 0.75 },
      });
    });
    s.addShape(pres.shapes.OVAL, { x: hubX, y: hubY, w: hubD, h: hubD, fill: { color: C.navy }, line: { color: C.gold, width: 1.5 } });
    T("MSIL", { x: hubX, y: hubY, w: hubD, h: hubD, fontSize: 11, bold: true, color: C.white, align: "center", valign: "middle" });
    for (let i = 0; i < agencies.length; i++) {
      const [Ic, name] = agencies[i];
      const ay = ny + i * rowH;
      await iconDot(Ic, nodeX, ay, d, C.green, C.white);
      T(name, { x: nodeX + d + 0.07, y: ay - 0.01, w: w - (nodeX - x) - d - 0.12, h: d + 0.02, fontSize: 8.8, bold: true, color: C.ink, valign: "middle" });
    }
    T("Scientific evidence supporting regulatory, enforcement and forensic investigations", {
      x: x + 0.15, y: top + 2.56, w: w - 0.3, h: 0.4, fontSize: 9, italic: true, color: C.muted, align: "center", valign: "middle",
    });
  }

  // ───────────── 3. WHAT MSIL DELIVERS ─────────────
  {
    const [x, w] = cols.c3;
    card(x, top, w, mainH);
    T("WHAT MSIL DELIVERS", { x: x + 0.15, y: top + 0.1, w: w - 0.3, h: 0.26, fontSize: 11, bold: true, color: C.navy, valign: "middle" });
    const mods = [
      [fa.FaDna, "MEAT SPECIES IDENTIFICATION"],
      [fa.FaVial, "ADULTERATION & SUBSTITUTION DETECTION"],
      [fa.FaTags, "MISLABELLING DETECTION"],
      [fa.FaCertificate, "HALAL CONFORMITY", "Porcine DNA detection"],
      [fa.FaPaw, "WILDLIFE SPECIES IDENTIFICATION"],
      [fa.FaLeaf, "VEGAN FOOD AUTHENTICATION"],
    ];
    const gx = x + 0.12, gy = top + 0.44, mw = (w - 0.24 - 0.08) / 2, mh = 0.64, gap = 0.08;
    for (let i = 0; i < mods.length; i++) {
      const [Ic, label, sub] = mods[i];
      const mx = gx + (i % 2) * (mw + gap), my = gy + Math.floor(i / 2) * (mh + gap);
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: mx, y: my, w: mw, h: mh, rectRadius: 0.06, fill: { color: "EEF3F8" }, line: { color: "EEF3F8" } });
      await iconDot(Ic, mx + 0.07, my + (mh - 0.34) / 2, 0.34, C.teal, C.white);
      const runs = [{ text: label, options: { bold: true, fontSize: 8.3, color: C.navy, breakLine: !!sub } }];
      if (sub) runs.push({ text: sub, options: { italic: true, fontSize: 7.8, color: C.teal } });
      T(runs, { x: mx + 0.47, y: my + 0.03, w: mw - 0.52, h: mh - 0.06, valign: "middle" });
    }
    // smaller module
    const sy = gy + 3 * (mh + gap) + 0.02;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: gx, y: sy, w: w - 0.24, h: 0.3, rectRadius: 0.06, fill: { color: C.white }, line: { color: C.teal, width: 0.75, dashType: "dash" } });
    await iconDot(fa.FaVenusMars, gx + 0.07, sy + 0.04, 0.22, C.blue, C.white);
    T("GENDER IDENTIFICATION", { bold: true, color: C.navy, x: gx + 0.37, y: sy, w: w - 0.7, h: 0.3, fontSize: 8.5, valign: "middle" });
  }

  // ───────────── 7. FUTURE ─────────────
  {
    const [x, w] = cols.c4;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: top, w, h: mainH, rectRadius: 0.08, fill: { color: C.navy }, line: { color: C.gold, width: 1.5 }, shadow: shadow(),
    });
    s.addImage({ data: await icon(fa.FaArrowRight, C.gold), x: x + 0.2, y: top + 0.2, w: 0.38, h: 0.38 });
    T("FUTURE", { x: x + 0.68, y: top + 0.2, w: 1.5, h: 0.38, fontSize: 13, bold: true, color: C.gold, valign: "middle", charSpacing: 3 });
    await iconDot(fa.FaFlask, x + w - 0.62, top + 0.14, 0.48, C.gold, C.navy);
    T("CERTIFIED\nREFERENCE\nMATERIALS", {
      x: x + 0.2, y: top + 0.72, w: w - 0.35, h: 0.98, fontFace: HEAD, fontSize: 19, bold: true, color: C.white, valign: "top", lineSpacingMultiple: 0.95,
    });
    T("Strengthening standardization, comparability and quality assurance in molecular meat species testing", {
      x: x + 0.2, y: top + 1.74, w: w - 0.35, h: 0.72, fontSize: 10, italic: true, color: "C9D6E6", valign: "top",
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.2, y: top + 2.5, w: w - 0.4, h: 0.36, rectRadius: 0.1, fill: { color: C.gold }, line: { color: C.gold } });
    T("ISO 17034 pathway  →", { x: x + 0.2, y: top + 2.5, w: w - 0.4, h: 0.36, fontSize: 11, bold: true, color: C.navy, align: "center", valign: "middle" });
  }

  // ───────────── 5. SCIENTIFIC INNOVATION TIMELINE ─────────────
  const r2y = 4.92, r2h = 1.12;
  {
    const x = 0.4, w = 9.8;
    card(x, r2y, w, r2h);
    await iconDot(fa.FaMicroscope, x + 0.15, r2y + 0.09, 0.28, C.blue, C.white);
    T("SCIENTIFIC INNOVATION TIMELINE", { x: x + 0.5, y: r2y + 0.09, w: 3.2, h: 0.28, fontSize: 10.5, bold: true, color: C.navy, valign: "middle" });
    T("Authentication  |  Surveillance  |  Quantification  |  Food Safety  |  Standardization", {
      x: x + 3.75, y: r2y + 0.09, w: w - 3.9, h: 0.28, fontSize: 9, bold: true, color: C.teal, align: "right", valign: "middle",
    });
    const steps = ["Species-specific PCR", "Duplex qPCR", "HRMA", "DNA Microarray", "ddPCR", "miRNA", "CRMs"];
    const sx0 = x + 0.8, sx1 = x + w - 0.55, ly = r2y + 0.5, dd = 0.14;
    s.addShape(pres.shapes.LINE, { x: sx0, y: ly, w: sx1 - sx0, h: 0, line: { color: "9FB6CC", width: 1.5, endArrowType: "triangle" } });
    const step = (sx1 - sx0 - 0.1) / (steps.length - 1);
    steps.forEach((t, i) => {
      const cx = sx0 + i * step, last = i === steps.length - 1;
      s.addShape(pres.shapes.OVAL, { x: cx - dd / 2, y: ly - dd / 2, w: dd, h: dd, fill: { color: last ? C.gold : C.teal }, line: { color: C.white, width: 1 } });
      T(t, { x: cx - 0.7, y: ly + 0.08, w: 1.4, h: 0.2, fontSize: 9, bold: true, color: last ? "9A7A12" : C.navy, align: "center", valign: "middle" });
    });
    // highlights
    const hl = ["Buffalo adulteration quantification by ddPCR", "Sheep–goat duplex real-time PCR", "Wildlife / complex-food authentication", "Certified Reference Materials"];
    const hy = r2y + 0.84, hx0 = x + 0.15, hwAll = w - 0.3, hg = 0.08, hw = (hwAll - hg * 3) / 4;
    hl.forEach((t, i) => {
      const hx = hx0 + i * (hw + hg);
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: hx, y: hy, w: hw, h: 0.22, rectRadius: 0.1, fill: { color: C.tealTint }, line: { color: C.tealTint } });
      T(t, { x: hx, y: hy, w: hw, h: 0.22, fontSize: 8.3, bold: true, color: C.teal, align: "center", valign: "middle" });
    });
  }

  // ───────────── 6. CAPACITY BUILDING ─────────────
  {
    const [x, w] = cols.c4;
    card(x, r2y, w, r2h);
    await iconDot(fa.FaChalkboardTeacher, x + 0.15, r2y + 0.1, 0.36, C.green, C.white);
    T("NATIONAL CAPACITY\nBUILDING", { x: x + 0.6, y: r2y + 0.08, w: w - 0.7, h: 0.4, fontSize: 10.5, bold: true, color: C.navy, valign: "middle" });
    T("Specialized training on meat speciation, authenticity, FSSAI methods and hands-on molecular techniques", {
      x: x + 0.15, y: r2y + 0.52, w: w - 0.25, h: 0.54, fontSize: 8.8, italic: true, color: C.muted, valign: "top",
    });
  }

  // ───────────── 4. NATIONAL RECOGNITION BAND ─────────────
  {
    const y = 6.14, h = 0.72, x = 0.4, w = 12.533;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: C.blue }, line: { color: C.gold, width: 1 } });
    await iconDot(fa.FaAward, x + 0.15, y + 0.17, 0.38, C.gold, C.navy);
    T("NATIONAL\nRECOGNITION", { x: x + 0.6, y, w: 1.2, h, fontSize: 10, bold: true, color: C.gold, valign: "middle", charSpacing: 1 });
    const recs = [
      "NABL Accredited",
      "FSSAI Referral / Primary Laboratory Recognition",
      "National Referral Laboratory",
      "NETSCoFAN – Lead Centre for Foods of Animal Origin",
      "FAPAS Proficiency Testing",
      "FSSAI Eat Right Research Team Award",
    ];
    const rx0 = x + 1.85, rw = (x + w - 0.1 - rx0) / recs.length;
    for (let i = 0; i < recs.length; i++) {
      const rx = rx0 + i * rw;
      if (i > 0) s.addShape(pres.shapes.LINE, { x: rx - 0.02, y: y + 0.16, w: 0, h: h - 0.32, line: { color: "3F6E9C", width: 0.75 } });
      s.addImage({ data: await icon(fa.FaCheckCircle, C.gold), x: rx + 0.08, y: y + (h - 0.18) / 2, w: 0.18, h: 0.18 });
      T(recs[i], { x: rx + 0.32, y: y + 0.06, w: rw - 0.4, h: h - 0.12, fontSize: 9, bold: true, color: C.white, valign: "middle" });
    }
  }

  // ───────────── CLOSING STATEMENT ─────────────
  T("“From research laboratory to nationally recognised testing facility — advancing authenticity, accountability, food safety and scientific integrity.”", {
    x: 0.4, y: 6.94, w: 12.533, h: 0.4, fontFace: HEAD, fontSize: 12.5, italic: true, bold: true, color: C.navy, align: "center", valign: "middle",
  });

  s.addNotes(
    "ICAR–MSIL national contribution slide.\n" +
    "All claims are taken from the MSIL story as quoted in the design brief: >1,000 samples analysed (2018–2026); support to Food Safety Authorities, Police, Customs, Animal Husbandry, Forest/Wildlife Departments, Animal Quarantine and DRI; ISO/IEC 17025:2017 NABL accreditation; FSSAI referral/primary laboratory recognition; NETSCoFAN Lead Centre for Foods of Animal Origin; FAPAS proficiency testing; FSSAI Eat Right Research Team Award; CRM initiative.\n" +
    "Before presenting: (1) replace the 'ICAR' badge with the official ICAR logo; (2) cross-check the NABL certificate number/scope and sample count against the latest NABL document."
  );

  await pres.writeFile({ fileName: "ICAR-MSIL_National_Impact.pptx" });
  console.log("written");
}
main().catch((e) => { console.error(e); process.exit(1); });
