import { AlertCircle } from 'lucide-react';

export function ErrorAlert({ title, message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50/80 p-5 shadow-card backdrop-blur-sm">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#A63A2A]" />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-[#7A2A1A]">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-[#8B3A2A]">{message}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center rounded-lg bg-gradient-to-r from-[#A63A2A] to-[#C54F3A] px-4 py-2 text-sm font-medium text-white transition-all duration-150 ease-in-out hover:from-[#8B2A1A] hover:to-[#A63A2A]"
            >
              Try Again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
