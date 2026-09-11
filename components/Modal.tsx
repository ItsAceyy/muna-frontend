"use client";

import { ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** md for forms, lg and xl for anything with a table in it. */
  size?: "md" | "lg" | "xl";
}

const WIDTHS = { md: "max-w-md", lg: "max-w-2xl", xl: "max-w-4xl" };

export default function Modal({ title, onClose, children, size = "md" }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`bg-card rounded-2xl shadow-xl w-full ${WIDTHS[size]} max-h-[90vh] flex flex-col p-6 border border-border/60 animate-in fade-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-lg font-display font-medium text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl leading-none transition-colors duration-150"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}