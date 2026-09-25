// ICAR-MSIL national impact slide — one 16:9 editable slide
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");

const OUT = process.argv[2] || "ICAR-MSIL_National_Impact.pptx";

// Palette
const C = {
  navy: "0F1C44", navy2: "1B2A5E", blue: "1F4E9A", teal: "0E8C8C", teal2: "13A3A3",
  green: "2E8B57", gold: "C9A227", gold2: "E3C766", ice: "D6E4F5", bg: "F3F6FA",
  white: "FFFFFF", ink: "1E2A3A", muted: "5B6B7F", line: "DCE3EC", tint: "EAF4F4",
};
const HEAD = "Cambria", BODY = "Calibri";

async function icon(Comp, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Comp, { color: "#" + color, size: String(size) }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

async function helix(w, h, color, alpha) {
  // Faint DNA double-helix motif as a transparent PNG
  const W = w * 100, H = h * 100, turns = 3, pts = 160;
  let a = "", b = "", rungs = "";
  for (let i = 0; i <= pts; i++) {
    const x = (i / pts) * W;
    const t = (i / pts) * turns * 2 * Math.PI;
    const y1 = H / 2 + Math.sin(t) * H * 0.38, y2 = H / 2 - Math.sin(t) * H * 0.38;
    a += (i ? "L" : "M") + x.toFixed(1) + " " + y1.toFixed(1);
    b += (i ? "L" : "M") + x.toFixed(1) + " " + y2.toFixed(1);
    if (i % 8 === 4) rungs += `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#${color}" stroke-width="2"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" opacity="${alpha}">
    <path d="${a}" fill="none" stroke="#${color}" stroke-width="3"/>
    <path d="${b}" fill="none" stroke="#${color}" stroke-width="3"/>${rungs}</svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

async function dotGrid(w, h, color, alpha) {
  const W = w * 100, H = h * 100;
  let dots = "";
  for (let x = 10; x < W; x += 22) for (let y = 10; y < H; y += 22)
    dots += `<circle cx="${x}" cy="${y}" r="1.6" fill="#${color}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" opacity="${alpha}">${dots}</svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

const shadow = () => ({ type: "outer", color: "0F1C44", blur: 6, offset: 1.5, angle: 90, opacity: 0.12 });

function card(slide, pres, x, y, w, h, fill = C.white) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: fill === C.white ? C.line : fill, width: 0.75 },
    shadow: shadow(),
  });
}

function label(slide, x, y, w, num, text, color = C.teal) {
  slide.addText([
    { text: num + "  ", options: { color: C.gold, bold: true } },
    { text, options: { color, bold: true } },
  ], { x, y, w, h: 0.24, fontFace: BODY, fontSize: 9, charSpacing: 1.5, margin: 0, valign: "middle", isTextBox: true });
}

