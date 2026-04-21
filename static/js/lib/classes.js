// Reusable Tailwind class strings (kept here so they're tree-shaken by JS reuse).
export const CARD =
    'group bg-white border border-surface-border rounded-2xl p-5 shadow-card ' +
    'hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200';

export const CARD_HEAD = 'flex items-start gap-3 mb-2';
export const CARD_LOGO =
    'w-11 h-11 rounded-xl object-contain p-1 bg-surface-soft border border-surface-border flex-shrink-0';
export const CARD_LOGO_ICON =
    'w-11 h-11 rounded-xl bg-accent-soft text-accent-strong border border-surface-border ' +
    'flex items-center justify-center flex-shrink-0';
export const CARD_TITLE = 'text-base font-semibold text-ink leading-tight';
export const CARD_META = 'text-xs text-ink-muted mt-0.5';
export const CARD_BODY = 'text-sm text-ink-soft mt-2';

export const TAG =
    'inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ' +
    'bg-accent-soft text-accent-strong tracking-wide';

export const SKILL_TAG =
    'inline-flex items-center text-sm font-medium px-3 py-1.5 rounded-full ' +
    'bg-surface-soft border border-surface-border text-ink ' +
    'hover:border-accent hover:text-accent-strong transition cursor-default';
