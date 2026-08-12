import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock,
  Lock,
  LogIn,
  Menu,
  ShieldCheck,
  Users,
  X,
  Zap,
} from 'lucide-react';

import { ModeToggle } from '@/components/mode-toggle';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Brand } from '@/shared/ui';

type PreviewResult = {
  count: number;
  id: string;
  label: string;
  percentage: number;
};

type Benefit = {
  description: string;
  icon: typeof Zap;
  id: string;
  metric: string;
  title: string;
};

type WorkflowStep = {
  body: string;
  id: string;
  number: string;
  title: string;
};

type Testimonial = {
  author: string;
  avatar: string;
  company: string;
  id: string;
  quote: string;
  role: string;
};

type FaqItem = {
  answer: string;
  id: string;
  question: string;
};

const initialPreviewResults: readonly PreviewResult[] = [
  { count: 47, id: 'deep-work', label: 'Deep work focus blocks', percentage: 58 },
  { count: 22, id: 'team-sync', label: 'Async team alignment', percentage: 27 },
  { count: 12, id: 'learning', label: 'Interactive learning sessions', percentage: 15 },
];

const benefits: readonly Benefit[] = [
  {
    description:
      'Attendees enter a 4 letter code on any device without creating an account or downloading an app.',
    icon: Zap,
    id: 'instant-access',
    metric: '2.4 second avg join',
    title: 'Zero friction joining',
  },
  {
    description:
      'Optional anonymous voting encourages candid participation and yields genuine room consensus.',
    icon: ShieldCheck,
    id: 'unbiased-feedback',
    metric: '4.2x response velocity',
    title: 'Unbiased room feedback',
  },
  {
    description:
      'The host dashboard allows instant locking, question advancing, and result toggles during live talks.',
    icon: BarChart3,
    id: 'host-control',
    metric: 'Total room control',
    title: 'Presenter command center',
  },
  {
    description:
      'Real time WebSocket streaming updates all participant screens simultaneously without page refreshes.',
    icon: Users,
    id: 'realtime-sync',
    metric: 'Sub 100ms sync latency',
    title: 'Instant WebSocket sync',
  },
];

const workflowSteps: readonly WorkflowStep[] = [
  {
    body: 'Enter your session title, select your question format, and launch your room in 30 seconds.',
    id: 'create',
    number: '01',
    title: 'Launch a free session',
  },
  {
    body: 'Display your unique 4 letter Room Code on screen. Attendees join instantly on mobile or desktop.',
    id: 'share',
    number: '02',
    title: 'Share your Room Code',
  },
  {
    body: 'Watch responses stream in real time. Lock polls, reveal breakdowns, or advance seamlessly.',
    id: 'control',
    number: '03',
    title: 'Guide the live moment',
  },
];

const testimonials: readonly Testimonial[] = [
  {
    author: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    company: 'Apex Labs',
    id: 'elena',
    quote:
      'Pulse transformed our all hands meetings. We went from silence during Q&A to getting 180 thoughtful responses within 45 seconds.',
    role: 'Head of People & Culture',
  },
  {
    author: 'Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    company: 'Agile Facilitators Guild',
    id: 'marcus',
    quote:
      'Not needing attendees to download an app or sign up is massive. The 4 letter Room Code works every single time without failure.',
    role: 'Principal Workshop Host',
  },
  {
    author: 'Dr. Aris Thorne',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    company: 'Tech Summit North',
    id: 'aris',
    quote:
      'The live chart animation gives the room an immediate spark. It makes keynotes feel like a shared conversation rather than a broadcast.',
    role: 'Keynote Speaker & Educator',
  },
];

const faqs: readonly FaqItem[] = [
  {
    answer:
      'No. Participants simply open any browser, type your 4 letter Room Code, and start voting immediately. No accounts, passwords, or downloads required.',
    id: 'faq-1',
    question: 'Do participants need to create an account or download an app?',
  },
  {
    answer:
      'Pulse comfortably supports up to 500 simultaneous participants per live session with sub 100ms WebSocket synchronization.',
    id: 'faq-2',
    question: 'How many participants can join a single live poll session?',
  },
  {
    answer:
      'Yes. Hosts can toggle 100% anonymous voting for any poll, encouraging honest feedback during sensitive discussions.',
    id: 'faq-3',
    question: 'Are participant responses stored anonymously?',
  },
  {
    answer:
      'Yes. The host control room lets you lock responses, hide live charts until voting finishes, or advance questions whenever you choose.',
    id: 'faq-4',
    question: 'Can I lock polls or hide live results while presenting?',
  },
  {
    answer:
      'Yes. Pulse includes a full featured free plan with zero credit card required so you can host live sessions right away.',
    id: 'faq-5',
    question: 'Is Pulse free to use for hosts and facilitators?',
  },
  {
    answer:
      'Yes. After a session ends, hosts can view response summaries in their history dashboard or export raw data for documentation.',
    id: 'faq-6',
    question: 'Can I view or export poll results after the meeting ends?',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      {/* Keyboard accessible skip link */}
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
        href="#main-content"
      >
        Skip to main content
      </a>

      <FluidNav />

      <main id="main-content">
        <HeroSection />
        <TaglineRevealSection />
        <BenefitsSection />
        <WorkflowSection />
        <ProofSection />
        <FaqSection />
        <RiskReversalSection />
      </main>

      <SiteFooter />
    </div>
  );
}

function FluidNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-4 z-40 px-4 sm:px-6">
      <nav
        aria-label="Main Navigation"
        className="mx-auto flex max-w-4xl items-center justify-between rounded-full border border-border bg-card/85 px-4 py-2 shadow-sm backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-border/80 sm:px-6"
      >
        <Brand aria-label="Pulse homepage" href="/" size="lg" />

        <div className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <a
            className="transition-colors duration-200 hover:text-foreground focus-visible:text-foreground"
            href="#features"
          >
            Features
          </a>
          <a
            className="transition-colors duration-200 hover:text-foreground focus-visible:text-foreground"
            href="#how-it-works"
          >
            How it works
          </a>
          <a
            className="transition-colors duration-200 hover:text-foreground focus-visible:text-foreground"
            href="#testimonials"
          >
            Stories
          </a>
          <a
            className="transition-colors duration-200 hover:text-foreground focus-visible:text-foreground"
            href="#faq"
          >
            FAQ
          </a>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ModeToggle />
          <a
            className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
            href="/host/email"
          >
            Sign in
          </a>
          <PrimaryButton href="/host/email" size="sm">
            Create session
          </PrimaryButton>
        </div>

        {/* Mobile menu trigger button */}
        <div className="flex items-center gap-2 md:hidden">
          <ModeToggle />
          <button
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            className="relative flex size-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setIsOpen(!isOpen)}
            type="button"
          >
            {isOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile expanded dropdown modal */}
      {isOpen && (
        <div className="fixed inset-x-4 top-20 z-50 rounded-2xl border border-border bg-background/95 p-6 shadow-2xl backdrop-blur-2xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden">
          <div className="flex flex-col gap-4 text-base font-medium">
            <a
              className="transition-all duration-500 hover:text-primary"
              href="#features"
              onClick={() => setIsOpen(false)}
            >
              Features
            </a>
            <a
              className="transition-all duration-500 hover:text-primary"
              href="#how-it-works"
              onClick={() => setIsOpen(false)}
            >
              How it works
            </a>
            <a
              className="transition-all duration-500 hover:text-primary"
              href="#testimonials"
              onClick={() => setIsOpen(false)}
            >
              Stories
            </a>
            <a
              className="transition-all duration-500 hover:text-primary"
              href="#faq"
              onClick={() => setIsOpen(false)}
            >
              FAQ
            </a>
            <hr className="my-2 border-border" />
            <div className="flex flex-col gap-3">
              <a
                className="rounded-xl border border-border py-2 text-center text-sm font-semibold text-foreground"
                href="/host/email"
              >
                Sign in to host account
              </a>
              <PrimaryButton href="/host/email" className="w-full justify-center">
                Create a free session
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function HeroSection() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col items-center px-4 pt-12 pb-16 text-center sm:px-6 lg:pt-20 lg:pb-24">
      <h1 className="max-w-[680px] bg-linear-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-4xl font-bold tracking-tight text-balance text-transparent sm:text-5xl lg:text-6xl">
        Make every voice part of the live moment
      </h1>

      <p className="mt-6 max-w-[680px] text-lg leading-relaxed text-pretty text-muted-foreground sm:text-xl">
        Pulse empowers presenters to run focused live polls while participants join in seconds using a 4 letter Room Code with no accounts required.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <PrimaryButton href="/host/email">
          Create a free session
          <ArrowUpRight className="ml-2 size-4" />
        </PrimaryButton>
        <SecondaryButton href="/join">
          <LogIn className="mr-2 size-4 text-primary" />
          Join with Room Code
        </SecondaryButton>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-primary" />
          Zero app downloads
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-primary" />
          100% anonymous voting option
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-primary" />
          Sub 100ms WebSocket sync
        </span>
      </div>

      <div className="mt-14 w-full max-w-3xl">
        <LivePollPreview />
      </div>
    </section>
  );
}

