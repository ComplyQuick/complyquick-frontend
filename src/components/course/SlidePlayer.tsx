import React, { useState, useEffect, useRef, useCallback } from "react";
import SlideControls from "./SlideControls";
import SlideNavigation from "./SlideNavigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import GoogleSlidesViewer from "@/components/dashboard/GoogleSlidesViewer";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Explanation, SlidePlayerProps } from "@/types/course";
import { Card } from "@/components/ui/card";
import { slideService } from "@/services/slideService";
import { Wand2 } from "lucide-react";

function parseWebVTT(vttText: string) {
  const lines = vttText.split("\n");
  const subtitles: { start: number; end: number; text: string }[] = [];
  let currentSubtitle: { start: number; end: number; text: string } | null =
    null;

  for (const line of lines) {
    if (line.includes("-->")) {
      const [start, end] = line.split(" --> ").map((time) => {
        const [h, m, s] = time.split(":");
        return parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s);
      });
      currentSubtitle = { start, end, text: "" };
    } else if (currentSubtitle && line.trim() && !line.startsWith("WEBVTT")) {
      currentSubtitle.text += line.trim() + " ";
    } else if (currentSubtitle && !line.trim() && currentSubtitle.text) {
      currentSubtitle.text = currentSubtitle.text.trim();
      subtitles.push(currentSubtitle);
      currentSubtitle = null;
    }
  }

  if (currentSubtitle && currentSubtitle.text) {
    currentSubtitle.text = currentSubtitle.text.trim();
    subtitles.push(currentSubtitle);
  }

  return subtitles;
}

