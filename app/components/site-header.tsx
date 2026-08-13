/* eslint-disable @next/next/no-img-element -- static brand logo from /public */
import Link from "next/link";

type SiteHeaderProps = {
  howItWorksHref?: string;
};

export function SiteHeader({ howItWorksHref = "#how-it-works" }: SiteHeaderProps) {
  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="Certiq home">
        <img className="brand-logo" src="/certiq-logo.png" alt="" width={32} height={32} />
        <span className="brand-name">Certiq</span>
      </Link>
      <Link className="help-link" href={howItWorksHref}>How it works</Link>
    </header>
  );
}
