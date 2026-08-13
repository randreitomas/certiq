import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("package is configured for Certiq on Next.js", async () => {
  const pkg = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
  assert.equal(pkg.name, "certiq");
  assert.equal(pkg.scripts.build, "next build");
  assert.equal(pkg.scripts.dev, "next dev");
});

test("landing and studio routes exist", async () => {
  const [page, studio, layout] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/studio/page.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
  ]);

  assert.match(page, /SiteHeader/);
  assert.match(page, /Start creating/);
  assert.match(studio, /"use client"/);
  assert.match(studio, /makeCertificate/);
  assert.match(layout, /Certiq — Certificates in minutes/);
});

test("required public assets exist", async () => {
  await Promise.all([
    access(new URL("public/certiq-logo.png", root)),
    access(new URL("public/sample-template.png", root)),
    access(new URL("public/og.png", root)),
  ]);
});

test("certificate helpers parse CSV names", async () => {
  const source = await readFile(new URL("app/lib/certificate.ts", root), "utf8");
  assert.match(source, /export function parseCsv/);
  assert.match(source, /"name", "full name", "fullname", "attendee"/);
});
