import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Extract news article title, description, and main body text from any URL
 */
export const extractArticleFromUrl = async (url) => {
  let cleanUrl = url.trim();

  // Support Hindustan Times deep-links or query params redirect
  try {
    const parsedUrl = new URL(cleanUrl);
    const targetUrl = parsedUrl.searchParams.get("targetUrl");
    if (parsedUrl.pathname.includes("/deeplink") && targetUrl) {
      cleanUrl = targetUrl;
    }
  } catch {}

  let htmlData = "";

  // 1. Try Axios with full browser User-Agent
  try {
    const response = await axios.get(cleanUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      timeout: 12000,
      maxRedirects: 5,
    });
    htmlData = response.data;
  } catch (axiosErr) {
    console.warn(`Axios GET failed for ${cleanUrl}: ${axiosErr.message}. Trying fetch fallback...`);
    try {
      const fetchRes = await fetch(cleanUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
        },
      });
      if (!fetchRes.ok) {
        throw new Error(`The article source returned ${fetchRes.status} ${fetchRes.statusText}`);
      }
      htmlData = await fetchRes.text();
    } catch (fetchErr) {
      console.warn(`Fetch fallback failed for ${cleanUrl}: ${fetchErr.message}`);
    }
  }

  if (/page not found|error\s*404|target url returned error/i.test(htmlData)) {
    throw new Error(
      "This article URL returned a 404 or blocked page. Please open the article and paste its text instead.",
    );
  }

  // Parse HTML if retrieved
  let title = "";
  let description = "";
  let extractedContent = "";

  if (htmlData && typeof htmlData === "string") {
    const $ = cheerio.load(htmlData);

    // Extract title & description metadata FIRST
    title =
      $("meta[property='og:title']").attr("content") ||
      $("meta[name='twitter:title']").attr("content") ||
      $("h1").first().text().trim() ||
      $("title").text().trim();

    description =
      $("meta[property='og:description']").attr("content") ||
      $("meta[name='description']").attr("content") ||
      $("meta[name='twitter:description']").attr("content") ||
      "";

    // Extract JSON-LD schema articleBody BEFORE removing script tags
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || "{}");
        const items = Array.isArray(json) ? json : [json];
        for (const item of items) {
          const body = item?.articleBody || item?.description || item?.headline;
          if (body && body.length > extractedContent.length) {
            extractedContent = body;
          }
        }
      } catch {}
    });

    // Remove boilerplate non-content tags AFTER extracting JSON-LD
    $("script, style, noscript, iframe, nav, footer, header, aside, svg, form").remove();

    // Try standard article containers
    if (!extractedContent || extractedContent.length < 150) {
      const articleSelectors = [
        "article",
        "[itemprop='articleBody']",
        ".article-body",
        ".article-content",
        ".articleBody",
        ".story-content",
        ".story-body",
        ".storyContent",
        ".content-body",
        ".main-content",
        "main",
      ];

      for (const selector of articleSelectors) {
        const text = $(selector).text().replace(/\s+/g, " ").trim();
        if (text.length > extractedContent.length) {
          extractedContent = text;
        }
      }
    }

    // Paragraph fallback
    if (!extractedContent || extractedContent.length < 150) {
      const pTexts = $("p")
        .map((_, el) => $(el).text())
        .get()
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (pTexts.length > extractedContent.length) {
        extractedContent = pTexts;
      }
    }
  }

  // Fallback to URL Slug Parsing if site blocked scraping or title missing
  if (!title || title === "MSN" || title.length < 5) {
    try {
      const u = new URL(cleanUrl);
      const pathname = u.pathname.replace(/\/$/, "");
      const segments = pathname.split("/").filter(Boolean);
      // Find longest descriptive segment in URL path
      const slugSegment = segments.reverse().find(s => s.length > 10 && !/^(ar-|hp-|news|index)/i.test(s)) || segments[0] || "";
      const parsedSlug = slugSegment
        .replace(/[-_]/g, " ")
        .replace(/\.(html|php|aspx|story)$/i, "")
        .replace(/\b(ar|id|ref|cvid|ocid)=\w+/gi, "")
        .trim();

      if (parsedSlug.length > 5) {
        title = parsedSlug.charAt(0).toUpperCase() + parsedSlug.slice(1);
      }
    } catch {
      title = title || "News Article";
    }
  }

  // Combine title, description, and extracted content for AI summarizer
  let finalContent = "";
  if (extractedContent.length > 120) {
    finalContent = `${title}\n\n${description}\n\n${extractedContent}`;
  } else if (description.length > 50) {
    finalContent = `News Title: ${title}\nNews Overview: ${description}\nSource: ${cleanUrl}`;
  } else {
    finalContent = `News Headline / Topic: ${title}\nArticle Link: ${cleanUrl}`;
  }

  return {
    title: title || "News Article",
    description: description || "",
    content: finalContent,
    url: cleanUrl,
  };
};
