import { useEffect } from "react";

export const SITE_NAME = "Mendunia";
export const SITE_URL = "https://sim.mendunia.id";
export const DEFAULT_TITLE = "Mendunia — Pelatihan & Penempatan Kerja Jepang & Korea Selatan";

const DEFAULT_DESC =
  "Lembaga pelatihan bahasa dan penempatan kerja ke Jepang dan Korea Selatan. Program persiapan JFT A2 Basic, EPS-TOPIK, dan pendampingan sampai berangkat kerja.";

type JsonLdValue = Record<string, unknown> | Record<string, unknown>[];

interface SeoProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  image?: string;
  type?: string;
  jsonLd?: JsonLdValue;
}

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setJsonLd(data: JsonLdValue) {
  let el = document.getElementById("seo-jsonld");
  if (!el) {
    el = document.createElement("script");
    el.id = "seo-jsonld";
    el.setAttribute("type", "application/ld+json");
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export default function Seo({
  title,
  description = DEFAULT_DESC,
  keywords,
  canonical,
  image,
  type = "website",
  jsonLd,
}: SeoProps) {
  useEffect(() => {
    const pageTitle = title ? `${title} | Mendunia` : DEFAULT_TITLE;
    document.title = pageTitle;

    setMeta("name", "description", description);
    if (keywords) setMeta("name", "keywords", keywords);
    if (canonical) {
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonical);
    }
    const ogImage = image || `${SITE_URL}/logo-sm.png`;

    setMeta("property", "og:title", pageTitle);
    setMeta("property", "og:description", description || DEFAULT_DESC);
    setMeta("property", "og:type", type);
    setMeta("property", "og:url", canonical || SITE_URL);
    setMeta("property", "og:image", ogImage);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", pageTitle);
    setMeta("name", "twitter:description", description || DEFAULT_DESC);
    setMeta("name", "twitter:image", ogImage);

    document.documentElement.lang = "id";

    if (jsonLd) setJsonLd(jsonLd);
  }, [title, description, keywords, canonical, image, type, jsonLd]);

  return null;
}