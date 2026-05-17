import { AlertCircle } from 'lucide-react';

export function ErrorAlert({ title, message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-card">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-red-900">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-red-800">{message}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors duration-150 ease-in-out hover:bg-primary-light"
            >
              Try Again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
