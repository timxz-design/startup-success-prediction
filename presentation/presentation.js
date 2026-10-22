/**
 * Startup Success Predictor — AI Class Presentation
 * 12 slides, ~10 minutes
 * Theme: Dark tech, indigo/sky-blue palette
 */

const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");

// ── Icons ────────────────────────────────────────────────────
const { FaDatabase, FaBrain, FaChartBar, FaRocket, FaCode,
        FaCheckCircle, FaTimesCircle, FaLightbulb, FaCogs,
        FaGlobe, FaSearch, FaLayerGroup } = require("react-icons/fa");

async function iconPng(IconComponent, color = "#FFFFFF", size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// ── Palette ──────────────────────────────────────────────────
const C = {
  bg:      "0F1117",   // dark background
  card:    "1E2130",   // card background
  border:  "2D3148",   // card border colour
  indigo:  "818CF8",   // primary accent
  sky:     "38BDF8",   // secondary accent
  green:   "22C55E",
  red:     "EF4444",
  amber:   "FBBF24",
  text:    "E2E8F0",   // body text
  muted:   "94A3B8",   // secondary text
  dim:     "475569",   // tertiary text
  white:   "FFFFFF",
};

// ── Helpers ──────────────────────────────────────────────────
const makeShadow = () => ({
  type: "outer", blur: 8, offset: 3, angle: 135,
  color: "000000", opacity: 0.25
});

function sectionBadge(slide, text, x, y) {
  slide.addShape("rect", {
    x, y, w: text.length * 0.115 + 0.35, h: 0.28,
    fill: { color: C.indigo, transparency: 75 },
    line: { color: C.indigo, width: 1 },
    rectRadius: 0.04,
  });
  slide.addText(text.toUpperCase(), {
    x, y, w: text.length * 0.115 + 0.35, h: 0.28,
    fontSize: 8, bold: true, color: C.indigo,
    align: "center", valign: "middle", margin: 0,
    charSpacing: 2,
  });
}

function cardBg(slide, x, y, w, h) {
  slide.addShape("rect", {
    x, y, w, h,
    fill: { color: C.card },
    line: { color: C.border, width: 1 },
    shadow: makeShadow(),
  });
}

function accentBar(slide, x, y, h) {
  slide.addShape("rect", { x, y, w: 0.07, h, fill: { color: C.indigo }, line: { color: C.indigo, width: 0 } });
}

// ── Slide helpers ────────────────────────────────────────────
function darkSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: C.bg };
  return s;
}

