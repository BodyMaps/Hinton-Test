import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const prefix = "/Hinton-Test";
const routes = ["", "about", "dataset", "explorer", "models", "submit", "tasks"];

test("exports every public benchmark route for GitHub Pages", async () => {
  for (const route of routes) {
    const path = route ? `../out/${route}/index.html` : "../out/index.html";
    const html = await readFile(new URL(path, import.meta.url), "utf8");
    assert.match(html, /RADWORLD/);
    assert.match(html, new RegExp(`${prefix}/_next/`));
    assert.doesNotMatch(html, /(?:src|href)="\/(?:images|data|_next)\//);
  }
});

test("exports portable data and image assets", async () => {
  await Promise.all([
    access(new URL("../out/data/benchmark.json", import.meta.url)),
    access(new URL("../out/images/trajectory/prior_scroll.webp", import.meta.url)),
    access(new URL("../out/images/examples/assess_phase_arterial_scroll.webp", import.meta.url)),
    access(new URL("../out/images/logos/openai.png", import.meta.url)),
  ]);

  const home = await readFile(new URL("../out/index.html", import.meta.url), "utf8");
  assert.match(home, /https:\/\/mrgiovanni\.github\.io\/Hinton-Test\/og\.png/);
});

test("publishes verified GPT-5.5 and Hulu Advise image results", async () => {
  const payload = JSON.parse(
    await readFile(new URL("../out/data/benchmark.json", import.meta.url), "utf8"),
  );
  const advise = new Map(payload.advise.map((row) => [row.model, row]));

  assert.equal(advise.get("GPT-5.5")?.n, 80);
  assert.equal(advise.get("GPT-5.5")?.followUp, 17);
  assert.equal(advise.get("GPT-5.5")?.intentAgreement, 0.2);
  assert.equal(advise.get("Hulu-Med-32B")?.n, 80);
  assert.equal(advise.get("Hulu-Med-32B")?.followUp, 60);
  assert.equal(advise.get("Hulu-Med-32B")?.intentAgreement, 0.7375);
});
