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
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(Flip);
  }, []);

  // Sync local state with incoming participants
  useEffect(() => {
    setParticipantNames(participants);
    setSelectedIndex(null);
    setIsDrawing(false);
    setFlipCycle((c) => c + 1);
  }, [participants]);

  const shuffleWithFlip = (iterations = 5, duration = 0.3) => {
    if (!containerRef.current) return Promise.resolve();
    const containerEl = containerRef.current;
    const startHeight = containerEl.offsetHeight;
    containerEl.style.minHeight = `${startHeight}px`;
    containerEl.style.position = containerEl.style.position || "relative";

    const doOnce = () => {
      const state = Flip.getState(containerEl.children);
      setParticipantNames((prev) => {
        const copy = [...prev];
        for (let i = copy.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
      });
      return new Promise<void>((resolve) => {
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

    let p = Promise.resolve();
    for (let i = 0; i < iterations; i += 1) {
      p = p.then(() => doOnce());
    }
    return p.finally(() => {
      containerEl.style.minHeight = "";
    });
  };

  const handleRandomDraw = () => {
    if (isDrawing) return;
    setIsDrawing(true);
    setSelectedIndex(null);
    setFlipCycle((c) => c + 1);

    const targetIndex = Math.floor(Math.random() * participantNames.length);
    shuffleWithFlip(5, 0.28).then(() => {
      setSelectedIndex(targetIndex);
      setRevealCycle((c) => c + 1);
      setIsDrawing(false);
    });
  };

  const handleReset = () => {
    setSelectedIndex(null);
    setIsDrawing(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div ref={containerRef} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {participantNames.map((name, index) => (
          <div key={`${name}-${index}`}>
            <Card
              name={name}
              index={index}
              selectedIndex={selectedIndex}
              flipCycle={flipCycle}
              revealCycle={revealCycle}
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
  flipCycle,
  revealCycle,
}: {
  name: string;
  index: number;
  selectedIndex: number | null;
  flipCycle: number;
  revealCycle: number;
}) {
  const isSelected = selectedIndex === index;
  return (
    <motion.div
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
        <FlipInner
          name={name}
          index={index}
          flipCycle={flipCycle}
          revealCycle={revealCycle}
          revealIndex={selectedIndex}
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
}: {
  name: string;
  index: number;
  flipCycle: number;
  revealCycle: number;
  revealIndex: number | null;
}) {
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
      <div
        className="absolute inset-0 backface-hidden rounded-2xl border overflow-hidden"
        style={{ backfaceVisibility: "hidden" }}
      >
        <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/25 dark:to-primary/10">
          <div className="absolute top-3 left-3 h-4 w-10 rounded bg-primary/30" />
          <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary/25" />
          <div className="absolute inset-0 opacity-30 [background:repeating-linear-gradient(135deg,transparent_0px,transparent_6px,rgba(255,255,255,0.06)_6px,rgba(255,255,255,0.06)_10px)]" />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <span className="text-sm sm:text-base font-semibold text-foreground">{name}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">FINOVA</span>
          </div>
        </div>
      </div>

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
}


