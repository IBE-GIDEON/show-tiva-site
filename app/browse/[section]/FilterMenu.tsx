"use client";

// A filter control shaped like a pill, not a form field.
//
// Replaces a native <select> in a bordered cell: the pill carries the current
// value as its own label, so there is no micro-label above it and no box
// around it, and picking a value happens in a floating panel rather than the
// browser's dropdown — which cannot be styled and looks like the host OS
// rather than the app.
//
// The pill is quiet while the filter is at its default and solid once it is
// actually narrowing something, so a glance across the row says what is on.

import { useEffect, useRef, useState } from "react";

import { cx } from "@/lib/cx";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterMenuProps {
  /** Announced name for the control. The pill paints the value instead. */
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  /** The "no filter" value. Anything else lights the pill up. */
  neutralValue?: string;
}

const PILL =
  "inline-flex h-9 max-w-full cursor-pointer items-center gap-2 rounded-full border-0 px-4 font-body text-[0.82rem] font-semibold whitespace-nowrap transition-[background-color,color] duration-200 ease-[ease] focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink";
const PILL_OFF =
  "bg-[rgba(255,255,225,0.07)] text-[rgba(255,255,225,0.72)] hover:bg-[rgba(255,255,225,0.13)] hover:text-ink";
const PILL_ON = "bg-ink text-black hover:bg-[#f0f0d6]";

const PANEL =
  "absolute top-[calc(100%+8px)] left-0 z-[60] max-h-[min(320px,58vh)] w-[max(100%,208px)] origin-top-left animate-menu-in overflow-y-auto rounded-2xl bg-[#141414] p-[6px] shadow-[0_26px_64px_rgba(0,0,0,0.7)] backdrop-blur-[18px] motion-reduce:animate-none";

const ITEM =
  "flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border-0 bg-transparent px-3 py-[9px] text-left font-body text-[0.85rem] transition-[background-color,color] duration-150 ease-[ease]";
const ITEM_ON = "bg-[rgba(255,255,225,0.1)] font-semibold text-ink";
const ITEM_OFF = "font-medium text-[rgba(255,255,225,0.68)] hover:bg-[rgba(255,255,225,0.06)] hover:text-ink";

export default function FilterMenu({
  label,
  value,
  options,
  onChange,
  neutralValue = "",
}: FilterMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const current = options.find((o) => o.value === value) ?? options[0];
  const active = value !== neutralValue;

  // Escape closes and hands focus back; a click anywhere else just closes.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  // Arrow keys walk the panel. The items are real buttons, so Enter and Space
  // already activate them and need nothing here.
  const onPanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();

    const items = Array.from(
      rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? [],
    );
    if (items.length === 0) return;

    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? items.length - 1
          : e.key === "ArrowDown"
            ? (at + 1) % items.length
            : (at - 1 + items.length) % items.length;

    items[next]?.focus();
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={cx(PILL, active ? PILL_ON : PILL_OFF)}
        aria-haspopup="menu"
        aria-expanded={open}
        // The pill shows only the value, so the name has to carry both.
        aria-label={`${label}: ${current?.label ?? ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="truncate">{current?.label}</span>
        <svg
          className={cx(
            "flex-none transition-[transform] duration-200 ease-[ease] motion-reduce:transition-none",
            open && "[transform:rotate(180deg)]",
          )}
          viewBox="0 0 24 24"
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div role="menu" aria-label={label} className={PANEL} onKeyDown={onPanelKeyDown}>
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value || "__neutral"}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                className={cx(ITEM, selected ? ITEM_ON : ITEM_OFF)}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                <span className="truncate">{option.label}</span>
                {selected && (
                  <svg
                    className="flex-none text-[#fc3343]"
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
