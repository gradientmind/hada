"use client";

export function FollowUpChips(props: {
  suggestions: string[];
  disabled?: boolean;
  onSelect: (value: string) => void;
}) {
  if (!props.suggestions.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {props.suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          disabled={props.disabled}
          onClick={() => props.onSelect(suggestion)}
          className="rounded-full border border-zinc-200/80 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-600 transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:border-teal-800 dark:hover:bg-teal-950/30 dark:hover:text-teal-300"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
