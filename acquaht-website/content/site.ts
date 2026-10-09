// All website text lives here. Update this file when the deck changes.
// Source: AcquaHT Labs Investor Deck (numbers ledger re-issued 30 Sep 2026).

export type Tag =
  | 'Demonstrated'
  | 'Modeled'
  | 'Target'
  | 'In development'
  | 'Third-party data'
  | 'Planned'

export const contact = {
  email: 'admin@acquahtlabs.in',
  founderEmail: 'swamynathan.jerra@acquahtlabs.in',
  location: 'Hyderabad, Telangana, India',
  company: 'AcquaHT Labs Private Limited',
  cin: 'U36000TS2023PTC179371',
  founded: 'November 2023',
}

export const nav = [
  { label: 'Problem', href: '#problem' },
  { label: 'Technology', href: '#technology' },
  { label: 'Product', href: '#product' },
  { label: 'Customers', href: '#customers' },
  { label: 'Progress', href: '#progress' },
  { label: 'Team', href: '#team' },
]

export const hero = {
  eyebrow: 'Water from air · Hyderabad, India',
  titleStart: 'Making water from air work',
  titleAccent: 'where the air is dry.',
  body:
    'We build atmospheric water generators, and the dry-air technology that condensation machines lack. We start where the air is humid: water-stressed coastal resorts and hotels, and industrial humidity control.',
  stats: [
    { num: '≈210 L', label: 'made in two field demonstrations in Telangana', tag: 'Demonstrated' as Tag },
    { num: '₹75,000', label: 'first sale, payment received (humidity control)', tag: 'Demonstrated' as Tag },
    { num: '≈168 L/day', label: 'pilot build at 30 °C / 80 % RH, humid coast', tag: 'Modeled' as Tag },
    { num: '1 in 5', label: 'of the world’s ice-free land has a month below 40 % RH', tag: 'Third-party data' as Tag },
  ],
  mapCaption:
    'Orange: land whose driest month averages below 40 % relative humidity, about 1 in 5 of the world’s ice-free land. Driest-month mean RH 1991–2020, CRU TS 4.10 (Harris et al., 2020; ODbL); AcquaHT analysis. Land: Natural Earth.',
  backers: [
    'Emergent Ventures grant',
    'MeitY TIDE 2.0 EiR · IIM Calcutta Innovation Park',
    '1st prize · IIM Shillong International Water Conference',
  ],
}

export const honesty =
  'Nothing AcquaHT has is measured in a lab yet. So every number on this site carries a tag that says where it comes from. A NABL-accredited lab will test the machine against our published predictions in months 3–5 after our round closes.'

export const problem = {
  label: 'The problem',
  title: 'Billions lack safe water, and water-from-air fails as the air dries.',
  stats: [
    {
      num: '2.1 billion',
      label: 'people, 1 in 4, lacked safely managed drinking water in 2024.',
      source: 'WHO/UNICEF JMP, Aug 2025',
      tag: 'Third-party data' as Tag,
    },
    {
      num: '−71 %',
      label:
        'fall in a refrigeration water-from-air unit’s output in Abu Dhabi’s cooler, drier months, against its September peak of 1,500 L/day.',
      source: 'Khalaf et al. 2024, peer-reviewed',
      tag: 'Third-party data' as Tag,
    },
    {
      num: '39 %',
      label:
        'of its humid-air output is all a leading commercial unit keeps at 35 °C / 30 % RH. Not an outlier.',
      source: 'GENAQ Catalogue 2025, Stratus S200 (manufacturer claim)',
      tag: 'Third-party data' as Tag,
    },
  ],
}

export const bottleneck = {
  label: 'Why dry air is hard',
  title: 'In hot, dry air, three-quarters of the cooling never touches water.',
  body:
    'Hot, dry air still carries water: 11.9 g in every cubic metre at 35 °C / 30 % RH, about half of humid coastal air. But the coil must chill that air by 20 °C before the first drop forms. All that cooling is spent before any water appears.',
  rows: [
    { cond: '30 °C · 80 % RH', name: 'Humid coast', chill: '4 °C', share: 62, water: '24.3 g/m³' },
    { cond: '27 °C · 60 % RH', name: 'Industry rating point', chill: '8 °C', share: 45, water: '15.5 g/m³' },
    { cond: '35 °C · 30 % RH', name: 'Hot, dry season', chill: '20 °C', share: 24, water: '11.9 g/m³' },
    { cond: '40 °C · 20 % RH', name: 'Hot desert afternoon', chill: '27 °C', share: 13, water: '10.2 g/m³' },
  ],
  note:
    'Share of coil cooling that makes water, AQ-200 pilot build (≈7–8 kW of coil cooling at each condition). AcquaHT first-principles model v2; psychrometrics: ASHRAE.',
}

