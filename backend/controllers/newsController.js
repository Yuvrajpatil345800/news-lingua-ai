import { summarizeNewsAI } from "../services/aiService.js";
import { extractArticleFromUrl } from "../services/articleService.js";
import { summaryService } from "../services/summaryService.js";
import { synthesizeAzureSpeech } from "../services/azureTtsService.js";

const GUEST_SUMMARY_LIMIT = 3;
const guestUsageByIp = new Map();

export const textToSpeech = async (req, res) => {
  try {
    const { text, language } = req.body;
    if (!text?.trim())
      return res.status(400).json({ success: false, message: "Text is required for speech." });
    const audio = await synthesizeAzureSpeech(text.trim(), language);
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audio.length,
      "Cache-Control": "no-store",
    });
    return res.send(audio);
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error.message || "Failed to generate speech." });
  }
};

/**
 * POST /api/news/summarize
 * Generate AI Summary for text or URL article
 */
export const summarizeNews = async (req, res) => {
  try {
    const { text, url, language = "en" } = req.body;

    if ((!text || !text.trim()) && (!url || !url.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide either article text or a valid news article URL.",
      });
    }

    const user = req.user || null;
    const guestKey = req.ip || "unknown";
    const guestUsage = guestUsageByIp.get(guestKey) || 0;

    if (!user && guestUsage >= GUEST_SUMMARY_LIMIT) {
      return res.status(401).json({
        success: false,
        message: "Your 3 free summaries have been used. Please sign in with Google to continue.",
      });
    }

    let articleContent = "";
    let articleTitle = "";
    let articleUrl = null;

    if (url && url.trim()) {
      articleUrl = url.trim();

      // Handle deep-links or query params redirect
      try {
        const parsedUrl = new URL(articleUrl);
        const targetUrl = parsedUrl.searchParams.get("targetUrl");
        if (parsedUrl.pathname.includes("/deeplink") && targetUrl) {
          articleUrl = targetUrl;
        }
      } catch {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid HTTP or HTTPS news article URL.",
        });
      }

      console.log(`🌐 Extracting news article from URL: ${articleUrl}`);
      const extracted = await extractArticleFromUrl(articleUrl);
      articleContent = `${extracted.title}\n\n${extracted.description}\n\n${extracted.content}`;
      articleTitle = extracted.title;
    } else {
      articleContent = text.trim();
    }

    console.log(`🧠 AI Processing news summary (Target Language: ${language})...`);
    const aiResult = await summarizeNewsAI(articleContent, language);

    const finalTitle = aiResult.title || articleTitle || "News Article Summary";

    // Only authenticated users get persistent history, scoped to their MongoDB user id.
    const savedRecord = user ? await summaryService.saveSummary({
      userId: user.id,
      userEmail: user.email,
      title: finalTitle,
      url: articleUrl,
      originalText: articleContent,
      summary: aiResult.summary,
      keyPoints: aiResult.keyPoints,
      sentiment: aiResult.sentiment,
      category: aiResult.category,
      language: language,
    }) : null;

    if (!user) {
      guestUsageByIp.set(guestKey, guestUsage + 1);
    }

    return res.json({
      success: true,
      data: {
        id: savedRecord?.id || null,
        title: finalTitle,
        summary: aiResult.summary,
        keyPoints: aiResult.keyPoints,
        sentiment: aiResult.sentiment,
        category: aiResult.category,
        url: articleUrl,
        language: language,
        createdAt: savedRecord?.created_at || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Summarization Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate news summary.",
    });
  }
};

/**
 * GET /api/news/history
 * Fetch a user's saved summary history from MongoDB
 */
export const getHistory = async (req, res) => {
  try {
    const user = req.user;
    const history = await summaryService.getUserHistory(user?.id);
    return res.json({
      success: true,
      history,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch summary history. " + error.message,
    });
  }
};

/**
 * DELETE /api/news/history/:id
 * Delete a specific summary history record
 */
export const deleteHistoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const deleted = await summaryService.deleteHistory(id, user?.id);
    return res.json({
      success: true,
      deleted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete history item. " + error.message,
    });
  }
};
