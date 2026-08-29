"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
type SectionId =
  | "overview"
  | "architecture"
  | "studio"
  | "csv"
  | "export"
  | "routing"
  | "tooling"
  | "risk-map"
  | "safe-starts";

interface NavItem {
  id: SectionId;
  label: string;
  icon: string;
}

/* ─────────────────────────────────────────────
   NAVIGATION CONFIG
───────────────────────────────────────────── */
const NAV: NavItem[] = [
  { id: "overview",      label: "Overview",         icon: "◎" },
  { id: "architecture",  label: "Architecture",     icon: "⬡" },
  { id: "studio",        label: "Studio",           icon: "✦" },
  { id: "csv",           label: "CSV Ingestion",    icon: "⊞" },
  { id: "export",        label: "Export Pipeline",  icon: "↓" },
  { id: "routing",       label: "Routing",          icon: "⇄" },
  { id: "tooling",       label: "Tooling",          icon: "⚙" },
  { id: "risk-map",      label: "Risk Map",         icon: "⚠" },
  { id: "safe-starts",   label: "Safe Starting Points", icon: "✓" },
];

/* ─────────────────────────────────────────────
   SMALL PRIMITIVES
───────────────────────────────────────────── */
function Code({ children }: { children: React.ReactNode }) {
  return <code className="docs-inline-code">{children}</code>;
}

function FilePath({ children }: { children: string }) {
  return <code className="docs-filepath">{children}</code>;
}

function FuncName({ children }: { children: string }) {
  return <code className="docs-funcname">{children}</code>;
}

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="docs-section-title">
      {children}
    </h2>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="docs-subtitle">{children}</h3>;
}

function Note({ children }: { children: React.ReactNode }) {
  return <div className="docs-note">{children}</div>;
}

function Warning({ children }: { children: React.ReactNode }) {
  return <div className="docs-warning">{children}</div>;
}

function CodeBlock({ children, label }: { children: string; label?: string }) {
  return (
    <div className="docs-codeblock">
      {label && <div className="docs-codeblock-label">{label}</div>}
      <pre><code>{children}</code></pre>
    </div>
  );
}

