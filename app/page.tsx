"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import PlatformModal from "@/components/platform-modal";
import { FaArrowRight } from "react-icons/fa6";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion, animate } from "framer-motion";
import SplitBillGame from "@/components/split-bill-game";
import {
  TrendingUp,
  Users,
  Bot,
  Wallet,
  Clipboard,
  BarChart3,
  MonitorSmartphone,
  Receipt,
  Tags,
} from "lucide-react";

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

// Split Bill Game content moved to components/split-bill-game

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
    <div className="min-h-screen text-foreground">
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
                  icon: <TrendingUp className="h-6 w-6" />,
                },
                {
                  title: "Split Bills with Friends",
                  desc: "Create groups, settle up, and see who owes what—no spreadsheets needed.",
                  icon: <Users className="h-6 w-6" />,
                },
                {
                  title: "AI-Powered Insights",
                  desc: "Understand trends, get alerts, and optimize your budget automatically.",
                  icon: <Bot className="h-6 w-6" />,
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
                    {f.icon}
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
                  icon: <Wallet className="h-5 w-5 text-primary" />,
                },
                {
                  step: "2",
                  title: "Track & split",
                  desc: "Categorize spending, split with friends, and settle balances in-app.",
                  icon: <Clipboard className="h-5 w-5 text-primary" />,
                },
                {
                  step: "3",
                  title: "Get insights",
                  desc: "See trends, forecasts, and suggestions powered by AI analysis.",
                  icon: <BarChart3 className="h-5 w-5 text-primary" />,
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
                    <h3 className="text-lg font-semibold flex items-center gap-2">{s.icon}{s.title}</h3>
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
                <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Receipt className="h-5 w-5" />
                </div>
                <div className="text-3xl font-bold"><AnimatedNumber value={12000} /></div>
                <p className="text-muted-foreground mt-1">Transactions Tracked</p>
              </div>
              <div>
                <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <div className="text-3xl font-bold"><AnimatedNumber value={850} /></div>
                <p className="text-muted-foreground mt-1">Active Groups</p>
              </div>
              <div>
                <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Tags className="h-5 w-5" />
                </div>
                <div className="text-3xl font-bold"><AnimatedNumber value={98} /></div>
                <p className="text-muted-foreground mt-1">Categories Covered</p>
              </div>
              <div>
                <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <MonitorSmartphone className="h-5 w-5" />
                </div>
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
            <SplitBillGame participants={["You", "Alex", "Sam", "Taylor"]} />
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
