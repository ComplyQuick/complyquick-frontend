import GoogleSlidesViewer from './GoogleSlidesViewer';

const renderMaterial = () => {
  if (!currentMaterial) return null;

  switch (currentMaterial.type) {
    case 'video':
      return (
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          <iframe
            src={currentMaterial.url}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            title="Video Player"
          />
        </div>
      );
    case 'document':
      return (
        <div className="relative w-full" style={{ height: '80vh' }}>
          <iframe
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(currentMaterial.url)}&embedded=true`}
            className="absolute inset-0 w-full h-full"
            title="Document Viewer"
          />
        </div>
      );
    case 'presentation':
      return <GoogleSlidesViewer materialUrl={currentMaterial.url} />;
    default:
      return <div>Unsupported material type</div>;
  }
}; 