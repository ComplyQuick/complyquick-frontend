import React from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Subtitles,
  Maximize,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { SlideControlsProps } from "@/types/course";

const SlideControls = ({
  isPlaying,
  togglePlayback,
  handlePrev,
  handleNext,
  isFirstSlide,
  isLastSlide,
  isMuted,
  toggleMute,
  volume,
  handleVolumeChange,
  playbackRate,
  changePlaybackRate,
  onComplete,
  showSubtitles,
  toggleSubtitles,
  canAdvance,
  progress,
  setProgress,
  setCanAdvance,
  isAdminView = false,
  onFullScreen,
}: SlideControlsProps) => {
  const handleNextClick = () => {
    if (!isAdminView && !canAdvance && progress < 80) {
      toast.info(
        "Please complete at least 80% of this slide before moving to the next one"
      );
      return;
    }
    handleNext();
    setProgress(0);
    setCanAdvance(false);
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            disabled={isFirstSlide}
          >
            <SkipBack className="h-4 w-4 text-white" />
          </Button>

          <Button variant="ghost" size="icon" onClick={togglePlayback}>
            {isPlaying ? (
              <Pause className="h-4 w-4 text-white" />
            ) : (
              <Play className="h-4 w-4 text-white" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextClick}
            disabled={!isAdminView && !canAdvance}
          >
            <SkipForward className="h-4 w-4 text-white" />
          </Button>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={toggleMute}>
              {isMuted ? (
                <VolumeX className="h-4 w-4 text-white" />
              ) : (
                <Volume2 className="h-4 w-4 text-white" />
              )}
            </Button>
            <div className="w-24">
              <Slider
                value={[volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Playback Speed Dropdown */}
          <div className="relative flex items-center">
            <span className="mr-2 text-xs text-white">Speed</span>
            <div className="relative">
              <select
                value={playbackRate}
                onChange={(e) => changePlaybackRate(Number(e.target.value))}
                className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-3 py-1 text-sm font-medium shadow focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-20 pr-6"
                style={{ minWidth: "60px" }}
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                ▼
              </span>
            </div>
          </div>
          {/* Subtitle Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSubtitles}
            aria-label="Toggle Subtitles"
          >
            <Subtitles
              className={`h-5 w-5 text-white ${
                showSubtitles ? "text-blue-500" : ""
              }`}
            />
          </Button>
          {/* Full Screen Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onFullScreen}
            aria-label="Full Screen"
          >
            <Maximize className="h-5 w-5 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SlideControls;
