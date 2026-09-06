"use client";

import React, { useEffect, useState } from "react";

interface FlipWordsProps {
  words: string[];
  duration?: number;
  className?: string;
}

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
    <span
      style={{
        display: "inline-flex",
        position: "relative",
        verticalAlign: "baseline",
        textAlign: "left",
        overflow: "hidden",
        height: "1.15em",
        lineHeight: "1",
        padding: "0 2px",
        boxSizing: "border-box",
      }}
      className={className}
    >
      <style>{`
        @keyframes flipInChar {
          0% {
            transform: translateY(80%) rotateX(-90deg);
            opacity: 0;
            filter: blur(4px);
          }
          100% {
            transform: translateY(0) rotateX(0deg);
            opacity: 1;
            filter: blur(0);
          }
        }
      `}</style>
      <span
        key={currentWordIndex}
        style={{
          display: "inline-flex",
          flexWrap: "nowrap",
          whiteSpace: "nowrap",
        }}
      >
        {currentWord.split("").map((letter, letterIdx) => (
          <span
            key={letterIdx}
            style={{
              display: "inline-block",
              color: "#ff1e2f",
              animation: "flipInChar 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
              animationDelay: `${letterIdx * 0.035}s`,
              opacity: 0,
              transform: "translateY(80%) rotateX(-90deg)",
              transformOrigin: "bottom center",
              willChange: "transform, opacity",
            }}
          >
            {letter === " " ? "\u00A0" : letter}
          </span>
        ))}
      </span>
    </span>
  );
};
