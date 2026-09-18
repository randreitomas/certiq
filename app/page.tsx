import { HeroCertificate } from "./components/hero-certificate";
import { SiteFooter } from "./components/site-footer";

export default function Home() {
  return (
    <main className="landing-shell">
      <HeroCertificate />
      <SiteFooter />
    </main>
  );
}
