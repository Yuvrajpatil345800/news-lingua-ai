import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/news/SiteHeader";
import { Hero } from "@/components/news/Hero";
import { Summarizer } from "@/components/news/Summarizer";
import {
  FeaturesSection,
  LanguagesSection,
  ResearchSection,
  SiteFooter,
  StatsSection,
} from "@/components/news/Sections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI News Summarizer — Multilingual Indian News Summaries" },
      {
        name: "description",
        content:
          "AI-powered news summarizer that fetches live news and generates concise summaries using Groq AI.",
      },
      { property: "og:title", content: "AI News Summarizer — Multilingual Indian News Summaries" },
      {
        property: "og:description",
        content:
          "AI-powered multilingual news summarization with language detection, translation, sentiment and speech output.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Hero />
        <Summarizer />
        <StatsSection />
        <FeaturesSection />
        <LanguagesSection />
        <ResearchSection />
      </main>
      <SiteFooter />
      <Toaster />
    </div>
  );
}
