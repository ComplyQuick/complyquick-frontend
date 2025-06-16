import { useState, useEffect, useRef } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { toast } from "sonner";
import SlidePlayer from "@/components/course/SlidePlayer";
import CourseNotFound from "@/components/course/CourseNotFound";
import ChatHelp from "@/components/course/ChatHelp";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";

// API endpoints for a real implementation
const API_ENDPOINTS = {
  // SSO Login
  SSO_LOGIN: "/api/auth/sso/login",
  SSO_CALLBACK: "/api/auth/sso/callback",

  // Admin/Superuser Login
  ADMIN_LOGIN: "/api/auth/login",

  // Course Content
  GET_COURSE_SLIDES: (courseId: string) => `/api/courses/${courseId}/slides`,
  GET_COURSE_EXPLANATIONS: (courseId: string, organizationId: string) =>
    `/api/courses/${courseId}/explanations?organizationId=${organizationId}`,
  GET_PRESENTER_AVATAR: (courseId: string) =>
    `/api/courses/${courseId}/presenter`,
  GET_SLIDE_AUDIO: (courseId: string, slideId: string) =>
    `/api/courses/${courseId}/slides/${slideId}/audio`,

  // Course Progress
  UPDATE_PROGRESS: (courseId: string) => `/api/courses/${courseId}/progress`,

  // S3 File Paths (these would be returned by the API, not called directly)
  S3_PPT_PATH:
    "s3://myaudiouploadbucket/Blue White Professional Modern Safety Training Presentation.pptx",
  S3_SLIDE_IMAGES_PATH: (courseId: string) =>
    `s3://course-content/${courseId}/slides/`,
  S3_AUDIO_PATH: (courseId: string) => `s3://course-content/${courseId}/audio/`,
};

interface Slide {
  id: string;
  title: string;
  content: string;
  completed: boolean;
}

interface CoursePlayerProps {
  courseId: string;
  tenantId: string;
  token: string;
  progress: number;
  properties?: {
    mandatory: boolean;
    skippable: boolean;
    retryType: "DIFFERENT" | "SAME";
  } | null;
}

const CoursePlayer = ({
  courseId,
  tenantId,
  token,
  progress,
  properties,
}: CoursePlayerProps) => {
  const { courseId: urlCourseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Get parameters from URL
  const urlTenantId = searchParams.get("tenantId");
  const urlToken = searchParams.get("token");
  const urlProgressParam = searchParams.get("progress");
  const urlProgress = urlProgressParam ? parseFloat(urlProgressParam) : 0;

  // Get properties from navigation state or props
  const stateProperties = location.state?.properties;
  const courseProperties = stateProperties ||
    properties || {
      mandatory: true,
      skippable: false,
      retryType: "SAME" as const,
    };

  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Add state for audio control
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null
  );

  const resumeSlideRef = useRef(0);

  // Set retryType in localStorage for this course
  useEffect(() => {
    if (courseId && courseProperties?.retryType) {
      localStorage.setItem(
        `course_${courseId}_retryType`,
        courseProperties.retryType
      );
    }
  }, [courseId, courseProperties]);

  // Fetch explanations and set initial slide
  useEffect(() => {
    const fetchExplanationsAndSetSlide = async () => {
      if (!courseId || !urlTenantId || !urlToken) {
        toast.error("Missing required parameters");
        return;
      }

      try {
        // Fetch explanations array
        const response = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/courses/${courseId}/explanations?tenantId=${urlTenantId}`,
          {
            headers: {
              Authorization: `Bearer ${urlToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch explanations");
        }

        const data = await response.json();

        // The response is an object with an explanations array
        const explanations = data.explanations || [];

        if (!Array.isArray(explanations)) {
          throw new Error("Invalid explanations format received from API");
        }

        const totalSlides = explanations.length;

        // Calculate resume slide
        let resumeSlide = 0;
        if (urlProgress > 0 && totalSlides > 0) {
          resumeSlide = Math.round((urlProgress * totalSlides) / 100);
          // Ensure we don't exceed the total number of slides
          if (resumeSlide >= totalSlides) resumeSlide = totalSlides - 1;
        }

        // Convert explanations to slides format
        const slidesData = explanations.map(
          (explanation: any, index: number) => ({
            id: `slide-${index + 1}`,
            title: `Slide ${index + 1}`,
            content: explanation.content || explanation, // Handle both object and string formats
            completed: false,
          })
        );

        setSlides(slidesData);
        setCurrentSlideIndex(resumeSlide);
        resumeSlideRef.current = resumeSlide;
        setIsLoading(false);
      } catch (error) {
        toast.error("Failed to load course content");
        setIsLoading(false);
      }
    };

    fetchExplanationsAndSetSlide();
  }, [courseId, urlTenantId, urlToken, urlProgress]);

  const handleSlideChange = (index: number) => {
    setCurrentSlideIndex(index);
  };

  const handleCourseComplete = () => {
    setCourseCompleted(true);
    toast.success("Course completed successfully!");
  };

  const handleReturnToDashboard = () => {
    navigate(`/dashboard?tenantId=${urlTenantId}&token=${urlToken}`);
  };

  const handleSkipForward = () => {
    if (audioElement && courseProperties.skippable) {
      audioElement.currentTime += 5;
    }
  };

  const handleSkipBackward = () => {
    if (audioElement && courseProperties.skippable) {
      audioElement.currentTime = Math.max(0, audioElement.currentTime - 5);
    }
  };

  if (!courseId) {
    return <CourseNotFound />;
  }

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-complybrand-700"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex-1 flex flex-col max-h-screen">
        <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <SlidePlayer
                slides={slides}
                setSlides={setSlides}
                currentSlideIndex={currentSlideIndex}
                onSlideChange={handleSlideChange}
                onComplete={handleCourseComplete}
                explanations={[]}
                isLoadingExplanations={isLoading}
                properties={courseProperties}
                onSkipForward={handleSkipForward}
                onSkipBackward={handleSkipBackward}
                resumeSlideIndex={resumeSlideRef.current}
              />
            </div>
          </div>

          {urlTenantId && (
            <div className="lg:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <ChatHelp
                slideTitle={slides[currentSlideIndex]?.title || ""}
                slideContent={slides[currentSlideIndex]?.content || ""}
                tenantId={urlTenantId}
              />
            </div>
          )}
        </div>
      </div>

      {/* Return to Dashboard Button */}
      <div className="fixed bottom-4 right-4">
        <Button
          variant="outline"
          onClick={handleReturnToDashboard}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default CoursePlayer;