function Expand({ title, children, defaultOpen = false }: { title: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`docs-expand${open ? " docs-expand--open" : ""}`}>
      <button className="docs-expand-trigger" onClick={() => setOpen(o => !o)}>
        <span className="docs-expand-arrow">{open ? "▾" : "▸"}</span>
        {title}
      </button>
      {open && <div className="docs-expand-body">{children}</div>}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="docs-table-wrap">
      <table className="docs-table">
        <thead>
          <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ARCHITECTURE DIAGRAM (SVG)
───────────────────────────────────────────── */
function ArchDiagram() {
  return (
    <div className="docs-arch-diagram">
      <svg viewBox="0 0 720 520" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Certiq system architecture diagram">
        {/* Background */}
        <rect width="720" height="520" rx="12" fill="#f7f8f6"/>

        {/* Browser boundary */}
        <rect x="16" y="16" width="688" height="488" rx="10" fill="none" stroke="#d0d8d2" strokeWidth="1.5" strokeDasharray="6 3"/>
        <text x="32" y="36" fontSize="11" fill="#8a9e94" fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight="500">Browser tab — no data leaves this boundary</text>

        {/* ── Boxes ── */}
        {/* CSV File */}
        <rect x="60" y="60" width="140" height="44" rx="8" fill="#edf5f0" stroke="#b8d9c8" strokeWidth="1.5"/>
        <text x="130" y="87" textAnchor="middle" fontSize="13" fill="#174a39" fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight="600">CSV File</text>

        {/* Template Image */}
        <rect x="240" y="60" width="160" height="44" rx="8" fill="#edf5f0" stroke="#b8d9c8" strokeWidth="1.5"/>
        <text x="320" y="87" textAnchor="middle" fontSize="13" fill="#174a39" fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight="600">Template Image</text>

        {/* React State box */}
        <rect x="140" y="154" width="300" height="68" rx="8" fill="#fff" stroke="#174a39" strokeWidth="2"/>
        <text x="290" y="178" textAnchor="middle" fontSize="12" fill="#6b7570" fontFamily="'Plus Jakarta Sans',sans-serif">LOCAL REACT STATE</text>
        <text x="290" y="198" textAnchor="middle" fontSize="11" fill="#174a39" fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight="500">templateImage · attendees · x · y · font · size · color</text>

        {/* Studio/Preview */}
        <rect x="60" y="278" width="180" height="52" rx="8" fill="#fff9ee" stroke="#b8964e" strokeWidth="1.5"/>
        <text x="150" y="299" textAnchor="middle" fontSize="13" fill="#1a2420" fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight="600">Studio / Preview</text>
        <text x="150" y="316" textAnchor="middle" fontSize="10.5" fill="#6b7570" fontFamily="'Plus Jakarta Sans',sans-serif">useLayoutEffect · ResizeObserver</text>

        {/* certificate.ts kernel */}
        <rect x="280" y="266" width="200" height="76" rx="8" fill="#fff" stroke="#c0392b" strokeWidth="2"/>
        <text x="380" y="287" textAnchor="middle" fontSize="12" fill="#c0392b" fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight="700">app/lib/certificate.ts</text>
        <text x="380" y="304" textAnchor="middle" fontSize="10.5" fill="#6b7570" fontFamily="'Plus Jakarta Sans',sans-serif">parseCsv · fitNameInBox</text>
        <text x="380" y="320" textAnchor="middle" fontSize="10.5" fill="#6b7570" fontFamily="'Plus Jakarta Sans',sans-serif">makeCertificate · downloadBlob</text>
        <text x="380" y="334" textAnchor="middle" fontSize="10" fill="#b8964e" fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight="600">★ Rank 1 blast radius</text>

        {/* fonts.ts */}
        <rect x="510" y="154" width="170" height="60" rx="8" fill="#f3f0ff" stroke="#7c5cd8" strokeWidth="1.5"/>
        <text x="595" y="178" textAnchor="middle" fontSize="12" fill="#4a3a8a" fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight="600">app/lib/fonts.ts</text>
        <text x="595" y="196" textAnchor="middle" fontSize="10.5" fill="#6b7570" fontFamily="'Plus Jakarta Sans',sans-serif">ensureCertificateFont()</text>

        {/* Export */}
        <rect x="200" y="394" width="180" height="52" rx="8" fill="#fff" stroke="#174a39" strokeWidth="1.5"/>
        <text x="290" y="415" textAnchor="middle" fontSize="13" fill="#1a2420" fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight="600">Export (exportZip)</text>
        <text x="290" y="432" textAnchor="middle" fontSize="10.5" fill="#6b7570" fontFamily="'Plus Jakarta Sans',sans-serif">Canvas API · JSZip</text>

        {/* ZIP download */}
        <rect x="200" y="466" width="180" height="32" rx="8" fill="#174a39"/>
        <text x="290" y="487" textAnchor="middle" fontSize="12" fill="#fff" fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight="600">ZIP Download</text>

        {/* ── Arrows ── */}
        {/* CSV → React State */}
        <line x1="130" y1="104" x2="200" y2="154" stroke="#b8d9c8" strokeWidth="1.5" markerEnd="url(#arrow-green)"/>
        {/* Template → React State */}
        <line x1="320" y1="104" x2="300" y2="154" stroke="#b8d9c8" strokeWidth="1.5" markerEnd="url(#arrow-green)"/>
        {/* React State → Studio */}
        <line x1="220" y1="222" x2="180" y2="278" stroke="#174a39" strokeWidth="1.5" markerEnd="url(#arrow-dark)"/>
        {/* React State → certificate.ts */}
        <line x1="320" y1="222" x2="360" y2="266" stroke="#c0392b" strokeWidth="2" markerEnd="url(#arrow-red)"/>
        {/* fonts.ts → certificate.ts (cross-cutting) */}
        <path d="M510 184 Q460 200 480 266" stroke="#7c5cd8" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#arrow-purple)"/>
        <text x="488" y="232" fontSize="9.5" fill="#7c5cd8" fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight="600" transform="rotate(-15 488 232)">awaited before</text>
        <text x="488" y="243" fontSize="9.5" fill="#7c5cd8" fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight="600" transform="rotate(-15 488 243)">measureText</text>
        {/* Studio → certificate.ts (fitNameInBox) */}
        <path d="M240 304 Q260 304 280 304" stroke="#b8964e" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arrow-gold)"/>
        <text x="248" y="298" fontSize="9" fill="#b8964e" fontFamily="'Plus Jakarta Sans',sans-serif">fitNameInBox()</text>
        {/* certificate.ts → Export */}
        <line x1="360" y1="342" x2="320" y2="394" stroke="#c0392b" strokeWidth="1.5" markerEnd="url(#arrow-red)"/>
        {/* Export → ZIP */}
        <line x1="290" y1="446" x2="290" y2="466" stroke="#174a39" strokeWidth="1.5" markerEnd="url(#arrow-dark)"/>
        {/* fonts.ts → Studio (pre-load) */}
        <path d="M510 184 Q400 220 240 290" stroke="#7c5cd8" strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#arrow-purple)"/>

        {/* Arrow marker defs */}
        <defs>
          <marker id="arrow-green" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" fill="#b8d9c8"/>
          </marker>
          <marker id="arrow-dark" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" fill="#174a39"/>
          </marker>
          <marker id="arrow-red" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" fill="#c0392b"/>
          </marker>
          <marker id="arrow-purple" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" fill="#7c5cd8"/>
          </marker>
          <marker id="arrow-gold" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" fill="#b8964e"/>
          </marker>
        </defs>
      </svg>

      <div className="docs-arch-legend">
        <span className="docs-legend-item docs-legend-red">★ <strong>app/lib/certificate.ts</strong> — Rank 1 blast radius; imported by studio preview AND export pipeline</span>
        <span className="docs-legend-item docs-legend-purple">▸ <strong>ensureCertificateFont()</strong> — cross-cutting pre-condition; must be awaited before any text measurement</span>
        <span className="docs-legend-item docs-legend-gold">▸ <strong>fitNameInBox()</strong> — called in both preview loop and makeCertificate(); change here affects both</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   RISK BADGE
───────────────────────────────────────────── */
function RiskBadge({ rank }: { rank: number }) {
  const cls = rank <= 2 ? "docs-risk-badge--critical"
    : rank <= 4 ? "docs-risk-badge--high"
    : rank <= 6 ? "docs-risk-badge--medium"
    : "docs-risk-badge--low";
  return <span className={`docs-risk-badge ${cls}`}>#{rank}</span>;
}

/* ─────────────────────────────────────────────
   RISK ITEMS DATA
───────────────────────────────────────────── */
const RISKS = [
  {
    rank: 1,
    area: "app/lib/certificate.ts (entire file)",
    why: "The only shared library. Imported by the live preview, the export pipeline, and directly tested by name in the smoke suite. No layer of indirection exists.",
    deps: ["Live preview (fitNameInBox, scaledNameSize, nameTextWidth)", "Export pipeline (makeCertificate, downloadBlob, safeFilename)", "CSV ingestion (parseCsv, splitCsvLine)", "Smoke test 4 (pins parseCsv export by name)", "Constants NAME_BOX_WIDTH_RATIO and NAME_REFERENCE_WIDTH govern both preview and export canvas"],
    breaks: ["Rename parseCsv → smoke test 4 fails; CSV upload stops working", "Change NAME_BOX_WIDTH_RATIO → visual inconsistency between preview and export", "Move or split the file → all page.tsx imports and smoke tests break"],
    sources: ["studio-editor.md", "csv-ingestion.md", "export-pipeline.md", "build-tooling.md"],
  },
  {
    rank: 2,
    area: "app/studio/page.tsx — state block + exportZip",
    why: "Single component owning all studio state. No sub-components or context; every feature is coupled through shared local state variables.",
    deps: ["All studio UI state (templateImage, attendees, x, y, font, size, color, uppercase, exporting, progress)", "Preview loop (useLayoutEffect reads font, size, previewName, templateUrl)", "exportZip closure captures all style state at call time", "exporting flag is the only re-entry guard"],
    breaks: ["New state var not included in exportZip closure → stale styling in exported certs", "Remove cancelled flag from useLayoutEffect → stale closure sets wrong previewFontSize", "Remove exporting guard → concurrent export runs corrupt the ZIP"],
    sources: ["studio-editor.md", "export-pipeline.md", "csv-ingestion.md"],
  },
  {
    rank: 3,
    area: "app/lib/fonts.ts — ensureCertificateFont()",
    why: "Silent pre-condition: must be awaited before any text measurement or canvas rendering. The contract is implicit — nothing in the type system enforces it. Three separate call sites uphold it today.",
    deps: ["Preview font sizing (fitNameInBox → measureNameWidth → measureText)", "Export canvas rendering (makeCertificate → fitNameInBox)", "All five certificate fonts via certificateFontWeight"],
    breaks: ["Remove await from exportZip → font may be evicted mid-batch; inconsistent output", "Add font to CERT_FONT_OPTIONS without adding it to certificateFontWeight → wrong weight, wrong metrics", "Change document.fonts.load() to non-awaited → text sizing becomes nondeterministic"],
    sources: ["studio-editor.md", "export-pipeline.md"],
  },
  {
    rank: 4,
    area: "app/globals.css (shared style foundation)",
    why: "The only CSS file for the entire application. Contains custom properties for both pages, Tailwind v4 import, and studio drag mechanics classes. No scoping.",
    deps: ["Landing page custom properties (--green, --gold, --cream, --ink)", "Studio layout (.studio, .canvas-panel, .certificate, .name-layer)", "Drag mechanics (touch-action: none, cursor: grab)", "Tailwind v4 via @import 'tailwindcss'"],
    breaks: ["Delete/rename .name-layer → drag target loses positioning; name jumps to top-left", "Remove touch-action: none from .certificate → drag broken on touch devices", "Change .certificate aspect-ratio → shifts drag coordinate system", "Edit @import 'tailwindcss' → all utility classes stop working everywhere"],
    sources: ["studio-editor.md", "routing.md"],
  },
  {
    rank: 5,
    area: "Font loading / text measurement contract (cross-cutting)",
    why: "A protocol spanning fonts.ts, certificate.ts, and studio/page.tsx. Not enforced by the type system, not documented at call sites, not tested at runtime. A developer unaware of it will violate it on first touch.",
    deps: ["Preview font size calculation (fitNameInBox in useLayoutEffect)", "Export font size calculation (fitNameInBox inside makeCertificate)", "Visual consistency between preview and exported certificates"],
    breaks: ["New code path renders text without awaiting ensureCertificateFont → wrong sizes in output, no thrown error, ships undetected"],
    sources: ["studio-editor.md", "export-pipeline.md"],
  },
  {
    rank: 6,
    area: "parseCsv() + handleCsv() — CSV silent failures",
    why: "Two compounding silent failures: parseCsv silently falls back to column 0 when no name header is found, and handleCsv silently exits with no UI feedback. No validation layer exists between raw file and attendees state.",
    deps: ["Entire export pipeline (attendees array populated solely by parseCsv)", "Attendee list UI and certificate count in the Download button"],
    breaks: ["Non-standard headers (e.g. full_name with underscore) → column 0 used as name; IDs on certificates", "Duplicate attendee names → safeFilename collision; one PNG silently overwrites another in ZIP", "Non-UTF-8 CSV → mojibake on every certificate, no error shown"],
    sources: ["csv-ingestion.md", "studio-editor.md", "export-pipeline.md"],
  },
  {
    rank: 7,
    area: "app/layout.tsx (root layout)",
    why: "Wraps every route. Changes to the body tag, CSS import, or metadata export affect the entire application.",
    deps: ["Every route's HTML boilerplate", "globals.css import", "Site-wide <title> and OG metadata", "metadataBase for absolute URL resolution"],
    breaks: ["Remove globals.css import → all styling disappears site-wide", "Conflicting body class → layout corruption in studio", "NEXT_PUBLIC_SITE_URL misconfigured → incorrect OG image URLs everywhere"],
    sources: ["routing.md", "build-tooling.md"],
  },
  {
    rank: 8,
    area: "tests/rendered-html.test.mjs (smoke tests)",
    why: "Source-level string checks pin specific symbol names and public asset paths. Legitimate refactoring triggers CI failures, creating pressure to weaken or delete the only automated safety net.",
    deps: ["CI/CD pipeline (npm test = npm run build + node --test)", "Confidence that parseCsv is still exported", "Confirmation required public assets exist"],
    breaks: ["Rename parseCsv → test 4 fails even if app works", "Move public/sample-template.png → test 3 fails + studio broken", "Refactor SiteHeader import alias → test 2 fails"],
    sources: ["build-tooling.md", "studio-editor.md", "csv-ingestion.md"],
  },
  {
    rank: 9,
    area: "public/ — sample-template.png, og.png, certiq-logo.png",
    why: "Studio calls loadSampleTemplate() on mount. Missing template = broken initial state. Smoke test 3 asserts all three files exist. Deleting any causes both a runtime regression and a CI failure.",
    deps: ["Studio initial state (sample template pre-load)", "OG social preview (og.png)", "Site logo in navigation (certiq-logo.png)", "Smoke test 3"],
    breaks: ["Delete sample-template.png → studio opens blank; smoke test fails", "Delete og.png → broken social sharing on all pages", "Rename any asset → smoke test fails + hardcoded references break"],
    sources: ["build-tooling.md", "routing.md"],
  },
  {
    rank: 10,
    area: "package.json — dependency versions + engine constraint",
    why: "Node ≥20.9.0 and exact versions of Next.js 16, React 19, JSZip 3.10.1, Tailwind 4 are all load-bearing. Tailwind v4 has breaking changes from v3.",
    deps: ["Entire build pipeline (Next.js version)", "Export pipeline (JSZip API)", "All utility classes (Tailwind v4)", "CI and local machines (Node version constraint)"],
    breaks: ["Downgrade Next.js below 16 → App Router stops working", "Replace JSZip → exportZip API calls break", "Add Tailwind v3 plugin → config crashes or styles wrong"],
    sources: ["build-tooling.md", "export-pipeline.md"],
  },
];

/* ─────────────────────────────────────────────
   SAFE STARTING POINTS DATA
───────────────────────────────────────────── */
const SAFE_AREAS = [
  {
    area: "app/page.tsx (landing page)",
    reason: "Pure server component with no shared state and no library code. Content changes, section reordering, or copy edits have no effect on the studio or export pipeline.",
  },
  {
    area: "app/components/",
    reason: "site-header.tsx, site-footer.tsx, landing-cta.tsx, landing-preview.tsx, and CardSwap.tsx are used only on the landing page. Changes don't affect studio, CSV parsing, or export.",
  },
  {
    area: "app/studio/page.tsx — styling controls UI only",
    reason: "The JSX for the font dropdown, size slider, color picker, and uppercase toggle is self-contained. Safe to adjust presentation as long as state variables and their connections to useLayoutEffect are not touched.",
  },
  {
    area: "tests/rendered-html.test.mjs — adding assertions",
    reason: "Adding new smoke test assertions is safe and additive. These are the only automated correctness signals the project has.",
  },
  {
    area: "eslint.config.mjs and tsconfig.json",
    reason: "Tightening lint rules or enabling additional TypeScript checks adds safety without affecting runtime behaviour.",
  },
  {
    area: "app/layout.tsx — metadata only",
    reason: "Adding per-route metadata exports to app/studio/page.tsx is safe. Modifying the root layout's <body> or CSS import is Rank 7 territory.",
  },
  {
    area: "public/ — adding new assets",
    reason: "Adding new images to public/ does not affect existing code. Risk only arises when renaming or deleting existing assets.",
  },
];

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const mainRef = useRef<HTMLDivElement>(null);

  // Intersection observer to track active section
  useEffect(() => {
    const sections = document.querySelectorAll("[data-section]");
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.getAttribute("data-section") as SectionId);
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: SectionId) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
      setSidebarOpen(false);
    }
  };

  const filteredNav = searchQuery.trim()
    ? NAV.filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : NAV;

  return (
    <div className="docs-shell">
      {/* ── Mobile header ── */}
      <header className="docs-mobile-header">
        <Link href="/" className="docs-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/certiq-logo.png" alt="" width={28} height={28} className="docs-brand-logo" />
          <span>Certiq</span>
          <span className="docs-brand-divider">/</span>
          <span className="docs-brand-sub">Dev Docs</span>
        </Link>
        <button className="docs-menu-btn" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle navigation">
          {sidebarOpen ? "✕" : "☰"}
        </button>
      </header>

      {/* ── Sidebar overlay (mobile) ── */}
      {sidebarOpen && (
        <div
          className="docs-overlay"
          role="button"
          tabIndex={-1}
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={e => { if (e.key === "Escape") setSidebarOpen(false); }}
        />
      )}

      {/* ── Sidebar ── */}
      <nav className={`docs-sidebar${sidebarOpen ? " docs-sidebar--open" : ""}`}>
        <div className="docs-sidebar-top">
          <Link href="/" className="docs-brand docs-brand--sidebar">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/certiq-logo.png" alt="" width={28} height={28} className="docs-brand-logo" />
            <div>
              <div className="docs-brand-name">Certiq</div>
              <div className="docs-brand-sub">Developer Docs</div>
            </div>
          </Link>

          <div className="docs-search-wrap">
            <input
              className="docs-search"
              type="search"
              placeholder="Search sections…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Search documentation sections"
            />
          </div>
        </div>

        <ul className="docs-nav-list">
          {filteredNav.map(item => (
            <li key={item.id}>
              <button
                className={`docs-nav-item${activeSection === item.id ? " docs-nav-item--active" : ""}`}
                onClick={() => scrollTo(item.id)}
              >
                <span className="docs-nav-icon">{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="docs-sidebar-footer">
          <Link href="/" className="docs-back-link">← Back to Certiq</Link>
          <Link href="/studio" className="docs-back-link">Open Studio →</Link>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="docs-main" ref={mainRef}>
        <div className="docs-content">

          {/* ══════════ OVERVIEW ══════════ */}
          <section data-section="overview" id="overview" className="docs-section">
            <SectionTitle id="overview-heading">Overview</SectionTitle>
            <p className="docs-lead">
              Certiq is a browser-only certificate generator. Upload a PNG/JPG template and a CSV of attendee names, position and style the name text on a live canvas preview, then download a ZIP containing one personalised PNG certificate per attendee.
            </p>
            <Note>
              <strong>Defining constraint:</strong> No data ever leaves the browser. There is no backend, no API, no database, and no file upload. Everything — template loading, CSV parsing, canvas rendering, and ZIP packaging — happens entirely in the user&apos;s tab. This is a deliberate privacy guarantee, not an omission.
            </Note>

            <SubTitle>The five areas of the codebase</SubTitle>
            <Table
              headers={["Area", "Primary file(s)", "Role"]}
              rows={[
                [<span key="r">Routing &amp; page structure</span>, <span key="f"><FilePath>app/layout.tsx</FilePath> <FilePath>app/page.tsx</FilePath> <FilePath>app/studio/page.tsx</FilePath></span>, "Two-route App Router shell; landing navigates to studio"],
                ["Studio / canvas editor", <FilePath key="f">app/studio/page.tsx</FilePath>, "All UI state, drag interactions, controls, preview loop"],
                ["CSV ingestion", <span key="f"><FilePath>app/lib/certificate.ts</FilePath> (<FuncName>parseCsv</FuncName>, <FuncName>splitCsvLine</FuncName>)</span>, "Turns a raw file into Attendee[] consumed by the studio"],
                ["Export pipeline", <span key="f"><FilePath>app/studio/page.tsx</FilePath> (<FuncName>exportZip</FuncName>) + <FilePath>app/lib/certificate.ts</FilePath> (<FuncName>makeCertificate</FuncName>, <FuncName>downloadBlob</FuncName>)</span>, "Renders each attendee's canvas and packages the ZIP"],
                ["Build & test tooling", <span key="f"><FilePath>package.json</FilePath> <FilePath>eslint.config.mjs</FilePath> <FilePath>tests/rendered-html.test.mjs</FilePath></span>, "Dev, lint, build, smoke-test, and Vercel deploy"],
              ]}
            />

            <SubTitle>End-to-end data flow</SubTitle>
            <CodeBlock label="User session — 6 steps">{`1. User visits /
   └─ app/layout.tsx wraps the page
   └─ app/page.tsx renders landing (server component, static)

2. User clicks "Start creating →"
   └─ Browser navigates to /studio
   └─ app/studio/page.tsx mounts ("use client")
   └─ loadSampleTemplate() pre-fills demo from /public/sample-template.png

3. User uploads a certificate template (PNG/JPG)
   └─ handleTemplate() → blob: URL created in memory (never uploaded)
   └─ Waits for image.onload → stores HTMLImageElement in templateImage state

4. User uploads an attendee CSV
   └─ handleCsv() → parseCsv() in certificate.ts
      └─ Strips BOM, splits rows, calls splitCsvLine() per row
      └─ Auto-detects "name"/"fullname"/"attendee" header (silent fallback to col 0)
      └─ Returns Attendee[] → stored in attendees state

5. User drags / resizes / styles the name
   └─ Pointer events update x%, y% state
   └─ snapToCenter() snaps to 50% within 1.75% threshold
   └─ useLayoutEffect + ResizeObserver:
      └─ ensureCertificateFont()   ← must complete first
      └─ scaledNameSize() + fitNameInBox()   ← binary search
      └─ setPreviewFontSize()

6. User clicks "Download N certificates"
   └─ exportZip()
      └─ ensureCertificateFont()   ← font pre-load for canvas
      └─ For each attendee: makeCertificate() → canvas.toBlob() → zip.file()
      └─ zip.generateAsync() (DEFLATE level 6)
      └─ downloadBlob() → URL.createObjectURL + anchor click → ZIP saved to disk`}</CodeBlock>

            <Warning>
              <strong>Critical coupling:</strong> <FuncName>fitNameInBox()</FuncName> is called in two separate contexts — the live preview loop and inside <FuncName>makeCertificate()</FuncName> during export. Inputs differ (preview uses CSS container width; export uses <Code>template.naturalWidth</Code>), but both must produce consistent visual output. Changing <FuncName>fitNameInBox</FuncName>, <Code>NAME_BOX_WIDTH_RATIO</Code>, or <Code>NAME_REFERENCE_WIDTH</Code> affects both simultaneously.
            </Warning>

            <SubTitle>Important architectural decisions</SubTitle>
            <Expand title={<><strong>1. Fully client-side by design</strong> — no /api/ routes</>} defaultOpen={true}>
              <p>No <FilePath>/api/</FilePath> routes exist. Attendee names and certificate templates are treated as sensitive data that must never leave the user&apos;s device. Any feature that requires a server (PDF rendering, email delivery, cloud storage) would require a deliberate architectural expansion.</p>
            </Expand>
            <Expand title={<><strong>2. app/lib/certificate.ts is the shared kernel</strong></>}>
              <p>This single file contains CSV parsing, canvas rendering, text fitting, font utilities, and the download helper. It is imported by <FilePath>app/studio/page.tsx</FilePath> for both the live preview and export, and directly tested by <FilePath>tests/rendered-html.test.mjs</FilePath>. A breaking change here affects every feature simultaneously.</p>
            </Expand>
            <Expand title={<><strong>3. All studio state is ephemeral and local</strong></>}>
              <p>No <Code>localStorage</Code>, URL serialisation, or server-side draft storage. State lives only in React&apos;s in-memory component tree. Navigating away from <Code>/studio</Code> destroys all work silently.</p>
            </Expand>
            <Expand title={<><strong>4. Single global CSS file</strong></>}>
              <p>All styles for both pages live in <FilePath>app/globals.css</FilePath>. No CSS Modules or scoped styles. Studio class names (<Code>.studio</Code>, <Code>.certificate</Code>, <Code>.name-layer</Code>) coexist with landing-page classes, separated only by convention.</p>
            </Expand>
            <Expand title={<><strong>5. Font loading is a synchronisation point</strong></>}>
              <p><FuncName>ensureCertificateFont()</FuncName> must complete before any text measurement. This contract is upheld in three separate call sites and is not enforced by the type system. Any new code path measuring or rendering certificate text must follow the same pattern.</p>
            </Expand>
            <Expand title={<><strong>6. Smoke tests are source-level, not runtime</strong></>}>
              <p><FilePath>tests/rendered-html.test.mjs</FilePath> reads files with <Code>fs.readFileSync</Code> and checks for string presence. Renaming <FuncName>parseCsv</FuncName> will break CI even if the app works correctly. Conversely, runtime errors won&apos;t be caught.</p>
            </Expand>

            <SubTitle>Most important files — read in this order</SubTitle>
            <ol className="docs-ordered-list">
              <li><FilePath>app/lib/certificate.ts</FilePath> — shared kernel; widest blast radius</li>
              <li><FilePath>app/studio/page.tsx</FilePath> — entire application UX and all state</li>
              <li><FilePath>app/lib/fonts.ts</FilePath> — short but critical; the font-load contract</li>
              <li><FilePath>app/globals.css</FilePath> — only CSS file; understand class names before adding</li>
              <li><FilePath>app/layout.tsx</FilePath> — root layout; affects every route</li>
              <li><FilePath>tests/rendered-html.test.mjs</FilePath> — read before refactoring anything</li>
            </ol>

            <SubTitle>First 30 Minutes</SubTitle>
            <div className="docs-steps">
              <div className="docs-step">
                <div className="docs-step-num">1</div>
                <div className="docs-step-body">
                  <strong>Clone &amp; install</strong> <span className="docs-step-time">~2 min</span>
                  <CodeBlock>{`git clone https://github.com/randreitomas/certiq.git
cd certiq
node --version   # must be >= 20.9.0
npm install
echo "NEXT_PUBLIC_SITE_URL=http://localhost:3000" > .env.local`}</CodeBlock>
                </div>
              </div>
              <div className="docs-step">
                <div className="docs-step-num">2</div>
                <div className="docs-step-body">
                  <strong>Run the app</strong> <span className="docs-step-time">~1 min</span>
                  <CodeBlock>{`npm run dev
# → http://localhost:3000        (landing page)
# → http://localhost:3000/studio (editor)`}</CodeBlock>
                  <p>On the landing page, read the three feature steps — they describe the exact user flow. Click &quot;Start creating&quot; to enter the studio. Upload a CSV with a <Code>name</Code> column, drag the name, and download a ZIP.</p>
                </div>
              </div>
              <div className="docs-step">
                <div className="docs-step-num">3</div>
                <div className="docs-step-body">
                  <strong>Read the kernel</strong> <span className="docs-step-time">~15 min</span>
                  <p>Open <FilePath>app/lib/certificate.ts</FilePath>. Read <FuncName>parseCsv</FuncName>, <FuncName>fitNameInBox</FuncName>, and <FuncName>makeCertificate</FuncName> in full — these three functions are the heart of the system. Then open <FilePath>app/studio/page.tsx</FilePath> and read <FuncName>exportZip</FuncName>.</p>
                </div>
              </div>
              <div className="docs-step">
                <div className="docs-step-num">4</div>
                <div className="docs-step-body">
                  <strong>Verify the build</strong> <span className="docs-step-time">~5 min</span>
                  <CodeBlock>{`npm run lint    # should pass clean
npm test        # full build + 4 smoke tests`}</CodeBlock>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════ ARCHITECTURE ══════════ */}
          <section data-section="architecture" id="architecture" className="docs-section">
            <SectionTitle id="architecture-heading">Architecture</SectionTitle>
            <p className="docs-lead">How the major components relate — and where coupling creates blast radius.</p>
            <ArchDiagram />
            <Note>
              The red border on <FilePath>app/lib/certificate.ts</FilePath> communicates blast radius: it is the sole shared library, imported by both the preview path and the export path with no indirection. The purple dashed lines show <FuncName>ensureCertificateFont()</FuncName> as a cross-cutting pre-condition that must be satisfied before any node in either path measures or renders text.
            </Note>
          </section>

          {/* ══════════ STUDIO ══════════ */}
          <section data-section="studio" id="studio" className="docs-section">
            <SectionTitle id="studio-heading">Studio / Canvas Editor</SectionTitle>
            <p className="docs-lead">
              The <FilePath>app/studio/page.tsx</FilePath> route is a three-step certificate personalisation interface. All logic — template upload, CSV ingestion, drag positioning, styling controls, live preview, and export — lives in a single <Code>&quot;use client&quot;</Code> React component.
            </p>

            <SubTitle>Key files</SubTitle>
            <Table
              headers={["File", "Purpose"]}
              rows={[
                [<FilePath key="f">app/studio/page.tsx</FilePath>, "Main React client component (307 lines); all studio UI and state logic"],
                [<FilePath key="f">app/lib/certificate.ts</FilePath>, "Canvas rendering utilities, text-fitting algorithm, CSV parser, download helper"],
                [<FilePath key="f">app/lib/fonts.ts</FilePath>, "Font-loading helpers and font-weight lookup"],
                [<FilePath key="f">app/globals.css</FilePath>, "All studio CSS: grid layout, canvas panel, draggable name layer, snap guides"],
              ]}
            />

            <SubTitle>Key exports from app/lib/certificate.ts</SubTitle>
            <Table
              headers={["Symbol", "Description"]}
              rows={[
                [<FuncName key="f">makeCertificate(template, name, options)</FuncName>, "Renders one certificate onto a new <canvas> element"],
                [<FuncName key="f">fitNameInBox(text, options)</FuncName>, "Binary-search algorithm that shrinks font until text fits the 65% box"],
                [<FuncName key="f">scaledNameSize(size, containerWidth)</FuncName>, "Maps slider value (24–86 px) to actual preview pixel size"],
                [<FuncName key="f">nameTextWidth(containerWidth)</FuncName>, "Returns usable text box width (65% of container)"],
                [<FuncName key="f">parseCsv(text)</FuncName>, "Parses attendee CSV; auto-detects name/fullname/attendee column"],
                [<FuncName key="f">downloadBlob(blob, filename)</FuncName>, "Creates a temporary anchor and triggers a browser download"],
                [<Code key="c">NAME_BOX_WIDTH_RATIO</Code>, "0.65 — text box is 65% of certificate width"],
                [<Code key="c">NAME_REFERENCE_WIDTH</Code>, "740 px — baseline width for size scaling"],
                [<Code key="c">SAMPLE_STYLE_DEFAULTS</Code>, "{ x:50, y:43, size:50, color:'#333333', font:'Cormorant Garamond', uppercase:false }"],
              ]}
            />

            <SubTitle>How it works</SubTitle>
            <Expand title="Template upload — handleTemplate()" defaultOpen>
              <CodeBlock label="app/studio/page.tsx lines 106–119">{`const handleTemplate = (file?: File) => {
  if (!file || !file.type.startsWith("image/")) return;
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    setTemplateUrl((old) => {
      if (old?.startsWith("blob:")) URL.revokeObjectURL(old);
      return url;
    });
    setTemplateImage(image);
    setTemplateName(file.name);
  };
  image.src = url;
};`}</CodeBlock>
              <p>Creates an in-memory blob URL (never uploaded). Waits for <Code>image.onload</Code> before setting state so <Code>naturalWidth</Code>/<Code>naturalHeight</Code> are available for export. Old blob URLs are revoked on replacement.</p>
            </Expand>

            <Expand title="Drag-to-position — moveName() + snapToCenter()">
              <p>State: <Code>x</Code> (0–100%), <Code>y</Code> (0–100%), <Code>dragging</Code>, <Code>snapGuideX</Code>. Pointer capture is set on <Code>pointerdown</Code> so dragging continues outside the element boundary.</p>
              <CodeBlock label="Snap logic">{`const CENTER = 50;
const SNAP_THRESHOLD = 1.75; // percentage units (~12px on a 720px canvas)

function snapToCenter(value: number) {
  return Math.abs(value - CENTER) <= SNAP_THRESHOLD ? CENTER : value;
}`}</CodeBlock>
            </Expand>

            <Expand title="Live preview — useLayoutEffect + ResizeObserver">
              <p>A <Code>ResizeObserver</Code> on the certificate container reruns on every resize, font change, name change, or template change:</p>
              <ol className="docs-ordered-list">
                <li>Awaits <FuncName>ensureCertificateFont()</FuncName></li>
                <li>Calculates max font size via <FuncName>scaledNameSize()</FuncName></li>
                <li>Calls <FuncName>fitNameInBox()</FuncName> — binary search shrinks from max to <Code>max * 0.35</Code></li>
                <li>Sets <Code>previewFontSize</Code> applied to the <Code>.name-layer</Code> button</li>
              </ol>
              <p>A <Code>cancelled</Code> flag prevents state updates after the effect tears down.</p>
            </Expand>

            <SubTitle>Gotchas &amp; risks</SubTitle>
            {[
              { title: "Font must load before text measurement", body: "fitNameInBox relies on measureNameWidth using CanvasRenderingContext2D.measureText. If the font is not loaded, the browser falls back to a system font and returns the wrong width. Always await ensureCertificateFont() before calling fitNameInBox — any new code path that measures text must do the same." },
              { title: "Canvas coordinate vs. percentage mismatch", body: "The preview uses 0–100% positions; makeCertificate converts them via (options.x / 100) * canvas.width. Always use template.naturalWidth / template.naturalHeight — never hardcode canvas dimensions." },
              { title: "ResizeObserver stale closure", body: "The cancelled flag in useLayoutEffect guards against updates after the effect tears down. Remove it and rapid resizing or font changes can set stale previewFontSize values." },
              { title: "CSV column detection silent fallback", body: "If no recognised name header is found, parseCsv silently uses column 0. A CSV with [ID, Email, Full Name] headers will produce certificates with row IDs as names." },
              { title: "Silent export failure", body: "exportZip has a bare try/finally; exceptions are swallowed. canvas.toBlob() can fail on cross-origin tainted canvases. Users see the button re-enable with no error or feedback." },
              { title: "ZIP filename collisions", body: "safeFilename() replaces special characters with hyphens. José and Jose produce the same filename; the second PNG silently overwrites the first in the ZIP." },
            ].map(g => (
              <Expand key={g.title} title={<span className="docs-gotcha-title">⚠ {g.title}</span>}>
                <p>{g.body}</p>
              </Expand>
            ))}

            <SubTitle>Quick-start snippet</SubTitle>
            <CodeBlock label="Trigger file pickers programmatically">{`imageInputRef.current?.click(); // template PNG/JPG
csvInputRef.current?.click();   // attendee CSV

// Set position and style
setX(50); setY(35);
setFont("'Libre Baskerville', Baskerville, serif");
setSize(64);
setColor("#1a1a1a");
setUppercase(true);`}</CodeBlock>
          </section>

          {/* ══════════ CSV ══════════ */}
          <section data-section="csv" id="csv" className="docs-section">
            <SectionTitle id="csv-heading">CSV Ingestion &amp; Validation</SectionTitle>
            <p className="docs-lead">
              CSV parsing lives entirely in <FilePath>app/lib/certificate.ts</FilePath>. The two key functions are <FuncName>parseCsv(text)</FuncName> and the internal <FuncName>splitCsvLine(line)</FuncName>. There is no server-side validation — everything runs in the browser.
            </p>

            <SubTitle>Attendee type</SubTitle>
            <CodeBlock>{`type Attendee = { name: string; email?: string };`}</CodeBlock>

            <SubTitle>Accepted header aliases (case-insensitive)</SubTitle>
            <div className="docs-chip-row">
              {["name", "full name", "fullname", "attendee"].map(h => <span key={h} className="docs-chip docs-chip--green">{h}</span>)}
            </div>
            <p>Email column aliases: <Code>email</Code>, <Code>email address</Code></p>

            <SubTitle>Parsing flow</SubTitle>
            <Expand title="parseCsv() step-by-step" defaultOpen>
              <ol className="docs-ordered-list">
                <li>Remove UTF-8 BOM (<Code>\uFEFF</Code>)</li>
                <li>Split on <Code>\r?\n</Code> (handles both <Code>\n</Code> and <Code>\r\n</Code>)</li>
                <li>Filter empty rows</li>
                <li>Call <FuncName>splitCsvLine()</FuncName> per row — RFC 4180 quote handling</li>
                <li>Check first row for recognised name header → <Code>hasHeader</Code></li>
                <li>If no header found, use column 0 as name (silent fallback)</li>
                <li>Skip rows where name cell is empty</li>
              </ol>
            </Expand>

            <Expand title="splitCsvLine() — RFC 4180 quote handling">
              <CodeBlock>{`// Handles: quoted cells, "" escaped quotes, commas inside quotes
"Smith, Jr., John"    → Smith, Jr., John
"Jane ""JJ"" Doe"    → Jane "JJ" Doe`}</CodeBlock>
            </Expand>

            <SubTitle>Known silent failure modes</SubTitle>
            {[
              { title: "Missing name column → silent column 0 fallback", body: "A CSV with id,email,full_name headers produces certificates with row IDs as names. No warning in the UI." },
              { title: "No header row — first data row included", body: "When hasHeader is false, the loop starts from rows[0]. A header-like row (Name,Email) with non-standard casing becomes a certificate name." },
              { title: "Duplicate names allowed", body: "Identical names produce identical certificates. safeFilename() collision means the second PNG silently overwrites the first in the ZIP." },
              { title: "Non-UTF-8 encoding", body: "BOM is stripped but no charset detection is done. Latin-1 or Windows-1252 files produce mojibake characters on every certificate with no error." },
              { title: "Silent failure propagates to UI", body: "handleCsv returns early (if (!parsed.length) return) with no toast or error state. Users who upload a JSON or XLSX see nothing happen." },
              { title: "Unmatched quotes", body: "splitCsvLine stays in quoted mode for the rest of the line if a quote is never closed, swallowing commas and producing one giant cell." },
            ].map(g => (
              <Expand key={g.title} title={<span className="docs-gotcha-title">⚠ {g.title}</span>}>
                <p>{g.body}</p>
              </Expand>
            ))}

            <SubTitle>Minimal valid CSV</SubTitle>
            <CodeBlock label="Recommended format">{`name,email
Alice Johnson,alice@example.com
Bob Chen,bob@example.com`}</CodeBlock>
          </section>

          {/* ══════════ EXPORT ══════════ */}
          <section data-section="export" id="export" className="docs-section">
            <SectionTitle id="export-heading">Export Pipeline</SectionTitle>
            <p className="docs-lead">
              The export pipeline renders every attendee&apos;s certificate to a PNG using the Canvas API, packages them in a ZIP via JSZip, and triggers a browser download — entirely client-side.
            </p>

            <Note>
              <strong>Privacy by design, not by accident.</strong> No file, image, attendee name, or generated certificate is ever sent to a server. The absence of any <Code>/api/</Code> route is intentional — certificate data must stay on the user&apos;s device. Template images are blob: URLs, attendee names live only in React state, canvas rendering uses an off-screen detached element, JSZip&apos;s generateAsync runs in-browser, and the final download is a simulated anchor click directly to disk.
            </Note>

            <SubTitle>Key files</SubTitle>
            <Table
              headers={["File", "Lines", "Description"]}
              rows={[
                [<FilePath key="f">app/studio/page.tsx</FilePath>, "153–176", <span key="s"><FuncName>exportZip()</FuncName> — orchestrates the full export flow</span>],
                [<FilePath key="f">app/lib/certificate.ts</FilePath>, "166–229", <span key="s"><FuncName>makeCertificate()</FuncName> — renders one certificate to a canvas</span>],
                [<FilePath key="f">app/lib/certificate.ts</FilePath>, "157–164", <span key="s"><FuncName>downloadBlob()</FuncName> — triggers a browser file download</span>],
                [<FilePath key="f">app/lib/certificate.ts</FilePath>, "88–115", <span key="s"><FuncName>fitNameInBox()</FuncName> — binary-search text fitting used during render</span>],
                [<FilePath key="f">package.json</FilePath>, "line 17", "jszip@3.10.1 dependency"],
              ]}
            />

            <SubTitle>Export flow</SubTitle>
            <Expand title="Step 1–2: Font pre-load and ZIP initialisation" defaultOpen>
              <CodeBlock>{`await ensureCertificateFont(font, size);  // must complete first
const zip = new JSZip();`}</CodeBlock>
            </Expand>
            <Expand title="Step 3: Rendering loop (progress 0→70%)" defaultOpen>
              <CodeBlock>{`for (let index = 0; index < attendees.length; index++) {
  const canvas = makeCertificate(templateImage, attendees[index].name, options);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((v) => v ? resolve(v) : reject(new Error("toBlob failed")), "image/png")
  );
  zip.file(\`\${safeFilename(attendees[index].name)}.png\`, blob);
  setProgress(Math.round(((index + 1) / attendees.length) * 70));
  await new Promise((r) => setTimeout(r, 0)); // yield to browser
}`}</CodeBlock>
            </Expand>
            <Expand title="Step 4–5: ZIP compression + download (progress 70→100%)">
              <CodeBlock>{`const zipBlob = await zip.generateAsync(
  { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
  (meta) => setProgress(70 + Math.round(meta.percent * 0.3))
);
downloadBlob(zipBlob, \`certiq-certificates-\${attendees.length}.zip\`);`}</CodeBlock>
            </Expand>

            <SubTitle>Risks &amp; memory considerations</SubTitle>
            {[
              { title: "Large exports exhaust browser memory", body: "All certificate blobs are held in the JSZip instance simultaneously before generateAsync is called. For 200+ high-resolution certificates, this can trigger an out-of-memory tab crash. No chunking is implemented." },
              { title: "Canvas toBlob() fails silently on tainted canvases", body: "Cross-origin template images without CORS headers taint the canvas; toBlob() throws a SecurityError. The try/finally swallows this; users see the button re-enable with no feedback and no ZIP." },
              { title: "Font loading covers the whole batch but not each canvas context", body: "ensureCertificateFont() is called once before the loop. If a font is evicted from cache mid-export, later certificates may render with a fallback font." },
              { title: "Progress stalls visually at ~70%", body: "The generateAsync compression phase runs synchronously in bursts. For large batches the browser may feel frozen while progress jumps from 70% to 100%." },
            ].map(g => (
              <Expand key={g.title} title={<span className="docs-gotcha-title">⚠ {g.title}</span>}>
                <p>{g.body}</p>
              </Expand>
            ))}
          </section>

          {/* ══════════ ROUTING ══════════ */}
          <section data-section="routing" id="routing" className="docs-section">
            <SectionTitle id="routing-heading">Routing &amp; Page Structure</SectionTitle>
            <p className="docs-lead">
              Certiq is a two-page Next.js App Router application. <Code>/</Code> is a static marketing landing page (server component). <Code>/studio</Code> is the interactive editor (client component). A single root layout wraps both.
            </p>

            <SubTitle>Route map</SubTitle>
            <Table
              headers={["Route", "File", "Type", "Notes"]}
              rows={[
                [<Code key="c">/</Code>, <FilePath key="f">app/page.tsx</FilePath>, "Server component", "Static; rendered at build time"],
                [<Code key="c">/studio</Code>, <FilePath key="f">app/studio/page.tsx</FilePath>, "Client component", '"use client"; all editor logic lives here'],
                ["(all)", <FilePath key="f">app/layout.tsx</FilePath>, "Root layout", "HTML shell, metadata, globals.css import"],
              ]}
            />

            <Expand title="Root layout — app/layout.tsx" defaultOpen>
              <p>Renders once for the entire app. Sets <Code>metadataBase</Code> from <Code>NEXT_PUBLIC_SITE_URL</Code> (defaults to <Code>https://certiq.vercel.app</Code>). Imports <FilePath>app/globals.css</FilePath>.</p>
              <Warning>Missing <Code>NEXT_PUBLIC_SITE_URL</Code> locally causes incorrect OG image URLs. Add it to <FilePath>.env.local</FilePath>: <Code>NEXT_PUBLIC_SITE_URL=http://localhost:3000</Code></Warning>
            </Expand>

            <Expand title="Adding a new route">
              <CodeBlock label="app/about/page.tsx">{`// Inherits root layout automatically
export default function AboutPage() {
  return <main><h1>About Certiq</h1></main>;
}

// To give /studio its own title:
// add to app/studio/page.tsx (outside the component):
export const metadata = {
  title: "Certiq — Studio",
  description: "Design and export personalised certificates.",
};`}</CodeBlock>
            </Expand>

            <SubTitle>Routing constraints</SubTitle>
            {[
              { title: "No route protection on /studio", body: "Anyone with the URL can access the editor. If authentication is added, a middleware.ts file or layout-level redirect will be needed." },
              { title: "Single global CSS file", body: "All styles for both pages live in globals.css. New routes inherit all existing custom properties and risk class-name collisions." },
              { title: "Metadata is the same for every route", body: "The <title> and OG image set in app/layout.tsx apply to all routes that don't override it with their own metadata export." },
              { title: "Studio state is not persisted", body: "Navigating away from /studio resets all work. No localStorage, URL serialisation, or draft API exists." },
            ].map(g => (
              <Expand key={g.title} title={<span className="docs-gotcha-title">⚠ {g.title}</span>}>
                <p>{g.body}</p>
              </Expand>
            ))}
          </section>

          {/* ══════════ TOOLING ══════════ */}
          <section data-section="tooling" id="tooling" className="docs-section">
            <SectionTitle id="tooling-heading">Build &amp; Test Tooling</SectionTitle>

            <SubTitle>npm scripts</SubTitle>
            <Table
              headers={["Script", "Command", "Description"]}
              rows={[
                [<Code key="c">dev</Code>, "next dev", "Start local dev server on http://localhost:3000"],
                [<Code key="c">build</Code>, "next build", "Compile and optimise for production; output in .next/"],
                [<Code key="c">start</Code>, "next start", "Serve production build locally (requires build first)"],
                [<Code key="c">lint</Code>, "eslint .", "Run ESLint against the entire codebase"],
                [<Code key="c">test</Code>, "npm run build && node --test tests/*.test.mjs", "Build then run 4 smoke tests"],
              ]}
            />

            <SubTitle>Smoke tests — tests/rendered-html.test.mjs</SubTitle>
            <p>Uses Node.js built-in <Code>node:test</Code> (no Jest, no Vitest). Four source-level assertions:</p>
            <Table
              headers={["#", "What is checked"]}
              rows={[
                ["1", "package.json has name==='certiq', scripts.build==='next build', scripts.dev==='next dev'"],
                ["2", "app/page.tsx contains SiteHeader and 'Start creating'; app/studio/page.tsx contains '\"use client\"' and 'makeCertificate'"],
                ["3", "public/certiq-logo.png, public/sample-template.png, public/og.png all exist"],
                ["4", "app/lib/certificate.ts exports parseCsv and contains the string '\"name\", \"full name\", \"fullname\", \"attendee\"'"],
              ]}
            />
            <Warning><strong>Limitation:</strong> These are string-presence checks via <Code>fs.readFileSync</Code>. Renaming a function breaks CI even if the app works. Conversely, they will not catch runtime regressions.</Warning>

            <SubTitle>ESLint configuration</SubTitle>
            <p>ESLint 9 flat config (<FilePath>eslint.config.mjs</FilePath>). Plugins: <Code>@eslint/js</Code>, <Code>typescript-eslint</Code>, <Code>eslint-plugin-react</Code>, <Code>jsx-a11y</Code>, <Code>react-hooks</Code>, <Code>@next/eslint-plugin-next</Code>. Ignores: <Code>.next/</Code>, <Code>dist/</Code>, <Code>out/</Code>, <Code>build/</Code>.</p>

            <SubTitle>Deployment (Vercel)</SubTitle>
            <p>No <FilePath>vercel.json</FilePath> exists. Vercel auto-detects Next.js and runs <Code>npm install</Code> + <Code>npm run build</Code>. Push to the linked GitHub repo; Vercel deploys on every push.</p>
            <Warning>Vercel may default to an older Node.js LTS. Set the Node version in Vercel project settings to match the <Code>engines</Code> field (<Code>&gt;=20.9.0</Code>).</Warning>

            <SubTitle>Tooling gotchas</SubTitle>
            {[
              { title: "npm test always triggers a full build", body: "Running tests is expensive (~30–60s) because next build precedes the test runner. No watch mode and no way to run tests against the dev server." },
              { title: "ESLint flat config requires plugin support", body: "Legacy plugins that only export { rules: ... } objects will crash the config loader. Verify flat-config compatibility before adding any plugin." },
              { title: "Tailwind CSS v4 is a major version upgrade", body: "Syntax differences from v3 apply. Avoid copy-pasting v3 Tailwind snippets without checking v4 compatibility." },
            ].map(g => (
              <Expand key={g.title} title={<span className="docs-gotcha-title">⚠ {g.title}</span>}>
                <p>{g.body}</p>
              </Expand>
            ))}

            <SubTitle>Dev environment quick-start</SubTitle>
            <CodeBlock>{`git clone https://github.com/randreitomas/certiq.git
cd certiq
node --version            # >= 20.9.0 required
npm install
echo "NEXT_PUBLIC_SITE_URL=http://localhost:3000" > .env.local
npm run dev               # http://localhost:3000
npm run lint              # should pass clean
npm test                  # full build + 4 smoke tests`}</CodeBlock>
          </section>

          {/* ══════════ RISK MAP ══════════ */}
          <section data-section="risk-map" id="risk-map" className="docs-section">
            <SectionTitle id="risk-map-heading">Risk Map</SectionTitle>
            <p className="docs-lead">
              Ranked by <strong>blast radius</strong> — the number of application features that break or misbehave if the area is changed incorrectly. Rank 1 is the highest risk.
            </p>
            <div className="docs-risk-legend">
              <span className="docs-risk-badge docs-risk-badge--critical">Critical (#1–2)</span>
              <span className="docs-risk-badge docs-risk-badge--high">High (#3–4)</span>
              <span className="docs-risk-badge docs-risk-badge--medium">Medium (#5–6)</span>
              <span className="docs-risk-badge docs-risk-badge--low">Lower (#7–10)</span>
            </div>

            <div className="docs-risk-list">
              {RISKS.map(risk => (
                <div key={risk.rank} className="docs-risk-card">
                  <div className="docs-risk-card-header">
                    <RiskBadge rank={risk.rank} />
                    <span className="docs-risk-area"><FilePath>{risk.area}</FilePath></span>
                  </div>
                  <p className="docs-risk-why">{risk.why}</p>
                  <Expand title="Dependencies">
                    <ul className="docs-risk-ul">
                      {risk.deps.map(d => <li key={d}>{d}</li>)}
                    </ul>
                  </Expand>
                  <Expand title="What could break">
                    <ul className="docs-risk-ul docs-risk-ul--break">
                      {risk.breaks.map(b => <li key={b}>{b}</li>)}
                    </ul>
                  </Expand>
                  <div className="docs-risk-sources">
                    {risk.sources.map(s => <span key={s} className="docs-chip docs-chip--muted">{s}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ══════════ SAFE STARTING POINTS ══════════ */}
          <section data-section="safe-starts" id="safe-starts" className="docs-section">
            <SectionTitle id="safe-starts-heading">Safe Starting Points</SectionTitle>
            <p className="docs-lead">
              These areas are relatively isolated and low-risk for a new developer to explore or modify. None of them touch the shared kernel (<FilePath>app/lib/certificate.ts</FilePath>) or the studio state block.
            </p>
            <div className="docs-safe-list">
              {SAFE_AREAS.map(s => (
                <div key={s.area} className="docs-safe-card">
                  <div className="docs-safe-icon">✓</div>
                  <div>
                    <div className="docs-safe-area"><FilePath>{s.area}</FilePath></div>
                    <p className="docs-safe-reason">{s.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
