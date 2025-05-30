import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface TenantDetails {
  details: {
    hrContactName: string;
    hrContactEmail: string;
    hrContactPhone: string;
    ceoName: string;
    ceoEmail: string;
    ceoContant: string;
    ctoName: string;
    ctoEmail: string;
    ctoContact: string;
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

interface ChatHelpProps {
  slideTitle: string;
  slideContent: string;
  tenantId: string;
}

const ChatHelp = ({ slideTitle, slideContent, tenantId }: ChatHelpProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tenantDetails, setTenantDetails] = useState<TenantDetails | null>(
    null
  );
  const [courseMaterial, setCourseMaterial] = useState<CourseMaterial | null>(
    null
  );
  const [pocs, setPocs] = useState<POC[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem("token");

  // Speech recognition setup
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Fetch tenant details, course material, and POCs when component mounts
  useEffect(() => {
    const fetchRequiredData = async () => {
      try {
        // Fetch tenant details
        const tenantResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/tenants/${tenantId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!tenantResponse.ok) {
          throw new Error("Failed to fetch tenant details");
        }

        const tenantData = await tenantResponse.json();
        console.log("Tenant details:", tenantData);
        setTenantDetails(tenantData);

        // Get courseId from URL
        const courseId = window.location.pathname
          .split("/course/")[1]
          ?.split("/")[0];
        if (!courseId) {
          throw new Error("Course ID not found in URL");
        }

        // Fetch POCs
        const pocsResponse = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/tenants/${tenantId}/courses/${courseId}/pocs`,
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
        console.log("POCs:", pocsData);
        setPocs(pocsData.pocs);

        // Check if we already have the material URL in localStorage
        const storedMaterialUrl = localStorage.getItem(
          `course_material_${courseId}`
        );

        if (!storedMaterialUrl) {
          // Fetch course material URL if not in localStorage
          const materialResponse = await fetch(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/api/courses/${courseId}/chatbot-material?tenantId=${tenantId}`,
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
            `course_material_${courseId}`,
            materialData.materialUrl
          );
          setCourseMaterial({ materialUrl: materialData.materialUrl });
        } else {
          // Use the stored material URL
          setCourseMaterial({ materialUrl: storedMaterialUrl });
        }
      } catch (error) {
        console.error("Error fetching required data:", error);
        toast.error("Failed to load chat data");
      }
    };

    if (tenantId && token) {
      fetchRequiredData();
    }
  }, [tenantId, token]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startListening = () => {
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
    if (transcript) {
      setInput(transcript);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !tenantDetails || !courseMaterial) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    resetTranscript();
    setIsLoading(true);

    try {
      console.log("Sending request to chatbot with:", {
        chatHistory: [...messages, userMessage],
        presentation_url: courseMaterial.materialUrl,
        company_name: tenantDetails.details.companyName || "Your Company",
        pocs: pocs,
      });

      const response = await fetch("http://localhost:8000/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatHistory: [...messages, userMessage],
          presentation_url: courseMaterial.materialUrl,
          company_name: tenantDetails.details.companyName || "Your Company",
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
        throw new Error(`API error: ${response.status} ${response.statusText}`);
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
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to get response from AI service");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Chat Help</h3>
        <p className="text-sm text-gray-500">
          Ask questions about: {slideTitle}
        </p>
      </div>

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
            placeholder={listening ? "Listening..." : "Type your question..."}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading || !tenantDetails || !courseMaterial}
          />
          {browserSupportsSpeechRecognition && (
            <Button
              variant="outline"
              size="icon"
              onClick={listening ? stopListening : startListening}
              disabled={isLoading}
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
            isLoading || !input.trim() || !tenantDetails || !courseMaterial
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

export default ChatHelp;
