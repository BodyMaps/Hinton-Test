import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  metadataBase: new URL("https://mrgiovanni.github.io"),
  title: "Hinton-Test | World Model of the Patient",
  description:
    "Explore how 23 AI models Assess, Read, Compare, Predict, Conclude, and Advise from longitudinal CT.",
  icons: { icon: `${BASE_PATH}/favicon.svg`, shortcut: `${BASE_PATH}/favicon.svg` },
  openGraph: {
    title: "Hinton-Test | World Model of the Patient",
    description: "Can a model keep one patient in mind? Explore six connected radiology tasks across 23 models.",
    images: [{ url: `${BASE_PATH}/og.png`, width: 1744, height: 915, alt: "Hinton-Test, a benchmark of the world model of the patient" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hinton-Test | World Model of the Patient",
    description: "Can a model keep one patient in mind?",
    images: [`${BASE_PATH}/og.png`],
  },
};

const links = [
  ["Dataset", "/dataset"],
  ["Models", "/models"],
  ["Tasks", "/tasks"],
  ["Finding explorer", "/explorer"],
  ["Submit", "/submit"],
  ["Resources", "/about"],
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link className="wordmark" href="/" aria-label="Hinton-Test home">
            <span className="mark">H</span>
            <span>Hinton-Test</span>
          </Link>
          <nav aria-label="Main navigation">
            {links.map(([label, href]) => (
              <Link key={href} href={href}>{label}</Link>
            ))}
          </nav>
          <Link className="header-cta" href="/submit">Submit your model</Link>
        </header>
        {children}
        <footer>
          <div><span className="mark small">H</span><strong>Hinton-Test</strong></div>
          <p>Six connected tasks. One patient state.</p>
          <div className="footer-links">
            <Link href="/about#methods">Methods</Link>
            <Link href="/about#downloads">Data & code</Link>
            <Link href="/submit">Submit a model</Link>
            <a href="https://github.com/BodyMaps/Hinton-Test">GitHub</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
