export function LoadingSpinner({ size = 'md', label }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-[3px]',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`animate-spin rounded-full border-primary border-t-transparent ${sizeClasses[size]}`}
        aria-label="Loading"
      />
      {label ? <p className="mt-3 text-sm text-text-muted">{label}</p> : null}
    </div>
  );
}
