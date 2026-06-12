export function InfoTooltip({ text }) {
  return (
    <span className="group relative inline-flex items-center align-middle">
      <button type="button" className="inline-flex items-center text-text-muted" aria-label={text}>
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-[100] mb-2 hidden w-[220px] -translate-x-1/2 rounded-lg bg-[#1A1614] px-3 py-2 text-xs leading-5 text-white shadow-lg group-hover:block">
        {text}
      </span>
    </span>
  );
}
