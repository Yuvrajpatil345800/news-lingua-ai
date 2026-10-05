import { synthesizeAzureSpeech } from "../services/azureTtsService.js";

export const speakText = async (req, res) => {
  try {
    const { text, language = "en" } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Text is required.",
      });
    }

    const audio = await synthesizeAzureSpeech(text, language);

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audio.length,
      "Cache-Control": "no-store",
    });

    return res.send(audio);
  } catch (error) {
    console.error("Speech error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to generate speech.",
    });
  }
};