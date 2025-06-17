import { ChatMessage, Course, CourseMaterial, POC } from "@/types/Chat";
import { chatService } from "./chatService";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const chatbotService = {
  async fetchCourses(tenantId: string, token: string): Promise<Course[]> {
    const response = await fetch(
      `${BACKEND_URL}/api/tenant-admin/tenants/${tenantId}/courses`,
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

    return response.json();
  },

  async sendGeneralChatMessage(
    tenantId: string,
    messages: ChatMessage[]
  ): Promise<string> {
    const response = await fetch(`${BACKEND_URL}/api/courses/general-chatbot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId,
        chatHistory: messages,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get response from chatbot");
    }

    const data = await response.json();
    return typeof data.response === "object" && data.response.response
      ? data.response.response
      : data.response;
  },

  // Reuse existing chat service methods
  fetchTenantDetails: chatService.fetchTenantDetails,
  fetchPOCs: chatService.fetchPOCs,
  fetchCourseMaterial: chatService.fetchCourseMaterial,
  sendChatMessage: chatService.sendChatMessage,
};
