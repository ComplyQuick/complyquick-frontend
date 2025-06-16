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
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, X, RotateCcw, Wand2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface Slide {
  id: string;
  title: string;
  content: string;
  completed: boolean;
}

interface Explanation {
  slide: number;
  content: string;
  explanation: string;
  explanation_audio: string;
}

const AdminCoursePlayer = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Get parameters from URL
  const urlTenantId = searchParams.get("tenantId");
  const urlToken = searchParams.get("token");

  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [explanations, setExplanations] = useState<Explanation[]>([]);
  const [isLoadingExplanations, setIsLoadingExplanations] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [initialExplanations, setInitialExplanations] = useState<Explanation[]>(
    []
  );

  const resumeSlideRef = useRef(0);

  const getHistoryKey = (courseId: string, slideIndex: number) =>
    `explanation_history_${courseId}_${slideIndex}`;

  const pushToHistory = (
    courseId: string,
    slideIndex: number,
    explanation: string
  ) => {
    const key = getHistoryKey(courseId, slideIndex);
    const stack = JSON.parse(sessionStorage.getItem(key) || "[]");
    stack.push(explanation);
    sessionStorage.setItem(key, JSON.stringify(stack));
  };

  const popFromHistory = (courseId: string, slideIndex: number) => {
    const key = getHistoryKey(courseId, slideIndex);
    const stack = JSON.parse(sessionStorage.getItem(key) || "[]");
    const prev = stack.pop();
    sessionStorage.setItem(key, JSON.stringify(stack));
    return prev;
  };

  const [isReverting, setIsReverting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const fetchExplanationsAndSetSlide = async () => {
      if (!courseId || !urlTenantId || !urlToken) {
        console.error("Missing required parameters");
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
        console.log("[AdminCoursePlayer] Explanations response:", data);

        // The response is an object with an explanations array
        const explanations = data.explanations || [];

        if (!Array.isArray(explanations)) {
          throw new Error("Invalid explanations format received from API");
        }

        setExplanations(explanations);
        setInitialExplanations(explanations);

        // Convert explanations to slides format
        const slidesData = explanations.map(
          (explanation: any, index: number) => ({
            id: `slide-${index + 1}`,
            title: `Slide ${index + 1}`,
            content: explanation.content || explanation,
            completed: false,
          })
        );

        setSlides(slidesData);
        setCurrentSlideIndex(0);
        resumeSlideRef.current = 0;
        setIsLoading(false);
        setIsLoadingExplanations(false);
      } catch (error) {
        console.error("Error fetching explanations:", error);
        toast.error("Failed to load course content");
        setIsLoading(false);
        setIsLoadingExplanations(false);
      }
    };

    fetchExplanationsAndSetSlide();
  }, [courseId, urlTenantId, urlToken]);

  const handleSlideChange = (index: number) => {
    setCurrentSlideIndex(index);
  };

  const handleCourseComplete = () => {
    toast.success("Course completed successfully!");
  };

  const handleReturnToDashboard = () => {
    navigate(`/admin/dashboard?tenantId=${urlTenantId}&token=${urlToken}`);
  };

  const handleGenerateExplanation = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGeneratingExplanation(true);
    try {
      // Store the current explanation in history before updating
      if (courseId) {
        pushToHistory(
          courseId,
          currentSlideIndex,
          explanations[currentSlideIndex]?.explanation || ""
        );
      }
      // Prepare the request body as required by the AI service
      const aiServiceUrl =
        import.meta.env.VITE_AI_SERVICE_URL + "/enhance-slide";
      const requestBody = {
        explanation_array: explanations.map((exp) => ({
          content: exp.content,
          explanation: exp.explanation,
          slide: exp.slide,
        })),
        query_index: currentSlideIndex,
        query_prompt: prompt,
      };

      const response = await fetch(aiServiceUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to generate explanation");
      }

      const data = await response.json();
      if (!data.explanation_array || !Array.isArray(data.explanation_array)) {
        throw new Error("Invalid response from AI service");
      }

      setExplanations(data.explanation_array);
      toast.success("Explanation updated successfully");
      setPrompt("");
    } catch (error) {
      console.error("Error generating explanation:", error);
      toast.error("Failed to generate explanation");
    } finally {
      setIsGeneratingExplanation(false);
    }
  };

  const handleRevertExplanation = () => {
    setIsReverting(true);
    setTimeout(() => setIsReverting(false), 600);
    if (!courseId) return;
    const prev = popFromHistory(courseId, currentSlideIndex);
    if (prev !== undefined && prev !== null) {
      setExplanations((prevExps) =>
        prevExps.map((exp, idx) =>
          idx === currentSlideIndex ? { ...exp, explanation: prev } : exp
        )
      );
      showDismissibleToast("Reverted to previous explanation!");
    } else {
      showDismissibleToast("No previous explanation to revert to.");
    }
  };

  const handleClearExplanation = () => {
    setIsClearing(true);
    setTimeout(() => setIsClearing(false), 400);
    if (!courseId) return;
    // Get the initial explanation for this slide
    const initial = initialExplanations[currentSlideIndex]?.explanation || "";
    // Clear session storage for this slide
    const key = getHistoryKey(courseId, currentSlideIndex);
    sessionStorage.removeItem(key);
    // Set the explanation back to the initial one
    setExplanations((prevExps) =>
      prevExps.map((exp, idx) =>
        idx === currentSlideIndex ? { ...exp, explanation: initial } : exp
      )
    );
    showDismissibleToast("Reverted to original explanation!");
  };

  const handleApproveExplanation = async () => {
    if (!courseId || !urlTenantId || !urlToken) {
      toast.error("Missing required parameters");
      return;
    }

    setIsApproving(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/courses/update-explanation`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${urlToken}`,
          },
          body: JSON.stringify({
            courseId,
            tenantId: urlTenantId,
            slideIndex: currentSlideIndex + 1,
            explanation: explanations[currentSlideIndex]?.explanation || "",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update explanation");
      }

      const data = await response.json();
      toast.success("Explanation approved and saved successfully!");

      // Update the explanations array with the response data
      setExplanations((prev) =>
        prev.map((exp, idx) =>
          idx === currentSlideIndex
            ? {
                ...exp,
                explanation: data.slide.explanation,
                explanation_audio: data.slide.explanation_audio,
              }
            : exp
        )
      );
    } catch (error) {
      console.error("Error approving explanation:", error);
      toast.error("Failed to approve explanation");
    } finally {
      setIsApproving(false);
    }
  };

  // Dismissible toast helper
  const showDismissibleToast = (message: string) => {
    let toastId: number | undefined = undefined;
    toastId = toast(message, {
      action: {
        label: "Clear",
        onClick: () => {
          if (toastId !== undefined) toast.dismiss(toastId);
        },
      },
      duration: 5000,
    });
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
                explanations={explanations}
                isLoadingExplanations={isLoadingExplanations}
                properties={{
                  mandatory: false,
                  skippable: true,
                  retryType: "SAME",
                }}
                onSkipForward={() => {}}
                onSkipBackward={() => {}}
                resumeSlideIndex={resumeSlideRef.current}
                isAdminView={true}
              />
            </div>
          </div>

          <div className="lg:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden h-[calc(100vh-2rem)]">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>Slide Explanation</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
                {isLoadingExplanations ? (
                  <div className="flex items-center justify-center py-8 w-full h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-complybrand-600" />
                  </div>
                ) : (
                  <>
                    <div className="flex-[3] min-h-0 overflow-y-auto p-4 prose dark:prose-invert max-w-none">
                      <p>
                        {explanations[currentSlideIndex]?.explanation ||
                          "No explanation available for this slide."}
                      </p>
                    </div>
                    <div className="flex-[1] min-h-0 overflow-y-auto p-4 flex flex-col justify-end space-y-2">
                      <Textarea
                        placeholder="Enter your prompt to modify the explanation..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[60px] max-h-[100px] overflow-y-auto resize-none"
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          onClick={handleGenerateExplanation}
                          disabled={isGeneratingExplanation}
                          className="bg-complybrand-600 hover:bg-complybrand-700 text-white py-1 px-10 text-sm h-8"
                          size="sm"
                        >
                          {isGeneratingExplanation ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Wand2 className="mr-2 h-4 w-4" />
                          )}
                          Enhance Explanation
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          title="Approve"
                          onClick={handleApproveExplanation}
                          disabled={isApproving}
                        >
                          {isApproving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className={`h-8 w-8 ${
                            isReverting ? "animate-spin" : ""
                          }`}
                          title="Revert"
                          onClick={handleRevertExplanation}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className={`h-8 w-8 transition-transform transition-opacity duration-400 ${
                            isClearing ? "scale-0 opacity-0" : ""
                          }`}
                          title="Clear"
                          onClick={handleClearExplanation}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
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

export default AdminCoursePlayer;
