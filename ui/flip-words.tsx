"use client";

import React, { useEffect, useState } from "react";

interface FlipWordsProps {
  words: string[];
  duration?: number;
  className?: string;
}

/* Each letter flips up into place, staggered by 35ms; the word is keyed so a
   change replaces the letters outright and replays the entrance. */
export const FlipWords = ({ words, duration = 3000, className }: FlipWordsProps) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    if (words.length === 0) return;

    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, duration);

    return () => clearInterval(interval);
  }, [words, duration]);

  // The index is state, so a shorter `words` prop can leave it out of range —
  // an edit to the landing copy re-renders this component in place without
  // resetting it. Clamping here keeps that from throwing on .split() below.
  const currentWord = words[currentWordIndex] ?? words[0];
  if (!currentWord) return null;

  return (
    <span className={`relative box-border inline-flex h-[1.15em] overflow-hidden px-[2px] text-left align-baseline leading-none ${className ?? ""}`}>
      <span key={currentWordIndex} className="inline-flex flex-nowrap whitespace-nowrap">
        {currentWord.split("").map((letter, letterIdx) => (
          <span
            key={letterIdx}
            className="inline-block origin-bottom animate-flip-in-char text-[#ff1e2f] opacity-0 will-change-[transform,opacity] [transform:translateY(80%)_rotateX(-90deg)]"
            style={{ animationDelay: `${letterIdx * 0.035}s` }}
          >
            {letter === " " ? " " : letter}
          </span>
        ))}
      </span>
    </span>
  );
};
