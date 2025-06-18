import { MCQ } from "@/types/quiz";
import { Course } from "@/types/AdminDashboard";
import {
  UserProfile,
  StoreCertificatePayload,
  CourseData,
  ProgressData,
  UserCourse,
} from "@/types/UserDashboard";
import { config } from "@/config";

export const userService = {
  async fetchUserProfile(token: string): Promise<UserProfile> {
    const response = await fetch(
      `${config.api.baseUrl}${config.api.endpoints.user.profile}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch user profile");
    }

    return response.json();
  },

  async fetchCourseDetails(tenantId: string, token: string): Promise<Course[]> {
    const response = await fetch(
      `${config.api.baseUrl}${config.api.endpoints.user.courses.details}/${tenantId}/courses`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch course details");
    }

    return response.json();
  },

  /**
   * Generate new MCQs
   */
  async generateMCQs(
    materialUrl: string,
    courseId: string,
    tenantId: string
  ): Promise<{ mcqs: MCQ[] }> {
    const response = await fetch(
      `${config.api.aiServiceUrl}${config.api.endpoints.user.mcq}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presentation_url: materialUrl,
          course_id: courseId,
          tenant_id: tenantId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to generate MCQs");
    }

    const data = await response.json();
    if (!data.mcqs || !Array.isArray(data.mcqs)) {
      throw new Error("Invalid MCQ data received");
    }

    return data;
  },

  /**
   * Store certificate in backend
   */
  async storeCertificate(
    payload: StoreCertificatePayload,
    token: string
  ): Promise<void> {
    const response = await fetch(
      `${config.api.baseUrl}${config.api.endpoints.user.certificate}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to store certificate");
    }
  },

  async fetchEnabledCourses(
    tenantId: string,
    token: string
  ): Promise<CourseData[]> {
    const response = await fetch(
      `${config.api.baseUrl}${config.api.endpoints.user.courses.enabled}?tenantId=${tenantId}`,
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
    return coursesData.map((course: CourseData) => ({
      ...course,
      properties: {
        skippable: course.skippable,
        mandatory: course.mandatory,
        retryType: course.retryType,
      },
    }));
  },

  async fetchCourseProgress(
    userId: string,
    courseId: string,
    token: string
  ): Promise<ProgressData> {
    const response = await fetch(
      `${config.api.baseUrl}${config.api.endpoints.user.courses.progress}?userId=${userId}&courseId=${courseId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return { courseId, progress: 0 };
    }

    return response.json();
  },

  async fetchUserCourses(userId: string, token: string): Promise<UserCourse[]> {
    const response = await fetch(
      `${config.api.baseUrl}${config.api.endpoints.user.courses.userCourses}/${userId}/courses`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch user courses");
    }

    return response.json();
  },

  async fetchCourseMaterial(
    courseId: string,
    tenantId: string
  ): Promise<{ materialUrl: string }> {
    const response = await fetch(
      `${config.api.baseUrl}${config.api.endpoints.user.courses.material}/${courseId}/chatbot-material?tenantId=${tenantId}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch course material URL");
    }

    const data = await response.json();
    if (!data.materialUrl) {
      throw new Error("Material URL is empty in the response");
    }

    return data;
  },
};
