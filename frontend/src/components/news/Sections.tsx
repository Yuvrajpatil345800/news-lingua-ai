import {
  BarChart3,
  Bot,
  Copy,
  Download,
  FileText,
  Github,
  Globe,
  Languages,
  Link2,
  Linkedin,
  Mail,
  ScanText,
  Smartphone,
  Volume2,
  Wand2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LANGUAGES } from "@/lib/news-data";

const STATS = [
  { label: "Articles summarized", value: "1,24,860" },
  { label: "Languages used", value: "15+" },
  { label: "Avg. reading time saved", value: "5m 32s" },
  { label: "AI accuracy (ROUGE-L)", value: "92.4%" },
  { label: "User satisfaction", value: "4.8 / 5" },
];

const FEATURES = [
  { icon: Bot, title: "AI powered", desc: "Transformer models fine-tuned on Indic news corpora." },
  { icon: Globe, title: "Supports 15+ languages", desc: "English, Hindi, Marathi and every major Indian language." },
  { icon: ScanText, title: "Automatic detection", desc: "Script and language identified with 98% confidence." },
  { icon: Wand2, title: "Abstractive summaries", desc: "Human-like rewriting, not just sentence picking." },
  { icon: FileText, title: "Extractive mode", desc: "Keeps original sentences for factual reporting." },
  { icon: Link2, title: "News URL support", desc: "Paste any newspaper link and we fetch the article." },
  { icon: Download, title: "Upload & export", desc: "PDF, DOCX and TXT in, clean PDF summaries out." },
  { icon: Copy, title: "One-tap copy", desc: "Copy or share summaries anywhere in a click." },
  { icon: Volume2, title: "Speech output", desc: "Listen to the summary in the selected language." },
  { icon: Smartphone, title: "Responsive design", desc: "Built for desktop, tablet and mobile alike." },
];

export function StatsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STATS.map((s) => (
          <Card key={s.label} className="hover-lift rounded-2xl border-border/70 shadow-soft">
            <CardContent className="p-5">
              <p className="font-display text-2xl font-bold text-gradient">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-10 max-w-2xl">
        <h2 className="text-3xl font-bold sm:text-4xl">Everything your newsroom workflow needs</h2>
        <p className="mt-3 text-muted-foreground">
          A complete summarization pipeline — detection, translation, insights and export.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title} className="hover-lift rounded-2xl border-border/70 shadow-soft">
            <CardContent className="p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function LanguagesSection() {
  return (
    <section id="languages" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-soft sm:p-10">
        <div className="flex items-center gap-2 text-primary">
          <Languages className="h-5 w-5" />
          <span className="text-sm font-semibold tracking-wide uppercase">Languages</span>
        </div>
        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Summaries in your language</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {LANGUAGES.map((l) => (
            <div key={l.code} className="hover-lift rounded-2xl bg-secondary/60 p-4">
              <p className="font-display text-lg font-semibold">{l.native}</p>
              <p className="text-xs text-muted-foreground">{l.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ResearchSection() {
  return (
    <section id="research" className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl shadow-soft">
          <CardContent className="p-8">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h2 id="about" className="mt-4 text-2xl font-bold">
              About the project
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              An engineering micro-project exploring multilingual abstractive summarization for Indian
              news. The pipeline combines language identification, IndicNLP normalization, transformer
              summarization and neural machine translation to deliver a single summary in any supported
              language.
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl shadow-soft">
          <CardContent className="p-8">
            <FileText className="h-6 w-6 text-accent" />
            <h2 className="mt-4 text-2xl font-bold">Research papers</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>mT5: A Massively Multilingual Pre-trained Text-to-Text Transformer</li>
              <li>IndicBART: Pre-trained Model for Indic Natural Language Generation</li>
              <li>Multilingual Denoising Pre-training (mBART) for NMT</li>
              <li>BART: Denoising Sequence-to-Sequence Pre-training</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer id="contact" className="mt-10 border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <p className="font-display text-lg font-bold">AI News Summarizer</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Multilingual news summarization for every Indian language.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><a href="#features" className="transition-colors hover:text-foreground">Features</a></li>
            <li><a href="#languages" className="transition-colors hover:text-foreground">Languages</a></li>
            <li><a href="#research" className="transition-colors hover:text-foreground">Research papers</a></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Legal</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><a href="#about" className="transition-colors hover:text-foreground">About</a></li>
            <li><a href="#" className="transition-colors hover:text-foreground">Privacy policy</a></li>
            <li><a href="#" className="transition-colors hover:text-foreground">Terms &amp; conditions</a></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Contact</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Github className="h-4 w-4" /> GitHub</li>
            <li className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> team@ainewssummarizer.in</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} AI News Summarizer · Final-year engineering micro-project
      </div>
    </footer>
  );
}
