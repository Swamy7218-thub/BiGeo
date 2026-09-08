"""
Reusable python-pptx styling engine for the ddPCR novelty strategy deck.
Content-independent: provides a scientific 16:9 theme and slide builders.
"""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn

# ---------------------------------------------------------------- palette
INK      = RGBColor(0x0E, 0x1B, 0x2A)   # deep navy (titles / text)
NAVY     = RGBColor(0x12, 0x2A, 0x3F)   # panel navy
TEAL     = RGBColor(0x0E, 0x8F, 0x8F)   # primary accent (ddPCR teal)
TEAL_DK  = RGBColor(0x0A, 0x6B, 0x6B)
AMBER    = RGBColor(0xE0, 0x8A, 0x1E)   # highlight / novelty
CRIMSON  = RGBColor(0xC0, 0x3A, 0x2B)   # gaps / warnings
GREEN    = RGBColor(0x2E, 0x8B, 0x57)   # go / strengths
SLATE    = RGBColor(0x5A, 0x6B, 0x7B)   # secondary text
LIGHT    = RGBColor(0xF4, 0xF6, 0xF8)   # light panel
PAPER    = RGBColor(0xFF, 0xFF, 0xFF)
BORDER   = RGBColor(0xD5, 0xDD, 0xE3)
GRIDHEAD = RGBColor(0x12, 0x2A, 0x3F)

FONT = "Calibri"
FONT_H = "Calibri"

EMU_W, EMU_H = Inches(13.333), Inches(7.5)


def new_deck():
    prs = Presentation()
    prs.slide_width = EMU_W
    prs.slide_height = EMU_H
    return prs


def _blank(prs):
    return prs.slides.add_slide(prs.slide_layouts[6])


def _rect(slide, x, y, w, h, fill=None, line=None, line_w=0.75, shape=MSO_SHAPE.RECTANGLE):
    sp = slide.shapes.add_shape(shape, x, y, w, h)
    sp.shadow.inherit = False
    if fill is None:
        sp.fill.background()
    else:
        sp.fill.solid(); sp.fill.fore_color.rgb = fill
    if line is None:
        sp.line.fill.background()
    else:
        sp.line.color.rgb = line; sp.line.width = Pt(line_w)
    return sp


def _text(slide, x, y, w, h, runs, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP,
          space_after=4, line_spacing=1.0, wrap=True):
    """runs: list of paragraphs; each paragraph is list of (text, size, color, bold, italic)."""
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = wrap
    tf.vertical_anchor = anchor
    tf.margin_left = Pt(2); tf.margin_right = Pt(2)
    tf.margin_top = Pt(1); tf.margin_bottom = Pt(1)
    for i, para in enumerate(runs):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.space_after = Pt(space_after)
        p.space_before = Pt(0)
        p.line_spacing = line_spacing
        for (txt, size, color, bold, italic) in para:
            r = p.add_run(); r.text = txt
            r.font.name = FONT; r.font.size = Pt(size)
            r.font.color.rgb = color; r.font.bold = bold; r.font.italic = italic
    return tb


def _bullets(slide, x, y, w, h, items, size=15, color=INK, gap=7, lh=1.05):
    """items: list of (level, text, color_override_or_None, bold) ; simple bullet list."""
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame; tf.word_wrap = True
    tf.margin_left = Pt(2); tf.margin_right = Pt(2)
    for i, it in enumerate(items):
        lvl, txt = it[0], it[1]
        col = it[2] if len(it) > 2 and it[2] else color
        bold = it[3] if len(it) > 3 else False
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.level = lvl
        p.space_after = Pt(gap); p.space_before = Pt(0); p.line_spacing = lh
        bullet = "▸ " if lvl == 0 else ("– " if lvl == 1 else "· ")
        r = p.add_run(); r.text = bullet + txt
        r.font.name = FONT; r.font.size = Pt(size - lvl); r.font.color.rgb = col; r.font.bold = bold
    return tb


def footer(slide, prs, idx, tag="ddPCR in Food Molecular Analysis — Global Novelty & Research Strategy"):
    _rect(slide, 0, Inches(7.18), EMU_W, Inches(0.32), fill=INK)
    _text(slide, Inches(0.35), Inches(7.19), Inches(10.5), Inches(0.3),
          [[(tag, 8.5, RGBColor(0xC9,0xD4,0xDD), False, False)]], anchor=MSO_ANCHOR.MIDDLE)
    _text(slide, Inches(12.4), Inches(7.19), Inches(0.7), Inches(0.3),
          [[(str(idx), 9, RGBColor(0xC9,0xD4,0xDD), True, False)]], align=PP_ALIGN.RIGHT, anchor=MSO_ANCHOR.MIDDLE)


def header(slide, kicker, title, idx, prs):
    _rect(slide, 0, 0, EMU_W, Inches(1.15), fill=PAPER)
    _rect(slide, 0, 0, Inches(0.16), Inches(1.15), fill=TEAL)
    _text(slide, Inches(0.45), Inches(0.14), Inches(12.4), Inches(0.3),
          [[(kicker.upper(), 11, TEAL_DK, True, False)]])
    _text(slide, Inches(0.45), Inches(0.42), Inches(12.4), Inches(0.62),
          [[(title, 24, INK, True, False)]], anchor=MSO_ANCHOR.TOP)
    _rect(slide, Inches(0.45), Inches(1.06), Inches(12.45), Pt(1.5), fill=BORDER)
    footer(slide, prs, idx)


def add_table(slide, x, y, w, rows, col_widths, header_fill=GRIDHEAD,
              header_color=PAPER, fs=11, hfs=11, zebra=True, row_h=0.3):
    nrows = len(rows); ncols = len(rows[0])
    gt = slide.shapes.add_table(nrows, ncols, x, y, w, Inches(row_h*nrows)).table
    # disable default styling banding via first row style
    tbl = gt._tbl
    # column widths
    total = sum(col_widths)
    for j, cw in enumerate(col_widths):
        gt.columns[j].width = Emu(int(w * cw / total))
    for i, row in enumerate(rows):
        gt.rows[i].height = Inches(row_h)
        for j, cell in enumerate(row):
            c = gt.cell(i, j)
            c.margin_left = Pt(5); c.margin_right = Pt(5)
            c.margin_top = Pt(2); c.margin_bottom = Pt(2)
            c.vertical_anchor = MSO_ANCHOR.MIDDLE
            if i == 0:
                c.fill.solid(); c.fill.fore_color.rgb = header_fill
            else:
                c.fill.solid()
                c.fill.fore_color.rgb = LIGHT if (zebra and i % 2 == 0) else PAPER
            tf = c.text_frame; tf.word_wrap = True
            p = tf.paragraphs[0]; p.alignment = PP_ALIGN.LEFT
            # allow rich cell = (text, color) or plain str
            if isinstance(cell, tuple):
                txt, col = cell
            else:
                txt, col = cell, (header_color if i == 0 else INK)
            r = p.add_run(); r.text = txt
            r.font.name = FONT
            r.font.size = Pt(hfs if i == 0 else fs)
            r.font.bold = (i == 0)
            r.font.color.rgb = col
    return gt
