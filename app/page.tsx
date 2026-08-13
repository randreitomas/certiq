import { LandingCta } from "./components/landing-cta";
import { LandingPreview } from "./components/landing-preview";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";

const STEPS = [
  {
    num: "01",
    title: "Upload your design",
    body: "Add a PNG or JPG certificate template—the background your names will appear on.",
  },
  {
    num: "02",
    title: "Add a CSV with a “name” column",
    body: "Import your attendee list. Each row becomes one personalized certificate.",
  },
  {
    num: "03",
    title: "Position, preview, and export",
    body: "Drag the name into place, preview each attendee, then download a ZIP of all certificates.",
  },
];

export default function Home() {
  return (
    <main className="app-shell landing-shell">
      <SiteHeader />

      <section className="hero" id="top">
        <h1>
          One template. <span className="hero-accent">Every name, perfectly placed.</span>
        </h1>
        <p>Turn a certificate design and attendee list into a polished, ready-to-send collection—in one private browser session.</p>
        <a className="hero-cta" href="/studio">Start creating →</a>
      </section>

      <LandingPreview />

      <section className="how-section" id="how-it-works">
        <h2>How it works</h2>
        <div className="how-grid">
          {STEPS.map((step) => (
            <article key={step.num} className="how-card">
              <span className="how-card-num">{step.num}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <LandingCta
        title={<>Your next certificate batch<br />starts here.</>}
        body="No account needed — upload your template and attendee list, then export a full batch in minutes."
        button="Start creating →"
      />

      <SiteFooter />
    </main>
  );
}
