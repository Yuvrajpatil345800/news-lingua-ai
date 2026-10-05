import { Sparkles, Languages, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-ai-news.png";
import { LANGUAGES } from "@/lib/news-data";

export function Hero() {
  return (
    <section id="home" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-surface)" }}
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div className="animate-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Powered by mT5, IndicBART &amp; mBART
          </span>
          <h1 className="mt-5 text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl">
            AI-Powered <span className="text-gradient">Multilingual</span> News Summarizer
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Upload or paste any news article or newspaper URL and get an accurate AI-generated
            summary in your preferred language.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" className="bg-gradient-brand shadow-soft" asChild>
              <a href="#summarize">
                <Newspaper className="mr-2 h-4 w-4" /> Summarize an article
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#languages">
                <Languages className="mr-2 h-4 w-4" /> Explore languages
              </a>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {LANGUAGES.slice(0, 8).map((l) => (
              <span
                key={l.code}
                className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
              >
                {l.native}
              </span>
            ))}
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              +5 more
            </span>
          </div>
        </div>

        <div className="relative">
          <img
            src={heroImage}
            width={1200}
            height={912}
            alt="AI brain analysing a newspaper and translating it across Indian languages"
            className="animate-float w-full drop-shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}
