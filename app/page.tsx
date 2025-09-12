"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import PlatformModal from "@/components/platform-modal";
import { FaArrowRight } from "react-icons/fa6";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion, animate } from "framer-motion";
import gsap from "gsap";
import { Flip } from "gsap/Flip";

function AnimatedNumber({ value, duration = 2 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplayValue(Math.floor(v)),
    });
    return () => controls.stop();
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
}

function SplitBillGameDemo() {
  const [participantNames, setParticipantNames] = useState<string[]>(["You", "Alex", "Sam", "Taylor"]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [flipCycle, setFlipCycle] = useState(0);
  const [revealCycle, setRevealCycle] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    gsap.registerPlugin(Flip);
  }, []);

  const shuffleWithFlip = (iterations = 5, duration = 0.3) => {
    if (!containerRef.current) return Promise.resolve();
    const containerEl = containerRef.current;
    // Pin container height so footer doesn't jump when children go absolute
    const startHeight = containerEl.offsetHeight;
    containerEl.style.minHeight = `${startHeight}px`;
    containerEl.style.position = containerEl.style.position || "relative";

    const doOnce = () => {
      const state = Flip.getState(containerEl.children);
      // Shuffle names order
      setParticipantNames((prev) => {
        const copy = [...prev];
        for (let i = copy.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
      });
      return new Promise<void>((resolve) => {
        // Wait for React to commit DOM updates
        requestAnimationFrame(() => {
          Flip.from(state, {
            duration,
            ease: "power2.inOut",
            absolute: true,
            onComplete: () => resolve(),
          });
        });
      });
    };
    // Chain a few shuffles
    let p = Promise.resolve();
    for (let i = 0; i < iterations; i += 1) {
      p = p.then(() => doOnce());
    }
    return p.finally(() => {
      // Release the height pin after all shuffles
      containerEl.style.minHeight = "";
    });
  };

  const handleRandomDraw = () => {
    if (isDrawing) return;
    setIsDrawing(true);
    setSelectedIndex(null);
    setFlipCycle((c) => c + 1); // trigger single flip for all

    const targetIndex = Math.floor(Math.random() * participantNames.length);
    // perform smooth shuffles
    shuffleWithFlip(5, 0.28).then(() => {
      setSelectedIndex(targetIndex);
      setRevealCycle((c) => c + 1); // trigger reveal flip for selected
      setIsDrawing(false);
    });
  };

  const handleReset = () => {
    setSelectedIndex(null);
    // keep cards as-is; next draw will flip all once again
    setIsDrawing(false);
  };

  const Card = ({ name, index }: { name: string; index: number }) => {
    const isSelected = selectedIndex === index;
    return (
      <motion.div
        key={name}
        className="relative border-2 rounded-2xl"
        animate={{
          scale: isSelected ? 1.05 : 1,
          boxShadow: isSelected
            ? "0 0 0 4px rgba(233,254,82,0.35)"
            : "0 0 0 0px rgba(0,0,0,0)",
        }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        <div className="[perspective:1000px]">
          <FlipInner name={name} index={index} flipCycle={flipCycle} revealCycle={revealCycle} revealIndex={selectedIndex} />
        </div>
      </motion.div>
    );
  };

  const FlipInner = ({
    name,
    index,
    flipCycle,
    revealCycle,
    revealIndex,
  }: {
    name: string;
    index: number;
    flipCycle: number;
    revealCycle: number;
    revealIndex: number | null;
  }) => {
    // use per-card controlled animation to guarantee single flips
    const innerRef = useRef<HTMLDivElement | null>(null);
    const prevFlip = useRef<number>(flipCycle);
    const prevReveal = useRef<number>(revealCycle);

    useEffect(() => {
      if (flipCycle !== prevFlip.current) {
        prevFlip.current = flipCycle;
        if (innerRef.current) gsap.to(innerRef.current, { rotateY: 180, duration: 0.5, ease: "power2.inOut" });
      }
    }, [flipCycle]);

    useEffect(() => {
      if (revealCycle !== prevReveal.current) {
        prevReveal.current = revealCycle;
        if (revealIndex === index && innerRef.current) {
          gsap.to(innerRef.current, { rotateY: 0, duration: 0.5, ease: "power2.inOut" });
        }
      }
    }, [revealCycle, revealIndex, index]);

    return (
      <motion.div
            className="relative h-[120px] sm:h-[150px] md:h-[180px] w-full rounded-2xl"
            style={{ transformStyle: "preserve-3d" }}
            initial={false}
            ref={innerRef}
          >
            {/* Front */}
            <div
              className="absolute inset-0 backface-hidden rounded-2xl border overflow-hidden"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/25 dark:to-primary/10">
                <div className="absolute top-3 left-3 h-4 w-10 rounded bg-primary/30" />
                <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary/25" />
                <div className="absolute inset-0 opacity-30 [background:repeating-linear-gradient(135deg,transparent_0px,transparent_6px,rgba(255,255,255,0.06)_6px,rgba(255,255,255,0.06)_10px)]" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className="text-sm sm:text-base font-semibold">{name}</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">FINOVA</span>
                </div>
              </div>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 rounded-2xl border overflow-hidden [transform:rotateY(180deg)] backface-hidden"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="h-full w-full bg-gradient-to-br from-background to-muted/40">
                <div className="absolute top-4 left-0 right-0 h-6 bg-foreground/70" />
                <div className="absolute top-14 right-6 h-6 w-24 rounded bg-muted/70" />
                <div className="absolute bottom-4 left-4 right-4 text-right text-[10px] sm:text-xs text-muted-foreground">finova.app</div>
              </div>
            </div>
          </motion.div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div ref={containerRef} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {participantNames.map((name, index) => (
          <div key={name} ref={(el) => { cardRefs.current[index] = el; }}>
            <Card name={name} index={index} />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3 mt-6">
        {selectedIndex === null ? (
          <button
            onClick={handleRandomDraw}
            disabled={isDrawing}
            className="rounded-full bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
          >
            {isDrawing ? "Shuffling..." : "Draw a card"}
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="rounded-full bg-secondary px-6 py-2 text-secondary-foreground hover:bg-secondary/90 transition-all duration-200 cursor-pointer"
          >
            Play again
          </button>
        )}
        <Link href="/auth/login" className="text-sm underline text-muted-foreground hover:text-foreground">
          Invite friends / Try in groups
        </Link>
      </div>

      {selectedIndex !== null && (
        <div className="mt-3 text-center text-sm text-muted-foreground">
          Loser pays: <span className="font-medium text-foreground">{participantNames[selectedIndex]}</span>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/protected/dashboard");
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed w-full top-0 z-50 bg-transparent backdrop-blur-md ">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[70px] md:h-[90px]">
              {/* Logo */}
              <>
                <Image src="/finova-logo.svg" alt="Logo" width={185} height={42} className="w-[100px] h-[25px] md:w-[150px] md:h-[30px] object-contain cursor-pointer block dark:hidden"/>
                <Image src="/finova-white-logo.svg" alt="Logo" width={185} height={42} className="w-[100px] h-[25px] md:w-[150px] md:h-[30px] object-contain cursor-pointer hidden dark:block"/>
              </>
              {/* Desktop Navigation */}
              <div className="hidden sm:flex sm:items-center sm:space-x-8 font-[inter] font-medium text-base">
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
                <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                  How it works
                </a>
                <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
                  Testimonials
                </a>
                <a href="#stats" className="text-muted-foreground hover:text-foreground transition-colors">
                  Stats
                </a>
                <a href="#game" className="text-muted-foreground hover:text-foreground transition-colors">
                  Games
                </a>
              </div>
            <div className="flex items-center gap-6">
              <div className=" gap-2 hidden md:flex">
                <Link href="/auth/login" className="bg-secondary hover:bg-secondary/80 transition-all duration-200 text-secondary-foreground px-4 py-1 rounded-4xl whitespace-nowrap font-medium">Log In</Link>

              </div>
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden">
              <button className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Add margin-top to prevent content from going under fixed header */}
      <div className="pt-[90px]">
        {/* Hero Section */}
        <section className="bg-background py-2 h-[550px] overflow-hidden">
          <div className="w-full h-full mx-auto px-4 sm:px-6 lg:px-8 relative flex items-center justify-center">
            <motion.div
              aria-hidden
              className="absolute -top-16 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="absolute -bottom-20 -left-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />
            <Image src="/fimi.svg" alt="Fimi" width={300} height={280} className="w-[190px] h-[180px] md:w-[300px] md:h-[280px] absolute top-5 md:top-10 left-[50%] -translate-x-1/2 object-cover z-0" />
            <Image src="/herobg.svg" alt="Hero Background" fill className="hidden md:block absolute top-0 object-cover z-0" />
            <div className="pt-[50px] md:pt-[230px] text-center z-10 flex flex-col items-center justify-center gap-3">
              <motion.h1
                className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl font-[grifterbold]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                Your All-in-One <br /> <span className="text-primary">Finance</span> Companion.
              </motion.h1>
              <motion.p
                className="md:max-w-2xl w-[320px] md:w-full mx-auto text-sm md:text-lg text-muted-foreground font-medium font-[inter]"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
              >
                A smarter way to manage your money—track, split, and analyze your expenses effortlessly.
              </motion.p>

              <motion.div
                className="rounded-full bg-primary hover:bg-primary/90 transition-all duration-200 px-6 py-3 h-[40px] md:h-[50px] font-medium text-[14px] md:text-lg font-[inter] text-primary-foreground cursor-pointer flex items-center justify-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
              >
                <Link href="/auth/login" className="flex items-center gap-2 font-semibold">Get Started</Link> <FaArrowRight />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl font-[grifterbold]">
              Track your finances in a whole new way
              </h2>
            </div>
            
            <div className="mt-20 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Track Expenses Effortlessly",
                  desc: "Capture spending in seconds. Auto-categorize and keep everything organized.",
                },
                {
                  title: "Split Bills with Friends",
                  desc: "Create groups, settle up, and see who owes what—no spreadsheets needed.",
                },
                {
                  title: "AI-Powered Insights",
                  desc: "Understand trends, get alerts, and optimize your budget automatically.",
                },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  className="flex flex-col items-center rounded-2xl border p-8 bg-card/30 backdrop-blur-sm"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                >
                  <div className="h-12 w-12 rounded-md bg-primary/15 text-primary flex items-center justify-center">
                    <span className="text-lg font-bold">{i + 1}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-foreground text-center">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-center text-muted-foreground">
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl font-[grifterbold]">
                How it works
              </h2>
              <p className="mt-2 text-muted-foreground">Three simple steps to get clarity.</p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Connect accounts",
                  desc: "Bring in your transactions or add them manually—your data, your control.",
                },
                {
                  step: "2",
                  title: "Track & split",
                  desc: "Categorize spending, split with friends, and settle balances in-app.",
                },
                {
                  step: "3",
                  title: "Get insights",
                  desc: "See trends, forecasts, and suggestions powered by AI analysis.",
                },
              ].map((s, i) => (
                <motion.div
                  key={s.step}
                  className="rounded-2xl border p-6 bg-card/30 backdrop-blur-sm"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold">
                      {s.step}
                    </div>
                    <h3 className="text-lg font-semibold">{s.title}</h3>
                  </div>
                  <p className="mt-3 text-muted-foreground">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section id="stats" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 rounded-2xl border p-8 bg-card/30 backdrop-blur-sm text-center">
              <div>
                <div className="text-3xl font-bold"><AnimatedNumber value={12000} /></div>
                <p className="text-muted-foreground mt-1">Transactions Tracked</p>
              </div>
              <div>
                <div className="text-3xl font-bold"><AnimatedNumber value={850} /></div>
                <p className="text-muted-foreground mt-1">Active Groups</p>
              </div>
              <div>
                <div className="text-3xl font-bold"><AnimatedNumber value={98} /></div>
                <p className="text-muted-foreground mt-1">Categories Covered</p>
              </div>
              <div>
                <div className="text-3xl font-bold"><AnimatedNumber value={4} /></div>
                <p className="text-muted-foreground mt-1">Platforms Supported</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl font-[grifterbold]">
                Loved by our users
              </h2>
              <p className="mt-2 text-muted-foreground">Real stories from people getting control over their money.</p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  quote: "Finova made splitting expenses with my housemates painless.",
                  author: "Avery",
                },
                {
                  quote: "The insights helped me cut unnecessary spending by 20% in a month.",
                  author: "Jordan",
                },
                {
                  quote: "I love how quick it is to add expenses on the go.",
                  author: "Riley",
                },
              ].map((t, i) => (
                <motion.div
                  key={t.author}
                  className="rounded-2xl border p-6 bg-card/30 backdrop-blur-sm"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: i * 0.1, duration: 0.45, ease: "easeOut" }}
                >
                  <p className="text-base">“{t.quote}”</p>
                  <p className="mt-4 text-sm text-muted-foreground">— {t.author}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Split Bill Game */}
        <section id="game" className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl font-[grifterbold]">
                Split Bill Game (Demo)
              </h2>
              <p className="mt-2 text-muted-foreground">
                Invite your friends or play within your group. Draw a random “card” to decide who pays.
              </p>
            </div>
            <SplitBillGameDemo />
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-muted-foreground">
              <p>© 2025 Finova. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
      <PlatformModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
