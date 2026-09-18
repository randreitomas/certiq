import type { ReactNode } from "react";

type LandingCtaProps = {
  title: ReactNode;
  body: ReactNode;
  button: string;
  href?: string;
};

export function LandingCta({ title, body, button, href = "/studio" }: LandingCtaProps) {
  return (
    <section className="cta-band">
      <div className="cta-band-inner">
        <h2>{title}</h2>
        <p>{body}</p>
        <a className="cta-button" href={href}>{button}</a>
      </div>
    </section>
  );
}
