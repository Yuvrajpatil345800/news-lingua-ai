import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import {
  Volume2,
  VolumeX,
  Copy,
  Sparkles,
  Link as LinkIcon,
  FileText,
  RotateCcw,
  History as HistoryIcon,
  Check,
  Tag,
  ThumbsUp,
  Share2,
  Trash2,
  Pause,
  Play,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type LangCode =
  "en" | "hi" | "mr" | "gu" | "ta" | "te" | "bn" | "kn" | "ml" | "pa" | "ur" | "es" | "fr" | "de";

type InputType = "text" | "url";

const GUEST_SUMMARY_LIMIT = 3;
const GUEST_USAGE_KEY = "news_summarizer_guest_summary_count";

const getGuestSummaryUsage = () => {
  if (typeof window === "undefined") return 0;
  const count = Number.parseInt(localStorage.getItem(GUEST_USAGE_KEY) || "0", 10);
  return Number.isFinite(count) && count >= 0 ? count : 0;
};

const LANGUAGE_NAMES: Record<LangCode, string> = {
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

const SPEECH_LANGUAGES: Record<LangCode, string> = {
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

interface SummaryResult {
  id?: string;
  title: string;
  summary: string;
  keyPoints: string[];
  sentiment: string;
  category: string;
  url?: string;
  language: string;
  createdAt?: string;
}

export function Summarizer() {
  const { isAuthenticated, openAuthModal } = useAuth();

  const [inputType, setInputType] = useState<InputType>("text");
  const [article, setArticle] = useState("");
  const [outputLang, setOutputLang] = useState<LangCode>("en");

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [guestUsage, setGuestUsage] = useState(getGuestSummaryUsage);

  // Summary State
  const [summaryData, setSummaryData] = useState<SummaryResult | null>(null);

  // History State
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Text-To-Speech (TTS) state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Store loaded voices — must be loaded async via voiceschanged event
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synthRef.current = synth;

    // Load voices — Chrome loads them async, Firefox loads sync
    const loadVoices = () => {
      const v = synth.getVoices();
      if (v.length > 0) voicesRef.current = v;
    };

    loadVoices(); // try immediately (works in Firefox)
    synth.addEventListener("voiceschanged", loadVoices); // works in Chrome
    return () => synth.removeEventListener("voiceschanged", loadVoices);
  }, []);

  // Fetch history from the backend
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.getHistory();
      if (res.success && res.history) {
        setHistoryList(res.history);
      }
    } catch (err: any) {
      console.warn("Failed to fetch history:", err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory]);

  // Handle Speech Toggle
  const toggleSpeech = async () => {
    if (!synthRef.current || !summaryData?.summary) {
      toast.error("Text-to-speech is not supported on this browser.");
      return;
    }

    const synth = synthRef.current;

    if (audioRef.current) {
      if (isPaused) {
        void audioRef.current.play();
        setIsPaused(false);
      } else {
        audioRef.current.pause();
        setIsPaused(true);
      }
      return;
    }

    if (isSpeaking) {
      if (isPaused) {
        synth.resume();
        setIsPaused(false);
      } else {
        synth.pause();
        setIsPaused(true);
      }
      return;
    }

    // Cancel any previous speech
    synth.cancel();

    const textToSpeak = `${summaryData.title}. ${summaryData.summary}. ${
      summaryData.keyPoints ? summaryData.keyPoints.join(". ") : ""
    }`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    // ✅ FIX: Use the actual language of the generated summary, not the UI dropdown
    // summaryData.language = the lang the AI generated the summary in
    const targetLangBcp47 = SPEECH_LANGUAGES[outputLang] || "en-US";
    utterance.lang = targetLangBcp47;
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    // ✅ FIX: Use async-loaded voices (voicesRef), not synth.getVoices() which is empty on first call in Chrome
    const voices = voicesRef.current.length > 0 ? voicesRef.current : synth.getVoices();
    const langPrefix = targetLangBcp47.split("-")[0]; // e.g. "hi" from "hi-IN"

    // Priority 1: Exact BCP-47 match (e.g. "hi-IN")
    // Priority 2: Same language family prefix (e.g. any "hi-*" voice)
    // Priority 3: No voice set — browser uses system default
    const normaliseLanguage = (value: string) => value.toLowerCase().replace("_", "-");
    const matchedVoice =
      voices.find((v) => normaliseLanguage(v.lang) === normaliseLanguage(targetLangBcp47)) ||
      voices.find((v) => normaliseLanguage(v.lang).startsWith(`${langPrefix}-`)) ||
      voices.find((v) => normaliseLanguage(v.lang) === langPrefix);

    if (matchedVoice) {
      utterance.voice = matchedVoice;
      console.log(
        `🔊 TTS voice selected: ${matchedVoice.name} (${matchedVoice.lang}) for lang: ${targetLangBcp47}`,
      );
    } else {
      try {
        const audioBlob = await api.synthesizeSpeech(textToSpeak, outputLang);
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          setIsSpeaking(false);
          setIsPaused(false);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          setIsSpeaking(false);
          setIsPaused(false);
          toast.error("Azure Speech could not play the generated audio.");
        };
        await audio.play();
        setIsSpeaking(true);
        setIsPaused(false);
      } catch (error: any) {
        toast.error(error.message || "Azure Speech is unavailable.");
      }
      return;
      console.warn(
        `⚠️ No voice found for ${targetLangBcp47}. Available voices:`,
        voices.map((v) => v.lang).join(", "),
      );
      // Still set the lang — browser will try to use it even without a matched voice
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.error("Speech error:", e);
      setIsSpeaking(false);
      setIsPaused(false);
      toast.error("Speech playback error. Please try again.");
    };

    utteranceRef.current = utterance;
    synth.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  };

  const stopSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
  };

  // Generate Summary from Real Backend
  const handleGenerateSummary = async () => {
    const input = article.trim();

    if (!input) {
      toast.error(
        inputType === "url"
          ? "Please paste a news article URL."
          : "Please paste some article text.",
      );
      return;
    }

    if (inputType === "url" && !/^https?:\/\//i.test(input)) {
      toast.error("Please enter a valid URL starting with http:// or https://");
      return;
    }

    if (!isAuthenticated && guestUsage >= GUEST_SUMMARY_LIMIT) {
      toast.info("Your 3 free summaries are used. Sign in with Google to continue.");
      openAuthModal("signin");
      return;
    }

    stopSpeech();
    setLoading(true);
    setSummaryData(null);

    try {
      const payload =
        inputType === "url"
          ? { url: input, language: outputLang }
          : { text: input, language: outputLang };

      const res = await api.summarize(payload);

      if (res.success && res.data) {
        setSummaryData(res.data);
        if (!isAuthenticated) {
          const nextUsage = guestUsage + 1;
          localStorage.setItem(GUEST_USAGE_KEY, String(nextUsage));
          setGuestUsage(nextUsage);
        }
        toast.success("AI Summary generated successfully!");
      }
    } catch (err: any) {
      console.error("Summarization error:", err);
      toast.error(err.message || "AI summary could not be generated.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!summaryData) return;
    const textToCopy = `${summaryData.title}\n\nSummary:\n${summaryData.summary}\n\nKey Highlights:\n${summaryData.keyPoints.map((p) => `• ${p}`).join("\n")}`;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Summary copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    stopSpeech();
    setArticle("");
    setSummaryData(null);
  };

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteHistoryItem(id);
      setHistoryList((prev) => prev.filter((item) => item.id !== id));
      toast.success("Deleted from history");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete history item");
    }
  };

  return (
    <section id="features" className="relative py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* SECTION HEADER */}
        <div className="mx-auto max-w-3xl text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Google Gemini Powered Summarizer Engine
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            AI News Summaries in{" "}
            <span className="bg-gradient-brand bg-clip-text text-transparent">Any Language</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Paste newspaper text or article URLs to receive instant executive summaries, key
            highlights, sentiment analysis, and audio speech output.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN — INPUT PANEL */}
          <div className="lg:col-span-6 space-y-4">
            <Card className="p-6 border-border/80 bg-card/60 backdrop-blur-xl shadow-lg space-y-5">
              <div className="flex items-center justify-between">
                <Tabs
                  value={inputType}
                  onValueChange={(v) => setInputType(v as InputType)}
                  className="w-full max-w-xs"
                >
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="text" className="gap-1.5 text-xs font-medium">
                      <FileText className="h-3.5 w-3.5" /> Text
                    </TabsTrigger>
                    <TabsTrigger value="url" className="gap-1.5 text-xs font-medium">
                      <LinkIcon className="h-3.5 w-3.5" /> URL Link
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="gap-1.5 text-xs border-border/70"
                >
                  <HistoryIcon className="h-3.5 w-3.5 text-primary" />
                  {showHistory ? "Hide History" : "Saved History"}
                </Button>
              </div>

              {/* INPUT CONTAINER */}
              {inputType === "text" ? (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground flex justify-between">
                    <span>PASTE ARTICLE OR NEWSPAPER TEXT</span>
                    <span>{article.length} characters</span>
                  </label>
                  <textarea
                    rows={8}
                    placeholder="Paste news article content, press release, or newspaper paragraph here..."
                    value={article}
                    onChange={(e) => setArticle(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background/80 p-3.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none font-sans"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    NEWS ARTICLE URL LINK
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="url"
                      placeholder="https://timesofindia.indiatimes.com/world/article..."
                      value={article}
                      onChange={(e) => setArticle(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background/80 py-3 pl-10 pr-3.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Supports news portals, newspapers, RSS feeds, and Hindustan Times shared links.
                  </p>
                </div>
              )}

              {/* LANGUAGE SELECTOR */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Languages className="h-3.5 w-3.5 text-primary" />
                  TARGET SUMMARY & SPEECH LANGUAGE
                </label>
                <select
                  value={outputLang}
                  onChange={(e) => setOutputLang(e.target.value as LangCode)}
                  className="w-full rounded-xl border border-input bg-background/80 p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {(Object.keys(LANGUAGE_NAMES) as LangCode[]).map((code) => (
                    <option key={code} value={code}>
                      {LANGUAGE_NAMES[code]}
                    </option>
                  ))}
                </select>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleGenerateSummary}
                  disabled={loading || !article.trim()}
                  className="flex-1 bg-gradient-brand shadow-soft text-sm font-semibold py-5 rounded-xl gap-2"
                >
                  {loading ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Summarize Article
                    </>
                  )}
                </Button>

                {article && (
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="px-4 py-5 rounded-xl border-border"
                    title="Reset Form"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {!isAuthenticated && (
                <p className="text-center text-xs text-muted-foreground">
                  {Math.max(0, GUEST_SUMMARY_LIMIT - guestUsage)} of {GUEST_SUMMARY_LIMIT} free summaries remaining. Sign in with Google for unlimited summaries and saved history.
                </p>
              )}
            </Card>

            {/* SAVED HISTORY PANEL */}
            {showHistory && (
              <Card className="p-5 border-border/80 bg-card/70 backdrop-blur-xl shadow-lg space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-1.5">
                    <HistoryIcon className="h-4 w-4 text-primary" />
                    Saved Summary History
                  </h3>
                  {!isAuthenticated && (
                    <span
                      onClick={() => openAuthModal("signin")}
                      className="text-xs text-primary cursor-pointer hover:underline"
                    >
                      Sign in to sync across devices
                    </span>
                  )}
                </div>

                {loadingHistory ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    Loading history...
                  </div>
                ) : historyList.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No saved summaries found yet. Generate your first summary above!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {historyList.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSummaryData({
                            id: item.id,
                            title: item.title,
                            summary: item.summary,
                            keyPoints: item.key_points || [item.summary],
                            sentiment: item.sentiment || "Neutral",
                            category: item.category || "General",
                            url: item.url,
                            language: item.language || "en",
                          });
                          toast.info("Loaded summary from history");
                        }}
                        className="group flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-secondary/60 cursor-pointer transition-colors"
                      >
                        <div className="min-w-0 pr-2 space-y-0.5">
                          <p className="text-xs font-semibold truncate text-foreground">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {item.summary}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteHistory(item.id, e)}
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* RIGHT COLUMN — OUTPUT DISPLAY PANEL */}
          <div className="lg:col-span-6 space-y-4">
            {summaryData ? (
              <Card className="p-6 border-primary/20 bg-card/80 backdrop-blur-2xl shadow-xl space-y-5 animate-fade-in relative overflow-hidden">
                {/* TOP METADATA & SPEAKER CONTROLS */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      <Tag className="h-3 w-3" />
                      {summaryData.category || "General"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <ThumbsUp className="h-3 w-3" />
                      {summaryData.sentiment || "Neutral"}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {LANGUAGE_NAMES[summaryData.language as LangCode] || summaryData.language}
                    </span>
                  </div>

                  {/* INTERACTIVE SPEAKER BUTTON */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      onClick={toggleSpeech}
                      variant={isSpeaking ? "default" : "outline"}
                      size="sm"
                      className={`gap-1.5 text-xs rounded-full shadow-soft transition-all ${
                        isSpeaking ? "bg-primary text-primary-foreground animate-pulse" : ""
                      }`}
                    >
                      {isSpeaking ? (
                        isPaused ? (
                          <>
                            <Play className="h-3.5 w-3.5" /> Resume Speech
                          </>
                        ) : (
                          <>
                            <Pause className="h-3.5 w-3.5" /> Pause Speech
                          </>
                        )
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5 text-primary" /> Listen Summary (TTS)
                        </>
                      )}
                    </Button>

                    {isSpeaking && (
                      <Button
                        onClick={stopSpeech}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Stop Speech"
                      >
                        <VolumeX className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* TITLE */}
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-foreground leading-snug">
                    {summaryData.title}
                  </h3>
                  {summaryData.url && (
                    <a
                      href={summaryData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1 truncate max-w-full"
                    >
                      <LinkIcon className="h-3 w-3" /> Read full original article
                    </a>
                  )}
                </div>

                {/* EXECUTIVE SUMMARY */}
                <div className="space-y-2 rounded-xl bg-secondary/40 p-4 border border-border/50">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> EXECUTIVE SUMMARY
                  </h4>
                  <p className="text-sm sm:text-base leading-relaxed text-foreground font-medium">
                    {summaryData.summary}
                  </p>
                </div>

                {/* KEY HIGHLIGHTS BULLET POINTS */}
                {summaryData.keyPoints && summaryData.keyPoints.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      KEY HIGHLIGHTS
                    </h4>
                    <ul className="space-y-2">
                      {summaryData.keyPoints.map((point, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-sm text-foreground/90 bg-background/60 p-3 rounded-lg border border-border/40"
                        >
                          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xs mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-snug">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* FOOTER ACTIONS */}
                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="gap-1.5 text-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy Summary
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      if (navigator.share && summaryData) {
                        try {
                          await navigator.share({
                            title: summaryData.title,
                            text: summaryData.summary,
                          });
                        } catch {}
                      } else {
                        handleCopy();
                      }
                    }}
                    className="gap-1.5 text-xs text-muted-foreground"
                  >
                    <Share2 className="h-3.5 w-3.5" /> Share
                  </Button>
                </div>
              </Card>
            ) : (
              /* PLACEHOLDER WHEN NO SUMMARY IS YET GENERATED */
              <Card className="p-8 border-dashed border-border/80 bg-card/30 text-center space-y-4 min-h-[380px] flex flex-col justify-center items-center">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary shadow-soft">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-lg font-bold">Your AI Summary Will Appear Here</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Paste any news text or article URL on the left and select your preferred
                    language. The AI will extract the headline, concise summary, key points, and
                    audio speech.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
