import { ChatMessage, TenantDetails, CourseMaterial, POC } from "@/types/Chat";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const chatService = {
  async fetchTenantDetails(
    tenantId: string,
    token: string
  ): Promise<TenantDetails> {
    const response = await fetch(`${BACKEND_URL}/api/tenants/${tenantId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch tenant details");
    }

    return response.json();
  },

  async fetchPOCs(
    tenantId: string,
    courseId: string,
    token: string
  ): Promise<POC[]> {
    const response = await fetch(
      `${BACKEND_URL}/api/tenants/${tenantId}/courses/${courseId}/pocs`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    return data.pocs;
  },

  async fetchCourseMaterial(
    courseId: string,
    tenantId: string,
    token: string
  ): Promise<CourseMaterial> {
    const response = await fetch(
      `${BACKEND_URL}/api/courses/${courseId}/chatbot-material?tenantId=${tenantId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch course material");
    }

    const data = await response.json();
    return { materialUrl: data.materialUrl };
  },

  async sendChatMessage(
    messages: ChatMessage[],
    materialUrl: string,
    companyName: string,
    pocs: POC[]
  ): Promise<string> {
    const response = await fetch(
      `${import.meta.env.VITE_AI_SERVICE_URL}/chatbot`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatHistory: messages,
          presentation_url: materialUrl,
          company_name: companyName,
          pocs: pocs,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return typeof data.response === "object" && data.response.response
      ? data.response.response
      : data.response;
  },
};
