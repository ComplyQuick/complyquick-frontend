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
import { Slide, Explanation } from "@/types/course";
import { adminService } from "@/services/adminService";
import Navbar from "@/components/layout/Navbar";

const AdminCoursePlayer = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
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
  const [editingSlideIndex, setEditingSlideIndex] = useState<number | null>(
    null
  );
  const [editedExplanation, setEditedExplanation] = useState("");
  const [materialUrl, setMaterialUrl] = useState<string>("");

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
        const data = await adminService.fetchCourseExplanations(
          courseId,
          urlTenantId,
          urlToken
        );

        const explanations = data.explanations || [];

        if (!Array.isArray(explanations)) {
          throw new Error("Invalid explanations format received from API");
        }

        setExplanations(explanations);
        setInitialExplanations(explanations);

        // Convert explanations to slides format
        const slidesData = explanations.map((explanation, index) => ({
          id: `slide-${index + 1}`,
          title: `Slide ${index + 1}`,
          content:
            typeof explanation === "string" ? explanation : explanation.content,
          completed: false,
        }));

        setSlides(slidesData);
        setCurrentSlideIndex(0);
        resumeSlideRef.current = 0;
        setIsLoading(false);
        setIsLoadingExplanations(false);

        // Fetch material URL for the course
        try {
          const materialUrlData = await adminService.fetchCourseMaterial(
            courseId,
            urlTenantId,
            urlToken
          );
          setMaterialUrl(materialUrlData.materialUrl || "");
        } catch (materialError) {
          console.warn("Failed to fetch material URL:", materialError);
          // Don't fail the entire load if material URL fetch fails
        }
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
    setEditingSlideIndex(null);
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
      if (courseId) {
        pushToHistory(
          courseId,
          currentSlideIndex,
          explanations[currentSlideIndex]?.explanation || ""
        );
      }

      const data = await adminService.generateExplanation(
        explanations,
        currentSlideIndex,
        prompt
      );

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
    const initial = initialExplanations[currentSlideIndex]?.explanation || "";
    const key = getHistoryKey(courseId, currentSlideIndex);
    sessionStorage.removeItem(key);
    setExplanations((prevExps) =>
      prevExps.map((exp, idx) =>
        idx === currentSlideIndex ? { ...exp, explanation: initial } : exp
      )
    );
    showDismissibleToast("Reverted to original explanation!");
  };

  const handleDoubleClickExplanation = () => {
    const currentExplanation = explanations.find(
      (exp) => exp.slide === currentSlideIndex + 1
    )?.explanation;
    if (currentExplanation !== undefined) {
      setEditingSlideIndex(currentSlideIndex);
      setEditedExplanation(currentExplanation);
    }
  };

  const handleCancelEdit = () => {
    setEditingSlideIndex(null);
    setEditedExplanation("");
  };

  const handleSaveLocalExplanation = () => {
    if (editingSlideIndex === null) return;

    const updatedExplanations = explanations.map((exp, index) => {
      if (index === editingSlideIndex) {
        return {
          ...exp,
          explanation: editedExplanation,
          isApproved: false,
        };
      }
      return exp;
    });

    setExplanations(updatedExplanations);
    saveHistory(updatedExplanations[editingSlideIndex]);

    setEditingSlideIndex(null);
    setEditedExplanation("");
  };

  const saveHistory = (explanation: Explanation) => {
    const key = getHistoryKey(courseId!, explanation.slide - 1);
    const history = JSON.parse(localStorage.getItem(key) || "[]");
    history.push(explanation.explanation);
    localStorage.setItem(key, JSON.stringify(history));
  };

  const handleSaveExplanation = async () => {
    if (!courseId || !urlTenantId || !urlToken) {
      toast.error("Missing required parameters");
      return;
    }

    const currentExplanation = explanations.find(
      (exp) => exp.slide === currentSlideIndex + 1
    );

    if (!currentExplanation) {
      toast.error("No explanation found for the current slide.");
      return;
    }

    setIsApproving(true);
    try {
      const response = await adminService.updateExplanation(
        {
          courseId,
          tenantId: urlTenantId,
          slideIndex: currentSlideIndex + 1,
          explanation: currentExplanation.explanation,
        },
        urlToken
      );

      toast.success("Explanation saved successfully!");

      // Update the explanations array with the response data,
      // which might include a new audio URL
      setExplanations((prev) =>
        prev.map((exp) =>
          exp.slide === currentSlideIndex + 1
            ? {
                ...exp,
                explanation: response.slide.explanation,
                explanation_audio: response.slide.explanation_audio,
              }
            : exp
        )
      );
    } catch (error) {
      console.error("Error saving explanation:", error);
      toast.error("Failed to save explanation");
    } finally {
      setIsApproving(false);
    }
  };

  // Dismissible toast helper
  const showDismissibleToast = (message: string) => {
    let toastId: string | number | undefined = undefined;
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Navbar */}
      <Navbar
        userRole="admin"
        showBackButton={true}
        onBackClick={handleReturnToDashboard}
      />

      {/* Main content with fixed height to prevent scrolling */}
      <div className="flex-1 flex flex-col pt-16 overflow-hidden">
        <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
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
                materialUrl={materialUrl}
              />
            </div>
          </div>

          <div className="lg:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Slide Explanation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
                {isLoadingExplanations ? (
                  <div className="flex items-center justify-center py-8 w-full h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-complybrand-600" />
                  </div>
                ) : editingSlideIndex === currentSlideIndex ? (
                  <div className="flex-1 flex flex-col p-4 space-y-2">
                    <Textarea
                      value={editedExplanation}
                      onChange={(e) => setEditedExplanation(e.target.value)}
                      className="flex-1 resize-none text-base"
                      autoFocus
                      onBlur={handleSaveLocalExplanation}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSaveLocalExplanation();
                        }
                        if (e.key === "Escape") {
                          handleCancelEdit();
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Press Enter to save, or Escape to cancel.
                    </p>
                  </div>
                ) : (
                  <>
                    <div
                      className="flex-1 overflow-y-auto p-4"
                      onDoubleClick={handleDoubleClickExplanation}
                    >
                      <p className="text-base whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300">
                        {explanations.find(
                          (exp) => exp.slide === currentSlideIndex + 1
                        )?.explanation || "No explanation available."}
                      </p>
                    </div>
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                      <Textarea
                        id="prompt"
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
                          onClick={handleSaveExplanation}
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
                          title="Revert Changes"
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
    </div>
  );
};

export default AdminCoursePlayer;
