"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import styles from "./card-stack.module.css";

export type CardStackItem = {
  id: number;
  name: string;
  designation: string;
  content: React.ReactNode;
};

type CardStackProps = {
  items: CardStackItem[];
  offset?: number;
  scaleFactor?: number;
  flipIntervalMs?: number;
};

export function CardStack({
  items,
  offset = 12,
  scaleFactor = 0.06,
  flipIntervalMs = 5000,
}: CardStackProps) {
  // The shuffle is stored as a rotation offset rather than a copied array, so a
  // new `items` prop needs no state sync — copying it into state meant an
  // effect had to mirror every prop change back into that copy, which is the
  // cascading-render pattern React warns about.
  const [rotation, setRotation] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion || items.length === 0) return;

    const interval = setInterval(() => setRotation((prev) => prev + 1), flipIntervalMs);
    return () => clearInterval(interval);
  }, [flipIntervalMs, items.length, shouldReduceMotion]);

  // Each tick moves the last card to the front, so card i is item i - rotation.
  // Taken modulo the current length, this stays correct even if `items` resizes.
  const cards = items.map(
    (_, index) => items[(index - (rotation % items.length) + items.length) % items.length],
  );

  return (
    <div className={styles.stackRoot}>
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          className={styles.stackCard}
          style={{ transformOrigin: "top center" }}
          animate={{
            top: index * -offset,
            scale: 1 - index * scaleFactor,
            zIndex: cards.length - index,
          }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.45, ease: [0.25, 1, 0.5, 1] }
          }
        >
          <div className={styles.cardContent}>{card.content}</div>
          <div className={styles.cardFooter}>
            <p className={styles.cardName}>{card.name}</p>
            <p className={styles.cardDesignation}>{card.designation}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
