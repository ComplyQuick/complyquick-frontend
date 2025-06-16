import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Wand2 } from "lucide-react";
import { toast } from "sonner";

interface Explanation {
  slide: number;
  content: string;
  explanation: string;
  explanation_audio?: string;
  explanation_subtitle?: string;
}

const AdminCourseExplanations = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get("tenantId") || "";
  const token = searchParams.get("token") || "";

  const [explanations, setExplanations] = useState<Explanation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    const fetchExplanations = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/courses/${courseId}/explanations?tenantId=${tenantId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch explanations");
        const data = await response.json();
        setExplanations(data.explanations || []);
      } catch (error) {
        toast.error("Failed to load explanations");
      } finally {
        setIsLoading(false);
      }
    };
    if (courseId && tenantId) fetchExplanations();
  }, [courseId, tenantId, token]);

  const handleEnhance = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    setIsEnhancing(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/courses/regenerate-explanations`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tenantId,
            courseId,
            queryPrompt: prompt,
            batchSize: 5,
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to enhance explanations");
      const data = await response.json();
      setExplanations(data.explanations || []);
      toast.success("Explanations enhanced successfully!");
      setPrompt("");
    } catch (error) {
      console.error("Error enhancing explanations:", error);
      toast.error("Failed to enhance explanations");
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center py-8 px-4">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-semibold">
              Course Explanations
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Course
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-complybrand-600" />
            </div>
          ) : (
            <div className="space-y-8">
              {explanations.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No explanations found for this course.
                </div>
              ) : (
                explanations.map((exp, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-complybrand-100 dark:bg-complybrand-900 text-complybrand-600 dark:text-complybrand-400 font-medium">
                        {exp.slide}
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        Slide {exp.slide}
                      </h3>
                    </div>
                    <div className="prose dark:prose-invert max-w-none">
                      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                        <p className="text-gray-700 dark:text-gray-300">
                          {exp.content}
                        </p>
                      </div>
                      <div className="p-4 bg-complybrand-50 dark:bg-complybrand-900/30 rounded-md">
                        <p className="text-gray-800 dark:text-gray-200">
                          {exp.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium mb-4">Enhance Content</h3>
            <Textarea
              placeholder="Suggest how to enhance the content for all slides..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] max-h-[200px] overflow-y-auto resize-none mb-4"
              disabled={isEnhancing}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleEnhance}
                disabled={isEnhancing || !prompt.trim()}
                className="bg-complybrand-600 hover:bg-complybrand-700 text-white px-6"
              >
                {isEnhancing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Enhance Content
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCourseExplanations;
