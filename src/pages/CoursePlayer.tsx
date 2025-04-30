import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { coursesSlides } from "@/data/courseSlides";
import SlidePlayer from "@/components/course/SlidePlayer";
import CourseNotFound from "@/components/course/CourseNotFound";
import { useQuery } from "@tanstack/react-query";
import ChatHelp from "@/components/course/ChatHelp";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
  GET_PRESENTER_AVATAR: (courseId: string) => `/api/courses/${courseId}/presenter`,
  GET_SLIDE_AUDIO: (courseId: string, slideId: string) => `/api/courses/${courseId}/slides/${slideId}/audio`,
  
  // Course Progress
  UPDATE_PROGRESS: (courseId: string) => `/api/courses/${courseId}/progress`,
  
  // S3 File Paths (these would be returned by the API, not called directly)
  S3_PPT_PATH: "s3://myaudiouploadbucket/Blue White Professional Modern Safety Training Presentation.pptx",
  S3_SLIDE_IMAGES_PATH: (courseId: string) => `s3://course-content/${courseId}/slides/`,
  S3_AUDIO_PATH: (courseId: string) => `s3://course-content/${courseId}/audio/`
};

// Mock API function - replace with actual API call
const fetchPersonalizedExplanations = async (courseId: string, organizationId: string = "default") => {
  // In a real app, this would be an API call to get personalized explanations
  console.log(`Fetching explanations for course ${courseId} and org ${organizationId}`);
  
  // Mock data - replace with actual API response
  return new Promise<Record<string, string>>((resolve) => {
    setTimeout(() => {
      resolve({
        "slide-1": "In Webknot organization, this concept is particularly relevant because...",
        "slide-2": "Considering Webknot's industry focus, these regulations apply in the following ways...",
        "slide-3": "For Webknot employees, the best practice is to handle this situation by..."
      });
    }, 1000);
  });
};

interface Slide {
  id: string;
  title: string;
  content: string;
  completed: boolean;
}

interface EnhancedSlide extends Slide {
  explanation?: string;
}

// Mock data for testing
const mockSlides: Slide[] = [
  {
    id: "slide1",
    title: "Introduction to Data Privacy",
    content: "This course will cover the essential aspects of data privacy regulations including GDPR, CCPA, and industry best practices.",
    completed: false
  },
  {
    id: "slide2",
    title: "Key GDPR Requirements",
    content: "The General Data Protection Regulation (GDPR) is a comprehensive privacy law that protects EU citizens. Learn about its key requirements and how they affect your organization.",
    completed: false
  },
  {
    id: "slide3",
    title: "CCPA Compliance",
    content: "The California Consumer Privacy Act (CCPA) gives California residents specific rights regarding their personal information. This section explains what businesses need to do for compliance.",
    completed: false
  }
];

const mockExplanations = {
  "slide1": "In this organization, data privacy is crucial because...",
  "slide2": "GDPR requirements are particularly important for our industry because...",
  "slide3": "CCPA compliance affects our business operations in the following ways..."
};

const CoursePlayer = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get parameters from URL
  const tenantId = searchParams.get('tenantId');
  const token = searchParams.get('token');
  const progressParam = searchParams.get('progress');
  const progress = progressParam ? parseFloat(progressParam) : 0;

  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch explanations and set initial slide
  useEffect(() => {
    const fetchExplanationsAndSetSlide = async () => {
      if (!courseId || !tenantId || !token) {
        console.error('Missing required parameters');
        return;
      }

      try {
        // Fetch explanations array
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/courses/${courseId}/explanations?tenantId=${tenantId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch explanations');
        }

        const data = await response.json();
        console.log('Explanations response:', data);

        // The response is an object with an explanations array
        const explanations = data.explanations || [];
        
        if (!Array.isArray(explanations)) {
          throw new Error('Invalid explanations format received from API');
        }

        const totalSlides = explanations.length;
        console.log('Total slides:', totalSlides);

        // Calculate resume slide
        let resumeSlide = 0;
        if (progress > 0 && totalSlides > 0) {
          resumeSlide = Math.round((progress * totalSlides) / 100);
          // Ensure we don't exceed the total number of slides
          if (resumeSlide >= totalSlides) resumeSlide = totalSlides - 1;
        }
        console.log('Resuming from slide:', resumeSlide + 1, 'out of', totalSlides);

        // Convert explanations to slides format
        const slidesData = explanations.map((explanation: any, index: number) => ({
          id: `slide-${index + 1}`,
          title: `Slide ${index + 1}`,
          content: explanation.content || explanation, // Handle both object and string formats
          completed: false
        }));

        setSlides(slidesData);
        setCurrentSlideIndex(resumeSlide);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching explanations:', error);
        toast.error('Failed to load course content');
        setIsLoading(false);
      }
    };

    fetchExplanationsAndSetSlide();
  }, [courseId, tenantId, token, progress]);

  const handleSlideChange = (index: number) => {
    console.log('Changing slide from', currentSlideIndex, 'to', index);
    setCurrentSlideIndex(index);
  };

  const handleCourseComplete = () => {
    console.log('Course completed');
    setCourseCompleted(true);
    toast.success('Course completed successfully!');
  };

  const handleReturnToDashboard = () => {
    console.log('Returning to dashboard');
    navigate(`/dashboard?tenantId=${tenantId}&token=${token}`);
  };

  if (!courseId) {
    console.log('No courseId found, showing CourseNotFound');
    return <CourseNotFound />;
  }

  if (slides.length === 0) {
    console.log('No slides loaded, showing loading spinner');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-complybrand-700"></div>
      </div>
    );
  }

  console.log('Rendering CoursePlayer with:', {
    currentSlideIndex,
    totalSlides: slides.length,
    currentSlide: slides[currentSlideIndex]
  });

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
          explanations={mockExplanations}
          isLoadingExplanations={isLoading}
        />
            </div>
          </div>

        {tenantId && (
            <div className="lg:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <ChatHelp
            slideTitle={slides[currentSlideIndex]?.title || ""}
            slideContent={slides[currentSlideIndex]?.content || ""}
            tenantId={tenantId}
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
