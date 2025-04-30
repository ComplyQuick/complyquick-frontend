import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import SlideControls from "./SlideControls";
import SlideNavigation from "./SlideNavigation";
import SlideContent from "./SlideContent";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import GoogleSlidesViewer from '@/components/dashboard/GoogleSlidesViewer';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

interface Explanation {
  slide: number;
  content: string;
  explanation: string;
}

interface Slide {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  imageUrl?: string;
}

interface SlidePlayerProps {
  slides: Slide[];
  setSlides: (slides: Slide[]) => void;
  currentSlideIndex: number;
  onSlideChange: (index: number) => void;
  onComplete: () => void;
  explanations: Record<string, string>;
  isLoadingExplanations: boolean;
}

async function getGoogleSlidesCount(presentationId, apiKey) {
  const res = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}?key=${apiKey}`);
  const data = await res.json();
  return data.slides.length;
}

const SlidePlayer = ({
  slides,
  setSlides,
  currentSlideIndex,
  onSlideChange,
  onComplete,
  explanations,
  isLoadingExplanations,
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
  const progressTimerRef = useRef<number | null>(null);
  const lastPressRef = useRef<number>(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentPositionRef = useRef<number>(0);
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const [showSkipFeedback, setShowSkipFeedback] = useState<'forward' | 'backward' | null>(null);
  const [showOverlayControls, setShowOverlayControls] = useState(false);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const lastSubtitleUpdateRef = useRef<number>(0);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  
  const currentSlide = slides[currentSlideIndex];
  const isLastSlide = currentSlideIndex === slides.length - 1;
  const isFirstSlide = currentSlideIndex === 0;
  const totalCompleted = slides.filter(slide => slide.completed).length;
  const overallProgress = (totalCompleted / slides.length) * 100;
  
  // Fetch explanations when component mounts
  useEffect(() => {
    const fetchExplanations = async () => {
      try {
        const tenantId = localStorage.getItem('tenantId');
        if (!courseId || !tenantId) {
          console.error('Missing courseId or tenantId:', { courseId, tenantId });
          throw new Error('Missing courseId or tenantId');
        }

        // First fetch course details to get materialUrl
        console.log('Fetching course details...', {
          url: `${import.meta.env.VITE_BACKEND_URL}/api/tenant-admin/tenants/${tenantId}/courses`,
          courseId,
          tenantId
        });
        
        const courseResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/tenant-admin/tenants/${tenantId}/courses`
        );

        if (!courseResponse.ok) {
          console.error('Failed to fetch course details:', {
            status: courseResponse.status,
            statusText: courseResponse.statusText
          });
          throw new Error('Failed to fetch course details');
        }

        const courseData = await courseResponse.json();
        console.log('Course data received:', courseData);

        // Find the current course in the list
        const currentCourse = courseData.find((course: any) => course.id === courseId);
        if (!currentCourse) {
          console.error('Current course not found:', { 
            courseId, 
            availableCourseIds: courseData.map((c: any) => c.id)
          });
          throw new Error('Current course not found');
        }

        console.log('Current course found:', {
          id: currentCourse.id,
          materialUrl: currentCourse.materialUrl
        });

        // Update the material URL state
        if (currentCourse.materialUrl) {
          console.log('Setting material URL:', currentCourse.materialUrl);
          setMaterialUrl(currentCourse.materialUrl);
        } else {
          console.warn('No materialUrl found in course details');
        }

        // Now fetch explanations
        console.log('Fetching explanations...');
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/courses/${courseId}/explanations?tenantId=${tenantId}`
        );

        if (!response.ok) {
          console.error('Failed to fetch explanations:', {
            status: response.status,
            statusText: response.statusText
          });
          throw new Error('Failed to fetch explanations');
        }

        const data = await response.json();
        console.log('Explanations data:', data);
        
        setSlideExplanations(data.explanations);
        
        // Set initial explanation
        const initialExplanation = data.explanations.find(
          (exp: Explanation) => exp.slide === currentSlideIndex + 1
        );
        if (initialExplanation) {
          setCurrentExplanation(initialExplanation.explanation);
        }
      } catch (error) {
        console.error('Error in fetchExplanations:', error);
        toast.error('Failed to load slide explanations');
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
      setIsPlaying(false);
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    }
  }, [currentSlideIndex, slideExplanations]);
  
  // Initialize speech synthesis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const newUtterance = new SpeechSynthesisUtterance();
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => voice.name.includes('female'));
      if (femaleVoice) {
        newUtterance.voice = femaleVoice;
      }
      utteranceRef.current = newUtterance;
    } else {
      toast.error('Text-to-speech is not supported in your browser');
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }
    };
  }, []);
  
  // Reset progress when slide changes
  useEffect(() => {
    setProgress(0);
    setCanAdvance(false);
    
    // Clear any existing timer
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    
    // Reset play state
    setIsPlaying(false);
  }, [currentSlideIndex]);
  
  // Update audio volume and mute state
  useEffect(() => {
    if (utteranceRef.current) {
      utteranceRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);
  
  // Simulate playback - in a real app, this would sync with actual audio/video
  useEffect(() => {
    if (isPlaying) {
      // Start progress timer
      startProgressTimer();
    }
  }, [isPlaying]);
  
  // Update playback rate
  useEffect(() => {
    // In a real implementation, update audio playbackRate
    // if (utteranceRef.current) {
    //   utteranceRef.current.playbackRate = playbackRate;
    // }
  }, [playbackRate]);
  
  // Update utterance when explanation changes
  useEffect(() => {
    if (utteranceRef.current && currentExplanation) {
      const newUtterance = new SpeechSynthesisUtterance(currentExplanation);
      newUtterance.rate = playbackRate;
      newUtterance.volume = isMuted ? 0 : volume / 100;
      
      newUtterance.onstart = () => {
        setIsPlaying(true);
        currentUtteranceRef.current = newUtterance;
      };
      
      newUtterance.onend = () => {
        setIsPlaying(false);
        setProgress(100);
        setCanAdvance(true);
        currentUtteranceRef.current = null;
      };
      
      newUtterance.onpause = () => {
        setIsPlaying(false);
      };
      
      newUtterance.onresume = () => {
        setIsPlaying(true);
      };
      
      utteranceRef.current = newUtterance;
    }
  }, [currentExplanation, playbackRate, volume, isMuted]);

  // Handle play/pause
  const togglePlayback = () => {
    if (!utteranceRef.current || !currentExplanation) return;

    if (isPlaying) {
      window.speechSynthesis.pause();
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    } else {
      window.speechSynthesis.cancel();
      
      const newUtterance = new SpeechSynthesisUtterance(currentExplanation);
      newUtterance.rate = playbackRate;
      newUtterance.volume = isMuted ? 0 : volume / 100;
      
      newUtterance.onstart = () => {
        setIsPlaying(true);
        startProgressTimer();
      };
      
      newUtterance.onend = () => {
        setIsPlaying(false);
        setProgress(100);
        setCanAdvance(true);
        if (progressTimerRef.current) {
          window.clearInterval(progressTimerRef.current);
        }
      };
      
      utteranceRef.current = newUtterance;
      window.speechSynthesis.speak(newUtterance);
    }
    setIsPlaying(!isPlaying);
  };

  // Start progress timer
  const startProgressTimer = () => {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
    }
    
    const totalLength = currentExplanation.length;
    const duration = (totalLength / 25) * (1 / playbackRate) * 1000; // Rough estimate of duration
    const interval = 100;
    
    progressTimerRef.current = window.setInterval(() => {
      setProgress(prev => {
        const increment = (interval / duration) * 100;
        const nextProgress = Math.min(prev + increment, 100);
        
        if (nextProgress >= 80 && !canAdvance) {
          setCanAdvance(true);
        }
        
        if (nextProgress >= 100) {
          if (progressTimerRef.current) {
            window.clearInterval(progressTimerRef.current);
          }
          return 100;
        }
        
        return nextProgress;
      });
    }, interval) as unknown as number;
  };

  // Reset position when slide changes
  useEffect(() => {
    currentPositionRef.current = 0;
    setProgress(0);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [currentSlideIndex]);

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  // Handle mute toggle
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Handle playback rate change
  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (window.speechSynthesis && isPlaying) {
      window.speechSynthesis.cancel();
      
      const newUtterance = new SpeechSynthesisUtterance(currentExplanation);
      newUtterance.rate = rate;
      newUtterance.volume = isMuted ? 0 : volume / 100;
      
      newUtterance.onstart = () => {
        setIsPlaying(true);
        startProgressTimer();
      };
      
      newUtterance.onend = () => {
        setIsPlaying(false);
        setProgress(100);
        setCanAdvance(true);
        if (progressTimerRef.current) {
          window.clearInterval(progressTimerRef.current);
        }
      };
      
      utteranceRef.current = newUtterance;
      window.speechSynthesis.speak(newUtterance);
    }
  };

  // Handle slide navigation
  const handleNext = async () => {
    if (!canAdvance && progress < 80) {
      toast.info("Please complete at least 80% of this slide before moving to the next one");
      return;
    }
    
    // Stop current speech
    window.speechSynthesis.cancel();
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
    }
    
    try {
      const tenantId = localStorage.getItem('tenantId');
      if (!tenantId) {
        throw new Error('Tenant ID not found');
      }

      // Update progress on the backend
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/courses/${courseId}/update-progress`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            slideNumber: currentSlideIndex + 1 // Convert to 1-based index
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Progress update failed:', errorData);
        throw new Error('Failed to update progress');
      }

      // Mark current slide as completed locally
      const updatedSlides = [...slides];
      updatedSlides[currentSlideIndex] = {
        ...updatedSlides[currentSlideIndex],
        completed: true
      };
      setSlides(updatedSlides);
      
      if (currentSlideIndex < slideExplanations.length - 1) {
        onSlideChange(currentSlideIndex + 1);
      } else {
        handleComplete();
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress. Please try again.');
    }
  };

  const handlePrev = () => {
    // Stop current speech
    window.speechSynthesis.cancel();
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
    }
    
    if (currentSlideIndex > 0) {
      onSlideChange(currentSlideIndex - 1);
    }
  };
  
  const handleSlideSelect = (index: number) => {
    // Allow navigating to any previous slide
    if (index < currentSlideIndex) {
      onSlideChange(index);
      return;
    }
    
    // For forward navigation, check progress
    if (!canAdvance && progress < 80) {
      toast.info("Please complete at least 80% of the current slide before moving forward");
      return;
    }
    
    if (index < slideExplanations.length) {
      onSlideChange(index);
    }
  };
  
  const toggleSubtitles = () => {
    setShowSubtitles(!showSubtitles);
  };

  const handleComplete = async () => {
    try {
      const tenantId = localStorage.getItem('tenantId');

      console.log('Parameters check:', {
        courseId,
        tenantId,
        searchParams: Object.fromEntries(searchParams.entries())
      });

      if (!courseId || !tenantId) {
        throw new Error(`Missing required parameters. CourseId: ${courseId}, TenantId: ${tenantId}`);
      }

      // Get the material URL from localStorage
      const storedMaterialUrl = localStorage.getItem(`course_material_${courseId}`);
      let s3Url;

      if (!storedMaterialUrl) {
        console.log('Material URL not found in localStorage, fetching from API...');
        // If not in localStorage, fetch it
        const materialResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/courses/${courseId}/chatbot-material?tenantId=${tenantId}`
        );

        if (!materialResponse.ok) {
          const errorText = await materialResponse.text();
          console.error('Material URL fetch failed:', {
            status: materialResponse.status,
            statusText: materialResponse.statusText,
            errorText
          });
          throw new Error(`Failed to fetch course material URL: ${materialResponse.status} ${materialResponse.statusText}`);
        }

        const materialData = await materialResponse.json();
        s3Url = materialData.materialUrl;
        
        if (!s3Url) {
          throw new Error('Material URL is empty in the response');
        }

        // Store it for future use
        localStorage.setItem(`course_material_${courseId}`, s3Url);
        console.log('Stored material URL in localStorage:', s3Url);
      } else {
        console.log('Using material URL from localStorage:', storedMaterialUrl);
        s3Url = storedMaterialUrl;
      }

      // Generate MCQs using the AI service
      console.log('Sending request to AI service with URL:', s3Url);
      const mcqResponse = await fetch(`${import.meta.env.VITE_AI_SERVICE_URL}/generate_mcq`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presentation_url: s3Url,
          course_id: courseId,
          tenant_id: tenantId
        })
      });

      if (!mcqResponse.ok) {
        const errorText = await mcqResponse.text();
        console.error('MCQ generation failed:', {
          status: mcqResponse.status,
          statusText: mcqResponse.statusText,
          errorText,
          url: `${import.meta.env.VITE_AI_SERVICE_URL}/generate_mcq`
        });
        throw new Error('Failed to generate MCQs');
      }

      const mcqData = await mcqResponse.json();
      console.log('Generated MCQs:', mcqData);
      
      if (!mcqData.mcqs || !Array.isArray(mcqData.mcqs)) {
        throw new Error('Invalid MCQ data received');
      }

      // Store MCQ data in localStorage for the quiz page
      localStorage.setItem('currentQuiz', JSON.stringify(mcqData.mcqs));

      // Call the original onComplete handler
      await onComplete();

      // Navigate to the quiz page
      window.location.href = `/dashboard/course/${courseId}/quiz?tenantId=${tenantId}`;
    } catch (error) {
      console.error('Error preparing quiz:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to prepare quiz. Please try again.');
    }
  };

  // Handle skip forward/backward
  const handleSkip = (direction: 'forward' | 'backward') => {
    if (!currentExplanation) return;

    // Show feedback
    setShowSkipFeedback(direction);
    setTimeout(() => setShowSkipFeedback(null), 500);

    // Calculate current position
    const totalLength = currentExplanation.length;
    const currentPosition = (progress / 100) * totalLength;
    const wordsPerSecond = 25; // Average words per second
    const currentTimeInSeconds = currentPosition / wordsPerSecond;
    
    // Calculate new position (10 seconds worth of text)
    const skipSeconds = direction === 'forward' ? 10 : -10;
    const newTimeInSeconds = Math.max(0, Math.min(currentTimeInSeconds + skipSeconds, totalLength / wordsPerSecond));
    const newPosition = Math.floor(newTimeInSeconds * wordsPerSecond);
    
    // Update position and progress
    currentPositionRef.current = newPosition;
    const newProgress = (newPosition / totalLength) * 100;
    setProgress(newProgress);
    
    if (isPlaying) {
      // Create new utterance with remaining text
      const remainingText = currentExplanation.slice(newPosition);
      const newUtterance = new SpeechSynthesisUtterance(remainingText);
      
      // Set properties
      newUtterance.rate = playbackRate;
      newUtterance.volume = isMuted ? 0 : volume / 100;
      
      // Set up event listeners
      newUtterance.onstart = () => {
        setIsPlaying(true);
        startProgressTimer();
      };
      
      newUtterance.onend = () => {
        setIsPlaying(false);
        setProgress(100);
        setCanAdvance(true);
        if (progressTimerRef.current) {
          window.clearInterval(progressTimerRef.current);
        }
      };
      
      newUtterance.onpause = () => {
        setIsPlaying(false);
      };
      
      newUtterance.onresume = () => {
        setIsPlaying(true);
      };
      
      // Cancel current speech and start new one
      window.speechSynthesis.cancel();
      utteranceRef.current = newUtterance;
      window.speechSynthesis.speak(newUtterance);
    }
  };

  // Update current subtitle based on speech position
  useEffect(() => {
    if (!currentExplanation || !isPlaying) return;

    const updateSubtitle = () => {
      const now = Date.now();
      // Only update subtitle every 100ms to prevent flickering
      if (now - lastSubtitleUpdateRef.current < 100) return;
      lastSubtitleUpdateRef.current = now;

      if (!currentUtteranceRef.current) return;

      // Get the current utterance and its position
      const utterance = currentUtteranceRef.current;
      const totalLength = utterance.text.length;
      const currentPosition = 0;
      
      // Split into sentences and find current position
      const sentences = utterance.text.split(/[.!?]+/).filter(s => s.trim());
      let currentSentence = "";
      let accumulatedLength = 0;
      
      for (const sentence of sentences) {
        const sentenceLength = sentence.length + 1; // +1 for punctuation
        if (accumulatedLength + sentenceLength > currentPosition) {
          currentSentence = sentence.trim();
          break;
        }
        accumulatedLength += sentenceLength;
      }
      
      setCurrentSubtitle(currentSentence || utterance.text);
    };

    const interval = setInterval(updateSubtitle, 50);
    return () => clearInterval(interval);
  }, [currentExplanation, isPlaying]);

  return (
    <div className="relative w-full h-full flex flex-col">
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
        <SheetContent side="left" className="h-screen w-[300px] sm:w-[400px] p-0">
          <div className="p-6 h-full flex flex-col">
            <h2 className="text-lg font-semibold mb-4">Slide Navigation</h2>
            <SlideNavigation
              totalSlides={slideExplanations.length}
              currentSlide={currentSlideIndex}
              onSlideSelect={handleSlideSelect}
              completedSlides={slides.map(slide => slide.completed)}
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
            
            {/* Overlay Play/Pause Button */}
            <div 
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                showOverlayControls ? 'opacity-100' : 'opacity-0'
              }`}
              onClick={togglePlayback}
            >
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
              <button 
                className="relative z-10 w-16 h-16 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center hover:scale-110 transition-transform duration-200"
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
            </div>

            {showSkipFeedback && (
              <div className={`absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity duration-300 ${
                showSkipFeedback === 'forward' ? 'translate-x-1/4' : '-translate-x-1/4'
              }`}>
                <span className="text-white text-2xl font-bold">
                  {showSkipFeedback === 'forward' ? '⏩ +10s' : '⏪ -10s'}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            Loading slides...
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Subtitles */}
        {showSubtitles && currentSubtitle && (
          <div 
            ref={subtitleRef}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded bg-black/80"
          >
            <p className="text-white text-center text-sm max-w-2xl">
              {currentSubtitle}
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border-t dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/avatars/presenter.png" />
              <AvatarFallback>PR</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">Slide {currentSlideIndex + 1} of {slideExplanations.length}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(progress)}% Complete
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
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
    </div>
  );
};

export default SlidePlayer;

