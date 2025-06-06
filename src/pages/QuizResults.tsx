import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Award, CheckCircle2, XCircle, Download } from "lucide-react";
import Certificate from "@/components/course/Certificate";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { uploadCertificateToDrive } from "@/services/googleDriveService";
import { jwtDecode } from "jwt-decode";
import { Loader } from "@/components/ui/loader";
import { useAuthStore } from "@/store/authStore";

interface QuizResult {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  usedHint: boolean;
}

const QuizResults = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  let courseIdFinal = courseId;
  // Fallback: extract courseId from URL if undefined or empty
  if (!courseIdFinal) {
    const match = window.location.pathname.match(/course\/([\w-]+)/);
    if (match && match[1]) {
      courseIdFinal = match[1];
    } else {
      courseIdFinal = localStorage.getItem("lastQuizCourseId") || undefined;
    }
  }
  console.log("QuizResults: Final courseId used:", courseIdFinal);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [courseName, setCourseName] = useState("");
  const [userName, setUserName] = useState<string>("");
  const { tenantId } = useAuthStore();
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isGeneratingMCQ, setIsGeneratingMCQ] = useState(false);

  useEffect(() => {
    const storedResults = localStorage.getItem("quizResults");
    const storedCourseName = localStorage.getItem(
      `course_name_${courseIdFinal}`
    );

    console.log("Stored results:", storedResults);

    if (storedResults) {
      try {
        const parsedResults = JSON.parse(storedResults);
        console.log("Parsed results:", parsedResults);
        console.log("Number of questions:", parsedResults.length);

        setResults(parsedResults);
        // Calculate score with hint penalty
        const correctAnswers = parsedResults.filter(
          (result: QuizResult) => result.isCorrect
        ).length;
        const totalQuestions = parsedResults.length;
        const hintsUsed = parsedResults.filter(
          (result: QuizResult) => result.usedHint
        ).length;
        let calculatedScore =
          (correctAnswers / totalQuestions) * 100 - hintsUsed * 3;
        if (calculatedScore < 0) calculatedScore = 0;

        console.log("Score calculation:", {
          correctAnswers,
          totalQuestions,
          hintsUsed,
          calculatedScore,
        });

        setScore(calculatedScore);
      } catch (error) {
        console.error("Error parsing results:", error);
      }
    } else {
      console.log("No stored results found");
    }
    // Fetch user name from profile endpoint
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user-dashboard/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.name) setUserName(data.name);
        })
        .catch(() => {});
    }
    // Get tenantId from store
    console.log("QuizResults: tenantId", tenantId, "courseId", courseIdFinal);
    setLoading(false);
  }, [courseIdFinal, tenantId]);

  // Fetch course name when tenantId and courseIdFinal are available
  useEffect(() => {
    if (tenantId && courseIdFinal) {
      fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/tenant-admin/tenants/${tenantId}/courses`
      )
        .then((res) => res.json())
        .then((courses) => {
          const course = courses.find((c: any) => c.id === courseIdFinal);
          setCourseName(course?.title || "Course");
        })
        .catch(() => setCourseName("Course"));
    }
  }, [tenantId, courseIdFinal]);

  const handleReturnToDashboard = () => {
    // Clear the results from localStorage when returning to dashboard
    localStorage.removeItem("quizResults");
    localStorage.removeItem("currentQuiz");
    navigate("/dashboard");
  };

  const handleTryAgain = async () => {
    // Get retryType from localStorage
    const retryType =
      localStorage.getItem(`course_${courseIdFinal}_retryType`) || "SAME";
    console.log("RetryType for this course:", retryType);

    if (retryType === "SAME") {
      // Shuffle the currentQuiz questions
      const currentQuiz = localStorage.getItem("currentQuiz");
      if (currentQuiz) {
        const questions = JSON.parse(currentQuiz);
        // Fisher-Yates shuffle
        for (let i = questions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [questions[i], questions[j]] = [questions[j], questions[i]];
        }
        localStorage.setItem("currentQuiz", JSON.stringify(questions));
        localStorage.removeItem("quizResults");
        window.history.back();
      } else {
        toast.error("Quiz data not found. Please try again.");
      }
    } else {
      // retryType is DIFFERENT, call AI service to generate new MCQs
      try {
        setIsGeneratingMCQ(true);
        const tenantId = localStorage.getItem("tenantId");
        const token = localStorage.getItem("token");
        // Fetch course details to get materialUrl
        const courseList = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/tenant-admin/tenants/${tenantId}/courses`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const courses = await courseList.json();
        const course = courses.find((c: any) => c.id === courseIdFinal);
        if (!course || !course.materialUrl) {
          toast.error("Course material not found for MCQ generation.");
          return;
        }
        // Call AI service
        const mcqResponse = await fetch(
          `${import.meta.env.VITE_AI_SERVICE_URL}/generate_mcq`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              presentation_url: course.materialUrl,
              course_id: courseIdFinal,
              tenant_id: tenantId,
            }),
          }
        );
        if (!mcqResponse.ok) {
          toast.error("Failed to generate new quiz questions.");
          return;
        }
        const mcqData = await mcqResponse.json();
        if (!mcqData.mcqs || !Array.isArray(mcqData.mcqs)) {
          toast.error("Invalid MCQ data received.");
          return;
        }
        localStorage.setItem("currentQuiz", JSON.stringify(mcqData.mcqs));
        localStorage.removeItem("quizResults");
        window.history.back();
      } catch (error) {
        console.error("Error generating new MCQs:", error);
        toast.error("Failed to generate new quiz questions.");
      } finally {
        setIsGeneratingMCQ(false);
      }
    }
  };

  // Function to handle certificate upload
  const handleCertificateUpload = async () => {
    if (certificateRef.current && score >= 70) {
      try {
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(certificateRef.current, {
          scale: 2,
          backgroundColor: "#ffffff",
          logging: true,
          useCORS: true,
        });

        // Convert canvas to ArrayBuffer
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
          }, "image/png");
        });
        const arrayBuffer = await blob.arrayBuffer();

        // Generate filename
        const fileName = `${courseName.replace(/\s+/g, "-")}-${
          userName?.replace(/\s+/g, "-") || "Certificate"
        }-${new Date().toISOString().split("T")[0]}.png`;

        // Upload to Google Drive
        const driveUrl = await uploadCertificateToDrive(arrayBuffer, fileName);
        console.log("Certificate uploaded successfully!");
        console.log("Certificate URL:", driveUrl);
        setCertificateUrl(driveUrl);

        // Store certificate in backend
        const token = localStorage.getItem("token");
        let userId = "";
        if (token) {
          try {
            const decoded: any = jwtDecode(token);
            userId = decoded.sub || decoded.id || decoded.userId || "";
          } catch (e) {
            console.error("Failed to decode token", e);
          }
        }
        if (userId && courseIdFinal && driveUrl) {
          fetch(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/api/user-dashboard/certificates/store`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                userId,
                courseId: courseIdFinal,
                certificateUrl: driveUrl,
              }),
            }
          )
            .then((res) => res.json())
            .then((data) => {
              console.log("Certificate stored in backend:", data);
            })
            .catch((err) => {
              console.error("Failed to store certificate in backend:", err);
            });
        }
      } catch (error) {
        console.error("Error uploading certificate:", error);
      }
    }
  };

  // Upload certificate when quiz is passed and userName/courseName are loaded
  useEffect(() => {
    if (
      score >= 70 &&
      !certificateUrl &&
      userName &&
      userName.trim() !== "" &&
      courseName &&
      courseName.trim() !== ""
    ) {
      handleCertificateUpload();
    }
  }, [score, certificateUrl, userName, courseName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isGeneratingMCQ) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 z-50 flex items-center justify-center">
        <Loader message="Please wait until the MCQ is generated" />
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-[90%] max-w-md">
          <CardHeader>
            <CardTitle className="text-center">No Results Found</CardTitle>
            <CardDescription className="text-center">
              We couldn't find any quiz results. Please try taking the quiz
              again.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={handleReturnToDashboard}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ScrollArea className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Score Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Quiz Results
              </CardTitle>
              <CardDescription className="text-center">
                {score >= 70
                  ? "Congratulations! You passed the quiz."
                  : "You can try again to improve your score."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Score Display */}
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">
                    {score.toFixed(0)}%
                  </div>
                  <Progress value={score} className="h-2" />
                  <div className="mt-2 text-sm text-muted-foreground">
                    {score >= 70 ? (
                      <div className="flex items-center justify-center text-green-600">
                        <Award className="w-5 h-5 mr-2" />
                        Passed
                      </div>
                    ) : (
                      <div className="flex items-center justify-center text-red-600">
                        <XCircle className="w-5 h-5 mr-2" />
                        Not Passed
                      </div>
                    )}
                  </div>
                </div>

                {/* Results Summary */}
                <div className="text-center space-y-2">
                  <p>Total Questions: {results.length}</p>
                  <p>
                    Correct Answers: {results.filter((r) => r.isCorrect).length}
                  </p>
                  <p>
                    Incorrect Answers:{" "}
                    {results.filter((r) => !r.isCorrect).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Certificate Section */}
          {score >= 70 && (
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-center">
                  Your Certificate
                </CardTitle>
                <CardDescription className="text-center">
                  {certificateUrl ? (
                    <span className="mt-2 block">
                      <span className="text-green-600 block">
                        Certificate uploaded successfully!
                      </span>
                      <a
                        href={certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Certificate on Google Drive
                      </a>
                    </span>
                  ) : (
                    "Generating your certificate..."
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Certificate
                  ref={certificateRef}
                  courseName={courseName}
                  completionDate={new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  score={score}
                  userName={userName}
                />
              </CardContent>
            </Card>
          )}

          {/* Results Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                Detailed Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <Card
                    key={index}
                    className={`p-4 ${
                      result.isCorrect
                        ? "bg-green-50/50 dark:bg-green-900/20"
                        : "bg-red-50/50 dark:bg-red-900/20"
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {result.isCorrect ? (
                          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium mb-2">
                          Question {index + 1}: {result.question}
                        </h3>
                        <div className="text-sm space-y-1">
                          <p
                            className={`${
                              result.isCorrect
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            Your answer: {result.userAnswer}
                          </p>
                          {!result.isCorrect && (
                            <p className="text-green-600 dark:text-green-400">
                              Correct answer: {result.correctAnswer}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <Button
              variant="default"
              onClick={handleReturnToDashboard}
              className="bg-primary hover:bg-primary/90"
            >
              Return to Dashboard
            </Button>
            {score < 70 && (
              <Button
                variant="outline"
                onClick={handleTryAgain}
                className="border-primary text-primary hover:bg-primary/10"
              >
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default QuizResults;
