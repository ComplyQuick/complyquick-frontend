import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import {
  ChatMessage,
  TenantDetails,
  CourseMaterial,
  POC,
  ChatHelpProps,
} from "@/types/Chat";
import { chatService } from "@/services/chatService";

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
    startListening: startSpeechRecognition,
    stopListening: stopSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => {
    const fetchRequiredData = async () => {
      try {
        // Fetch tenant details
        const tenantData = await chatService.fetchTenantDetails(
          tenantId,
          token!
        );
        setTenantDetails(tenantData);

        // Get courseId from URL
        const courseId = window.location.pathname
          .split("/course/")[1]
          ?.split("/")[0];
        if (!courseId) {
          throw new Error("Course ID not found in URL");
        }

        // Fetch POCs
        const pocsData = await chatService.fetchPOCs(
          tenantId,
          courseId,
          token!
        );
        setPocs(pocsData);

        // Check if we already have the material URL in localStorage
        const storedMaterialUrl = localStorage.getItem(
          `course_material_${courseId}`
        );

        if (!storedMaterialUrl) {
          // Fetch course material URL if not in localStorage
          const materialData = await chatService.fetchCourseMaterial(
            courseId,
            tenantId,
            token!
          );
          // Store the material URL in localStorage
          localStorage.setItem(
            `course_material_${courseId}`,
            materialData.materialUrl
          );
          setCourseMaterial(materialData);
        } else {
          // Use the stored material URL
          setCourseMaterial({ materialUrl: storedMaterialUrl });
        }
      } catch (error) {
        toast.error("Failed to fetch required data");
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

  const handleStartListening = () => {
    resetTranscript();
    startSpeechRecognition();
  };

  const handleStopListening = () => {
    stopSpeechRecognition();
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
      const botReply = await chatService.sendChatMessage(
        [...messages, userMessage],
        courseMaterial.materialUrl,
        tenantDetails.details.companyName || "Your Company",
        pocs
      );

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: botReply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
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
              onClick={listening ? handleStopListening : handleStartListening}
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
