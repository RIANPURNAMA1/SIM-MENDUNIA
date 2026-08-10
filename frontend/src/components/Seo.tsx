import { useEffect } from "react";

export const SITE_NAME = "Mendunia";
export const SITE_URL = "https://sim.mendunia.id";
export const DEFAULT_TITLE = "Mendunia — LPK Pelatihan & Penempatan Kerja Jepang dan Korea Selatan";

const DEFAULT_DESC =
  "Mendunia.id — Lembaga Pelatihan Kerja (LPK) terpercaya untuk program kerja ke Jepang dan Korea Selatan. Pelatihan bahasa & budaya (JFT A2 Basic, EPS-TOPIK), pendampingan sampai berangkat kerja.";

const DEFAULT_KEYWORDS =
  "Mendunia, Mendunia.id, LPK Mendunia, LPK Jepang Korea, pelatihan bahasa Jepang, program kerja Jepang Korea, EPS-TOPIK, JFT A2, penempatan kerja luar negeri";

export const DEFAULT_IMG = `${SITE_URL}/logo1.png`;

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

function clearJsonLd() {
  const el = document.getElementById("seo-jsonld");
  if (el) el.remove();
}

export default function Seo({
  title,
  description = DEFAULT_DESC,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  image = DEFAULT_IMG,
  type = "website",
  jsonLd,
}: SeoProps) {
  useEffect(() => {
    const pageTitle = title ? `${title} | Mendunia` : DEFAULT_TITLE;
    document.title = pageTitle;

    setMeta("name", "description", description);
    setMeta("name", "keywords", keywords);
    if (canonical) {
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonical);
    }

    setMeta("property", "og:title", pageTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", type);
    setMeta("property", "og:url", canonical || `${SITE_URL}/landing`);
    setMeta("property", "og:image", image);
    setMeta("property", "og:image:alt", "Mendunia — LPK Pelatihan dan Penempatan Kerja Jepang dan Korea Selatan");
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("property", "og:locale", "id_ID");
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", pageTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);
    setMeta("name", "twitter:image:alt", "Mendunia — LPK Pelatihan dan Penempatan Kerja Jepang dan Korea Selatan");

    document.documentElement.lang = "id";

    if (jsonLd) {
      setJsonLd(jsonLd);
    } else {
      clearJsonLd();
    }
  }, [title, description, keywords, canonical, image, type, jsonLd]);

  return null;
}