export const insight = {
  label: 'Our approach',
  title: 'Dry air is two problems. Each fix opens a new market.',
  body: 'The water is in the air. The energy goes into reaching the dew point. So we change the air the coil sees.',
  cards: [
    {
      where: 'Humid coast',
      cond: '30 °C · 80 % RH',
      issue: 'No dry-air fix needed',
      detail: 'Condensation works as it is. The coil only chills the air 4 °C before water forms.',
      output: '≈168 L/day',
      tag: 'Modeled' as Tag,
      market: 'Coastal India · today',
    },
    {
      where: 'Hot, dry inland',
      cond: '35 °C · 30 % RH',
      issue: 'Step 1 · Recycle the cold',
      detail:
        'Most cooling is wasted chilling air. Cold air leaving the coil pre-cools the air coming in. Heat recovery is industry practice, not our IP.',
      output: '≈58 L/day → ≥90 L/day target',
      tag: 'In development' as Tag,
      market: 'Inland India · opened by Step 1',
    },
    {
      where: 'Desert air',
      cond: '30 °C · 20 % RH',
      issue: 'Step 2 · Concentrate the water',
      detail:
        'The dew point is 4.6 °C, so the coil would frost. A sorbent stage, dried by the machine’s own condenser heat, raises the dew point the coil sees. This is our R&D. 0 sorbent cycles run so far.',
      output: '≥1.6× Step 1 target',
      tag: 'Target' as Tag,
      market: 'Deserts · opened by Step 2',
    },
  ],
}

export const product = {
  label: 'The product',
  title: 'A working prototype, built in Hyderabad from industrial refrigeration parts.',
  name: 'AQ-200',
  photos: [
    { src: '/images/prototype.webp', alt: 'AQ-200 prototype with the front panel off', caption: 'AQ-200 prototype, front panel off · Hyderabad, 2026' },
    { src: '/images/coil.webp', alt: 'Condensing coil fins and return bends', caption: 'The condensing surface, where the water forms' },
    { src: '/images/prototype-fan.webp', alt: 'Prototype rear with 400 mm fan', caption: 'The prototype in the workshop, 27 Mar 2026' },
  ],
  parts: [
    { name: 'Copeland CR30K7ME compressor', detail: 'Hermetic reciprocating, R407C. Rated 6.86 kW cooling at 2.29 kW (COP 3.0).' },
    { name: '7-row Cu/Al coil in an SS304 block', detail: 'Where the water forms.' },
    { name: 'Danfoss KP15 cut-out', detail: 'High/low-pressure safety switch.' },
    { name: 'Pleated air pre-filters', detail: 'Clean air in, before the coil.' },
  ],
  status: [
    { when: 'Today', text: '≈100 L/day at 27 °C / 60 % RH. In humid heat (30 °C / 80 % RH) it trips its high-pressure switch.', tag: 'Modeled' as Tag },
    { when: 'Pilot build', text: 'A bigger condenser, an electronic suction limiter and split air. Indicative cost ₹11,000–26,000 a unit.', tag: 'In development' as Tag },
    { when: 'First sale', text: 'One unit for humidity control, sold to a Telangana food processor (FY2026-27).', tag: 'Demonstrated' as Tag },
  ],
  fits: ['Hotel F&B, banquet and staff water', 'Water-stressed coastal resorts', 'Food-plant humidity control'],
}

export const howItWorks = {
  label: 'How it works',
  title: 'A built refrigeration core, plus two dry-air stages in development.',
  steps: [
    { num: '01', title: 'Air in', text: 'Filtered air, pulled through the machine by one 400 mm fan.', status: 'Built' },
    { num: '02', title: 'Capture · dry mode only', text: 'A sorbent stage loads water vapour from desert air, then hands it to the coil. The machine’s own condenser heat releases it. No electric heater.', status: 'Our R&D' },
    { num: '03', title: 'Condense', text: 'A Copeland compressor chills a 7-row coil below the dew point. Water drips off.', status: 'Built' },
    { num: '04', title: 'Purify', text: 'Sediment, carbon, ultrafiltration, a copper–nickel polisher, a remineraliser and UV-C. No RO, so no reject water.', status: 'Design frozen for testing' },
    { num: '05', title: 'Water out', text: 'UV-protected tank. A legal-metrology meter at the tap. Condensate and kWh logged every hour.', status: 'In the pilot build' },
  ],
  modes: [
    { name: 'Humid mode', path: '01 → 03 → 04 → 05' },
    { name: 'Dry mode', path: '01 → 02 → 03 → 04 → 05' },
  ],
  water: {
    title: 'Condensate is not drinking water yet. Treatment makes it so.',
    text:
      'Water off a coil can pick up copper and nickel, starts acidic, and can regrow bacteria in storage. Each treatment stage answers one of these risks. The train is designed to meet IS 10500:2012. A screening panel is due by 15 Dec 2026; the full IS 10500 panel follows after our round closes. No lab report exists yet.',
    image: '/images/treatment.webp',
    caption: 'Treatment parts bought for the prototype. The RO housing and ozone generator have since been removed from the design.',
  },
}

