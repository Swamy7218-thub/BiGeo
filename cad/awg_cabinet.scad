// =====================================================================
// Floor-standing Atmospheric Water Generator (AWG) Cabinet — 100 L/day
// Parametric assembly: enclosure, plinth/casters, door, side panels,
// dispensing nook, and labeled internal mounting brackets.
// Units: millimetres. Render: F5 preview / F6 for final.
// =====================================================================

$fn = 32;

// ---------------------------------------------------------------
// Global parameters
// ---------------------------------------------------------------
W            = 600;   // overall width
D            = 650;   // overall depth
H_TOTAL      = 1500;  // overall height
PLINTH_H     = 100;   // base plinth height
WALL         = 1.5;   // sheet-steel wall thickness
EDGE_R       = 8;     // rounded vertical edge radius
GAP          = 2;     // panel reveal/gap

BODY_H       = H_TOTAL - PLINTH_H;     // 1400
BODY_Z0      = PLINTH_H;               // body sits on plinth top

// vertical thirds of the body (top->bottom referenced from BODY_Z0)
THIRD_H      = BODY_H / 3;             // 466.67
TOP_Z0       = BODY_Z0 + 2*THIRD_H;    // refrigeration section start
MID_Z0       = BODY_Z0 + THIRD_H;      // condensate/raw-tank section start
BOT_Z0       = BODY_Z0;                // storage/pump/electrical section start

SHOW_LABELS  = true;
FINISH_COLOR = [0.55, 0.56, 0.58];     // neutral matte grey

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
module rrect2d(w, d, r) {
    hull() {
        for (sx = [-1, 1]) for (sy = [-1, 1])
            translate([sx*(w/2 - r), sy*(d/2 - r)]) circle(r = r);
    }
}

module rrect_prism(w, d, h, r) {
    linear_extrude(height = h) rrect2d(w, d, r);
}

module label(txt, pos, size = 10, col = [0,0,0]) {
    if (SHOW_LABELS) {
        translate(pos) color(col)
            rotate([90, 0, 0])
                linear_extrude(height = 0.8)
                    text(txt, size = size, halign = "left", valign = "center");
    }
}

// ---------------------------------------------------------------
// Base plinth + casters
// ---------------------------------------------------------------
module plinth() {
    color(FINISH_COLOR)
        translate([-W/2, -D/2, 0])
            rrect_prism(W, D, PLINTH_H, EDGE_R);

    caster_r = 40; caster_h = 90; inset = 70;
    positions = [
        [-(W/2 - inset),  (D/2 - inset), true],   // front-left  (lockable)
        [ (W/2 - inset),  (D/2 - inset), false],  // front-right (swivel)
        [-(W/2 - inset), -(D/2 - inset), true],   // rear-left   (lockable, brake)
        [ (W/2 - inset), -(D/2 - inset), true],   // rear-right  (lockable, brake)
    ];
    for (p = positions) {
        translate([p[0], p[1], -caster_h + 5])
            color(p[2] ? [0.8, 0.1, 0.1] : [0.15, 0.15, 0.15])
                cylinder(r = caster_r, h = caster_h);
    }
    label("4x lockable casters (2 w/ brakes, rear)", [W/2 + 20, D/2 - 60, -40]);
}

// ---------------------------------------------------------------
// Outer enclosure shell (rounded-edge sheet-steel body, top capped)
// ---------------------------------------------------------------
module outer_shell() {
    color(FINISH_COLOR)
    translate([0, 0, BODY_Z0])
    difference() {
        translate([-W/2, -D/2, 0]) rrect_prism(W, D, BODY_H, EDGE_R);
        translate([-(W/2 - WALL), -(D/2 - WALL), -1])
            rrect_prism(W - 2*WALL, D - 2*WALL, BODY_H - WALL + 1, max(EDGE_R - WALL, 1));
        // front opening for door + dispensing nook (cut full front face below TOP_Z0-cap)
        translate([-(W/2 - WALL) , D/2 - WALL - 1, -1])
            cube([W - 2*WALL, WALL + 2, (TOP_Z0 - BODY_Z0) + 1]);
    }
    label("Outer enclosure: 1.5mm powder-coated steel, R8 edges",
          [W/2 + 20, 0, BODY_Z0 + BODY_H - 50]);
}

