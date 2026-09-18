import { HeroCertificate } from "./components/hero-certificate";
import { SiteFooter } from "./components/site-footer";

export default function Home() {
  return (
    <main className="landing-shell">
      <div className="mobile-gate" role="dialog" aria-modal="true" aria-labelledby="mobile-gate-title">
        <div className="mobile-gate-card">
          <h2 id="mobile-gate-title">Works best on a desktop or laptop</h2>
          <p>The studio is built for a larger screen. You can still continue on this device.</p>
          <a className="mobile-gate-cta" href="/studio">Continue to studio</a>
        </div>
      </div>
      <HeroCertificate />
      <SiteFooter />
    </main>
  );
}
