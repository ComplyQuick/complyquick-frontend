import React, { useState, useEffect, useRef } from "react";
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
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSearchParams } from "react-router-dom";
import {
  ChatMessage,
  Course,
  TenantDetails,
  CourseMaterial,
  POC,
  GeneralChatbotProps,
} from "@/types/Chat";
import { chatbotService } from "@/services/generalChatbotService";

// Add this helper component before the main component
const FormattedMessage = ({
  content,
  isUser,
}: {
  content: string;
  isUser: boolean;
}) => {
  if (isUser) {
    return <span>{content}</span>;
  }

  // Format AI responses
  const formatContent = (text: string) => {
    // Split by double line breaks for paragraphs, but also handle single line breaks
    const sections = text.split("\n\n").filter((s) => s.trim());

    return sections.map((section, sectionIndex) => {
      const lines = section.split("\n").filter((l) => l.trim());

      // Check if this section is a list
      const isBulletList = lines.every(
        (line) =>
          line.trim().startsWith("•") ||
          line.trim().startsWith("-") ||
          line.trim().startsWith("*")
      );

      const isNumberedList = lines.every((line) => /^\d+\./.test(line.trim()));

      if (isBulletList && lines.length > 1) {
        return (
          <ul
            key={sectionIndex}
            className={`list-disc list-inside space-y-1 ${
              sectionIndex > 0 ? "mt-4" : ""
            }`}
          >
            {lines.map((line, lineIndex) => (
              <li key={lineIndex} className="text-sm">
                {formatTextWithBold(line.replace(/^[•\-*]\s*/, ""))}
              </li>
            ))}
          </ul>
        );
      }

      if (isNumberedList && lines.length > 1) {
        return (
          <ol
            key={sectionIndex}
            className={`list-decimal list-inside space-y-1 ${
              sectionIndex > 0 ? "mt-4" : ""
            }`}
          >
            {lines.map((line, lineIndex) => (
              <li key={lineIndex} className="text-sm">
                {formatTextWithBold(line.replace(/^\d+\.\s*/, ""))}
              </li>
            ))}
          </ol>
        );
      }

      // Regular paragraph
      return (
        <div key={sectionIndex} className={sectionIndex > 0 ? "mt-4" : ""}>
          {lines.map((line, lineIndex) => (
            <p key={lineIndex} className={lineIndex > 0 ? "mt-2" : ""}>
              {formatTextWithBold(line)}
            </p>
          ))}
        </div>
      );
    });
  };

  const formatTextWithBold = (text: string) => {
    return text.split(/(\*\*.*?\*\*)/).map((part, partIndex) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong
            key={partIndex}
            className="font-semibold text-gray-900 dark:text-gray-100"
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {formatContent(content)}
    </div>
  );
};

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
  const [showCourseCards, setShowCourseCards] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem("token");
  const [searchParams] = useSearchParams();

  // Speech recognition setup
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    startListening: startSpeechRecognition,
    stopListening: stopSpeechRecognition,
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
        const data = await chatbotService.fetchTenantDetails(tenantId, token!);
        setTenantDetails(data);
      } catch (error) {
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
        // Fetch POCs and course material in parallel
        const [pocsData, materialData] = await Promise.all([
          chatbotService.fetchPOCs(tenantId, selectedCourse.id, token),
          chatbotService.fetchCourseMaterial(
            selectedCourse.id,
            tenantId,
            token
          ),
        ]);

        setPocs(pocsData);
        setCourseMaterial(materialData);
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
        const coursesData = await chatbotService.fetchCourses(tenantId, token!);
        setCourses(coursesData);
      } catch (error) {
        toast.error("Failed to load courses");
      } finally {
        setIsLoadingCourses(false);
      }
    };

    if (tenantId) {
      fetchCourses();
    }
  }, [tenantId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStartListening = () => {
    resetTranscript();
    startSpeechRecognition();
  };

  const handleStopListening = () => {
    stopSpeechRecognition();
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
      let botReply: string;

      if (selectedCourse) {
        // Course-specific chat
        botReply = await chatbotService.sendChatMessage(
          [...messages, userMessage],
          courseMaterial!.materialUrl,
          tenantDetails!.details.companyName || "Your Company",
          pocs
        );
      } else {
        // General chat
        botReply = await chatbotService.sendGeneralChatMessage(tenantId, [
          ...messages,
          userMessage,
        ]);
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: botReply,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error("Failed to get response from chatbot");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="font-semibold">General Chatbot</h3>
          <p className="text-sm text-gray-500">
            {selectedCourse
              ? `You're chatting about: ${selectedCourse.title}`
              : "Ask any general compliance or company-related question."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!hideCourseSelector && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCourseCards(!showCourseCards)}
              className="flex items-center gap-1"
            >
              {showCourseCards ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  <span className="text-sm">Hide Courses</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  <span className="text-sm">Show Courses</span>
                </>
              )}
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              <span className="text-sm">Close</span>
            </Button>
          )}
        </div>
      </div>

      {!hideCourseSelector && showCourseCards && (
        <div className="p-3 border-b bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Course-Specific Chat
            </h4>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Select a course below to get specific help about that course, or use
            general chat for company-wide questions.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {isLoadingCourses ? (
              <div className="col-span-full text-center py-3">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
                <p className="text-xs text-gray-500">Loading courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="col-span-full text-center py-3">
                <BookOpen className="h-6 w-6 mx-auto mb-1 text-gray-400" />
                <p className="text-xs text-gray-500">No courses available</p>
                <p className="text-xs text-gray-400">
                  Use general chat for company questions
                </p>
              </div>
            ) : (
              courses.map((course) => (
                <Button
                  key={course.id}
                  variant={
                    selectedCourse?.id === course.id ? "default" : "outline"
                  }
                  className={`justify-start h-auto py-2 px-2 text-left ${
                    selectedCourse?.id === course.id
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  }`}
                  onClick={() => {
                    setSelectedCourse(
                      selectedCourse?.id === course.id ? null : course
                    );
                    setMessages([]); // Clear chat history when switching courses
                  }}
                >
                  <BookOpen
                    className={`h-3 w-3 mr-2 flex-shrink-0 ${
                      selectedCourse?.id === course.id
                        ? "text-white"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  />
                  <span className="text-xs truncate font-medium">
                    {course.title}
                  </span>
                </Button>
              ))
            )}
          </div>
          {courses.length > 0 && (
            <div className="mt-2 p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                💡 Select a course for specific help, or leave unselected for
                general questions
              </p>
            </div>
          )}
        </div>
      )}

      <ScrollArea className="flex-1 p-4 min-h-[200px]">
        <div className="space-y-4">
          {messages.length === 0 && !isLoading && !selectedCourse && (
            <div className="flex justify-center">
              <div className="max-w-[80%] rounded-lg p-3 bg-muted/50 border border-dashed">
                <p className="text-sm text-gray-500 text-center">
                  👋 Start a conversation! Ask me anything about compliance or
                  select a course above for specific help.
                </p>
              </div>
            </div>
          )}
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
                <FormattedMessage
                  content={message.content}
                  isUser={message.role === "user"}
                />
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

      <div className="p-4 border-t flex gap-2 flex-shrink-0">
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
              onClick={listening ? handleStopListening : handleStartListening}
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
