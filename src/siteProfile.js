import { depologySeedProfile } from "./seedProfile.js";

const DEFAULT_PATHS = ["/", "/pages/about-depology", "/collections/all"];

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreKeywordHits(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.filter((keyword) => lower.includes(keyword.toLowerCase()));
}

async function fetchPageText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "depology-ad-agent/0.1"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const html = await response.text();
  return {
    url,
    html,
    text: stripHtml(html)
  };
}

function deriveSignals(pages) {
  const combinedText = pages.map((page) => page.text).join(" ");

  return {
    ingredientHits: scoreKeywordHits(combinedText, [
      "matrixyl",
      "argireline",
      "collagen",
      "peptide",
      "wrinkle",
      "under eye",
      "anti-aging",
      "lifting",
      "firming"
    ]),
    benefitHits: scoreKeywordHits(combinedText, [
      "fine lines",
      "wrinkles",
      "depuff",
      "brighten",
      "firm",
      "smooth",
      "hydrate",
      "lift"
    ]),
    trustHits: scoreKeywordHits(combinedText, [
      "science",
      "clinical",
      "dermatologist",
      "award",
      "review",
      "results"
    ])
  };
}

function mergeSeedWithSignals(seed, signals) {
  const extraAngles = [];

  if (signals.benefitHits.includes("brighten")) {
    extraAngles.push("Brighter, refreshed under-eye look");
  }

  if (signals.benefitHits.includes("firm")) {
    extraAngles.push("Firming-focused anti-aging visual story");
  }

  if (signals.ingredientHits.includes("collagen")) {
    extraAngles.push("Collagen-supporting skincare narrative");
  }

  return {
    ...seed,
    inferredSignals: signals,
    copyAngles: [...new Set([...seed.copyAngles, ...extraAngles])]
  };
}

export async function buildBrandProfile(siteUrl) {
  const base = new URL(siteUrl);
  const pages = [];

  for (const pathname of DEFAULT_PATHS) {
    const pageUrl = new URL(pathname, base).toString();
    try {
      pages.push(await fetchPageText(pageUrl));
    } catch (error) {
      pages.push({
        url: pageUrl,
        html: "",
        text: "",
        error: error.message
      });
    }
  }

  const signals = deriveSignals(pages);

  return {
    profile: mergeSeedWithSignals(depologySeedProfile, signals),
    pages
  };
}