const SlidePlayer = ({
  slides,
  setSlides,
  currentSlideIndex,
  onSlideChange,
  onComplete,
  explanations,
  isLoadingExplanations,
  properties,
  onSkipForward,
  onSkipBackward,
  resumeSlideIndex,
  isAdminView = false,
  materialUrl: propMaterialUrl,
}: SlidePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [canAdvance, setCanAdvance] = useState(false);
  const [slideExplanations, setSlideExplanations] = useState<Explanation[]>([]);
  const [currentExplanation, setCurrentExplanation] = useState<string>("");
  const [currentSubtitle, setCurrentSubtitle] = useState<string>("");
  const [materialUrl, setMaterialUrl] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [showSkipFeedback, setShowSkipFeedback] = useState<
    null | "forward" | "backward"
  >(null);
  const [showOverlayControls, setShowOverlayControls] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isGeneratingMCQ, setIsGeneratingMCQ] = useState(false);
  const [maxVisitedSlide, setMaxVisitedSlide] = useState(resumeSlideIndex);
  const isLastSlide = currentSlideIndex === slides.length - 1;
  const totalCompleted = slides.filter((slide) => slide.completed).length;
  const overallProgress = (totalCompleted / slides.length) * 100;
  const [showAdminCompleteModal, setShowAdminCompleteModal] = useState(false);
  const slideAreaRef = useRef<HTMLDivElement>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [showEnhanceDialog, setShowEnhanceDialog] = useState(false);

  // Fetch explanations when component mounts
  useEffect(() => {
    const fetchExplanations = async () => {
      try {
        const tenantId = localStorage.getItem("tenantId");
        if (!courseId || !tenantId) {
          throw new Error("Missing courseId or tenantId");
        }

        // For admin view, use the provided materialUrl
        if (isAdminView && propMaterialUrl) {
          console.log(
            "Using provided materialUrl for admin view:",
            propMaterialUrl
          );
          setMaterialUrl(propMaterialUrl);
        } else {
          // For regular users, fetch the materialUrl
          try {
            const material = await slideService.fetchCourseMaterial(
              courseId,
              tenantId
            );
            console.log("Material URL fetched for user:", material);
            setMaterialUrl(material);
          } catch (materialError) {
            console.warn("Failed to fetch material URL:", materialError);
            // Don't fail the entire load if material URL fetch fails
          }
        }

        const explanations = await slideService.fetchExplanations(
          courseId,
          tenantId
        );
        setSlideExplanations(explanations);

        // Set initial explanation
        const initialExplanation = explanations.find(
          (exp: Explanation) => exp.slide === currentSlideIndex + 1
        );
        if (initialExplanation) {
          setCurrentExplanation(initialExplanation.explanation);
          if (initialExplanation.explanation_subtitle) {
            const subtitles = parseWebVTT(
              initialExplanation.explanation_subtitle
            );
            if (subtitles.length > 0) {
              setCurrentSubtitle(subtitles[0].text);
            }
          }
        }
      } catch (error) {
        console.error("Error in fetchExplanations:", error);
        toast.error("Failed to load slide explanations");
      }
    };

    fetchExplanations();
  }, [courseId, currentSlideIndex, isAdminView, propMaterialUrl]);

  // Update current explanation when slide changes
  useEffect(() => {
    const explanation = slideExplanations.find(
      (exp) => exp.slide === currentSlideIndex + 1
    );
    if (explanation) {
      setCurrentExplanation(explanation.explanation);
      // Reset progress and playback state
      setProgress(0);
      setIsPlaying(true);
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    }
  }, [currentSlideIndex, slideExplanations]);

  const handleComplete = useCallback(async () => {
    if (isAdminView) {
      // For admin view, just mark all slides as completed and show modal
      const updatedSlides = slides.map((slide) => ({
        ...slide,
        completed: true,
      }));
      setSlides(updatedSlides);
      setShowAdminCompleteModal(true);
      onComplete();
      return;
    }
    if (!isLastSlide && overallProgress < 80) {
      toast.error(
        "You need to complete at least 80% of the course to proceed."
      );
      return;
    }

    try {
      const tenantId = localStorage.getItem("tenantId");
      const token = localStorage.getItem("token");
      if (!courseId || !tenantId || !token) {
        throw new Error("Missing required parameters");
      }

      await slideService.updateProgress(
        courseId,
        tenantId,
        token,
        100,
        currentSlideIndex + 1
      );

      setShowCompletionModal(true);
      // Pause playback on last slide after completion
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } catch (error) {
      toast.error("Failed to complete course");
    }
  }, [
    isAdminView,
    slides,
    setSlides,
    onComplete,
    isLastSlide,
    overallProgress,
    courseId,
    currentSlideIndex,
    setIsPlaying,
  ]);

  const handleNext = useCallback(async () => {
    if (isAdminView) {
      // For admin view, just move to next slide without restrictions
      if (currentSlideIndex < slides.length - 1) {
        onSlideChange(currentSlideIndex + 1);
      } else {
        handleComplete();
      }
      return;
    }

    // Original next slide logic for user view
    if (!canAdvance && !properties?.skippable) {
      return;
    }

    if (currentSlideIndex < slides.length - 1) {
      // Update current slide as completed
      const updatedSlides = [...slides];
      updatedSlides[currentSlideIndex] = {
        ...updatedSlides[currentSlideIndex],
        completed: true,
      };
      setSlides(updatedSlides);

      // Calculate and update progress
      const totalCompleted = updatedSlides.filter(
        (slide) => slide.completed
      ).length;
      const progress = (totalCompleted / slides.length) * 100;

      try {
        const tenantId = localStorage.getItem("tenantId");
        const token = localStorage.getItem("token");
        if (!courseId || !tenantId || !token) {
          throw new Error("Missing required parameters");
        }

        await slideService.updateProgress(
          courseId,
          tenantId,
          token,
          progress,
          currentSlideIndex + 1
        );

        // Move to next slide
        const nextIndex = currentSlideIndex + 1;
        onSlideChange(nextIndex);
        setMaxVisitedSlide(Math.max(maxVisitedSlide, nextIndex));
      } catch (error) {
        console.error("Error updating progress:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to update progress"
        );
      }
    } else {
      handleComplete();
    }
  }, [
    isAdminView,
    currentSlideIndex,
    slides,
    onSlideChange,
    handleComplete,
    canAdvance,
    properties,
    setSlides,
    courseId,
    setMaxVisitedSlide,
    maxVisitedSlide,
  ]);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    // Set up audio event listeners
    audio.addEventListener("timeupdate", () => {
      if (audio.duration) {
        const percent = (audio.currentTime / audio.duration) * 100;
        setProgress(percent);
        if (percent >= 80 && !canAdvance) {
          setCanAdvance(true);
        }

        // Update current subtitle based on audio time
        const explanation = slideExplanations.find(
          (exp) => exp.slide === currentSlideIndex + 1
        );

        if (explanation?.explanation_subtitle) {
          const subtitles = parseWebVTT(explanation.explanation_subtitle);
          const currentSubtitle = subtitles.find(
            (sub) =>
              audio.currentTime >= sub.start && audio.currentTime <= sub.end
          );

          if (currentSubtitle?.text) {
            setCurrentSubtitle(currentSubtitle.text);
          } else {
            setCurrentSubtitle("");
          }
        }
      }
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setProgress(100);
      setCanAdvance(true);

      // Auto advance to next slide if not the last slide
      if (currentSlideIndex < slides.length - 1) {
        setTimeout(() => {
          handleNext();
        }, 2000); // 2 second delay
      } else {
        // If it's the last slide, show completion state
        handleComplete();
      }
    });

    audio.addEventListener("play", () => {
      setIsPlaying(true);
    });

    audio.addEventListener("pause", () => {
      setIsPlaying(false);
    });

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", () => {});
      audio.removeEventListener("ended", () => {});
      audio.removeEventListener("play", () => {});
      audio.removeEventListener("pause", () => {});
    };
  }, [
    currentSlideIndex,
    slideExplanations,
    canAdvance,
    slides.length,
    handleComplete,
    handleNext,
  ]);

  // Update audio source when explanation changes
  useEffect(() => {
    const explanation = slideExplanations.find(
      (exp) => exp.slide === currentSlideIndex + 1
    );
    if (explanation && audioRef.current) {
      setCurrentExplanation(explanation.explanation);
      audioRef.current.src = explanation.explanation_audio;
      audioRef.current.load();
      setProgress(0);
      setIsPlaying(true);
      audioRef.current.play().catch((error) => {
        setIsPlaying(false);
      });
    }
  }, [currentSlideIndex, slideExplanations]);

  // Handle play/pause
  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  // Handle mute toggle
  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.muted = newMuted;
  };

  // Handle playback rate change
  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Handle skip forward/backward
  const handleSkip = (direction: "forward" | "backward") => {
    if (!audioRef.current || !properties.skippable) return;

    setShowSkipFeedback(direction);
    setTimeout(() => setShowSkipFeedback(null), 700);

    const skipSeconds = direction === "forward" ? 5 : -5;
    const newTime = Math.max(0, audioRef.current.currentTime + skipSeconds);
    audioRef.current.currentTime = newTime;
  };

  // Reset audio when slide changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setProgress(0);
    setCanAdvance(false);
  }, [currentSlideIndex]);

  // Handle slide navigation
  useEffect(() => {
    setMaxVisitedSlide((prev) => {
      if (currentSlideIndex > prev) {
        return currentSlideIndex;
      }
      return prev;
    });
  }, [currentSlideIndex]);

  const handleSlideSelect = (index: number) => {
    if (isAdminView) {
      onSlideChange(index);
      return;
    }
    if (index <= maxVisitedSlide) {
      onSlideChange(index);
      return;
    }
    // For future slides, require 80% completion of the current slide
    if (!canAdvance && progress < 80) {
      toast.info(
        "Please complete at least 80% of the current slide before moving forward"
      );
      return;
    }
    onSlideChange(index);
  };

  const toggleSubtitles = () => {
    setShowSubtitles(!showSubtitles);
  };

  const handleFullScreen = () => {
    const el = slideAreaRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  };

  // Show controls on mouse move, hide after 2s
  const handleSlideAreaMouseMove = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      // Abort MCQ generation if navigating away
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setIsGeneratingMCQ(false);
    };
  }, []);

  const handleStartAssessment = useCallback(async () => {
    if (isAdminView) return;
    try {
      setIsGeneratingMCQ(true);
      const tenantId = localStorage.getItem("tenantId");
      if (!tenantId) {
        throw new Error("Missing tenant ID");
      }

      // Get the material URL from localStorage
      const storedMaterialUrl = localStorage.getItem(
        `course_material_${courseId}`
      );
      let s3Url;

      if (!storedMaterialUrl) {
        s3Url = await slideService.fetchCourseMaterial(courseId, tenantId);
        localStorage.setItem(`course_material_${courseId}`, s3Url);
      } else {
        s3Url = storedMaterialUrl;
      }

      // Generate MCQs with abort support
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const mcqData = await slideService.generateMCQ(
        courseId,
        tenantId,
        s3Url,
        controller.signal
      );

      // Only proceed if not aborted
      if (!controller.signal.aborted) {
        localStorage.setItem("currentQuiz", JSON.stringify(mcqData.mcqs));
        window.location.href = `/dashboard/course/${courseId}/quiz?tenantId=${tenantId}`;
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          // Request was aborted, do nothing
          setIsGeneratingMCQ(false);
          return;
        }
        console.error("Error preparing quiz:", error);
        toast.error(error.message);
      } else {
        toast.error("Failed to prepare quiz. Please try again.");
      }
      setIsGeneratingMCQ(false);
    }
  }, [isAdminView, courseId]);

  const handlePrev = useCallback(() => {
    if (currentSlideIndex > 0) {
      onSlideChange(currentSlideIndex - 1);
    }
  }, [currentSlideIndex, onSlideChange]);

  if (isGeneratingMCQ) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 z-50 flex items-center justify-center">
        <Loader message="Please wait until the MCQ is generated" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen flex flex-col overflow-hidden">
      {/* Hamburger Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="h-screen w-[300px] sm:w-[400px] p-0"
        >
          <div className="p-6 h-full flex flex-col">
            <h2 className="text-lg font-semibold mb-4">Slide Navigation</h2>
            <SlideNavigation
              totalSlides={slideExplanations.length}
              currentSlide={currentSlideIndex}
              onSlideSelect={handleSlideSelect}
              slideExplanations={slideExplanations}
              progress={progress}
              maxVisitedSlide={maxVisitedSlide}
              isAdminView={isAdminView}
            />
          </div>
        </SheetContent>
      </Sheet>

      <div
        className="flex-grow relative"
        ref={slideAreaRef}
        onMouseMove={handleSlideAreaMouseMove}
        onMouseLeave={() => setControlsVisible(false)}
      >
        {materialUrl ? (
          <div
            className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
            onMouseEnter={() => setShowOverlayControls(true)}
            onMouseLeave={() => setShowOverlayControls(false)}
          >
            <GoogleSlidesViewer
              materialUrl={materialUrl}
              currentSlideIndex={currentSlideIndex}
              onSlideChange={onSlideChange}
            />
            {/* Subtitles at bottom of PPT */}
            {showSubtitles && currentSubtitle && (
              <div
                className="absolute bottom-0 left-0 w-full bg-black/50 text-white px-4 py-2 text-sm text-center"
                style={{ pointerEvents: "none" }}
              >
                {currentSubtitle}
              </div>
            )}
            {/* Overlay Play/Pause Button */}
            <div
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                showOverlayControls ? "opacity-100" : "opacity-0"
              }`}
              onClick={togglePlayback}
            >
              <div className="absolute inset-0 bg-black/30" />
              <div className="relative z-10 flex items-center gap-8">
                {properties?.skippable && (
                  <button
                    className="w-12 h-12 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center hover:scale-110 transition-transform duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSkip("backward");
                    }}
                  >
                    <span className="text-lg font-bold text-gray-800 dark:text-white">
                      -5&lt;&lt;
                    </span>
                  </button>
                )}
                <button
                  className="w-16 h-16 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center hover:scale-110 transition-transform duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlayback();
                  }}
                >
                  {isPlaying ? (
                    <svg
                      className="w-8 h-8 text-gray-800 dark:text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-8 h-8 text-gray-800 dark:text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                {properties?.skippable && (
                  <button
                    className="w-12 h-12 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center hover:scale-110 transition-transform duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSkip("forward");
                    }}
                  >
                    <span className="text-lg font-bold text-gray-800 dark:text-white">
                      +5&gt;&gt;
                    </span>
                  </button>
                )}
              </div>
            </div>
            {/* Slide Controls Overlay at bottom (YouTube style) */}
            <div
              className={`absolute left-0 right-0 bottom-0 z-30 transition-opacity duration-500 ${
                controlsVisible
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              <div className="bg-black/60 px-4 pb-2 pt-3">
                <SlideControls
                  isPlaying={isPlaying}
                  volume={volume}
                  isMuted={isMuted}
                  playbackRate={playbackRate}
                  showSubtitles={showSubtitles}
                  progress={progress}
                  setProgress={setProgress}
                  setCanAdvance={setCanAdvance}
                  togglePlayback={togglePlayback}
                  handleVolumeChange={handleVolumeChange}
                  toggleMute={toggleMute}
                  changePlaybackRate={changePlaybackRate}
                  toggleSubtitles={toggleSubtitles}
                  handlePrev={handlePrev}
                  handleNext={handleNext}
                  isFirstSlide={currentSlideIndex === 0}
                  isLastSlide={
                    currentSlideIndex === slideExplanations.length - 1
                  }
                  onComplete={handleComplete}
                  canAdvance={canAdvance}
                  isAdminView={isAdminView}
                  onFullScreen={handleFullScreen}
                />
              </div>
            </div>
            {/* Skip Feedback Overlay */}
            {showSkipFeedback && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                <div
                  className="px-8 py-4 rounded-xl text-3xl font-bold shadow-lg bg-black/80 text-white animate-fade-in-up"
                  style={{ opacity: 0.9 }}
                >
                  {showSkipFeedback === "forward" ? "+5s ⏩" : "-5s ⏪"}
                </div>
              </div>
            )}
            {/* Audio Seekbar */}
            <div
              className="absolute bottom-0 left-0 right-0 h-2 bg-gray-200 dark:bg-gray-700 cursor-pointer"
              onClick={(e) => {
                if (!audioRef.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = Math.max(
                  0,
                  Math.min(1, (e.clientX - rect.left) / rect.width)
                );
                const newTime = percent * audioRef.current.duration;

                // Only allow seeking backward
                if (newTime < audioRef.current.currentTime) {
                  audioRef.current.currentTime = newTime;
                  setProgress(percent * 100);
                }
              }}
            >
              <div
                className="h-full bg-blue-500 dark:bg-blue-400 relative"
                style={{ width: `${progress}%` }}
              >
                {/* Seekbar handle */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-300 shadow-lg transform -translate-x-1/2 hover:scale-125 transition-transform" />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            Loading slides...
          </div>
        )}
      </div>

      {/* Tiny feedback link for admin view */}
      {isAdminView && (
        <div className="w-full flex justify-center mt-4 mb-3">
          <div className="group relative overflow-hidden bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800/40 dark:via-gray-800/50 dark:to-gray-800/60 rounded-md px-3 py-1 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300 ease-out">
            {/* Subtle background animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 via-indigo-100/20 to-purple-100/20 dark:from-blue-900/10 dark:via-indigo-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Content */}
            <div className="relative flex items-center gap-1.5">
              {/* Icon */}
              <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-hover:rotate-12 transition-transform duration-300"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>

              {/* Text */}
              <div className="flex-1">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-200">
                  Ready to take your content to the next level?
                </span>
              </div>

              {/* Button */}
              <a
                href={`/admin/course/${courseId}/explanations?tenantId=${
                  localStorage.getItem("tenantId") || ""
                }&token=${localStorage.getItem("token") || ""}`}
                className="relative inline-flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-gray-900 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 shadow-sm hover:shadow group-hover:scale-105"
              >
                <span>Enhance Content</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-hover:translate-x-1 transition-transform duration-200"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Enhance Content Button for Admins - Top Right */}
      {isAdminView && (
        <>
          <button
            className="fixed top-8 right-8 z-50 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl p-3 flex items-center justify-center hover:scale-110 transition-all duration-200 focus:outline-none border-4 border-white dark:border-gray-900"
            title="Enhance Content"
            style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)" }}
            onClick={() => setShowEnhanceDialog(true)}
          >
            <Wand2 className="h-7 w-7" />
          </button>
          <Dialog open={showEnhanceDialog} onOpenChange={setShowEnhanceDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-indigo-600" /> Enhance Content
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="text-center">
                  <div className="text-lg font-semibold mb-2">
                    Ready to take your content to the next level?
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    Use our AI-powered tool to enhance your course explanations
                    and make your content even more engaging.
                  </div>
                  <Button
                    onClick={() => {
                      const tenantId = localStorage.getItem("tenantId") || "";
                      const token = localStorage.getItem("token") || "";
                      navigate(
                        `/admin/course/${courseId}/explanations?tenantId=${tenantId}&token=${token}`
                      );
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow transition-all duration-200 font-semibold"
                  >
                    <Wand2 className="h-4 w-4" /> Go to Enhance Content
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

      <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold">
              Slide {currentSlideIndex + 1} of {slideExplanations.length}
            </h3>
          </div>
          {!isAdminView && isLastSlide && progress >= 80 && (
            <Button
              onClick={handleComplete}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Complete Course
            </Button>
          )}
        </div>
      </div>

      {/* Completion Modal */}
      <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Course Completed!
            </DialogTitle>
            <DialogDescription className="text-center mt-2">
              Congratulations on completing the course! To ensure you've
              understood the material, please take a short assessment test.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-center">
            {isGeneratingMCQ ? (
              <div className="flex flex-col items-center gap-4">
                <Loader className="w-8 h-8" />
                <p className="text-sm text-gray-500">
                  Preparing your assessment...
                </p>
              </div>
            ) : (
              <Button
                onClick={handleStartAssessment}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              >
                Start Assessment
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin completion modal */}
      {isAdminView && showAdminCompleteModal && (
        <Dialog
          open={showAdminCompleteModal}
          onOpenChange={setShowAdminCompleteModal}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hurray!!</DialogTitle>
              <DialogDescription>
                Your course is completed! Feel free to make any changes as per
                your wishes.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button onClick={() => setShowAdminCompleteModal(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
export default SlidePlayer;
