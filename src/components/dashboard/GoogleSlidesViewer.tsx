import React, { useRef, useEffect } from "react";
import { GoogleSlidesViewerProps } from "@/types/GoogleSlidesViewer";

const GoogleSlidesViewer = ({
  materialUrl,
  currentSlideIndex,
  onSlideChange,
}: GoogleSlidesViewerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Extract the presentation ID from the Google Slides URL (robust for any format)
  const getPresentationId = (url: string) => {
    // Handles /d/{id}/... in any Google Slides URL
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
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
      iframeRef.current.src = embedUrl;
    }
  }, [currentSlideIndex, embedUrl]);

  if (!presentationId) {
    return <div className="text-red-500">Invalid Google Slides URL</div>;
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
      />
    </div>
  );
};

export default GoogleSlidesViewer;
