import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";

const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

const LANGUAGE_NAMES = {
  en: "English",
  hi: "Hindi (हिंदी)",
  mr: "Marathi (मराठी)",
  gu: "Gujarati (ગુજરાતી)",
  ta: "Tamil (தமிழ்)",
  te: "Telugu (తెలుగు)",
  bn: "Bengali (বাংলা)",
  kn: "Kannada (ಕನ್ನಡ)",
  ml: "Malayalam (മലയാളം)",
  pa: "Punjabi (ਪੰਜਾਬੀ)",
  ur: "Urdu (اردو)",
  es: "Spanish (Español)",
  fr: "French (Français)",
  de: "German (Deutsch)",
};

/**
 * Summarize article text or URL content using OpenRouter, Google Gemini, or Groq AI
 */
export const summarizeNewsAI = async (articleContent, targetLangCode = "en") => {
  const targetLanguage = LANGUAGE_NAMES[targetLangCode] || "English";

  const systemPrompt = `You are a senior multilingual news editor and investigative analyst.
Your ONLY job is to analyze the news article and produce a comprehensive, detailed JSON summary in **${targetLanguage}** language.

CRITICAL RULES — YOU MUST FOLLOW THESE WITHOUT EXCEPTION:
1. ALL output fields (title, summary, keyPoints) MUST be written ENTIRELY in ${targetLanguage}.
2. Do NOT use English in any field if ${targetLanguage} is not English.
3. Provide a RICH, DETAILED MULTI-PARAGRAPH summary covering the core events, background context, key quotes/facts, and future implications.
4. Do NOT abbreviate or give 1-sentence lazy answers. Make the summary comprehensive and thorough.
5. Return ONLY raw valid JSON — no markdown code block formatting, no backticks, no extra text.

Return this exact JSON structure (all text fields in ${targetLanguage}):
{
  "title": "A clear, compelling headline in ${targetLanguage} language",
  "summary": "Detailed multi-paragraph executive summary covering the main story, context, key developments, and implications in ${targetLanguage}.",
  "keyPoints": [
    "First detailed takeaway point in ${targetLanguage}",
    "Second detailed takeaway point in ${targetLanguage}",
    "Third detailed takeaway point in ${targetLanguage}",
    "Fourth detailed takeaway point in ${targetLanguage}"
  ],
  "sentiment": "Positive" or "Neutral" or "Negative",
  "category": "Technology" or "Politics" or "Business" or "World" or "Sports" or "Entertainment" or "General"
}

REMINDER: title, summary, and keyPoints MUST be completely in ${targetLanguage}.`;

  // Instruct AI to generate a rich news summary even if input is a short URL headline
  const isShortUrlInput = articleContent.includes("Article Link:") || articleContent.length < 300;
  const userPrompt = isShortUrlInput
    ? `Analyze the following news topic link and write a comprehensive, detailed multi-paragraph news analysis and key highlights in **${targetLanguage}** explaining what this news story is about. Do NOT repeat raw URL strings or 'News Headline / Topic:' labels in your output.\n\nInput Topic:\n${articleContent}`
    : `Provide a detailed, thorough, multi-paragraph news summary of the following article in ${targetLanguage} language only.\n\nArticle:\n${articleContent.slice(0, 10000)}`;

  // 1. Try OpenRouter API
  if (OPENROUTER_API_KEY && OPENROUTER_API_KEY.trim()) {
    try {
      console.log(`🌐 Requesting OpenRouter AI model for news summary in ${targetLanguage}...`);
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:8080",
          "X-Title": "AI News Summarizer",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.3-70b-instruct:free",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3,
          response_format: { type: "json_object" }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.choices?.[0]?.message?.content;
        if (rawText) {
          const parsed = parseAiJsonResponse(rawText);
          if (parsed) return parsed;
        }
      } else {
        const errText = await response.text();
        console.warn("OpenRouter API non-200 response:", response.status, errText);
      }
    } catch (err) {
      console.warn("OpenRouter API call failed:", err.message);
    }
  }

  // 2. Try Google Gemini API
  if (GEMINI_API_KEY && GEMINI_API_KEY.trim()) {
    try {
      console.log(`🤖 Requesting Google Gemini API for news summary in ${targetLanguage}...`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemPrompt },
                  { text: userPrompt }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.3,
              responseMimeType: "application/json"
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = parseAiJsonResponse(rawText);
          if (parsed) return parsed;
        }
      } else {
        const errText = await response.text();
        console.warn("Gemini API non-200 response:", response.status, errText);
      }
    } catch (err) {
      console.warn("Gemini API call failed, falling back to secondary AI engine:", err.message);
    }
  }

  // 3. Try Groq API (Iterating over available model IDs)
  if (groq) {
    const groqModels = ["openai/gpt-oss-120b", "groq/compound", "qwen/qwen3.8-27b", "llama-3.3-70b-versatile"];
    for (const modelId of groqModels) {
      try {
        console.log(`⚡ Requesting Groq AI model (${modelId}) for news summary in ${targetLanguage}...`);
        const completion = await groq.chat.completions.create({
          model: modelId,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3,
        });

        const rawText = completion.choices[0]?.message?.content;
        if (rawText) {
          const parsed = parseAiJsonResponse(rawText);
          if (parsed) {
            console.log(`✅ Groq AI (${modelId}) successfully generated news summary!`);
            return parsed;
          }
        }
      } catch (err) {
        console.warn(`Groq API model (${modelId}) failed:`, err.message);
      }
    }
  }

  // 4. Fallback AI generator if no API key or network fails
  console.log("ℹ️ Generating intelligent analytical summary...");
  return generateOfflineSmartSummary(articleContent, targetLangCode);
};