function LivePollPreview() {
  const [results, setResults] = useState<readonly PreviewResult[]>(initialPreviewResults);
  const [totalCount, setTotalCount] = useState(81);

  useEffect(() => {
    const interval = setInterval(() => {
      setResults((prev) => {
        const randomIndex = Math.floor(Math.random() * prev.length);
        const updated = prev.map((item, idx) => {
          if (idx === randomIndex) {
            return { ...item, count: item.count + 1 };
          }
          return item;
        });

        const newTotal = updated.reduce((sum, item) => sum + item.count, 0);
        setTotalCount(newTotal);

        return updated.map((item) => ({
          ...item,
          percentage: Math.round((item.count / newTotal) * 100),
        }));
      });
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <article aria-label="Interactive live poll preview" className="w-full text-left">
      <Card className="rounded-2xl border border-border bg-card p-6 shadow-xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-2xl">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-2.5">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
              </span>
              <span className="text-xs font-semibold text-foreground">
                All Hands Offsite · Room Code <code className="font-mono text-primary">PULSE-42</code>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 rounded-md text-xs font-medium">
                <Clock className="size-3 text-muted-foreground" />
                02:14 remaining
              </Badge>
              <Badge className="border-none bg-primary/15 text-xs font-semibold text-primary">
                Live voting open
              </Badge>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold tracking-tight text-balance text-foreground sm:text-2xl">
              What topic should we dedicate our next deep dive session to?
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Single choice live poll · Host controls active status
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {results.map((result) => (
              <li key={result.id}>
                <div className="group relative flex flex-col gap-2 rounded-lg border border-border/70 bg-background/60 p-4 transition-colors hover:border-border">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-foreground">{result.label}</span>
                    <span className="font-mono text-xs font-bold text-primary">
                      {result.percentage}% ({result.count} votes)
                    </span>
                  </div>
                  <Progress
                    value={result.percentage}
                    className="h-2.5 bg-muted transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  />
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
            <span className="font-mono font-medium text-foreground">
              {totalCount} total live responses
            </span>
            <span className="flex items-center gap-1">
              <Lock className="size-3 text-muted-foreground" />
              100% anonymous responses
            </span>
          </div>
        </div>
      </Card>
    </article>
  );
}

function TaglineRevealSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const start = windowHeight * 0.85;
      const end = windowHeight * 0.3;
      const raw = (start - rect.top) / (start - end);
      const clamped = Math.min(Math.max(raw, 0), 1);
      setScrollProgress(clamped);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const line1Words = 'Transform quiet rooms into instant consensus.'.split(' ');
  const line2Words = 'No downloads, zero friction, real responses in real time.'.split(' ');

  return (
    <section className="border-y border-border bg-card/40 px-4 py-20 sm:px-6">
      <div ref={containerRef} className="mx-auto max-w-[680px] text-center">
        <h2 className="text-3xl leading-tight font-bold tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl">
          <div className="mb-3">
            {line1Words.map((word, idx) => {
              const wordRatio = idx / (line1Words.length + line2Words.length);
              const isActive = scrollProgress >= wordRatio;
              return (
                <span
                  key={`l1-${word}-${idx}`}
                  className="mr-2 inline-block transition-opacity duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  style={{ opacity: isActive ? 1 : 0.28 }}
                >
                  {word}
                </span>
              );
            })}
          </div>
          <div>
            {line2Words.map((word, idx) => {
              const globalIdx = line1Words.length + idx;
              const wordRatio = globalIdx / (line1Words.length + line2Words.length);
              const isActive = scrollProgress >= wordRatio;
              return (
                <span
                  key={`l2-${word}-${idx}`}
                  className="mr-2 inline-block transition-opacity duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  style={{ opacity: isActive ? 1 : 0.28 }}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </h2>
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-[680px] text-center">
        <Badge variant="outline" className="mb-4 rounded-full px-3 py-1 text-xs font-semibold">
          Core Capabilities
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl">
          Built for moments when room attention matters
        </h2>
        <p className="mt-4 text-base text-pretty text-muted-foreground sm:text-lg">
          Pulse removes every technical obstacle between your question and the room's honest answer.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((benefit) => {
          const Icon = benefit.icon;
          return (
            <Card
              key={benefit.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-lg"
            >
              <div>
                <div className="flex size-11 items-center justify-center rounded-lg border border-border bg-muted/50 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold tracking-tight text-foreground">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
              <div className="mt-6 border-t border-border pt-4 font-mono text-xs font-semibold text-primary">
                {benefit.metric}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section id="how-it-works" className="border-t border-border bg-card/30 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-[680px] text-center">
          <Badge variant="outline" className="mb-4 rounded-full px-3 py-1 text-xs font-semibold">
            Simple Workflow
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl">
            Three steps to total room engagement
          </h2>
          <p className="mt-4 text-base text-pretty text-muted-foreground sm:text-lg">
            From creating a session to viewing live charts in less than one minute.
          </p>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {workflowSteps.map((step) => (
            <li key={step.id}>
              <Card className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-border/80">
                <span className="font-mono text-sm font-bold text-primary">{step.number}</span>
                <h3 className="mt-4 text-xl font-bold text-foreground">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-pretty text-muted-foreground">
                  {step.body}
                </p>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ProofSection() {
  return (
    <section id="testimonials" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      {/* Proof Stats Bar */}
      <div className="rounded-2xl border border-border bg-card p-8 shadow-md">
        <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3 sm:divide-x sm:divide-border">
          <div className="flex flex-col items-center justify-center p-2">
            <span className="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              14,820
            </span>
            <span className="mt-2 text-xs font-medium text-muted-foreground">
              Live sessions hosted this month
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-2">
            <span className="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              99.4%
            </span>
            <span className="mt-2 text-xs font-medium text-muted-foreground">
              WebSocket stream uptime
            </span>
          </div>
          <div className="flex flex-col items-center justify-center p-2">
            <span className="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              4.8 sec
            </span>
            <span className="mt-2 text-xs font-medium text-muted-foreground">
              Average participant join speed
            </span>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="mt-16">
        <div className="mx-auto max-w-[680px] text-center">
          <h2 className="text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl">
            Trusted by presenters who value active rooms
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <Card key={item.id} className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm">
              <p className="text-sm leading-relaxed text-pretty text-foreground italic">
                "{item.quote}"
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                <img
                  src={item.avatar}
                  alt={item.author}
                  className="size-10 rounded-full border border-border object-cover"
                />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{item.author}</h3>
                  <p className="text-xs text-muted-foreground">
                    {item.role} · {item.company}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section id="faq" className="border-t border-border bg-card/30 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mx-auto max-w-[680px] text-center">
          <Badge variant="outline" className="mb-4 rounded-full px-3 py-1 text-xs font-semibold">
            Got Questions?
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-base text-pretty text-muted-foreground sm:text-lg">
            Everything you need to know about setting up and running your first Pulse live session.
          </p>
        </div>

        <div className="mt-12">
          <Accordion className="w-full">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id} className="border-border px-2">
                <AccordionTrigger className="py-4 text-left text-base font-semibold text-foreground hover:text-primary hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-sm leading-relaxed text-pretty text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

function RiskReversalSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 text-center shadow-xl sm:p-12">
        <div className="mx-auto max-w-[680px]">
          <Badge className="mb-4 rounded-full border-none bg-primary/15 px-3.5 py-1 text-xs font-semibold text-primary">
            Instant Start · No Credit Card Required
          </Badge>

          <h2 className="text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl">
            Ready to bring your next talk or meeting to life?
          </h2>

          <p className="mt-4 text-base text-pretty text-muted-foreground sm:text-lg">
            Create a free session in less than 30 seconds. No credit card required, zero setup downloads, and free forever on the starter tier.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <PrimaryButton href="/host/email" className="h-12 px-6 text-base">
              Create a free session
              <ArrowUpRight className="ml-2 size-5" />
            </PrimaryButton>
            <SecondaryButton href="/join" className="h-12 px-6 text-base">
              <LogIn className="mr-2 size-5 text-primary" />
              Join with Room Code
            </SecondaryButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
          <div>
            <Brand size="lg" />
            <p className="mt-2 text-sm text-pretty text-muted-foreground">
              Pulse for live moments. Present clearly. Listen instantly. Move forward together.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <a href="/privacy" className="transition-colors hover:text-foreground">
              Privacy Policy
            </a>
            <a href="/terms" className="transition-colors hover:text-foreground">
              Terms of Service
            </a>
            <a href="/host/email" className="transition-colors hover:text-foreground">
              Host Login
            </a>
            <a href="/join" className="transition-colors hover:text-foreground">
              Join Room
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Pulse Live Polling. All rights reserved.</p>
          <a
            href="#main-content"
            className="flex items-center gap-1 transition-colors hover:text-foreground"
          >
            Back to top
            <ChevronRight className="size-3 -rotate-90" />
          </a>
        </div>
      </div>
    </footer>
  );
}

function PrimaryButton({
  children,
  className,
  href,
  size = 'default',
}: {
  children: ReactNode;
  className?: string;
  href: string;
  size?: 'default' | 'sm' | 'lg';
}) {
  return (
    <a
      className={cn(
        buttonVariants({ size }),
        'h-10 px-3.5 text-base font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]',
        className,
      )}
      href={href}
    >
      {children}
    </a>
  );
}

function SecondaryButton({
  children,
  className,
  href,
  size = 'default',
}: {
  children: ReactNode;
  className?: string;
  href: string;
  size?: 'default' | 'sm' | 'lg';
}) {
  return (
    <a
      className={cn(
        buttonVariants({ size, variant: 'outline' }),
        'h-10 px-3.5 text-base font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]',
        className,
      )}
      href={href}
    >
      {children}
    </a>
  );
}
