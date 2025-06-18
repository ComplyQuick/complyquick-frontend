import { Explanation, CourseDetails } from "@/types/course";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL;

export const slideService = {
  async fetchCourseDetails(tenantId: string): Promise<CourseDetails[]> {
    const response = await fetch(
      `${BACKEND_URL}/api/tenant-admin/tenants/${tenantId}/courses`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch course details");
    }

    return response.json();
  },

  async fetchExplanations(
    courseId: string,
    tenantId: string
  ): Promise<Explanation[]> {
    const response = await fetch(
      `${BACKEND_URL}/api/courses/${courseId}/explanations?tenantId=${tenantId}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch explanations");
    }

    const data = await response.json();
    return data.explanations || [];
  },

  async updateProgress(
    courseId: string,
    tenantId: string,
    token: string,
    progress: number,
    slideNumber: number
  ): Promise<void> {
    const response = await fetch(
      `${BACKEND_URL}/api/courses/${courseId}/update-progress`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantId,
          progress,
          slideNumber,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update progress");
    }
  },

  async fetchCourseMaterial(
    courseId: string,
    tenantId: string
  ): Promise<string> {
    const response = await fetch(
      `${BACKEND_URL}/api/courses/${courseId}/chatbot-material?tenantId=${tenantId}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch course material URL");
    }

    const data = await response.json();
    if (!data.materialUrl) {
      throw new Error("Material URL is empty in the response");
    }

    return data.materialUrl;
  },

  async generateMCQ(
    courseId: string,
    tenantId: string,
    materialUrl: string,
    signal?: AbortSignal
  ): Promise<{ mcqs: unknown[] }> {
    const response = await fetch(`${AI_SERVICE_URL}/generate_mcq`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        presentation_url: materialUrl,
        course_id: courseId,
        tenant_id: tenantId,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error("Failed to generate MCQs");
    }

    const data = await response.json();
    if (!data.mcqs || !Array.isArray(data.mcqs)) {
      throw new Error("Invalid MCQ data received");
    }

    return data;
  },
};