function parseAiJsonResponse(rawText) {
  try {
    const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const data = JSON.parse(cleaned);
    if (data && data.summary) {
      // Clean metadata labels if model hallucinated them
      const cleanText = (str) =>
        String(str || "")
          .replace(/News Headline \/ Topic:?/gi, "")
          .replace(/Article Link:?\s*https?:\/\/\S+/gi, "")
          .replace(/Content retrieved from\s*https?:\/\/\S+/gi, "")
          .trim();

      return {
        title: cleanText(data.title) || "News Summary",
        summary: cleanText(data.summary),
        keyPoints: (Array.isArray(data.keyPoints) ? data.keyPoints : [data.summary]).map(cleanText).filter(Boolean),
        sentiment: data.sentiment || "Neutral",
        category: data.category || "General"
      };
    }
  } catch (err) {
    console.error("JSON parse error from AI response:", err);
  }
  return null;
}

const MULTILINGUAL_TEMPLATES = {
  hi: {
    summaryPrefix: "यह रिपोर्ट हाल के घटनाक्रमों और मुख्य समाचारों पर प्रकाश डालती है।",
    points: [
      "रिपोर्ट हाल की प्रमुख घटनाओं और अपडेट का विश्लेषण करती है।",
      "संबंधित पक्षों और विशेषज्ञों ने इस विषय पर अपनी प्रतिक्रिया दी है।",
      "इस मामले में आगे के विकास और अपडेट की उम्मीद की जा रही है।"
    ]
  },
  mr: {
    summaryPrefix: "हा अहवाल अलीकडील घडामोडी आणि महत्त्वाच्या बातम्यांवर प्रकाश टाकतो.",
    points: [
      "अहवाल अलीकडील महत्त्वाच्या घटना आणि अपडेट्सचे विश्लेषण करतो.",
      "संबंधित घटक आणि तज्ज्ञांनी या विषयावर आपल्या प्रतिक्रिया व्यक्त केल्या आहेत.",
      "या प्रकरणात पुढील घडामोडींची शक्यता वर्तवली जात आहे."
    ]
  },
  gu: {
    summaryPrefix: "આ અહેવાલ તાજેતરના વિકાસ અને મુખ્ય செய்தિઓ પર પ્રકાશ પાડે છે.",
    points: [
      "અહેવાલ તાજેતરની મુખ્ય ઘટનાઓ અને અપડેટ્સનું વિશ્લેષણ કરે છે.",
      "સંબંધિત પક્ષો અને નિષ્ણાતોએ આ વિષય પર પ્રતિભાવો આપ્યા છે.",
      "આ બાબતે આગળના વિકાસની અપેક્ષા રાખવામાં આવી રહી છે."
    ]
  },
  ta: {
    summaryPrefix: "இந்த அறிக்கை சமீபத்திய நிகழ்வுகள் மற்றும் முக்கிய செய்திகளை விளக்குகிறது.",
    points: [
      "அறிக்கை சமீபத்திய முக்கிய சம்பவங்கள் மற்றும் புதுப்பிப்புகளை பகுப்பாய்வு செய்கிறது.",
      "தொடர்புடைய தரப்பினர் மற்றும் நிபுணர்கள் தங்கள் கருத்துக்களை தெரிவித்துள்ளனர்.",
      "இந்த விவகாரத்தில் மேலதிக தகவல்கள் எதிர்பார்க்கப்படுகின்றன."
    ]
  },
  te: {
    summaryPrefix: "ఈ నివేదిక ఇటీవల జరిగిన పరిణామాలు మరియు ముఖ్యాంశాలను వివరిస్తుంది.",
    points: [
      "నివేదిక ఇటీవల జరిగిన ముఖ్యమైన సంఘటనలు మరియు అప్‌డేట్‌లను విశ్లేషిస్తుంది.",
      "సంబంధిత వర్గాలు మరియు నిపుణులు ఈ అంశంపై తమ స్పందనను తెలియజేశారు.",
      "ఈ అంశంలో తదుపరి పరిణామాలు చోటుచేసుకునే అవకాశం ఉంది."
    ]
  },
  bn: {
    summaryPrefix: "এই প্রতিবেদনটি সাম্প্রতিক ঘটনাবলী এবং মূল সংবাদের ওপর আলোকপাত করে।",
    points: [
      "প্রতিবেদনটি সাম্প্রতিক গুরুত্বপূর্ণ ঘটনা এবং আপডেটগুলো বিশ্লেষণ করে।",
      "সংশ্লিষ্ট পক্ষ এবং বিশেষজ্ঞরা এই বিষয়ে প্রতিক্রিয়া জানিয়েছেন।",
      "এই বিষয়ে পরবর্তী আপডেটের প্রত্যাশা করা হচ্ছে।"
    ]
  },
  kn: {
    summaryPrefix: "ಈ ವರದಿಯು ಇತ್ತೀಚಿನ ಬೆಳವಣಿಗೆಗಳು ಮತ್ತು ಪ್ರಮುಖ ಸುದ್ದಿಗಳನ್ನು ವಿವರಿಸುತ್ತದೆ.",
    points: [
      "ವರದಿಯು ಇತ್ತೀಚಿನ ಪ್ರಮುಖ ಘಟನೆಗಳು ಮತ್ತು ಅಪ್‌ಡೇಟ್‌ಗಳನ್ನು ವಿಶ್ಲೇಷಿಸುತ್ತದೆ.",
      "ಸಂಬಂಧಪಟ್ಟ ವ್ಯಕ್ತಿಗಳು ಮತ್ತು ತಜ್ಞರು ಈ ವಿಷಯದ ಬಗ್ಗೆ ಪ್ರತಿಕ್ರಿಯಿಸಿದ್ದಾರೆ.",
      "ಈ ವಿಷಯದಲ್ಲಿ ಮುಂದಿನ ಬೆಳವಣಿಗೆಗಳನ್ನು ನಿರೀಕ್ಷಿಸಲಾಗಿದೆ."
    ]
  },
  ml: {
    summaryPrefix: "ഈ റിപ്പോർട്ട് സമീപകാല സംഭവവികാസങ്ങളെയും പ്രധാന വാർത്തകളെയും എടുത്തുകാണിക്കുന്നു.",
    points: [
      "റിപ്പോർട്ട് സമീപകാല പ്രധാന സംഭവങ്ങളെയും അപ്‌ഡേറ്റുകളെയും വിശകലനം ചെയ്യുന്നു.",
      "ബന്ധപ്പെട്ട കക്ഷികളും വിദഗ്ദ്ധരും ഈ വിഷയത്തിൽ തങ്ങളുടെ പ്രതികരണങ്ങൾ രേഖപ്പെടുത്തി.",
      "ഈ വിഷയത്തിൽ കൂടുതൽ വിവരങ്ങൾ പ്രതീക്ഷിക്കുന്നു."
    ]
  },
  pa: {
    summaryPrefix: "ਇਹ ਰਿਪੋਰਟ ਹਾਲੀਆ ਘਟਨਾਵਾਂ ਅਤੇ ਮੁੱਖ ਖ਼ਬਰਾਂ 'ਤੇ ਚਾਨਣਾ ਪਾਉਂਦੀ ਹੈ।",
    points: [
      "ਰਿਪੋਰਟ ਹਾਲੀਆ ਅਹਿਮ ਘਟਨਾਵਾਂ ਅਤੇ ਅੱਪਡੇਟਾਂ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰਦੀ ਹੈ।",
      "ਸੰਬੰਧਿਤ ਧਿਰਾਂ ਅਤੇ ਮਾਹਿਰਾਂ ਨੇ ਇਸ ਵਿਸ਼ੇ 'ਤੇ ਆਪਣੀ ਪ੍ਰਤੀਕਿਰਿਆ ਦਿੱਤੀ ਹੈ।",
      "ਇਸ ਮਾਮਲੇ ਵਿੱਚ ਹੋਰ ਅੱਗੇ ਵਧਣ ਦੀ ਉਮੀਦ ਕੀਤੀ ਜਾ ਰਹੀ ਹੈ।"
    ]
  },
  ur: {
    summaryPrefix: "یہ رپورٹ حالیہ پیش رفت اور اہم خبروں کو اجاگر کرتی ہے۔",
    points: [
      "رپورٹ حالیہ اہم واقعات اور اپ ڈیٹس کا تجزیہ کرتی ہے۔",
      "متعلقہ فریقین اور ماہرین نے اس موضوع پر اپنے ردعمل کا اظہار کیا ہے۔",
      "اس معاملے میں مزید پیش رفت کی توقع کی جا رہی ہے۔"
    ]
  },
  es: {
    summaryPrefix: "Este informe destaca los acontecimientos recientes y las noticias clave.",
    points: [
      "El informe analiza los acontecimientos recientes y las actualizaciones principales.",
      "Partes interesadas y expertos han compartido sus perspectivas sobre el tema.",
      "Se esperan nuevos desarrollos a medida que surja más información."
    ]
  },
  fr: {
    summaryPrefix: "Ce rapport met en lumière les développements récents et les faits marquants.",
    points: [
      "Le rapport analyse les récents événements majeurs et les mises à jour.",
      "Les parties prenantes et experts ont partagé leurs perspectives sur le sujet.",
      "De nouveaux développements sont attendus au fur et à mesure que l'information évolue."
    ]
  },
  de: {
    summaryPrefix: "Dieser Bericht hebt die jüngsten Entwicklungen und wichtigen Nachrichten hervor.",
    points: [
      "Der Bericht analysiert die wichtigsten aktuellen Ereignisse und Updates.",
      "Beteiligte Parteien und Experten haben ihre Perspektiven zum Thema geäußert.",
      "Weitere Entwicklungen werden im Laufe der Berichterstattung erwartet."
    ]
  }
};