export const performance = {
  label: 'Performance',
  title: 'Our model predicts a steep drop in dry air. This round measures it.',
  body:
    'These are predictions from our engineering model, not measurements. We publish them before the lab test, so anyone can check us against them. A NABL chamber test runs in months 3–5 after close, and every run gets published.',
  rows: [
    { cond: '30 °C / 80 % RH', name: 'Humid coast', pilot: '≈168', today: 'Trips', energy: '398 Wh/L' },
    { cond: '27 °C / 60 % RH', name: 'Industry rating point', pilot: '≈113', today: '≈100', energy: '530 Wh/L' },
    { cond: '35 °C / 30 % RH', name: 'Hot, dry season', pilot: '≈58', today: '≈39', energy: '1,087 Wh/L' },
  ],
  note:
    'Litres a day of condensate at the coil. AcquaHT first-principles model v2; median of 386 field-consistent machines. Model ranges 149–179 / 91–124 / 49–64 L/day. Energy: whole machine, pilot build.',
  highlight: {
    num: '≈58 L/day',
    text: 'at 35 °C / 30 % RH is the number we are building the company to move. Moving it opens inland India and the Gulf coast.',
  },
  targets: [
    { name: 'Step 1 · heat recovery', value: '≥90 L/day at 35 °C / 30 % RH, ≤700 Wh/L', when: 'Chamber A/B test, month 6' },
    { name: 'Step 2 · sorbent dry mode', value: '≥1.6× Step 1 at 30 °C / 20 % RH, frost-free', when: 'Witnessed NABL test, month 18' },
  ],
  killRule: 'Our rule, set in advance: if Step 2 gives less than 1.3× Step 1, we stop and ship heat recovery only.',
}

export const customers = {
  label: 'Who buys first',
  title: 'We start where the air is wet and the water is expensive.',
  segments: [
    {
      name: 'Coastal resorts and hotels',
      who: 'Where the source water is the problem. First 3 units on the Puducherry–ECR coast; next Goa, Kochi and Visakhapatnam.',
      paysToday: '₹12.9–18 a litre for branded 500 ml bottles. Goa’s coastal belt trucks water in.',
      offer: 'Water made on site at a planned ₹10 a litre, as a service. No capex for the hotel.',
    },
    {
      name: 'Food processing, cold chain and seed storage',
      who: 'Factories in Telangana and Andhra Pradesh that already pay for humidity control.',
      paysToday: 'Commodity dehumidifiers at ₹0.6–1.6 lakh.',
      offer: 'Humidity control that also recovers water. Our first sale (₹75,000) is one of these units.',
    },
  ],
  later: 'Later: island and remote resorts, defence and rail sites.',
  cities: [
    { name: 'Kochi', lpd: 163 },
    { name: 'Visakhapatnam', lpd: 150 },
    { name: 'Panaji (Goa)', lpd: 148 },
    { name: 'Chennai', lpd: 147 },
    { name: 'Mumbai', lpd: 144 },
    { name: 'Hyderabad (HQ)', lpd: 105 },
    { name: 'Delhi', lpd: 86 },
    { name: 'Jaipur', lpd: 70 },
  ],
  citiesNote:
    'Annual mean litres a day, AQ-200 pilot build. AcquaHT model v2 on ERA5 hourly weather 2015–2024. Inland cities need Step 1.',
}

export const businessModel = {
  label: 'Business model',
  title: 'Hotels buy water, not machines.',
  headline: '₹10 a litre',
  headlineDetail: '₹25,000 a month including 2,500 L, then ₹10 a litre above. 3-year term.',
  points: [
    'AcquaHT owns, installs, meters, maintains and powers the unit. We keep the output risk.',
    'Every unit meters its water before the tank, so each hotel is also a field test.',
    'No water, no bill until the first full IS 10500 lab pass.',
  ],
  prices: [
    { label: 'A bottled litre costs a hotel', value: '≈₹15.5', tag: 'Third-party data' as Tag },
    { label: 'Our planned price, as a service', value: '₹10', tag: 'Planned' as Tag },
    { label: 'What a delivered litre costs us, all-in', value: '₹7.5–9.4', tag: 'Modeled' as Tag },
  ],
  other: [
    { who: 'Owners who prefer to buy', what: '₹3.75 lakh + ₹3,500 a month service, with an output guarantee' },
    { who: 'Eco-resorts and islands', what: '₹12 a litre where water from air is the product' },
    { who: 'Food plants', what: 'Humidity control at ₹2.25 lakh + ₹1,500 a month' },
  ],
  note: 'All prices are planned, ex-GST, and will be checked against real hotel invoices and quotes.',
}

