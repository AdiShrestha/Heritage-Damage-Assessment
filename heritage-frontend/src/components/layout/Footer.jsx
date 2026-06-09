export function Footer() {
  return (
    <footer className="relative bg-[#1C1816] px-4 pt-6 pb-5 text-center">
      <div className="mx-auto mb-4 flex items-center justify-center gap-3">
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#D4A04A]/40" />
        <svg
          width="16"
          height="16"
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
          className="text-[#D4A04A]/60"
        >
          <rect
            x="14"
            y="10"
            width="36"
            height="44"
            rx="2"
            fill="currentColor"
          />
          <rect
            x="20"
            y="4"
            width="24"
            height="8"
            rx="2"
            fill="currentColor"
            opacity="0.7"
          />
          <rect
            x="22"
            y="22"
            width="20"
            height="20"
            rx="1"
            fill="rgba(255,255,255,0.15)"
          />
          <path d="M32 24l4 8h-8z" fill="currentColor" opacity="0.3" />
        </svg>
        <div className="h-px w-12 bg-gradient-to-r from-[#D4A04A]/40 to-transparent" />
      </div>
      <p className="font-display text-xs italic tracking-wide text-[#A69A92]">
        Heritage Damage Assessment
      </p>
      <p className="mt-1 text-[10px] text-[#7A726C]">
        AI-assisted cultural heritage preservation
      </p>
    </footer>
  );
}
