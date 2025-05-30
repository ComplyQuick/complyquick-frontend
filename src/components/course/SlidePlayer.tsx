import { useState, useEffect, useRef } from "react";
import SlideControls from "./SlideControls";
import SlideNavigation from "./SlideNavigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
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

interface Explanation {
  slide: number;
  content: string;
  explanation: string;
  explanation_audio: string;
  explanation_subtitle: string;
}

interface Slide {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  imageUrl?: string;
}

interface SlidePlayerProps {
  slides: {
    id: string;
    title: string;
    content: string;
    completed: boolean;
  }[];
  setSlides: (
    slides: {
      id: string;
      title: string;
      content: string;
      completed: boolean;
    }[]
  ) => void;
  currentSlideIndex: number;
  onSlideChange: (index: number) => void;
  onComplete: () => void;
  explanations: {
    slide: number;
    content: string;
    explanation: string;
    explanation_audio: string;
  }[];
  isLoadingExplanations: boolean;
  properties: {
    skippable: boolean;
    mandatory: boolean;
    retryType: "SAME" | "DIFFERENT";
  };
  onSkipForward: () => void;
  onSkipBackward: () => void;
  resumeSlideIndex: number;
}

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

  // Fetch explanations when component mounts
  useEffect(() => {
    const fetchExplanations = async () => {
      try {
        const tenantId = localStorage.getItem("tenantId");
        if (!courseId || !tenantId) {
          console.error("Missing courseId or tenantId:", {
            courseId,
            tenantId,
          });
          throw new Error("Missing courseId or tenantId");
        }

        // First fetch course details to get materialUrl
        console.log("Fetching course details...", {
          url: `${
            import.meta.env.VITE_BACKEND_URL
          }/api/tenant-admin/tenants/${tenantId}/courses`,
          courseId,
          tenantId,
        });

        const courseResponse = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/tenant-admin/tenants/${tenantId}/courses`
        );

        if (!courseResponse.ok) {
          console.error("Failed to fetch course details:", {
            status: courseResponse.status,
            statusText: courseResponse.statusText,
          });
          throw new Error("Failed to fetch course details");
        }

        const courseData = await courseResponse.json();

        // Find the current course in the list
        const currentCourse = courseData.find(
          (course: any) => course.id === courseId
        );
        if (!currentCourse) {
          console.error("Current course not found:", {
            courseId,
            availableCourseIds: courseData.map((c: any) => c.id),
          });
          throw new Error("Current course not found");
        }
        // Update the material URL state
        if (currentCourse.materialUrl) {
          setMaterialUrl(currentCourse.materialUrl);
        } else {
          console.warn("No materialUrl found in course details");
        }
        const response = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/courses/${courseId}/explanations?tenantId=${tenantId}`
        );

        if (!response.ok) {
          console.error("Failed to fetch explanations:", {
            status: response.status,
            statusText: response.statusText,
          });
          throw new Error("Failed to fetch explanations");
        }

        const data = await response.json();

        if (data.explanations && Array.isArray(data.explanations)) {
          setSlideExplanations(data.explanations);

          // Set initial explanation
          const initialExplanation = data.explanations.find(
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
        }
      } catch (error) {
        console.error("Error in fetchExplanations:", error);
        toast.error("Failed to load slide explanations");
      }
    };

    fetchExplanations();
  }, [courseId, currentSlideIndex]);

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
        handleNext();
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
  }, [currentSlideIndex, slideExplanations]);

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
      // Auto play the audio
      audioRef.current.play().catch((error) => {
        console.error("Error auto-playing audio:", error);
        // If autoplay fails, we'll keep the play button visible
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
        console.log(
          "[SlidePlayer] Updating maxVisitedSlide:",
          currentSlideIndex,
          "(prev:",
          prev,
          ")"
        );
        return currentSlideIndex;
      }
      return prev;
    });
  }, [currentSlideIndex]);

  const handleSlideSelect = (index: number) => {
    console.log("[SlidePlayer] handleSlideSelect", {
      index,
      maxVisitedSlide,
      currentSlideIndex,
      canAdvance,
      progress,
    });
    // Allow navigation to any slide up to maxVisitedSlide
    if (index <= maxVisitedSlide) {
      console.log(
        "[SlidePlayer] Navigating to slide",
        index,
        "(<= maxVisitedSlide)"
      );
      onSlideChange(index);
      return;
    }
    // For future slides, require 80% completion of the current slide
    if (!canAdvance && progress < 80) {
      console.log(
        "[SlidePlayer] Blocked: progress",
        progress,
        "canAdvance",
        canAdvance
      );
      toast.info(
        "Please complete at least 80% of the current slide before moving forward"
      );
      return;
    }
    // If we can advance, allow navigation
    console.log("[SlidePlayer] Navigating to future slide", index);
    onSlideChange(index);
  };

  const toggleSubtitles = () => {
    setShowSubtitles(!showSubtitles);
  };

  const handleComplete = async () => {
    try {
      const tenantId = localStorage.getItem("tenantId");
      if (!courseId || !tenantId) {
        toast.error("Missing course or tenant information");
        return;
      }
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No authentication token found. Please log in again.");
        return;
      }

      // Update progress first
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/courses/${courseId}/update-progress`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ slideNumber: currentSlideIndex + 1 }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to update progress");
        return;
      }

      // Show completion modal
      setShowCompletionModal(true);
    } catch (err) {
      toast.error("Failed to update progress");
    }
  };

  const handleStartAssessment = async () => {
    try {
      setIsGeneratingMCQ(true);
      const tenantId = localStorage.getItem("tenantId");

      // Get the material URL from localStorage
      const storedMaterialUrl = localStorage.getItem(
        `course_material_${courseId}`
      );
      let s3Url;

      if (!storedMaterialUrl) {
        const materialResponse = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/courses/${courseId}/chatbot-material?tenantId=${tenantId}`
        );

        if (!materialResponse.ok) {
          throw new Error("Failed to fetch course material URL");
        }

        const materialData = await materialResponse.json();
        s3Url = materialData.materialUrl;

        if (!s3Url) {
          throw new Error("Material URL is empty in the response");
        }

        localStorage.setItem(`course_material_${courseId}`, s3Url);
      } else {
        s3Url = storedMaterialUrl;
      }

      // Generate MCQs
      const mcqResponse = await fetch(
        `${import.meta.env.VITE_AI_SERVICE_URL}/generate_mcq`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            presentation_url: s3Url,
            course_id: courseId,
            tenant_id: tenantId,
          }),
        }
      );

      if (!mcqResponse.ok) {
        throw new Error("Failed to generate MCQs");
      }

      const mcqData = await mcqResponse.json();

      if (!mcqData.mcqs || !Array.isArray(mcqData.mcqs)) {
        throw new Error("Invalid MCQ data received");
      }

      // Store MCQ data and navigate to quiz
      localStorage.setItem("currentQuiz", JSON.stringify(mcqData.mcqs));
      window.location.href = `/dashboard/course/${courseId}/quiz?tenantId=${tenantId}`;
    } catch (error) {
      console.error("Error preparing quiz:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to prepare quiz. Please try again."
      );
      setIsGeneratingMCQ(false);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      onSlideChange(currentSlideIndex - 1);
    }
  };

  const handleNext = async () => {
    if (currentSlideIndex < slides.length - 1) {
      try {
        const tenantId = localStorage.getItem("tenantId");
        if (!courseId || !tenantId) {
          toast.error("Missing course or tenant information");
          return;
        }
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("No authentication token found. Please log in again.");
          return;
        }
        const response = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/courses/${courseId}/update-progress`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
            body: JSON.stringify({ slideNumber: currentSlideIndex + 1 }),
          }
        );
        if (!response.ok) {
          const error = await response.json();
          toast.error(error.error || "Failed to update progress");
          return;
        }
        onSlideChange(currentSlideIndex + 1);
      } catch (err) {
        toast.error("Failed to update progress");
      }
    }
  };

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
            />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-grow relative">
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
                    <span className="text-2xl font-bold text-gray-800 dark:text-white">
                      {"<<"}
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
                    <span className="text-2xl font-bold text-gray-800 dark:text-white">
                      {">>"}
                    </span>
                  </button>
                )}
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

      <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-4">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatars/presenter.png" />
              <AvatarFallback>PR</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-sm font-semibold">
                Slide {currentSlideIndex + 1} of {slideExplanations.length}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round(progress)}% Complete
              </p>
            </div>
          </div>
          {isLastSlide && progress >= 80 && (
            <Button
              onClick={handleComplete}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Complete Course
            </Button>
          )}
        </div>

        <div className="space-y-2">
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
            isLastSlide={currentSlideIndex === slideExplanations.length - 1}
            onComplete={handleComplete}
            canAdvance={canAdvance}
          />
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
    </div>
  );
};

export default SlidePlayer;