export const progress = {
  label: 'Progress',
  title: 'Early but real: a working machine, ≈210 litres made, one paying customer.',
  done: [
    { title: 'Working prototype built', detail: 'Hyderabad, 2026. Performance modeled, not yet measured.' },
    { title: '≈210 L made', detail: 'Two short field demonstrations at Malla Sagar and Cherlapally, Telangana.' },
    { title: '₹75,000 first sale', detail: 'Payment received. Telangana food processor, humidity control, FY2026-27.' },
    { title: 'US$21,000 + ₹2 lakh in grants and prizes', detail: 'Emergent Ventures grant; 1st prize at the IIM Shillong International Water Conference.' },
    { title: 'MeitY TIDE 2.0 fellowship', detail: 'Entrepreneur-in-Residence, IIM Calcutta Innovation Park.' },
  ],
  next: [
    { title: 'Measured performance', detail: 'NABL chamber curve vs our published predictions, months 3–5 after close.' },
    { title: 'Water-quality lab report', detail: 'Screening panel by 15 Dec 2026; full IS 10500 panel after close.' },
    { title: 'Hotel pilot contracts', detail: '3 contracts with resorts on the Puducherry–ECR coast, metered from month 5.' },
    { title: 'Dry-air stages', detail: 'Step 1 chamber test at month 6. 0 sorbent cycles run so far.' },
    { title: 'Patents', detail: 'None filed yet. An Indian provisional is being filed.' },
  ],
  roadmap: [
    { when: 'Q4 2026', what: 'Water screening panel · provisional patent' },
    { when: 'Months 3–5', what: 'NABL-measured performance curve' },
    { when: 'Month 6', what: 'Step 1 heat-recovery test' },
    { when: 'Month 9', what: 'Sorbent bench test' },
    { when: 'Month 12', what: 'Sorbent retrofit gate (≥1.3×)' },
    { when: 'Month 18', what: 'Witnessed dry-air test' },
    { when: 'Months 19–21', what: 'Gulf desert season trial' },
    { when: 'After 24', what: 'Gulf coast via distributors; next platform on R32' },
  ],
  roadmapNote: 'Months after our pre-seed first close. These are targets, not results.',
}

export const team = {
  label: 'Team',
  title: 'The founder built the machine. This round hires the engineering team.',
  people: [
    {
      name: 'Swamynathan Jerra',
      role: 'Founder & CEO',
      photo: '/images/team-swamynathan.webp',
      detail:
        'Mechanical engineer, ex-TSIC Siddipet. Led the build of the AQ-200 prototype and closed the first sale. Emergent Ventures grantee; MeitY TIDE 2.0 Entrepreneur-in-Residence, IIM Calcutta Innovation Park; 1st prize, IIM Shillong International Water Conference.',
    },
    {
      name: 'Nalla Sai Smaran',
      role: 'Business · hotel and industrial sales',
      photo: '/images/team-sai-smaran.webp',
      detail: 'Director since November 2023.',
    },
    {
      name: 'Vaidhatri Sanugula',
      role: 'Water quality · part-time',
      photo: '/images/team-vaidhatri.webp',
      detail: 'Leads water-quality work on the treatment train.',
    },
    {
      name: 'Sumanth Malyala',
      role: 'Hardware · part-time',
      photo: '/images/team-sumanth.webp',
      detail: 'Prototype build and testing.',
    },
  ],
  hiring: [
    'Senior thermal / refrigeration engineer',
    'Mechanical design engineer',
    'Embedded / IoT and controls engineer',
    'Field engineers',
    'Hotel key-account manager',
  ],
}

export const investors = {
  label: 'For investors',
  title: 'We are raising a US$750K pre-seed round.',
  body:
    'It turns a modeled machine into measured dry-air performance in 24 months: a lab-measured curve, three paying hotel pilots, and a witnessed test of our dry-air stages. Write to us for the full deck and data room.',
  vision:
    'If the dry-air stages work, water from air stops being a coastal product, and the dry fifth of the world’s land becomes its market.',
}
