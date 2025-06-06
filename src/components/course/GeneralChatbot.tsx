import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Send,
  Mic,
  MicOff,
  BookOpen,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { useSearchParams } from "react-router-dom";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
}

interface TenantDetails {
  details: {
    companyName?: string;
  };
}

interface CourseMaterial {
  materialUrl: string;
}

interface POC {
  role: string;
  name: string;
  contact: string;
}

interface GeneralChatbotProps {
  tenantId: string;
  initialCourseId?: string;
  hideCourseSelector?: boolean;
  onClose?: () => void;
}

const GeneralChatbot = ({
  tenantId,
  initialCourseId,
  hideCourseSelector = false,
  onClose,
}: GeneralChatbotProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [tenantDetails, setTenantDetails] = useState<TenantDetails | null>(
    null
  );
  const [courseMaterial, setCourseMaterial] = useState<CourseMaterial | null>(
    null
  );
  const [pocs, setPocs] = useState<POC[]>([]);
  const [showCourseCards, setShowCourseCards] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem("token");
  const [searchParams] = useSearchParams();

  // Speech recognition setup
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Set initial selected course from URL or prop
  useEffect(() => {
    const selectedCourseId =
      initialCourseId || searchParams.get("selectedCourse");
    if (selectedCourseId && courses.length > 0) {
      const course = courses.find((c) => c.id === selectedCourseId);
      if (course) {
        setSelectedCourse(course);
        setShowCourseCards(false); // Hide course cards when coming from course card
      }
    }
  }, [initialCourseId, searchParams, courses]);

  // Fetch tenant details
  useEffect(() => {
    const fetchTenantDetails = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/tenants/${tenantId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch tenant details");
        }

        const data = await response.json();
        setTenantDetails(data);
      } catch (error) {
        console.error("Error fetching tenant details:", error);
        toast.error("Failed to load tenant details");
      }
    };

    if (tenantId && token) {
      fetchTenantDetails();
    }
  }, [tenantId, token]);

  // Fetch course material and POCs when a course is selected
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!selectedCourse || !tenantId || !token) return;

      try {
        // Fetch POCs
        const pocsResponse = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/tenants/${tenantId}/courses/${selectedCourse.id}/pocs`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!pocsResponse.ok) {
          throw new Error("Failed to fetch POCs");
        }

        const pocsData = await pocsResponse.json();
        setPocs(pocsData.pocs);

        // Check if we already have the material URL in localStorage
        const storedMaterialUrl = localStorage.getItem(
          `course_material_${selectedCourse.id}`
        );

        if (!storedMaterialUrl) {
          // Fetch course material URL if not in localStorage
          const materialResponse = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/courses/${
              selectedCourse.id
            }/chatbot-material?tenantId=${tenantId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!materialResponse.ok) {
            throw new Error("Failed to fetch course material");
          }

          const materialData = await materialResponse.json();
          // Store the material URL in localStorage
          localStorage.setItem(
            `course_material_${selectedCourse.id}`,
            materialData.materialUrl
          );
          setCourseMaterial({ materialUrl: materialData.materialUrl });
        } else {
          // Use the stored material URL
          setCourseMaterial({ materialUrl: storedMaterialUrl });
        }
      } catch (error) {
        console.error("Error fetching course data:", error);
      }
    };

    fetchCourseData();
  }, [selectedCourse, tenantId, token]);

  // Fetch available courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(
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

        if (!response.ok) {
          throw new Error("Failed to fetch courses");
        }

        const coursesData = await response.json();
        setCourses(coursesData);
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast.error("Failed to load courses");
      } finally {
        setIsLoadingCourses(false);
      }
    };

    if (tenantId) {
      fetchCourses();
    }
  }, [tenantId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startListening = () => {
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
    if (transcript) setInput(transcript);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !tenantId) return;
    if (selectedCourse && (!courseMaterial || !tenantDetails)) return;

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    resetTranscript();
    setIsLoading(true);

    try {
      if (selectedCourse) {
        // Course-specific chat
        console.log("Sending request to course-specific chatbot with:", {
          chatHistory: [...messages, userMessage],
          presentation_url: courseMaterial?.materialUrl,
          company_name: tenantDetails?.details.companyName || "Your Company",
          pocs: pocs,
        });

        const response = await fetch("http://localhost:8000/chatbot", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chatHistory: [...messages, userMessage],
            presentation_url: courseMaterial?.materialUrl,
            company_name: tenantDetails?.details.companyName || "Your Company",
            pocs: pocs,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error("Error response:", {
            status: response.status,
            statusText: response.statusText,
            errorData,
          });
          throw new Error(
            `API error: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("Chatbot response:", data);

        const botReply =
          typeof data.response === "object" && data.response.response
            ? data.response.response
            : data.response;
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: botReply,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // General chat
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/courses/general-chatbot`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tenantId,
              chatHistory: [...messages, userMessage],
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to get response from chatbot");
        }

        const data = await response.json();
        const botReply =
          typeof data.response === "object" && data.response.response
            ? data.response.response
            : data.response;
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: botReply,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to get response from chatbot");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold">General Chatbot</h3>
          <p className="text-sm text-gray-500">
            {selectedCourse
              ? `You're chatting about: ${selectedCourse.title}`
              : "Ask any general compliance or company-related question."}
          </p>
        </div>
        {!hideCourseSelector && (
          <button
            onClick={() => setShowCourseCards(!showCourseCards)}
            className="p-1 hover:bg-muted rounded-full transition-colors"
            aria-label={showCourseCards ? "Hide courses" : "Show courses"}
          >
            {showCourseCards ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Close chatbot"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {!hideCourseSelector && showCourseCards && (
        <div className="p-4 border-b">
          <h4 className="text-sm font-medium mb-2">Course-Specific Chat</h4>
          <div className="grid grid-cols-2 gap-2">
            {isLoadingCourses ? (
              <div className="col-span-2 text-center py-2">
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              </div>
            ) : (
              courses.map((course) => (
                <Button
                  key={course.id}
                  variant={
                    selectedCourse?.id === course.id ? "default" : "outline"
                  }
                  className="justify-start h-auto py-2 px-3"
                  onClick={() => {
                    setSelectedCourse(
                      selectedCourse?.id === course.id ? null : course
                    );
                    setMessages([]); // Clear chat history when switching courses
                  }}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  <span className="text-sm truncate">{course.title}</span>
                </Button>
              ))
            )}
          </div>
        </div>
      )}

      <ScrollArea className="h-[400px] p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                <span className="animate-pulse">Typing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex gap-2">
        <div className="flex-1 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selectedCourse
                ? `Ask a question about ${selectedCourse.title}...`
                : listening
                ? "Listening..."
                : "Type your question..."
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={
              isLoading ||
              (selectedCourse && (!courseMaterial || !tenantDetails))
            }
          />
          {browserSupportsSpeechRecognition && (
            <Button
              variant="outline"
              size="icon"
              onClick={listening ? stopListening : startListening}
              disabled={
                isLoading ||
                (selectedCourse && (!courseMaterial || !tenantDetails))
              }
            >
              {listening ? (
                <MicOff className="h-4 w-4 text-red-500" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        <Button
          onClick={handleSendMessage}
          disabled={
            isLoading ||
            !input.trim() ||
            (selectedCourse && (!courseMaterial || !tenantDetails))
          }
          size="icon"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Card>
  );
};

export default GeneralChatbot;
