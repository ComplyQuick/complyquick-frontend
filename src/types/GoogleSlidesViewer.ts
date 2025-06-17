export interface GoogleSlidesViewerProps {
  materialUrl: string;
  currentSlideIndex: number;
  onSlideChange: (index: number) => void;
}
