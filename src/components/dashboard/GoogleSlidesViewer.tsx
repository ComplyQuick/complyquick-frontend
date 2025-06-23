import React, { useRef, useEffect, useState } from "react";
import { GoogleSlidesViewerProps } from "@/types/GoogleSlidesViewer";

const GoogleSlidesViewer = ({
  materialUrl,
  currentSlideIndex,
  onSlideChange,
}: GoogleSlidesViewerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeError, setIframeError] = useState(false);

  // Extract the presentation ID from the Google Slides URL (more robust)
  const getPresentationId = (url: string) => {
    // Regex to find the presentation ID in various Google Slides URL formats
    const regex = /\/presentation\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    if (match && match[1]) {
      return match[1];
    }

    // Fallback for older /d/{id}/edit format
    const oldRegex = /\/d\/([a-zA-Z0-9-_]+)/;
    const oldMatch = url.match(oldRegex);
    if (oldMatch && oldMatch[1]) {
      return oldMatch[1];
    }

    return null;
  };

  const presentationId = getPresentationId(materialUrl);

  // Convert 0-based index to 1-based for Google Slides
  const slideNumber = currentSlideIndex + 1;

  // Always use the correct embed URL format, ignore any query params from input
  const embedUrl = presentationId
    ? `https://docs.google.com/presentation/d/${presentationId}/embed?start=false&loop=false&delayms=3000&rm=minimal&slide=${slideNumber}`
    : "";

  useEffect(() => {
    if (iframeRef.current && embedUrl) {
      setIframeError(false); // Reset error state on change
      iframeRef.current.src = embedUrl;
    }
  }, [currentSlideIndex, embedUrl]);

  const handleReload = () => {
    if (iframeRef.current) {
      setIframeError(false);
      // Force reload of the iframe content
      iframeRef.current.src += "";
    }
  };

  if (!presentationId) {
    console.error("Invalid Google Slides URL:", materialUrl);
    return (
      <div className="text-red-500">
        Invalid Google Slides URL: {materialUrl}
      </div>
    );
  }

  if (iframeError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <div className="text-center p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md">
          <div className="text-red-500 mb-3 text-2xl">⚠️</div>
          <div className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Unable to Load Presentation
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            This can happen if the Google Slides file is set to 'private' or if
            there's a temporary issue with Google's servers.
            <br />
            <strong>
              Please ensure the sharing setting is "Anyone with the link".
            </strong>
          </div>
          <button
            onClick={handleReload}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Reload Slide
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        frameBorder="0"
        allowFullScreen
        title="Google Slides Presentation"
        allow="autoplay"
        onError={() => {
          console.error("Iframe failed to load");
          setIframeError(true);
        }}
        onLoad={() => {
          setIframeError(false);
        }}
      />
    </div>
  );
};

export default GoogleSlidesViewer;