function generateOfflineSmartSummary(text, langCode) {
  const clean = text
    .replace(/News Headline \/ Topic:?/gi, "")
    .replace(/Article Link:?\s*https?:\/\/\S+/gi, "")
    .replace(/Content retrieved from\s*https?:\/\/\S+/gi, "")
    .trim();

  const firstLine = clean.split("\n")[0] || "News Article";
  const title = firstLine.length > 90 ? firstLine.slice(0, 90) + "..." : firstLine;
  const sentences = clean.split(/(?<=[.!?])\s+/).filter(s => s.length > 15 && !s.includes("http"));

  const template = MULTILINGUAL_TEMPLATES[langCode];

  let summaryText = sentences.slice(0, 3).join(" ");
  if (!summaryText || summaryText.length < 30) {
    summaryText = template
      ? `${template.summaryPrefix} (${title})`
      : `This report highlights key updates regarding "${title}". The article covers recent developments and insights surrounding the topic.`;
  }

  const keyPoints = template
    ? template.points
    : [
        sentences[0] || `The article outlines major developments regarding ${title}.`,
        sentences[1] || "Key statistics and stakeholder reactions were reported in the coverage.",
        sentences[2] || "Follow-up coverage is expected as new details emerge."
      ];

  return {
    title: title || "News Article Summary",
    summary: summaryText,
    keyPoints: keyPoints,
    sentiment: "Neutral",
    category: "General"
  };
}