function line(slide, pres, x1, y1, x2, y2, opts) {
  const flip = (x2 - x1) * (y2 - y1) < 0;
  slide.addShape(pres.shapes.LINE, {
    x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
    flipV: flip, line: opts,
  });
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
  pres.title = "ICAR-MSIL: From Molecular Science to National Food Authenticity";
  pres.author = "ICAR-National Meat Research Institute, Hyderabad";
  const s = pres.addSlide();
  s.background = { color: C.bg };

  // ---------- HEADER ----------
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 13.333, h: 1.35, fill: { color: C.navy }, line: { color: C.navy, width: 0 } });
  s.addImage({ data: await helix(3.4, 1.0, "FFFFFF", 0.07), x: 4.7, y: 0.18, w: 3.4, h: 1.0 });

  // ICAR identity mark (editable text badge — swap for official logo if available)
  s.addShape(pres.shapes.OVAL, { x: 0.35, y: 0.24, w: 0.88, h: 0.88, fill: { color: C.white }, line: { color: C.gold, width: 2 } });
  s.addText("ICAR", { x: 0.35, y: 0.24, w: 0.88, h: 0.88, fontFace: HEAD, fontSize: 15, bold: true, color: C.navy, align: "center", valign: "middle", margin: 0, isTextBox: true });

  s.addText("ICAR–MSIL", { x: 1.42, y: 0.14, w: 2.2, h: 0.52, fontFace: HEAD, fontSize: 30, bold: true, color: C.white, margin: 0, valign: "middle", isTextBox: true });
  s.addText([
    { text: "Meat Species Identification Laboratory", options: { breakLine: true } },
    { text: "ICAR–National Meat Research Institute, Hyderabad" },
  ], { x: 3.72, y: 0.17, w: 4.3, h: 0.46, fontFace: BODY, fontSize: 9.5, color: C.gold2, margin: 0, valign: "middle", isTextBox: true });
  s.addText("From Molecular Science to National Food Authenticity", {
    x: 1.42, y: 0.66, w: 6.7, h: 0.36, fontFace: HEAD, fontSize: 18, color: C.white, margin: 0, valign: "middle", isTextBox: true });
  s.addText("Scientific testing  •  Regulatory support  •  Food authenticity  •  National service", {
    x: 1.42, y: 1.02, w: 6.7, h: 0.24, fontFace: BODY, fontSize: 10, italic: true, color: C.ice, margin: 0, valign: "middle", isTextBox: true });

  // Journey strip
  s.addText("THE MSIL JOURNEY", { x: 8.35, y: 0.2, w: 4.6, h: 0.2, fontFace: BODY, fontSize: 7.5, bold: true, color: C.gold2, charSpacing: 2, margin: 0, isTextBox: true });
  const steps = [["SCIENCE", C.blue], ["QUALITY", "1C6FA8"], ["NATIONAL\nSERVICE", C.teal], ["IMPACT", C.green], ["FUTURE", C.gold]];
  steps.forEach(([t, col], i) => {
    const x = 8.35 + i * 0.93;
    s.addShape(i === 0 ? pres.shapes.PENTAGON : pres.shapes.CHEVRON, {
      x, y: 0.47, w: 1.0, h: 0.6, fill: { color: col }, line: { color: col, width: 0 } });
    s.addText(t, { x: x + (i === 0 ? 0.05 : 0.22), y: 0.47, w: 0.66, h: 0.6, fontFace: BODY, fontSize: 7.5, bold: true,
      color: i === 4 ? C.navy : C.white, align: "center", valign: "middle", margin: 0, isTextBox: true });
  });

  // ---------- 01 SCIENCE & QUALITY (left) ----------
  const L = { x: 0.35, y: 1.5, w: 3.25, h: 4.45 };
  card(s, pres, L.x, L.y, L.w, L.h);
  label(s, L.x + 0.18, L.y + 0.12, 2.9, "01", "SCIENCE & QUALITY");
  s.addText("MULTI-PLATFORM MOLECULAR TESTING", { x: L.x + 0.18, y: L.y + 0.38, w: 2.95, h: 0.3, fontFace: HEAD, fontSize: 11.5, bold: true, color: C.navy, margin: 0, valign: "middle", isTextBox: true });
  const dna = await icon(fa.FaDna, C.teal);
  const techs = ["Real-time PCR / qPCR", "Conventional PCR", "Duplex PCR", "PCR-RFLP and advanced molecular approaches"];
  techs.forEach((t, i) => {
    const y = L.y + 0.78 + i * 0.32;
    s.addShape(pres.shapes.OVAL, { x: L.x + 0.18, y: y + 0.02, w: 0.24, h: 0.24, fill: { color: C.tint }, line: { color: C.tint, width: 0 } });
    s.addImage({ data: dna, x: L.x + 0.225, y: y + 0.065, w: 0.15, h: 0.15 });
    s.addText(t, { x: L.x + 0.52, y, w: 2.62, h: 0.28, fontFace: BODY, fontSize: i === 3 ? 9.5 : 10.5, bold: true, color: C.ink, margin: 0, valign: "middle", isTextBox: true });
  });
  // NABL badge
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: L.x + 0.18, y: L.y + 2.1, w: 2.9, h: 0.56, rectRadius: 0.08, fill: { color: C.navy2 }, line: { color: C.gold, width: 1 } });
  s.addImage({ data: await icon(fa.FaAward, C.gold2), x: L.x + 0.3, y: L.y + 2.2, w: 0.36, h: 0.36 });
  s.addText([
    { text: "ISO/IEC 17025:2017", options: { bold: true, color: C.white, breakLine: true } },
    { text: "NABL Accredited", options: { bold: true, color: C.gold2 } },
  ], { x: L.x + 0.78, y: L.y + 2.12, w: 2.25, h: 0.52, fontFace: BODY, fontSize: 11, margin: 0, valign: "middle", isTextBox: true });
  // Species
  s.addText("MULTIPLE-SPECIES IDENTIFICATION", { x: L.x + 0.18, y: L.y + 2.82, w: 2.9, h: 0.24, fontFace: BODY, fontSize: 9, bold: true, charSpacing: 1, color: C.navy, margin: 0, valign: "middle", isTextBox: true });
  const species = ["Cattle", "Buffalo", "Sheep", "Goat", "Pig", "Chicken", "Turkey", "Donkey", "Mithun", "Camel", "Wildlife & others"];
  species.forEach((sp, i) => {
    const r = Math.floor(i / 3), c = i % 3;
    const w = i === 10 ? 1.94 : 0.93;
    const x = L.x + 0.18 + c * 0.985, y = L.y + 3.12 + r * 0.32;
    const hi = i === 10;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.26, rectRadius: 0.13, fill: { color: hi ? C.green : C.tint }, line: { color: hi ? C.green : "BFE0DF", width: 0.75 } });
    s.addText(sp, { x, y, w, h: 0.26, fontFace: BODY, fontSize: 9, bold: true, color: hi ? C.white : C.teal, align: "center", valign: "middle", margin: 0, isTextBox: true });
  });

  // ---------- 02 NATIONAL SERVICE & IMPACT (middle top) ----------
  const M = { x: 3.78, y: 1.5, w: 5.2, h: 2.12 };
  card(s, pres, M.x, M.y, M.w, M.h, C.navy2);
  s.addImage({ data: await dotGrid(3.2, 1.55, "FFFFFF", 0.10), x: 5.72, y: 1.56, w: 3.2, h: 1.55 });
  label(s, M.x + 0.18, M.y + 0.12, 2.0, "02", "NATIONAL SERVICE", C.gold2);
  s.addText(">1,000", { x: M.x + 0.15, y: M.y + 0.4, w: 1.85, h: 0.72, fontFace: HEAD, fontSize: 42, bold: true, color: C.white, margin: 0, valign: "middle", isTextBox: true });
  s.addText("SAMPLES ANALYSED", { x: M.x + 0.18, y: M.y + 1.1, w: 1.85, h: 0.24, fontFace: BODY, fontSize: 11, bold: true, charSpacing: 1, color: C.ice, margin: 0, valign: "middle", isTextBox: true });
  s.addText("2018–2026", { x: M.x + 0.18, y: M.y + 1.34, w: 1.85, h: 0.32, fontFace: HEAD, fontSize: 17, bold: true, color: C.gold2, margin: 0, valign: "middle", isTextBox: true });

  // Network: MSIL hub -> agencies
  const hub = { x: 7.38, y: 2.36 };
  const nodes = [
    ["Food Safety Authorities", 6.3, 1.76], ["Police", 7.38, 1.76], ["Customs", 8.46, 1.76],
    ["Animal Husbandry", 6.3, 2.36], ["Animal Quarantine", 8.46, 2.36],
    ["Forest / Wildlife Depts.", 6.82, 2.96], ["Directorate of Revenue Intelligence", 7.94, 2.96],
  ];
  nodes.forEach(([, nx, ny]) => line(s, pres, hub.x, hub.y, nx, ny, { color: C.teal2, width: 1.25, transparency: 20 }));
  s.addShape(pres.shapes.OVAL, { x: hub.x - 0.33, y: hub.y - 0.33, w: 0.66, h: 0.66, fill: { color: C.teal }, line: { color: C.gold2, width: 2 } });
  s.addText("MSIL", { x: hub.x - 0.33, y: hub.y - 0.33, w: 0.66, h: 0.66, fontFace: HEAD, fontSize: 11, bold: true, color: C.white, align: "center", valign: "middle", margin: 0, isTextBox: true });
  nodes.forEach(([t, nx, ny]) => {
    const w = 0.98, h = 0.36;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: nx - w / 2, y: ny - h / 2, w, h, rectRadius: 0.07, fill: { color: C.white }, line: { color: C.ice, width: 0.75 } });
    s.addText(t, { x: nx - w / 2 + 0.03, y: ny - h / 2, w: w - 0.06, h, fontFace: BODY, fontSize: 7.5, bold: true, color: C.navy, align: "center", valign: "middle", margin: 0, isTextBox: true });
  });
  s.addText("Scientific evidence supporting regulatory, enforcement and forensic investigations", {
    x: M.x + 0.18, y: M.y + 1.76, w: M.w - 0.36, h: 0.26, fontFace: BODY, fontSize: 9.5, italic: true, color: C.ice, margin: 0, valign: "middle", align: "left", isTextBox: true });

  // ---------- 03 WHAT MSIL DELIVERS (middle bottom) ----------
  const D = { x: 3.78, y: 3.76 };
  label(s, D.x + 0.02, D.y, 2.6, "03", "WHAT MSIL DELIVERS");
  // Small extra module: gender identification
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.98, y: D.y - 0.02, w: 2.0, h: 0.28, rectRadius: 0.14, fill: { color: C.white }, line: { color: C.teal, width: 0.75 } });
  s.addImage({ data: await icon(fa.FaVenusMars, C.teal), x: 7.08, y: D.y + 0.03, w: 0.18, h: 0.18 });
  s.addText("+ GENDER IDENTIFICATION", { x: 7.3, y: D.y - 0.02, w: 1.64, h: 0.28, fontFace: BODY, fontSize: 8, bold: true, color: C.teal, margin: 0, valign: "middle", isTextBox: true });
  const mods = [
    [fa.FaSearch, "MEAT SPECIES IDENTIFICATION", null, C.blue],
    [fa.FaExchangeAlt, "ADULTERATION & SUBSTITUTION DETECTION", null, C.teal],
    [fa.FaTags, "MISLABELLING DETECTION", null, C.green],
    [fa.FaCheckCircle, "HALAL CONFORMITY", "Porcine DNA detection", C.blue],
    [fa.FaPaw, "WILDLIFE SPECIES IDENTIFICATION", null, C.teal],
    [fa.FaLeaf, "VEGAN FOOD AUTHENTICATION", null, C.green],
  ];
  for (let i = 0; i < mods.length; i++) {
    const [Ic, t, sub, col] = mods[i];
    const r = Math.floor(i / 3), c = i % 3;
    const w = 1.68, h = 0.9, x = D.x + c * (w + 0.08), y = D.y + 0.36 + r * (h + 0.1);
    card(s, pres, x, y, w, h);
    s.addShape(pres.shapes.OVAL, { x: x + 0.1, y: y + (h - 0.44) / 2, w: 0.44, h: 0.44, fill: { color: col }, line: { color: col, width: 0 } });
    s.addImage({ data: await icon(Ic, C.white), x: x + 0.21, y: y + (h - 0.22) / 2, w: 0.22, h: 0.22 });
    const runs = [{ text: t, options: { bold: true, color: C.navy, fontSize: 8.5, breakLine: !!sub } }];
    if (sub) runs.push({ text: sub, options: { italic: true, color: C.muted, fontSize: 8 } });
    s.addText(runs, { x: x + 0.62, y: y + 0.06, w: w - 0.7, h: h - 0.12, fontFace: BODY, margin: 0, valign: "middle", isTextBox: true });
  }

  // ---------- 04 SCIENTIFIC INNOVATION (right top) ----------
  const R = { x: 9.15, y: 1.5, w: 3.83 };
  card(s, pres, R.x, R.y, R.w, 2.22);
  label(s, R.x + 0.18, R.y + 0.12, 3.4, "04", "SCIENTIFIC INNOVATION");
  const evo = ["Species-specific PCR", "Duplex qPCR", "HRMA", "DNA Microarray", "ddPCR", "miRNA", "CRMs"];
  const ly = R.y + 0.86, x0 = 9.66, step = 0.475;
  line(s, pres, x0 - 0.12, ly, x0 + step * 6 + 0.02, ly, { color: C.teal, width: 1.75, endArrowType: "triangle" });
  evo.forEach((t, i) => {
    const x = x0 + i * step, last = i === 6, d = last ? 0.2 : 0.14;
    s.addShape(pres.shapes.OVAL, { x: x - d / 2, y: ly - d / 2, w: d, h: d, fill: { color: last ? C.gold : C.white }, line: { color: last ? C.gold : C.teal, width: 1.5 } });
    const up = i % 2 === 0;
    s.addText(t, { x: x - 0.45, y: up ? ly - 0.46 : ly + 0.12, w: 0.9, h: 0.34, fontFace: BODY, fontSize: 7.5, bold: true,
      color: last ? "9A7A10" : C.navy, align: "center", valign: up ? "bottom" : "top", margin: 0, isTextBox: true });
  });
  s.addText("Authentication  |  Surveillance  |  Quantification  |  Food Safety  |  Standardization", {
    x: R.x + 0.18, y: R.y + 1.34, w: R.w - 0.3, h: 0.2, fontFace: BODY, fontSize: 7, bold: true, color: C.teal, margin: 0, valign: "middle", isTextBox: true });
  const chk = await icon(fa.FaCheck, C.green);
  const hl = ["Buffalo adulteration quantification by ddPCR", "Sheep–goat duplex real-time PCR", "Wildlife / complex-food authentication", "Certified Reference Materials"];
  hl.forEach((t, i) => {
    const r = Math.floor(i / 2), c = i % 2;
    const x = R.x + 0.18 + c * 1.78, y = R.y + 1.6 + r * 0.3;
    s.addImage({ data: chk, x, y: y + 0.07, w: 0.12, h: 0.12 });
    s.addText(t, { x: x + 0.17, y, w: 1.55, h: 0.28, fontFace: BODY, fontSize: 7.5, color: C.ink, margin: 0, valign: "middle", isTextBox: true });
  });

  // ---------- 05 CAPACITY BUILDING (right middle) ----------
  const cb = { x: R.x, y: 3.84, w: R.w, h: 0.78 };
  card(s, pres, cb.x, cb.y, cb.w, cb.h);
  s.addShape(pres.shapes.OVAL, { x: cb.x + 0.15, y: cb.y + 0.15, w: 0.48, h: 0.48, fill: { color: C.green }, line: { color: C.green, width: 0 } });
  s.addImage({ data: await icon(fa.FaChalkboardTeacher, C.white), x: cb.x + 0.26, y: cb.y + 0.26, w: 0.26, h: 0.26 });
  s.addText([
    { text: "05  ", options: { color: C.gold, bold: true, fontSize: 9 } },
    { text: "NATIONAL CAPACITY BUILDING", options: { color: C.navy, bold: true, fontSize: 9.5, breakLine: true } },
    { text: "Specialized training on meat speciation, authenticity, FSSAI methods and hands-on molecular techniques", options: { italic: true, color: C.muted, fontSize: 8 } },
  ], { x: cb.x + 0.74, y: cb.y + 0.08, w: cb.w - 0.86, h: cb.h - 0.16, fontFace: BODY, margin: 0, valign: "middle", paraSpaceAfter: 2, isTextBox: true });

  // ---------- FUTURE (right bottom, forward arrow) ----------
  const F = { x: R.x, y: 4.74, w: R.w, h: 1.21 };
  s.addShape(pres.shapes.PENTAGON, { x: F.x, y: F.y, w: F.w, h: F.h, fill: { color: C.teal }, line: { color: C.teal, width: 0 }, shadow: shadow() });
  s.addText("FUTURE  ➜", { x: F.x + 0.2, y: F.y + 0.1, w: 2.0, h: 0.2, fontFace: BODY, fontSize: 9, bold: true, charSpacing: 2, color: C.gold2, margin: 0, valign: "middle", isTextBox: true });
  s.addText("CERTIFIED REFERENCE MATERIALS", { x: F.x + 0.2, y: F.y + 0.32, w: 3.3, h: 0.3, fontFace: HEAD, fontSize: 13.5, bold: true, color: C.white, margin: 0, valign: "middle", isTextBox: true });
  s.addText("Strengthening standardization, comparability and quality assurance in molecular meat species testing", {
    x: F.x + 0.2, y: F.y + 0.63, w: 3.0, h: 0.28, fontFace: BODY, fontSize: 7.5, italic: true, color: "E6F4F4", margin: 0, valign: "middle", isTextBox: true });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: F.x + 0.2, y: F.y + 0.94, w: 1.35, h: 0.2, rectRadius: 0.1, fill: { color: C.gold }, line: { color: C.gold, width: 0 } });
  s.addText("ISO 17034 pathway", { x: F.x + 0.2, y: F.y + 0.94, w: 1.35, h: 0.2, fontFace: BODY, fontSize: 8, bold: true, color: C.navy, align: "center", valign: "middle", margin: 0, isTextBox: true });

  // ---------- NATIONAL RECOGNITION band ----------
  const B = { x: 0.35, y: 6.07, w: 12.63, h: 0.58 };
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: B.x, y: B.y, w: B.w, h: B.h, rectRadius: 0.08, fill: { color: C.navy }, line: { color: C.gold, width: 1 } });
  s.addText([
    { text: "NATIONAL", options: { breakLine: true } }, { text: "RECOGNITION" },
  ], { x: B.x + 0.18, y: B.y, w: 1.15, h: B.h, fontFace: BODY, fontSize: 9, bold: true, color: C.gold2, charSpacing: 1.5, margin: 0, valign: "middle", isTextBox: true });
  const rec = [
    [fa.FaAward, "NABL Accredited"],
    [fa.FaUniversity, "FSSAI Referral / Primary Laboratory Recognition"],
    [fa.FaFlask, "National Referral Laboratory"],
    [fa.FaProjectDiagram, "NETSCoFAN – Lead Centre for Foods of Animal Origin"],
    [fa.FaClipboardCheck, "FAPAS Proficiency Testing"],
    [fa.FaTrophy, "FSSAI Eat Right Research Team Award"],
  ];
  const rx0 = B.x + 1.4, rw = (B.w - 1.5) / rec.length;
  for (let i = 0; i < rec.length; i++) {
    const [Ic, t] = rec[i];
    const x = rx0 + i * rw;
    s.addShape(pres.shapes.LINE, { x, y: B.y + 0.12, w: 0, h: B.h - 0.24, line: { color: C.gold, width: 0.75, transparency: 40 } });
    s.addImage({ data: await icon(Ic, C.gold2), x: x + 0.12, y: B.y + (B.h - 0.24) / 2, w: 0.24, h: 0.24 });
    s.addText(t, { x: x + 0.44, y: B.y + 0.04, w: rw - 0.52, h: B.h - 0.08, fontFace: BODY, fontSize: 8.5, bold: true, color: C.white, margin: 0, valign: "middle", isTextBox: true });
  }

  // ---------- Closing statement ----------
  s.addText([
    { text: "“", options: { color: C.gold, bold: true, fontSize: 16 } },
    { text: "From research laboratory to nationally recognised testing facility — advancing authenticity, accountability, food safety and scientific integrity.", options: { color: C.navy } },
    { text: "”", options: { color: C.gold, bold: true, fontSize: 16 } },
  ], { x: 0.6, y: 6.76, w: 12.13, h: 0.5, fontFace: HEAD, fontSize: 13, italic: true, align: "center", valign: "middle", margin: 0, isTextBox: true });

  s.addNotes(
    "ICAR–MSIL national impact slide.\n" +
    "All claims are taken from the MSIL story source material: >1,000 samples analysed (2018–2026); support to Food Safety Authorities, Police, Customs, Animal Husbandry, Forest/Wildlife Departments, Animal Quarantine and DRI; " +
    "NABL accreditation (ISO/IEC 17025:2017); FSSAI referral / primary laboratory recognition; National Referral Laboratory; NETSCoFAN Lead Centre for Foods of Animal Origin; FAPAS proficiency testing; FSSAI Eat Right Research Team Award; " +
    "innovations (species-specific PCR, duplex qPCR, HRMA, DNA microarray, ddPCR, miRNA, CRMs); training programmes; CRM initiative toward ISO 17034.\n" +
    "Before presenting: check the sample count and accreditation scope against the latest NABL certificate. If the certificate figure differs, replace '>1,000' with the verified figure and do not mix the two. " +
    "The 'ICAR' circle is an editable placeholder — replace it with the official ICAR and ICAR–NMRI logos.");

  await pres.writeFile({ fileName: OUT });
  console.log("wrote", OUT);
})();
