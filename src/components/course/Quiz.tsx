import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lightbulb, AlertTriangle } from "lucide-react";
import ProctorRecorder, {
  ProctorRecorderHandle,
} from "@/components/quiz/ProctorRecorder";
import { MCQ } from "@/types/quiz";

const Quiz = () => {
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [hintsUsed, setHintsUsed] = useState<Record<number, boolean>>({});
  const [showHint, setShowHint] = useState(false);
  const [violations, setViolations] = useState<string[]>([]);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [violationMessage, setViolationMessage] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const navigate = useNavigate();
  const { courseId } = useParams();
  const proctorRef = useRef<ProctorRecorderHandle>(null);
  let toastId = 0;

  useEffect(() => {
    // Load MCQs from localStorage
    const savedMcqs = localStorage.getItem("currentQuiz");
    if (savedMcqs) {
      const parsedMcqs = JSON.parse(savedMcqs);
      setMcqs(parsedMcqs);
    } else {
      toast.error("Quiz data not found");
      navigate(`/course/${courseId}`);
    }
  }, [courseId, navigate]);

  const handleViolation = (type: string) => {
    setViolations((prev) => [...prev, type]);
    let message = "";
    switch (type) {
      case "no_face":
        message = "No face detected. Please stay in front of the camera.";
        break;
      case "multiple_faces":
        message = "Multiple faces detected. Only one person should be present.";
        break;
      case "gaze_away":
        message =
          "You appear to be looking away from the screen. Please focus on the quiz.";
        break;
      case "window_blur":
        message = "You left the quiz window. Please stay on the quiz page.";
        break;
      case "tab_hidden":
        message = "You switched tabs. Please stay on the quiz page.";
        break;
      case "webcam_denied":
        message =
          "Webcam access denied. Please allow camera access for proctoring.";
        break;
      default:
        message = "Suspicious activity detected.";
    }
    // Add a toast
    toastId += 1;
    const id = toastId;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion]: value,
    }));
    setShowHint(false);
  };

  const handleShowHint = () => {
    if (!hintsUsed[currentQuestion]) {
      setHintsUsed((prev) => ({
        ...prev,
        [currentQuestion]: true,
      }));
      setShowHint(true);
      toast.warning("Hint used! 3 marks will be deducted for this question.");
    }
  };

  const handleNext = () => {
    if (currentQuestion < mcqs.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setShowHint(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      setShowHint(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (Object.keys(answers).length !== mcqs.length) {
        toast.error("Please answer all questions before submitting");
        return;
      }

      // Calculate results with hint penalty
      const results = mcqs.map((question, index) => {
        const isCorrect = answers[index] === question.correctAnswer;
        const usedHint = hintsUsed[index] || false;
        const score = isCorrect ? (usedHint ? 5 : 10) : 0;
        return {
          question: question.question,
          userAnswer: answers[index] || "Not answered",
          correctAnswer: question.correctAnswer,
          isCorrect,
          usedHint,
          score,
        };
      });
      localStorage.setItem("quizResults", JSON.stringify(results));
      localStorage.setItem("lastQuizCourseId", courseId || "");
      navigate("/quiz-results");
    } catch (error) {
      toast.error("Failed to submit quiz. Please try again.");
    }
  };

  if (mcqs.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Loading quiz...</h2>
            <p className="text-gray-500">
              Please wait while we prepare your questions.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const currentMcq = mcqs[currentQuestion];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded shadow-lg animate-fade-in"
          >
            <AlertTriangle className="w-5 h-5 text-white" />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
      <Card className="max-w-3xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Assessment Quiz</h1>
          <p className="text-gray-500">
            Complete the quiz with a score of at least 70% to receive your
            certificate.
          </p>
        </div>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Question {currentQuestion + 1}
            </h2>
            <span className="text-sm text-gray-500">
              {currentQuestion + 1} of {mcqs.length} questions
            </span>
          </div>

          <div className="space-y-4">
            <p className="text-lg mb-4">{currentMcq.question}</p>

            <RadioGroup
              value={answers[currentQuestion] || ""}
              onValueChange={handleAnswer}
              className="space-y-3"
            >
              {Object.entries(currentMcq.choices).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={key}
                    id={`option-${key}`}
                    className={
                      answers[currentQuestion] === key
                        ? "border-pink-500 text-pink-500 ring-pink-200"
                        : "border-gray-400 text-gray-400"
                    }
                  />
                  <Label htmlFor={`option-${key}`} className="text-base">
                    {value}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {showHint && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">{currentMcq.hint}</p>
              </div>
            )}

            {!showHint && !hintsUsed[currentQuestion] && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleShowHint}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Show Hint (-3 marks)
              </Button>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>

          {currentQuestion < mcqs.length - 1 ? (
            <Button onClick={handleNext} disabled={!answers[currentQuestion]}>
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length !== mcqs.length}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Submit Quiz
            </Button>
          )}
        </div>

        <div className="mt-4 flex justify-center">
          <div className="flex gap-2">
            {mcqs.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors duration-200
                  ${
                    currentQuestion === index
                      ? "bg-pink-500"
                      : answers[index]
                      ? "bg-blue-600"
                      : "bg-gray-400"
                  }
                `}
              />
            ))}
          </div>
        </div>
        <div className="text-center text-xs text-gray-500 mt-4 mb-2">
          *All names, symbols, and references used in this content are purely
          fictional and intended for educational or illustrative purposes only.
          Any resemblance to real persons, living or dead, or actual
          organizations is purely coincidental.*
        </div>
      </Card>
      {/* Proctoring component */}
      {/* <ProctorRecorder
        ref={proctorRef}
        onRecordingComplete={(blob) => {
          setVideoBlob(blob);
        }}
        onViolation={handleViolation}
      /> */}
    </div>
  );
};

export default Quiz;