// ---------------------------------------------------------------
// Louvers (simple slatted opening pattern)
// ---------------------------------------------------------------
module louver_field(w, h, slat_h = 8, slat_gap = 6) {
    n = floor(h / (slat_h + slat_gap));
    for (i = [0:n-1])
        translate([0, 0, i*(slat_h + slat_gap)])
            cube([w, WALL + 2, slat_h]);
}

// ---------------------------------------------------------------
// Side panels (removable, quarter-turn fasteners) with intake louvers
// ---------------------------------------------------------------
module side_panel(side) { // side = 1 (right, +X) or -1 (left, -X)
    panel_h = BODY_H - 2*GAP;
    intake_h = panel_h * 2/3;
    x = side * (W/2 - WALL/2);

    color(FINISH_COLOR)
    translate([x - side*WALL/2, -D/2 + WALL, BODY_Z0 + GAP])
    difference() {
        cube([WALL, D - 2*WALL, panel_h]);
        // louvered intake covering lower 2/3 of panel
        translate([-1, 10, 0])
            rotate([0,90,0])
                translate([0, 0, side > 0 ? -WALL-2 : 0])
                    louver_field(intake_h, D - 2*WALL - 20);
    }

    // quarter-turn fastener indicators (4 per panel)
    for (fz = [0.15, 0.45, 0.7, 0.9])
        for (fy = [0.15, 0.85])
            translate([x, (-D/2 + WALL) + fy*(D - 2*WALL), BODY_Z0 + GAP + fz*panel_h])
                color([0.1,0.1,0.1]) rotate([0,90,0]) cylinder(r=4, h=2, center=true);

    label(str(side > 0 ? "Right" : "Left", " side panel: quarter-turn fasteners, lower 2/3 intake louvers"),
          [x + side*10, D/2 - 100, BODY_Z0 + panel_h - 80]);
}

// ---------------------------------------------------------------
// Rear panel with upper-third exhaust louvers
// ---------------------------------------------------------------
module rear_panel() {
    y = -D/2 + WALL/2;
    color(FINISH_COLOR)
    translate([-W/2 + WALL, y - WALL/2, BODY_Z0])
    difference() {
        cube([W - 2*WALL, WALL, BODY_H]);
        translate([20, -1, TOP_Z0 - BODY_Z0])
            rotate([0,0,0])
                translate([0,0,0])
                    rotate([90,0,90])
                        louver_field(THIRD_H - 20, W - 2*WALL - 40);
    }

    // cable glands: DC solar input + AC backup inlet
    color([0.2,0.2,0.2]) {
        translate([-W/4, y - 3, BOT_Z0 + 80]) rotate([90,0,0]) cylinder(r=10, h=10);
        translate([ -W/4 + 60, y - 3, BOT_Z0 + 80]) rotate([90,0,0]) cylinder(r=10, h=10);
    }
    label("Rear: exhaust louvers (upper third) + DC solar / AC inlet glands",
          [-W/2 + 20, -D/2 - 5, TOP_Z0 + 60]);
}

// ---------------------------------------------------------------
// Front door (removable, concealed hinges, recessed pull, dispensing
// nook, touchscreen on fixed panel above door)
// ---------------------------------------------------------------
module front_door() {
    door_w = W - 2*WALL - 2*GAP;
    door_h = 1100 - PLINTH_H;            // door top at 1100mm overall height
    y = D/2 - WALL/2;

    color(FINISH_COLOR)
    translate([-door_w/2, y, BODY_Z0])
    difference() {
        cube([door_w, WALL, door_h]);

        // recessed pull handle (vertical), right-hand edge
        translate([door_w - 60, -0.5, door_h*0.5 - 100])
            cube([40, WALL*0.6 + 1, 200]);

        // dispensing nook opening at 1000mm height
        translate([door_w/2 - 90, -1, 1000 - PLINTH_H - 60])
            cube([180, WALL + 2, 160]);
    }

