import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import AssessmentQuiz from "@/components/course/AssessmentQuiz";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

// Mock quiz data - in a real app, this would come from an API
const coursesQuizzes = {
  "1": [
    {
      id: "q1",
      question: "Which of the following is a key principle of GDPR?",
      options: [
        { id: "a", text: "Data should be collected without limitations" },
        {
          id: "b",
          text: "Purpose limitation - data collected for specified, explicit, legitimate purposes",
        },
        { id: "c", text: "Organizations can keep personal data indefinitely" },
        {
          id: "d",
          text: "Consent is not required for processing personal data",
        },
      ],
      correctOptionId: "b",
    },
    {
      id: "q2",
      question:
        "What is the maximum timeframe for reporting a data breach under GDPR?",
      options: [
        { id: "a", text: "72 hours" },
        { id: "b", text: "30 days" },
        { id: "c", text: "7 days" },
        { id: "d", text: "24 hours" },
      ],
      correctOptionId: "a",
    },
    {
      id: "q3",
      question:
        "Which of the following is NOT a data subject right under GDPR?",
      options: [
        { id: "a", text: "Right to access" },
        { id: "b", text: "Right to be forgotten" },
        { id: "c", text: "Right to data portability" },
        { id: "d", text: "Right to unlimited data storage" },
      ],
      correctOptionId: "d",
    },
    {
      id: "q4",
      question:
        "The California Consumer Privacy Act (CCPA) applies to businesses that:",
      options: [
        { id: "a", text: "Have at least one California customer" },
        { id: "b", text: "Have annual gross revenue exceeding $25 million" },
        { id: "c", text: "Are based in California only" },
        { id: "d", text: "Process any personal data" },
      ],
      correctOptionId: "b",
    },
    {
      id: "q5",
      question:
        "Which of the following is a best practice for handling personal data?",
      options: [
        { id: "a", text: "Collect as much data as possible for future use" },
        {
          id: "b",
          text: "Store data indefinitely for potential business needs",
        },
        { id: "c", text: "Minimize data collection to only what is necessary" },
        {
          id: "d",
          text: "Share data freely with third parties to maximize value",
        },
      ],
      correctOptionId: "c",
    },
  ],
  "2": [
    {
      id: "q1",
      question: "Which of the following is a secure password practice?",
      options: [
        { id: "a", text: "Using the same password across multiple accounts" },
        {
          id: "b",
          text: "Using a password manager to generate and store unique passwords",
        },
        { id: "c", text: "Writing down passwords on sticky notes" },
        { id: "d", text: "Using simple, easy-to-remember words" },
      ],
      correctOptionId: "b",
    },
    {
      id: "q2",
      question: "What is a common sign of a phishing email?",
      options: [
        { id: "a", text: "Coming from a known colleague's email address" },
        { id: "b", text: "Contains no links or attachments" },
        { id: "c", text: "Creates urgency or threatens negative consequences" },
        { id: "d", text: "Contains proper grammar and formatting" },
      ],
      correctOptionId: "c",
    },
    {
      id: "q3",
      question:
        "When working remotely, which of the following is a security best practice?",
      options: [
        { id: "a", text: "Using public WiFi without a VPN" },
        { id: "b", text: "Leaving your laptop unlocked when you step away" },
        { id: "c", text: "Using a secure VPN connection for company work" },
        {
          id: "d",
          text: "Sharing your work account credentials with family members",
        },
      ],
      correctOptionId: "c",
    },
  ],
  "3": [
    {
      id: "q1",
      question:
        "Which of the following behaviors could be considered workplace harassment?",
      options: [
        {
          id: "a",
          text: "Giving constructive feedback about work performance",
        },
        {
          id: "b",
          text: "Making unwelcome comments about a person's appearance",
        },
        { id: "c", text: "Declining a lunch invitation" },
        { id: "d", text: "Asking for clarification on a project requirement" },
      ],
      correctOptionId: "b",
    },
    {
      id: "q2",
      question:
        "What should you do if you witness harassment in the workplace?",
      options: [
        { id: "a", text: "Ignore it as it's not your business" },
        { id: "b", text: "Wait to see if it happens again before reporting" },
        { id: "c", text: "Report it to HR or through appropriate channels" },
        { id: "d", text: "Confront the harasser aggressively" },
      ],
      correctOptionId: "c",
    },
    {
      id: "q3",
      question:
        "Which of the following is an example of a bystander intervention technique?",
      options: [
        { id: "a", text: "Laughing along with inappropriate jokes" },
        {
          id: "b",
          text: "Direct intervention by saying, 'That's not appropriate'",
        },
        { id: "c", text: "Walking away from uncomfortable situations" },
        { id: "d", text: "Expecting someone else to address the situation" },
      ],
      correctOptionId: "b",
    },
  ],
};

interface Question {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
}

const QuizPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const { token, tenantId } = useAuthStore();

  useEffect(() => {
    if (courseId && coursesQuizzes[courseId as keyof typeof coursesQuizzes]) {
      setQuestions(coursesQuizzes[courseId as keyof typeof coursesQuizzes]);
    }
  }, [courseId]);

  if (!questions.length) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-16 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Quiz Not Found</h1>
            <p className="mb-4">
              The quiz you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const handleQuizComplete = (passed: boolean, score: number) => {
    // Navigate to the result page with data
    navigate(`/course/${courseId}/result?passed=${passed}&score=${score}`);

    if (passed) {
      toast.success(`Congratulations! You passed with a score of ${score}%`, {
        duration: 5000,
      });
    } else {
      toast.error(`You scored ${score}%. 70% is required to pass. Try again.`, {
        duration: 5000,
      });
    }
  };

  const handleReturnToDashboard = () => {
    navigate(`/dashboard?tenantId=${tenantId}&token=${token}`);
  };

  console.log("[QuizPage] Rendering QuizPage, should render ProctorRecorder");

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to={`/course/${courseId}`}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-semibold truncate">
              {courseId === "1"
                ? "Data Privacy Compliance Quiz"
                : courseId === "2"
                ? "Information Security Basics Quiz"
                : "Anti-Harassment Training Quiz"}
            </h1>
          </div>
          <Button variant="outline" onClick={handleReturnToDashboard}>
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </div>

      <main className="flex-grow pt-8 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Assessment Quiz
            </h2>
            <p className="text-center mb-8 text-gray-600">
              Complete the quiz with a score of at least 70% to receive your
              certificate.
            </p>
            <AssessmentQuiz
              questions={questions}
              passingScore={70}
              onComplete={handleQuizComplete}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuizPage;
