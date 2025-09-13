"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { Flip } from "gsap/Flip";

export type SplitBillGameProps = {
  participants: string[];
};

export default function SplitBillGame({ participants }: SplitBillGameProps) {
  const [participantNames, setParticipantNames] = useState<string[]>(participants);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [flipCycle, setFlipCycle] = useState(0);
  const [revealCycle, setRevealCycle] = useState(0);
  const [resetCycle, setResetCycle] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(Flip);
  }, []);

  // Sync local state with incoming participants
  useEffect(() => {
    setParticipantNames(participants);
    setSelectedIndex(null);
    setIsDrawing(false);
    setResetCycle((c) => c + 1);
  }, [participants]);

  // Removed positional shuffling to keep cards in place

  const handleRandomDraw = () => {
    if (isDrawing) return;
    setIsDrawing(true);
    setSelectedIndex(null);
    // Flip all to back briefly for suspense
    setFlipCycle((c) => c + 1);
    const targetIndex = Math.floor(Math.random() * participantNames.length);
    // Reveal selected after a short delay without reordering
    setTimeout(() => {
      setSelectedIndex(targetIndex);
      setRevealCycle((c) => c + 1);
      setIsDrawing(false);
    }, 650);
  };

  const handleReset = () => {
    setSelectedIndex(null);
    setIsDrawing(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {participantNames.map((name, index) => (
          <div key={`${name}-${index}`}>
            <Card
              name={name}
              index={index}
              selectedIndex={selectedIndex}
              isDrawing={isDrawing}
              flipCycle={flipCycle}
              revealCycle={revealCycle}
              resetCycle={resetCycle}
            />
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
      </div>

      {selectedIndex !== null && (
        <div className="mt-3 text-center text-sm text-muted-foreground">
          Loser pays: <span className="font-medium text-foreground">{participantNames[selectedIndex]}</span>
        </div>
      )}
    </div>
  );
}

function Card({
  name,
  index,
  selectedIndex,
  isDrawing,
  flipCycle,
  revealCycle,
  resetCycle,
}: {
  name: string;
  index: number;
  selectedIndex: number | null;
  isDrawing: boolean;
  flipCycle: number;
  revealCycle: number;
  resetCycle: number;
}) {
  const isSelected = selectedIndex === index;
  return (
    <motion.div
      className={`relative border-2 rounded-xl ${isSelected ? "" : ""}`}
      animate={{
        scale: 1,
        boxShadow: isSelected
          ? "0 0 0 4px rgba(233,254,82,0.45)"
          : isDrawing
          ? "0 0 0 3px rgba(233,254,82,0.25)"
          : "0 0 0 0px rgba(0,0,0,0)",
        filter: isSelected ? "brightness(1)" : isDrawing ? "brightness(0.95)" : "brightness(1)",
      }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <div className="[perspective:1000px]">
        <FlipInner
          name={name}
          index={index}
          flipCycle={flipCycle}
          revealCycle={revealCycle}
          revealIndex={selectedIndex}
          resetCycle={resetCycle}
        />
      </div>
    </motion.div>
  );
}

function FlipInner({
  name,
  index,
  flipCycle,
  revealCycle,
  revealIndex,
  resetCycle,
}: {
  name: string;
  index: number;
  flipCycle: number;
  revealCycle: number;
  revealIndex: number | null;
  resetCycle: number;
}) {
  const VARIANTS = [
    { from: "from-rose-400/25", to: "to-rose-400/10", border: "border-rose-300/40", badge: "bg-rose-400/30", circle: "bg-rose-400/25" },
    { from: "from-amber-400/25", to: "to-amber-400/10", border: "border-amber-300/40", badge: "bg-amber-400/30", circle: "bg-amber-400/25" },
    { from: "from-emerald-400/25", to: "to-emerald-400/10", border: "border-emerald-300/40", badge: "bg-emerald-400/30", circle: "bg-emerald-400/25" },
    { from: "from-sky-400/25", to: "to-sky-400/10", border: "border-sky-300/40", badge: "bg-sky-400/30", circle: "bg-sky-400/25" },
    { from: "from-violet-400/25", to: "to-violet-400/10", border: "border-violet-300/40", badge: "bg-violet-400/30", circle: "bg-violet-400/25" },
  ];
  const variant = VARIANTS[index % VARIANTS.length];
  const innerRef = useRef<HTMLDivElement | null>(null);
  const prevFlip = useRef<number>(flipCycle);
  const prevReveal = useRef<number>(revealCycle);

  useEffect(() => {
    if (flipCycle !== prevFlip.current) {
      prevFlip.current = flipCycle;
      if (innerRef.current) gsap.to(innerRef.current, { rotateY: 180, duration: 0.45, ease: "power2.inOut" });
    }
  }, [flipCycle]);

  useEffect(() => {
    if (revealCycle !== prevReveal.current) {
      prevReveal.current = revealCycle;
      if (revealIndex === index && innerRef.current) {
        gsap.to(innerRef.current, { rotateY: 0, duration: 0.45, ease: "power2.inOut" });
      }
    }
  }, [revealCycle, revealIndex, index]);

  // Ensure front face when participants change
  useEffect(() => {
    if (innerRef.current) {
      gsap.set(innerRef.current, { rotateY: 0 });
    }
  }, [resetCycle]);

  return (
    <motion.div
      className="relative rounded-xl w-full aspect-[16/10]"
      style={{ transformStyle: "preserve-3d" }}
      initial={false}
      ref={innerRef}
    >
      <div
        className={`absolute inset-0 backface-hidden rounded-xl border overflow-hidden ${variant.border} will-change-transform`}
        style={{ backfaceVisibility: "hidden" }}
      >
        <div className={`h-full w-full bg-gradient-to-br ${variant.from} ${variant.to}`}>
          <div className={`absolute top-3 left-3 h-4 w-10 rounded ${variant.badge}`} />
          <div className={`absolute top-3 right-3 h-6 w-6 rounded-full ${variant.circle}`} />
          <div className="absolute inset-0 opacity-30 [background:repeating-linear-gradient(135deg,transparent_0px,transparent_6px,rgba(255,255,255,0.06)_6px,rgba(255,255,255,0.06)_10px)]" />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <span className="text-sm sm:text-base font-semibold text-foreground">{name}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">FINOVA</span>
          </div>
        </div>
      </div>

      <div
        className="absolute inset-0 rounded-xl border overflow-hidden [transform:rotateY(180deg)] backface-hidden will-change-transform"
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
}


