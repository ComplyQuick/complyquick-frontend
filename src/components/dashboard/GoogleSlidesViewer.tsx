import React, { useRef, useEffect } from 'react';

interface GoogleSlidesViewerProps {
  materialUrl: string;
  currentSlideIndex: number;
  onSlideChange: (index: number) => void;
}

const GoogleSlidesViewer: React.FC<GoogleSlidesViewerProps> = ({ 
  materialUrl, 
  currentSlideIndex,
  onSlideChange 
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Extract the presentation ID from the Google Slides URL
  const getPresentationId = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const presentationId = getPresentationId(materialUrl);
  
  if (!presentationId) {
    return <div className="text-red-500">Invalid Google Slides URL</div>;
  }

  // Convert 0-based index to 1-based for Google Slides
  const slideNumber = currentSlideIndex + 1;
  
  // Construct the embed URL with slide parameter
  const embedUrl = `https://docs.google.com/presentation/d/${presentationId}/embed?start=false&loop=false&delayms=3000&rm=minimal&slide=${slideNumber}`;

  // Handle slide changes by reloading the iframe with the new slide parameter
  useEffect(() => {
    if (iframeRef.current) {
      // Force iframe to reload with new slide parameter
      iframeRef.current.src = embedUrl;
    }
  }, [currentSlideIndex, embedUrl]);

  return (
    <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
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