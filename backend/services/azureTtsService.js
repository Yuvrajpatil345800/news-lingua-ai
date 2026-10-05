import dotenv from "dotenv";

dotenv.config();

const voices = {
  en: "en-US-JennyNeural",
  hi: "hi-IN-SwaraNeural",
  mr: "mr-IN-AarohiNeural",
  gu: "gu-IN-DhwaniNeural",
  ta: "ta-IN-ValluvarNeural",
  te: "te-IN-ShrutiNeural",
  bn: "bn-IN-TanishaaNeural",
  kn: "kn-IN-SapnaNeural",
  ml: "ml-IN-SobhanaNeural",
  pa: "pa-IN-OjasNeural",
  ur: "ur-IN-GulNeural",
  es: "es-ES-ElviraNeural",
  fr: "fr-FR-DeniseNeural",
  de: "de-DE-KatjaNeural",
};

const locales = {
  en: "en-US",
  hi: "hi-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  ta: "ta-IN",
  te: "te-IN",
  bn: "bn-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  ur: "ur-IN",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
};
  const escapeXml = (value) =>
  value.replace(
    /[<>&'"]/g,
    (character) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      })[character],
  );
export const synthesizeAzureSpeech = async (text, language = "en") => {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region)
    throw new Error(
      "Azure Speech is not configured. Add AZURE_SPEECH_KEY and AZURE_SPEECH_REGION to backend/.env.",
    );
  const voice = voices[language] || voices.en;
  const locale = locales[language] || locales.en;
  const ssml = `<speak version="1.0" xml:lang="${locale}"><voice name="${voice}">${escapeXml(text.slice(0, 5000))}</voice></speak>`;
  const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      "User-Agent": "AI-News-Summarizer",
    },
    body: ssml,
  });
  if (!response.ok) throw new Error(`Azure Speech could not create audio (${response.status}).`);
  return Buffer.from(await response.arrayBuffer());
};