    // concealed hinge markers (left edge)
    for (hz = [0.1, 0.5, 0.9])
        color([0.1,0.1,0.1])
            translate([-door_w/2 + 6, y + WALL/2, BODY_Z0 + hz*door_h])
                cylinder(r=6, h=10, center=true);

    // ---- dispensing nook (recessed box + tap + drip basin) ----
    nook_z = BODY_Z0 + 1000 - PLINTH_H;
    color([0.7,0.7,0.72])
        translate([-90, y - 60, nook_z - 70])
            cube([180, 60, 130]);
    color([0.85,0.85,0.0])              // tap
        translate([0, y - 50, nook_z + 20])
            rotate([90,0,0]) cylinder(r=6, h=40);
    color([0.9,0.9,0.9])                // removable drip basin
        translate([-70, y - 55, nook_z - 80])
            cube([140, 50, 15]);
    label("Dispensing nook @1000mm: tap + removable drip basin",
          [110, D/2, nook_z]);

    // ---- fixed upper front panel (sealed, above door) with touchscreen ----
    fixed_h = (TOP_Z0 - BODY_Z0) - (door_h);
    color(FINISH_COLOR)
        translate([-door_w/2, y, BODY_Z0 + door_h])
            cube([door_w, WALL, fixed_h]);

    ts_z = BODY_Z0 + 1300 - PLINTH_H;
    color([0.05,0.05,0.05])
        translate([-90, y - 4, ts_z - 60])
            cube([180, 4, 120]);          // 7" touchscreen, flush-mounted
    label("7\" IoT touchscreen @1300mm, flush-mounted",
          [110, D/2, ts_z]);

    label("Front door: full-height(0-1100mm), concealed hinges, recessed pull",
          [-door_w/2 - 10, D/2, BODY_Z0 + door_h - 50]);
}

// =====================================================================
// INTERNAL LAYOUT (top -> bottom)
// =====================================================================

// ---------------- TOP THIRD: refrigeration section -----------------
module cooling_section() {
    // mounting frame (skeleton) for the section
    color([0.3,0.3,0.3])
    translate([-W/2 + 30, -D/2 + 30, TOP_Z0 + 10])
        difference() {
            cube([W - 60, D - 60, 20]);
            translate([10,10,-1]) cube([W - 80, D - 80, 22]);
        }
    label("Coil-block mounting frame", [-W/2 + 40, -D/2 + 10, TOP_Z0 + 30]);

    // evaporator coil block 400 x 300 x 120
    color([0.6,0.75,0.85])
        translate([-200, -50, TOP_Z0 + 60])
            cube([400, 300, 120]);
    label("Evaporator coil block (400x300x120)", [-190, -D/2+40, TOP_Z0 + 130]);

    // condenser coil (slab, rear)
    color([0.8,0.5,0.3])
        translate([-200, D/2 - 90, TOP_Z0 + 60])
            cube([400, 40, 220]);
    label("Condenser coil", [-190, D/2 - 50, TOP_Z0 + 280]);

    // compressor on rubber isolation feet, rear
    feet_z = TOP_Z0 + 5;
    for (fx = [-60, 60]) for (fy = [-30, 30])
        color([0.1,0.1,0.1])
            translate([fx, D/2 - 120 + fy, feet_z])
                cylinder(r=12, h=20);
    color([0.25,0.25,0.3])
        translate([-90, D/2 - 150, feet_z + 20])
            cube([180, 90, 160]);
    label("Compressor on rubber isolation feet (rear)",
          [-85, D/2 - 30, feet_z + 180]);
}

