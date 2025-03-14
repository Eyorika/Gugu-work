
interface LoadingSpinnerProps {
  fullScreen?: boolean;
  className?: string;
}

export default function LoadingSpinner({ 
    fullScreen = false, 
    className = ''
  }: LoadingSpinnerProps) {
    return (
      <div
        className={`flex items-center justify-center ${
          fullScreen ? "fixed inset-0 bg-background/50" : "w-full h-full"
        } ${className}`}
        aria-label="Loading"
        role="status"
      >
      <svg
        className="animate-spin h-8 w-8 text-primary"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}