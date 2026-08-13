import { LandingCta } from "./components/landing-cta";
import { LandingPreview } from "./components/landing-preview";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";

const STEPS = [
  {
    num: "01",
    title: "Upload your design",
    body: "Add a PNG or JPG template—the background your names will appear on.",
  },
  {
    num: "02",
    title: "Import your list",
    body: "Drop a CSV with a name column. Each row becomes one certificate.",
  },
  {
    num: "03",
    title: "Export the batch",
    body: "Position the name, preview each attendee, download a ZIP of everything.",
  },
];

export default function Home() {
  return (
    <main className="landing-shell">
      <SiteHeader />

      <section className="hero" id="top">
        <h1>
          One template. <span className="hero-accent">Every name, placed.</span>
        </h1>
        <p>
          Turn a certificate design and attendee list into a polished, ready-to-send collection—entirely in your browser, no uploads to a server.
        </p>
        <a className="hero-cta" href="/studio">Start creating →</a>
      </section>

      <LandingPreview />

      <section className="landing-how-it-works" id="how-it-works">
        <h2 className="landing-section-title">How it works</h2>
        <div className="landing-steps-grid">
          {STEPS.map((step) => (
            <article key={step.num} className="landing-step-card">
              <span className="landing-step-number">{step.num}</span>
              <h3 className="landing-step-title">{step.title}</h3>
              <p className="landing-step-body">{step.body}</p>
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