// ----------- MIDDLE THIRD: condensate tray + raw-water tank ---------
module condensate_section() {
    tray_z = MID_Z0 + THIRD_H - 80;
    // sloped stainless condensate tray funneling to center drain
    color([0.8,0.82,0.85])
        translate([-W/2 + 25, -D/2 + 25, tray_z])
            difference() {
                cube([W - 50, D - 50, 30]);
                translate([0,0,5])
                    cube([W - 50, D - 50, 30]);
            }
    color([0.7,0.72,0.75])
        translate([0, 0, tray_z - 40])
            cylinder(r1 = 25, r2 = 8, h = 40);  // center drain funnel
    label("Sloped condensate tray -> center drain", [-W/2+30, -D/2+40, tray_z+35]);

    // 20 L raw-water collection tank (approx 330 x 250 x 245 -> ~20.2 L)
    color([0.2,0.5,0.8,0.6])
        translate([-165, -50, MID_Z0 + 20])
            cube([330, 250, 245]);
    label("Raw-water collection tank (20 L)", [-160, -D/2+40, MID_Z0 + 130]);

    // mounting frame for blower (behind right-side intake)
    color([0.3,0.3,0.3])
        translate([W/2 - 90, -D/2 + 40, MID_Z0 + 20])
            difference() {
                cube([60, D - 220, THIRD_H - 40]);
                translate([8,8,8]) cube([44, D-236, THIRD_H-56]);
            }
    color([0.35,0.35,0.4])
        translate([W/2 - 80, -D/2 + 60, MID_Z0 + 60])
            cylinder(r=55, h=70);             // centrifugal blower
    label("Blower mounting frame + centrifugal blower",
          [W/2 - 80, -D/2 + 130, MID_Z0 + 150]);
}

// ----------- LEFT WALL: six-stage vertical filter bay (full height) --
module filter_bay() {
    n = 6;
    names = ["Sediment","Carbon","RO membrane","Post-carbon","UV chamber","Mineralizer"];
    dia = 70; ht = 250;
    x = -W/2 + WALL + 20 + dia/2;
    usable_d = D - 2*WALL - 60;
    spacing = usable_d / n;
    z0 = BOT_Z0 + 40;

    color([0.3,0.3,0.3])
        translate([x - dia/2 - 10, -D/2 + 25, z0 - 15])
            cube([dia + 20, usable_d, ht + 30]);     // filter bay frame
    for (i = [0:n-1]) {
        yc = -D/2 + 30 + spacing*(i + 0.5);
        color([0.4 + i*0.08, 0.7, 0.9 - i*0.08])
            translate([x, yc, z0])
                cylinder(d = dia, h = ht);
        label(names[i], [x - dia/2, yc + dia/2 + 5, z0 + ht/2]);
    }
    label("Six-stage vertical filter bay (left wall)",
          [x - dia, -D/2 + 10, z0 + ht + 40]);
}

// ----------- BOTTOM THIRD: treated tank, pump, electrical compt -----
module storage_section() {
    // 30 L treated-water storage tank (approx 380 x 280 x 282 -> ~30 L)
    color([0.2,0.6,0.9,0.6])
        translate([-W/2 + 110, -60, BOT_Z0 + 150])
            cube([380, 280, 282]);
    label("Treated-water storage tank (30 L)", [-W/2+115, -D/2+30, BOT_Z0+260]);

    // small water pump
    color([0.2,0.2,0.25])
        translate([W/2 - 140, -D/2 + 60, BOT_Z0 + 150])
            cylinder(r = 35, h = 60);
    label("Water pump", [W/2 - 150, -D/2 + 110, BOT_Z0 + 210]);

    // sealed electrical / battery compartment at very base (low CG)
    color([0.15,0.15,0.15])
        translate([-W/2 + 30, -D/2 + 30, BOT_Z0])
            cube([W - 60, D - 60, 90]);
    label("Sealed electrical / battery compartment (low C.G.)",
          [-W/2 + 40, -D/2 + 10, BOT_Z0 + 100]);
}

// =====================================================================
// TOP-LEVEL ASSEMBLY
// =====================================================================
module awg_cabinet() {
    plinth();
    outer_shell();
    side_panel(1);
    side_panel(-1);
    rear_panel();
    front_door();

    cooling_section();
    condensate_section();
    filter_bay();
    storage_section();
}

awg_cabinet();