// ── Build presentation ───────────────────────────────────────
(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.title = "Predicting Startup Success with ML";

  // ╔══════════════════════════════════════════════════════════╗
  // ║  SLIDE 1 — TITLE                                        ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    const s = darkSlide(pres);

    // Gradient-like top bar
    s.addShape("rect", { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.indigo }, line: { color: C.indigo, width: 0 } });

    // Big decorative circle (background)
    s.addShape("ellipse", { x: 6.5, y: -0.5, w: 5, h: 5, fill: { color: C.indigo, transparency: 88 }, line: { color: C.indigo, width: 0 } });
    s.addShape("ellipse", { x: 7.2, y: 0.2, w: 3.5, h: 3.5, fill: { color: C.sky, transparency: 92 }, line: { color: C.sky, width: 0 } });

    // Title
    s.addText("Predicting Startup", {
      x: 0.6, y: 1.15, w: 7, h: 0.75,
      fontSize: 42, bold: true, color: C.white,
      fontFace: "Calibri", margin: 0,
    });
    s.addText("Success with Machine Learning", {
      x: 0.6, y: 1.85, w: 8.5, h: 0.75,
      fontSize: 42, bold: true, color: C.indigo,
      fontFace: "Calibri", margin: 0,
    });

    // Subtitle
    s.addText("A binary classification project — predicting whether a startup will succeed or fail", {
      x: 0.6, y: 2.85, w: 8, h: 0.45,
      fontSize: 15, color: C.muted, fontFace: "Calibri", margin: 0,
    });

    // Bottom metadata row
    s.addShape("rect", { x: 0, y: 5.2, w: 10, h: 0.425, fill: { color: C.card }, line: { color: C.border, width: 1 } });
    s.addText("AI Class Project  •  100,000 Startup Dataset  •  3 ML Models  •  Web App Demo", {
      x: 0.5, y: 5.22, w: 9, h: 0.38,
      fontSize: 11, color: C.muted, align: "center", margin: 0, fontFace: "Calibri",
    });

    // Tag pills
    const tags = ["Python", "scikit-learn", "XGBoost", "Flask", "Optuna"];
    let tx = 0.6;
    for (const tag of tags) {
      const tw = tag.length * 0.1 + 0.3;
      s.addShape("rect", { x: tx, y: 4.55, w: tw, h: 0.28, fill: { color: C.card }, line: { color: C.border, width: 1 } });
      s.addText(tag, { x: tx, y: 4.55, w: tw, h: 0.28, fontSize: 9, color: C.sky, align: "center", valign: "middle", margin: 0 });
      tx += tw + 0.15;
    }
  }

  // ╔══════════════════════════════════════════════════════════╗
  // ║  SLIDE 2 — THE PROBLEM                                  ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    const s = darkSlide(pres);
    sectionBadge(s, "The Problem", 0.5, 0.3);

    s.addText("Why Does This Matter?", {
      x: 0.5, y: 0.65, w: 9, h: 0.6,
      fontSize: 32, bold: true, color: C.white, fontFace: "Calibri", margin: 0,
    });

    // Left column — text
    accentBar(s, 0.5, 1.45, 3.2);
    s.addText([
      { text: "90% of startups fail.", options: { bold: true, color: C.white, breakLine: true } },
      { text: " ", options: { fontSize: 6, breakLine: true } },
      { text: "Investors, founders, and accelerators all face the same question:", options: { color: C.muted, breakLine: true } },
      { text: " ", options: { fontSize: 6, breakLine: true } },
      { text: '"Will this startup succeed?"', options: { bold: true, italic: true, color: C.indigo, breakLine: true } },
      { text: " ", options: { fontSize: 6, breakLine: true } },
      { text: "Machine Learning gives us a data-driven answer — replacing gut feeling with a model trained on 100,000 real-world startup outcomes.", options: { color: C.muted } },
    ], {
      x: 0.65, y: 1.45, w: 4.3, h: 3.2,
      fontSize: 13.5, fontFace: "Calibri", valign: "top",
    });

    // Right column — 3 stat cards
    const stats = [
      { val: "90%",  label: "of startups fail",              col: C.red },
      { val: "$300B", label: "lost to failed startups yearly", col: C.amber },
      { val: "10x",  label: "better with data-driven decisions", col: C.green },
    ];
    stats.forEach((st, i) => {
      const cy = 1.45 + i * 1.12;
      cardBg(s, 5.5, cy, 3.9, 0.95);
      s.addShape("rect", { x: 5.5, y: cy, w: 0.07, h: 0.95, fill: { color: st.col }, line: { color: st.col, width: 0 } });
      s.addText(st.val, { x: 5.65, y: cy + 0.05, w: 1.4, h: 0.42, fontSize: 28, bold: true, color: st.col, fontFace: "Calibri", margin: 0 });
      s.addText(st.label, { x: 5.65, y: cy + 0.48, w: 3.6, h: 0.38, fontSize: 11, color: C.muted, fontFace: "Calibri", margin: 0 });
    });
  }

  // ╔══════════════════════════════════════════════════════════╗
  // ║  SLIDE 3 — THE DATASET                                  ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    const s = darkSlide(pres);
    sectionBadge(s, "The Dataset", 0.5, 0.3);

    s.addText("Startup Funding & Outcome Dataset", {
      x: 0.5, y: 0.65, w: 9, h: 0.55,
      fontSize: 30, bold: true, color: C.white, fontFace: "Calibri", margin: 0,
    });
    s.addText("Kaggle — 100,000 startup records, no missing values", {
      x: 0.5, y: 1.2, w: 9, h: 0.3,
      fontSize: 13, color: C.muted, fontFace: "Calibri", margin: 0,
    });

    // 4 big stat boxes
    const bigStats = [
      { val: "100,000", label: "Startups", sub: "rows in dataset", col: C.indigo },
      { val: "10",      label: "Features", sub: "7 numeric + 3 categorical", col: C.sky },
      { val: "7",       label: "Sectors",  sub: "AI, SaaS, Health, Fintech...", col: C.amber },
      { val: "3",       label: "Outcomes", sub: "IPO · Acquisition · Failure", col: C.green },
    ];
    bigStats.forEach((st, i) => {
      const cx = 0.5 + i * 2.32;
      cardBg(s, cx, 1.65, 2.1, 1.65);
      s.addText(st.val, { x: cx, y: 1.8, w: 2.1, h: 0.7, fontSize: 36, bold: true, color: st.col, align: "center", fontFace: "Calibri", margin: 0 });
      s.addText(st.label, { x: cx, y: 2.5, w: 2.1, h: 0.3, fontSize: 13, bold: true, color: C.white, align: "center", fontFace: "Calibri", margin: 0 });
      s.addText(st.sub, { x: cx + 0.1, y: 2.82, w: 1.9, h: 0.35, fontSize: 9.5, color: C.muted, align: "center", fontFace: "Calibri", margin: 0 });
    });

    // Feature list — two columns
    const feats = [
      ["Numeric Features", ["Funding rounds (0-8)", "Founder experience (yrs)", "Team size", "Market size ($B)", "Product traction (users)", "Burn rate ($M)", "Revenue ($M)"]],
      ["Categorical Features", ["Investor type (tier1/tier2/angel/none)", "Sector (AI, SaaS, Fintech...)", "Founder background (serial/bigtech/academic/first-time)"]],
    ];
    feats.forEach(([title, items], col) => {
      const cx = 0.5 + col * 4.8;
      cardBg(s, cx, 3.5, 4.4, 1.9);
      s.addText(title, { x: cx + 0.2, y: 3.58, w: 4, h: 0.28, fontSize: 11, bold: true, color: C.indigo, fontFace: "Calibri", margin: 0 });
      s.addText(
        items.map((t, i) => ({ text: t, options: { bullet: true, color: C.muted, breakLine: i < items.length - 1 } })),
        { x: cx + 0.2, y: 3.9, w: 4, h: 1.4, fontSize: 10.5, fontFace: "Calibri" }
      );
    });
  }

  // ╔══════════════════════════════════════════════════════════╗
  // ║  SLIDE 4 — EDA FINDINGS                                 ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    const s = darkSlide(pres);
    sectionBadge(s, "Data Exploration", 0.5, 0.3);

    s.addText("What the Data Tells Us", {
      x: 0.5, y: 0.65, w: 9, h: 0.55,
      fontSize: 30, bold: true, color: C.white, fontFace: "Calibri", margin: 0,
    });

    // Class balance bar
    cardBg(s, 0.5, 1.3, 9, 0.95);
    s.addText("Class Distribution", { x: 0.7, y: 1.38, w: 3, h: 0.28, fontSize: 11, bold: true, color: C.indigo, fontFace: "Calibri", margin: 0 });
    // Bar: failure
    s.addShape("rect", { x: 0.7, y: 1.72, w: 5.01, h: 0.33, fill: { color: C.red, transparency: 30 }, line: { color: C.red, width: 0 } });
    s.addText("FAILURE  55.6%  (55,610 startups)", { x: 0.75, y: 1.72, w: 5, h: 0.33, fontSize: 10, color: C.white, valign: "middle", margin: 0 });
    // Bar: success
    s.addShape("rect", { x: 0.7, y: 1.72, w: 3.99, h: 0.33, fill: { color: C.green, transparency: 40 }, line: { color: C.green, width: 0 } });
    s.addText("SUCCESS  44.4%  (44,390 startups)", { x: 5.85, y: 1.72, w: 4, h: 0.33, fontSize: 10, color: C.muted, valign: "middle", margin: 0 });

    // 4 key findings
    const findings = [
      { icon: "revenue", title: "Revenue is King", body: "Revenue ($M) is the single strongest predictor — far above all other features. More revenue = dramatically higher success probability.", col: C.green },
      { icon: "funding", title: "Funding Rounds Matter", body: "Each additional funding round significantly increases success odds. Tier 1 VC backing shows a strong positive signal.", col: C.indigo },
      { icon: "experience", title: "Founder Experience Helps", body: "Years of experience and serial founders outperform first-timers. Ex-BigTech founders show above-average success rates.", col: C.sky },
      { icon: "sector",  title: "Sector is Irrelevant", body: "All 7 sectors (AI, SaaS, Fintech, Health, Crypto, Climate, Ecommerce) are nearly uniformly distributed — sector adds almost no predictive signal.", col: C.amber },
    ];

    findings.forEach((f, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = 0.5 + col * 4.8;
      const cy = 2.45 + row * 1.5;
      cardBg(s, cx, cy, 4.4, 1.3);
      s.addShape("rect", { x: cx, y: cy, w: 0.07, h: 1.3, fill: { color: f.col }, line: { color: f.col, width: 0 } });
      s.addText(f.title, { x: cx + 0.2, y: cy + 0.1, w: 4.1, h: 0.3, fontSize: 12, bold: true, color: f.col, fontFace: "Calibri", margin: 0 });
      s.addText(f.body, { x: cx + 0.2, y: cy + 0.42, w: 4.1, h: 0.8, fontSize: 10, color: C.muted, fontFace: "Calibri", margin: 0, valign: "top" });
    });
  }

  // ╔══════════════════════════════════════════════════════════╗
  // ║  SLIDE 5 — THE APPROACH                                 ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    const s = darkSlide(pres);
    sectionBadge(s, "Our Approach", 0.5, 0.3);

    s.addText("Framing as Binary Classification", {
      x: 0.5, y: 0.65, w: 9, h: 0.55,
      fontSize: 30, bold: true, color: C.white, fontFace: "Calibri", margin: 0,
    });

    // Outcome → Binary mapping
    cardBg(s, 0.5, 1.35, 9, 1.2);
    s.addText("Original 3 Outcomes  →  Binary Target", {
      x: 0.7, y: 1.43, w: 8.5, h: 0.3, fontSize: 12, bold: true, color: C.indigo, fontFace: "Calibri", margin: 0,
    });
    const outcomes = [
      { label: "IPO", count: "2,055", col: C.green },
      { label: "Acquisition", count: "42,335", col: C.green },
      { label: "Failure", count: "55,610", col: C.red },
    ];
    outcomes.forEach((o, i) => {
      const cx = 0.7 + i * 2.1;
      s.addShape("rect", { x: cx, y: 1.8, w: 1.8, h: 0.55, fill: { color: o.col, transparency: 75 }, line: { color: o.col, width: 1 } });
      s.addText(`${o.label}\n${o.count}`, { x: cx, y: 1.8, w: 1.8, h: 0.55, fontSize: 10, bold: true, color: o.col, align: "center", valign: "middle", margin: 0 });
    });
    // Arrow
    s.addShape("rect", { x: 7.0, y: 1.97, w: 0.5, h: 0.05, fill: { color: C.muted }, line: { color: C.muted, width: 0 } });
    s.addText("→", { x: 6.85, y: 1.82, w: 0.5, h: 0.5, fontSize: 22, color: C.muted, align: "center", valign: "middle", margin: 0 });
    // Result
    s.addShape("rect", { x: 7.5, y: 1.8, w: 1.8, h: 0.55, fill: { color: C.indigo, transparency: 75 }, line: { color: C.indigo, width: 1 } });
    s.addText("SUCCESS = 1\nFAILURE = 0", { x: 7.5, y: 1.8, w: 1.8, h: 0.55, fontSize: 10, bold: true, color: C.indigo, align: "center", valign: "middle", margin: 0 });

    // Pipeline steps
    const steps = [
      { n: "1", title: "Split Data", body: "80% train / 20% test\nStratified, seed=42", col: C.sky },
      { n: "2", title: "Preprocess", body: "StandardScaler (numeric)\nOneHotEncoder (categorical)", col: C.indigo },
      { n: "3", title: "Train Models", body: "3 different algorithms\nwith same train set", col: C.amber },
      { n: "4", title: "Cross-Validate", body: "5-fold StratifiedKFold\nFixed seed=42", col: C.green },
      { n: "5", title: "Compare", body: "Evaluate on held-out\ntest set only", col: C.red },
    ];
    steps.forEach((st, i) => {
      const cx = 0.5 + i * 1.82;
      cardBg(s, cx, 2.75, 1.65, 2.6);
      s.addShape("ellipse", { x: cx + 0.57, y: 2.88, w: 0.5, h: 0.5, fill: { color: st.col }, line: { color: st.col, width: 0 } });
      s.addText(st.n, { x: cx + 0.57, y: 2.88, w: 0.5, h: 0.5, fontSize: 14, bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });
      s.addText(st.title, { x: cx + 0.1, y: 3.48, w: 1.45, h: 0.35, fontSize: 11, bold: true, color: st.col, align: "center", fontFace: "Calibri", margin: 0 });
      s.addText(st.body, { x: cx + 0.1, y: 3.85, w: 1.45, h: 1.35, fontSize: 9.5, color: C.muted, align: "center", fontFace: "Calibri", margin: 0 });
    });

    // Baseline callout
    cardBg(s, 0.5, 5.05, 9, 0.4);
    s.addText("BASELINE (always predict majority class):  55.61% accuracy  —  any real model must beat this", {
      x: 0.6, y: 5.08, w: 8.7, h: 0.32,
      fontSize: 11, color: C.amber, bold: true, align: "center", fontFace: "Calibri", margin: 0,
    });
  }

  // ╔══════════════════════════════════════════════════════════╗
  // ║  SLIDE 6 — 3 MODELS                                     ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    const s = darkSlide(pres);
    sectionBadge(s, "The Models", 0.5, 0.3);

    s.addText("3 Models Compared", {
      x: 0.5, y: 0.65, w: 9, h: 0.55,
      fontSize: 30, bold: true, color: C.white, fontFace: "Calibri", margin: 0,
    });

    const models = [
      {
        name: "Logistic\nRegression",
        col: C.sky,
        how: "Finds the best straight line (decision boundary) that separates successes from failures in feature space.",
        pros: ["Simple & fast", "Very interpretable", "Works well with linear data"],
        best: "Linear patterns, clear feature relationships",
      },
      {
        name: "Random\nForest",
        col: C.indigo,
        how: "Builds 300 decision trees on random subsets of data & features, then takes a majority vote across all trees.",
        pros: ["Handles non-linear patterns", "Resistant to overfitting", "Built-in feature importance"],
        best: "Noisy data, complex interactions",
      },
      {
        name: "XGBoost",
        col: C.amber,
        how: "Builds trees sequentially — each new tree fixes the errors of all previous ones, using gradient descent.",
        pros: ["Handles missing values natively", "Highly tunable", "Wins most tabular competitions"],
        best: "Complex non-linear patterns, messy data",
      },
    ];

    models.forEach((m, i) => {
      const cx = 0.5 + i * 3.08;
      cardBg(s, cx, 1.35, 2.85, 4.0);
      s.addShape("rect", { x: cx, y: 1.35, w: 2.85, h: 0.06, fill: { color: m.col }, line: { color: m.col, width: 0 } });

      s.addText(m.name, { x: cx + 0.15, y: 1.5, w: 2.55, h: 0.7, fontSize: 18, bold: true, color: m.col, fontFace: "Calibri", margin: 0 });
      s.addText("How it works:", { x: cx + 0.15, y: 2.25, w: 2.55, h: 0.24, fontSize: 10, bold: true, color: C.white, fontFace: "Calibri", margin: 0 });
      s.addText(m.how, { x: cx + 0.15, y: 2.5, w: 2.55, h: 1.0, fontSize: 9.5, color: C.muted, fontFace: "Calibri", margin: 0, valign: "top" });

      s.addText("Strengths:", { x: cx + 0.15, y: 3.55, w: 2.55, h: 0.24, fontSize: 10, bold: true, color: C.white, fontFace: "Calibri", margin: 0 });
      s.addText(
        m.pros.map((p, j) => ({ text: p, options: { bullet: true, color: C.muted, breakLine: j < m.pros.length - 1 } })),
        { x: cx + 0.15, y: 3.8, w: 2.55, h: 0.85, fontSize: 9.5, fontFace: "Calibri" }
      );

      s.addShape("rect", { x: cx + 0.15, y: 4.72, w: 2.55, h: 0.45, fill: { color: m.col, transparency: 82 }, line: { color: m.col, width: 1 } });
      s.addText(m.best, { x: cx + 0.15, y: 4.72, w: 2.55, h: 0.45, fontSize: 9, color: m.col, align: "center", valign: "middle", fontFace: "Calibri", margin: 0 });
    });
  }

  // ╔══════════════════════════════════════════════════════════╗
  // ║  SLIDE 7 — RESULTS                                      ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    const s = darkSlide(pres);
    sectionBadge(s, "Results", 0.5, 0.3);

    s.addText("Model Performance — Test Set", {
      x: 0.5, y: 0.65, w: 9, h: 0.55,
      fontSize: 30, bold: true, color: C.white, fontFace: "Calibri", margin: 0,
    });

    // Metrics chart (bar chart)
    s.addChart(pres.charts.BAR, [
      { name: "Accuracy",  labels: ["Baseline", "Log. Regression", "Random Forest", "XGBoost"], values: [55.61, 76.58, 76.02, 75.87] },
      { name: "F1 Score",  labels: ["Baseline", "Log. Regression", "Random Forest", "XGBoost"], values: [0,     72.20, 71.45, 71.55] },
      { name: "ROC AUC",   labels: ["Baseline", "Log. Regression", "Random Forest", "XGBoost"], values: [50.00, 84.06, 83.58, 83.40] },
    ], {
      x: 0.5, y: 1.3, w: 5.8, h: 3.2,
      barDir: "col",
      barGrouping: "clustered",
      chartColors: [C.dim, C.sky, C.indigo, C.amber],
      chartArea: { fill: { color: C.card } },
      catAxisLabelColor: C.muted,
      valAxisLabelColor: C.muted,
      valGridLine: { color: C.border, size: 0.5 },
      catGridLine: { style: "none" },
      showValue: false,
      legendPos: "b",
      legendFontSize: 9,
      legendFontColor: C.muted,
      valAxisMaxVal: 100,
      valAxisMinVal: 0,
      dataLabelColor: C.white,
    });

    // Result cards — right side
    const rows = [
      { model: "Baseline",         acc: "55.61%", f1: "—",      auc: "—",      col: C.dim, winner: false },
      { model: "Logistic Regression", acc: "76.58%", f1: "72.20%", auc: "84.06%", col: C.sky, winner: true },
      { model: "Random Forest",    acc: "76.02%", f1: "71.45%", auc: "83.58%", col: C.indigo, winner: false },
      { model: "XGBoost",          acc: "75.87%", f1: "71.55%", auc: "83.40%", col: C.amber, winner: false },
    ];

    // Header
    const hx = 6.5;
    s.addShape("rect", { x: hx, y: 1.3, w: 3.2, h: 0.35, fill: { color: C.card }, line: { color: C.border, width: 1 } });
    ["Model", "Acc", "AUC"].forEach((h, i) => {
      const wx = [0, 1.5, 2.5];
      s.addText(h, { x: hx + wx[i] + 0.1, y: 1.3, w: 1.2, h: 0.35, fontSize: 9, bold: true, color: C.indigo, valign: "middle", fontFace: "Calibri", margin: 0 });
    });

    rows.forEach((r, i) => {
      const ry = 1.65 + i * 0.62;
      s.addShape("rect", { x: hx, y: ry, w: 3.2, h: 0.55, fill: { color: r.winner ? "1a2540" : C.card }, line: { color: r.winner ? C.sky : C.border, width: r.winner ? 1.5 : 1 } });
      if (r.winner) s.addShape("rect", { x: hx, y: ry, w: 0.06, h: 0.55, fill: { color: C.sky }, line: { color: C.sky, width: 0 } });
      s.addText(r.model, { x: hx + 0.12, y: ry, w: 1.4, h: 0.55, fontSize: 10, bold: r.winner, color: r.col, valign: "middle", fontFace: "Calibri", margin: 0 });
      s.addText(r.acc,   { x: hx + 1.6,  y: ry, w: 0.9, h: 0.55, fontSize: 10, color: r.winner ? C.white : C.muted, valign: "middle", fontFace: "Calibri", margin: 0 });
      s.addText(r.auc,   { x: hx + 2.5,  y: ry, w: 0.9, h: 0.55, fontSize: 10, color: r.winner ? C.white : C.muted, valign: "middle", fontFace: "Calibri", margin: 0 });
    });

    // Improvement callout
    cardBg(s, 0.5, 4.65, 9, 0.7);
    s.addText("+21 percentage points over baseline  |  All models similar — data has a clear ceiling at ~84% AUC", {
      x: 0.6, y: 4.7, w: 8.7, h: 0.3,
      fontSize: 11.5, color: C.green, bold: true, align: "center", fontFace: "Calibri", margin: 0,
    });
    s.addText("Cross-validation scores (5-fold) matched test scores closely — no overfitting detected", {
      x: 0.6, y: 5.0, w: 8.7, h: 0.28,
      fontSize: 10, color: C.muted, align: "center", fontFace: "Calibri", margin: 0,
    });
  }

  // ╔══════════════════════════════════════════════════════════╗
  // ║  SLIDE 8 — WHAT WE TRIED TO IMPROVE                    ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    const s = darkSlide(pres);
    sectionBadge(s, "V2 Improvements", 0.5, 0.3);

    s.addText("Can We Do Better?", {
      x: 0.5, y: 0.65, w: 9, h: 0.55,
      fontSize: 30, bold: true, color: C.white, fontFace: "Calibri", margin: 0,
    });

    const improvements = [
      {
        title: "Feature Engineering",
        col: C.sky,
        items: ["Revenue / Burn Rate → runway ratio", "Revenue per employee", "Traction per employee", "Log transforms on skewed features", "Interaction: experience × funding rounds"],
        result: "No improvement — original features already capture the signal",
        resultCol: C.red,
      },
      {
        title: "Hyperparameter Tuning (Optuna)",
        col: C.indigo,
        items: ["50→20 Bayesian trials per model", "LR: tuned C regularization", "RF: depth, estimators, features, leaf size", "XGBoost: lr, depth, subsample, regularization"],
        result: "Minimal gain — defaults were already near-optimal",
        resultCol: C.amber,
      },
      {
        title: "Stacking Ensemble",
        col: C.amber,
        items: ["LR + RF + XGBoost as base models", "Logistic Regression as meta-model", "3-fold internal cross-validation"],
        result: "Tied with plain LR — all models learned the same patterns",
        resultCol: C.red,
      },
      {
        title: "Threshold Optimization",
        col: C.green,
        items: ["Default threshold: 0.50", "Optimized threshold: 0.38", "Maximised F1 using precision-recall curve"],
        result: "F1: 0.72 → 0.74 (trades accuracy for recall)",
        resultCol: C.green,
      },
    ];

    improvements.forEach((imp, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = 0.5 + col * 4.8;
      const cy = 1.35 + row * 2.05;
      cardBg(s, cx, cy, 4.4, 1.85);
      s.addShape("rect", { x: cx, y: cy, w: 4.4, h: 0.06, fill: { color: imp.col }, line: { color: imp.col, width: 0 } });
      s.addText(imp.title, { x: cx + 0.15, y: cy + 0.12, w: 4.1, h: 0.3, fontSize: 12, bold: true, color: imp.col, fontFace: "Calibri", margin: 0 });
      s.addText(
        imp.items.map((t, j) => ({ text: t, options: { bullet: true, color: C.muted, breakLine: j < imp.items.length - 1 } })),
        { x: cx + 0.15, y: cy + 0.45, w: 4.1, h: 0.95, fontSize: 9.5, fontFace: "Calibri" }
      );
      s.addShape("rect", { x: cx + 0.15, y: cy + 1.48, w: 4.1, h: 0.28, fill: { color: imp.resultCol, transparency: 82 }, line: { color: imp.resultCol, width: 0 } });
      s.addText("Result: " + imp.result, { x: cx + 0.2, y: cy + 1.48, w: 4.05, h: 0.28, fontSize: 9, color: imp.resultCol, valign: "middle", fontFace: "Calibri", margin: 0 });
    });
  }

  // ╔══════════════════════════════════════════════════════════╗
  // ║  SLIDE 9 — KEY INSIGHT                                  ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    const s = darkSlide(pres);

    // Large decorative background shape
    s.addShape("ellipse", { x: 5.5, y: -1, w: 7, h: 7, fill: { color: C.indigo, transparency: 92 }, line: { color: C.indigo, width: 0 } });

    sectionBadge(s, "Key Insight", 0.5, 0.3);

    s.addText("Why Did the Simplest\nModel Win?", {
      x: 0.5, y: 0.65, w: 9, h: 1.1,
      fontSize: 34, bold: true, color: C.white, fontFace: "Calibri", margin: 0,
    });

    // Main insight box
    cardBg(s, 0.5, 1.95, 9, 1.3);
    s.addShape("rect", { x: 0.5, y: 1.95, w: 0.08, h: 1.3, fill: { color: C.indigo }, line: { color: C.indigo, width: 0 } });
    s.addText("The relationships in this dataset are predominantly LINEAR.", {
      x: 0.7, y: 2.05, w: 8.6, h: 0.35, fontSize: 15, bold: true, color: C.indigo, fontFace: "Calibri", margin: 0,
    });
    s.addText("More revenue → more likely success.  More funding rounds → more likely success.  More experience → more likely success. There are no complex hidden interactions for tree models to discover — Logistic Regression finds the same straight-line decision boundary, faster and with fewer parameters.", {
      x: 0.7, y: 2.42, w: 8.6, h: 0.75, fontSize: 11.5, color: C.muted, fontFace: "Calibri", margin: 0,
    });

    // 3 takeaway cards
    const takes = [
      { title: "Data > Model",       body: "A hard ceiling (~84% AUC) comes from the data. No model can extract signal that doesn't exist in the features.", col: C.sky },
      { title: "Simplicity Wins",    body: "When the problem is linear, complex models waste capacity. The right model is the simplest one that works.", col: C.green },
      { title: "No Overfitting",     body: "CV scores matched test scores across all models. The +21pp gap over baseline is real signal, not memorisation.", col: C.amber },
    ];

    takes.forEach((t, i) => {
      const cx = 0.5 + i * 3.08;
      cardBg(s, cx, 3.42, 2.85, 1.9);
      s.addShape("rect", { x: cx, y: 3.42, w: 2.85, h: 0.06, fill: { color: t.col }, line: { color: t.col, width: 0 } });
      s.addText(t.title, { x: cx + 0.15, y: 3.55, w: 2.55, h: 0.35, fontSize: 13, bold: true, color: t.col, fontFace: "Calibri", margin: 0 });
      s.addText(t.body,  { x: cx + 0.15, y: 3.93, w: 2.55, h: 1.3, fontSize: 11, color: C.muted, fontFace: "Calibri", margin: 0, valign: "top" });
    });
  }

  // ╔══════════════════════════════════════════════════════════╗
  // ║  SLIDE 10 — FEATURE IMPORTANCE                         ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    const s = darkSlide(pres);
    sectionBadge(s, "Feature Importance", 0.5, 0.3);

    s.addText("What Drives Predictions?", {
      x: 0.5, y: 0.65, w: 9, h: 0.55,
      fontSize: 30, bold: true, color: C.white, fontFace: "Calibri", margin: 0,
    });

    // Horizontal bar chart of feature importances
    const features = [
      { name: "Revenue ($M)",              val: 1.028, pct: 100, col: C.green  },
      { name: "Funding Rounds",            val: 0.723, pct: 70,  col: C.sky    },
      { name: "Founder Experience (yrs)",  val: 0.601, pct: 58,  col: C.sky    },
      { name: "Product Traction (users)",  val: 0.548, pct: 53,  col: C.sky    },
      { name: "Team Size",                 val: 0.287, pct: 28,  col: C.indigo },
      { name: "Sector: Fintech",           val: 0.046, pct: 4.5, col: C.dim    },
      { name: "Founder: Serial",           val: 0.037, pct: 3.6, col: C.dim    },
      { name: "Sector: Climate",           val: 0.035, pct: 3.4, col: C.dim    },
      { name: "Founder: First-time",       val: 0.032, pct: 3.1, col: C.dim    },
      { name: "Investor: None",            val: 0.023, pct: 2.2, col: C.dim    },
    ];

    features.forEach((f, i) => {
      const ry = 1.35 + i * 0.385;
      const barW = (f.pct / 100) * 5.5;
      // Label
      s.addText(f.name, { x: 0.5, y: ry, w: 3.2, h: 0.32, fontSize: 10.5, color: i < 5 ? C.text : C.muted, fontFace: "Calibri", margin: 0, valign: "middle" });
      // Track
      s.addShape("rect", { x: 3.8, y: ry + 0.06, w: 5.5, h: 0.2, fill: { color: C.card }, line: { color: C.border, width: 1 } });
      // Fill
      if (barW > 0) s.addShape("rect", { x: 3.8, y: ry + 0.06, w: barW, h: 0.2, fill: { color: f.col }, line: { color: f.col, width: 0 } });
      // Value
      s.addText(f.val.toFixed(3), { x: 9.4, y: ry, w: 0.7, h: 0.32, fontSize: 9.5, color: f.col, fontFace: "Calibri", margin: 0, valign: "middle" });
    });

    // Insight note
    cardBg(s, 0.5, 5.18, 9, 0.27);
    s.addText("Numeric features dominate. Categorical features (sector, investor, background) contribute almost nothing individually.", {
      x: 0.6, y: 5.2, w: 8.7, h: 0.22,
      fontSize: 10, color: C.amber, align: "center", fontFace: "Calibri", margin: 0,
    });
  }

  // ╔══════════════════════════════════════════════════════════╗
  // ║  SLIDE 11 — WEB APP                                     ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    const s = darkSlide(pres);
    sectionBadge(s, "Demo", 0.5, 0.3);

    s.addText("From Model to Web App", {
      x: 0.5, y: 0.65, w: 9, h: 0.55,
      fontSize: 30, bold: true, color: C.white, fontFace: "Calibri", margin: 0,
    });

    // How it's deployed — left
    cardBg(s, 0.5, 1.35, 4.1, 4.0);
    s.addText("How It Works", { x: 0.7, y: 1.45, w: 3.7, h: 0.3, fontSize: 13, bold: true, color: C.indigo, fontFace: "Calibri", margin: 0 });

    const stack = [
      { step: "1", label: "save_model.py", desc: "Trains & saves the full sklearn pipeline (preprocessor + LR) to startup_model.pkl using joblib", col: C.sky },
      { step: "2", label: "Flask backend (app.py)", desc: "Loads the .pkl once on startup. Receives JSON from browser, runs pipeline.predict_proba(), returns result", col: C.indigo },
      { step: "3", label: "HTML/JS frontend", desc: "Single-page form with quick-fill presets, sends fetch() POST, animates probability bars on result", col: C.amber },
    ];
    stack.forEach((st, i) => {
      const ry = 1.88 + i * 1.1;
      s.addShape("ellipse", { x: 0.68, y: ry, w: 0.36, h: 0.36, fill: { color: st.col }, line: { color: st.col, width: 0 } });
      s.addText(st.step, { x: 0.68, y: ry, w: 0.36, h: 0.36, fontSize: 12, bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });
      s.addText(st.label, { x: 1.15, y: ry, w: 3.2, h: 0.3, fontSize: 11, bold: true, color: st.col, fontFace: "Calibri", margin: 0 });
      s.addText(st.desc, { x: 1.15, y: ry + 0.3, w: 3.2, h: 0.65, fontSize: 9.5, color: C.muted, fontFace: "Calibri", margin: 0 });
    });

    // Right — mock UI representation
    cardBg(s, 5.0, 1.35, 4.6, 4.0);
    s.addShape("rect", { x: 5.0, y: 1.35, w: 4.6, h: 0.06, fill: { color: C.indigo }, line: { color: C.indigo, width: 0 } });
    s.addText("Startup Success Predictor", { x: 5.1, y: 1.48, w: 4.4, h: 0.3, fontSize: 12, bold: true, color: C.indigo, align: "center", fontFace: "Calibri", margin: 0 });
    s.addText("localhost:5000", { x: 5.1, y: 1.78, w: 4.4, h: 0.22, fontSize: 9, color: C.dim, align: "center", fontFace: "Calibri", margin: 0 });

    // Mock form fields
    const fields = ["Funding rounds", "Founder experience (yrs)", "Team size", "Revenue ($M)", "Investor type", "Sector"];
    fields.forEach((f, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const fx = 5.15 + col * 2.2;
      const fy = 2.1 + row * 0.55;
      s.addShape("rect", { x: fx, y: fy, w: 2.0, h: 0.42, fill: { color: C.bg }, line: { color: C.border, width: 1 } });
      s.addText(f, { x: fx + 0.08, y: fy + 0.05, w: 1.9, h: 0.18, fontSize: 7.5, color: C.dim, fontFace: "Calibri", margin: 0 });
      s.addText("—", { x: fx + 0.08, y: fy + 0.2, w: 1.9, h: 0.18, fontSize: 8.5, color: C.muted, fontFace: "Calibri", margin: 0 });
    });

    // Predict button
    s.addShape("rect", { x: 5.15, y: 3.78, w: 4.3, h: 0.42, fill: { color: C.indigo }, line: { color: C.indigo, width: 0 } });
    s.addText("Predict Outcome", { x: 5.15, y: 3.78, w: 4.3, h: 0.42, fontSize: 11, bold: true, color: C.white, align: "center", valign: "middle", fontFace: "Calibri", margin: 0 });

    // Result
    s.addShape("rect", { x: 5.15, y: 4.3, w: 4.3, h: 0.82, fill: { color: "0d2a1f" }, line: { color: C.green, width: 1.5 } });
    s.addText("Likely to Succeed", { x: 5.15, y: 4.35, w: 4.3, h: 0.35, fontSize: 16, bold: true, color: C.green, align: "center", fontFace: "Calibri", margin: 0 });
    s.addText("Confidence: 96.7%", { x: 5.15, y: 4.7, w: 4.3, h: 0.28, fontSize: 10, color: C.muted, align: "center", fontFace: "Calibri", margin: 0 });

    // Run instruction
    s.addText("python webapp/app.py  →  open http://127.0.0.1:5000", {
      x: 0.5, y: 5.42, w: 9, h: 0.25,
      fontSize: 10, color: C.dim, align: "center", fontFace: "Consolas", margin: 0,
    });
  }

  // ╔══════════════════════════════════════════════════════════╗
  // ║  SLIDE 12 — CONCLUSION                                  ║
  // ╚══════════════════════════════════════════════════════════╝
  {
    const s = darkSlide(pres);

    s.addShape("ellipse", { x: -1, y: -1, w: 6, h: 6, fill: { color: C.indigo, transparency: 90 }, line: { color: C.indigo, width: 0 } });
    s.addShape("ellipse", { x: 6.5, y: 2, w: 5, h: 5, fill: { color: C.sky, transparency: 92 }, line: { color: C.sky, width: 0 } });

    sectionBadge(s, "Conclusion", 0.5, 0.3);

    s.addText("What We Learned", {
      x: 0.5, y: 0.65, w: 9, h: 0.55,
      fontSize: 32, bold: true, color: C.white, fontFace: "Calibri", margin: 0,
    });

    const lessons = [
      { num: "01", title: "Define the problem right", body: "Converting 3-class to binary (Success vs Failure) made the task tractable and meaningful for real-world use.", col: C.sky },
      { num: "02", title: "Always set a baseline", body: "Without a baseline (55.6%), you can't tell if your model is actually useful. Every ML project needs one.", col: C.indigo },
      { num: "03", title: "Understand your data", body: "EDA revealed that revenue dominates all other features — knowing this upfront would have saved tuning time.", col: C.amber },
      { num: "04", title: "Simpler is often better", body: "Logistic Regression beat RF and XGBoost. Complex models aren't always the answer — match the model to the data.", col: C.green },
      { num: "05", title: "Cross-validation prevents overconfidence", body: "5-fold CV confirmed results were real and not lucky splits. Always validate before trusting a model.", col: C.sky },
      { num: "06", title: "Data quality is the real ceiling", body: "No amount of tuning or ensembling beat ~84% AUC. Better features (market timing, team quality) would matter more.", col: C.indigo },
    ];

    lessons.forEach((l, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = 0.5 + col * 4.72;
      const cy = 1.4 + row * 1.32;
      cardBg(s, cx, cy, 4.35, 1.15);
      s.addShape("rect", { x: cx, y: cy, w: 0.07, h: 1.15, fill: { color: l.col }, line: { color: l.col, width: 0 } });
      s.addText(l.num, { x: cx + 0.15, y: cy + 0.08, w: 0.45, h: 0.35, fontSize: 20, bold: true, color: l.col, fontFace: "Calibri", margin: 0 });
      s.addText(l.title, { x: cx + 0.65, y: cy + 0.1, w: 3.6, h: 0.3, fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", margin: 0 });
      s.addText(l.body, { x: cx + 0.65, y: cy + 0.42, w: 3.6, h: 0.65, fontSize: 9.5, color: C.muted, fontFace: "Calibri", margin: 0, valign: "top" });
    });

    // Footer
    s.addShape("rect", { x: 0, y: 5.32, w: 10, h: 0.305, fill: { color: C.card }, line: { color: C.border, width: 1 } });
    s.addText("76.6% accuracy  •  84.1% ROC AUC  •  +21pp over baseline  •  Python / scikit-learn / Flask", {
      x: 0.5, y: 5.33, w: 9, h: 0.28,
      fontSize: 10, color: C.indigo, align: "center", fontFace: "Calibri", margin: 0,
    });
  }

  // ── Write file ──────────────────────────────────────────────
  await pres.writeFile({ fileName: "C:/Users/nikni/Desktop/projekt/Startup_Prediction_Presentation.pptx" });
  console.log("Presentation saved: Startup_Prediction_Presentation.pptx");
})();
