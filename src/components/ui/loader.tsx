import { Loader2 } from "lucide-react";

interface LoaderProps {
  message?: string;
  className?: string;
}

export function Loader({
  message = "Loading...",
  className = "",
}: LoaderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 ${className}`}
    >
      <Loader2 className="h-8 w-8 animate-spin text-complybrand-700" />
      <p className="mt-4 text-sm text-gray-600">{message}</p>
    </div>
  );
}
