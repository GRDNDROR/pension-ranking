"use client";

import { useState } from "react";

interface MobileNavProps {
  links: Array<{ href: string; label: string }>;
}

export function MobileNav({ links }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-accent transition-colors"
        aria-label="תפריט ניווט"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {isOpen ? (
            <>
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </>
          ) : (
            <>
              <line x1="3" y1="5" x2="17" y2="5" />
              <line x1="3" y1="10" x2="17" y2="10" />
              <line x1="3" y1="15" x2="17" y2="15" />
            </>
          )}
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          {/* Menu */}
          <div className="fixed top-[57px] left-0 right-0 bg-background border-b border-border shadow-lg z-50 animate-in slide-in-from-top-2 duration-200">
            <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-3 rounded-lg hover:bg-accent text-foreground font-medium transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
