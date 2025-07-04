import { User, RecentActivity } from "@/types/TenantUsersList";
import { Tenant } from "@/types/SuperuserDashboard";
import { Explanation, Slide } from "@/types/course";
import {
  Course,
  Statistics,
  TenantDetailsPayload,
  TenantDetailsResponse,
  EnhanceExplanationsPayload,
  EnhanceExplanationsResponse,
  UpdateExplanationPayload,
  UpdateExplanationResponse,
  AssignCoursePayload,
} from "@/types/AdminDashboard";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL;

export const adminService = {
  /**
   * Fetch users for a specific tenant
   */
  async fetchTenantUsers(tenantId: string): Promise<User[]> {
    const response = await fetch(
      `${BACKEND_URL}/api/tenant-admin/tenants/${tenantId}/users`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }

    return response.json();
  },

  /**
   * Fetch recent activity for a specific tenant
   */
  async fetchRecentActivity(tenantId: string): Promise<RecentActivity[]> {
    const response = await fetch(
      `${BACKEND_URL}/api/admin/dashboard/recent-activity?tenantId=${tenantId}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch recent activity");
    }

    return response.json();
  },

  /**
   * Fetch tenant details
   */
  async fetchTenantDetails(tenantId: string): Promise<TenantDetailsResponse> {
    const response = await fetch(
      `${BACKEND_URL}/api/tenants/${tenantId}/details`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          details: {
            hrContactName: "",
            hrContactEmail: "",
            hrContactPhone: "",
            ceoName: "",
            ceoEmail: "",
            ceoContact: "",
            ctoName: "",
            ctoEmail: "",
            ctoContact: "",
          },
        };
      }
      throw new Error("Failed to fetch tenant details");
    }

    return response.json();
  },

  /**
   * Update tenant details
   */
  async updateTenantDetails(
    tenantId: string,
    details: TenantDetailsPayload
  ): Promise<TenantDetailsResponse> {
    const response = await fetch(
      `${BACKEND_URL}/api/tenants/${tenantId}/details`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(details),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update tenant details");
    }

    return response.json();
  },

  /**
   * Fetch courses for a specific tenant
   */
  async fetchTenantCourses(tenantId: string, token: string): Promise<Course[]> {
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
      throw new Error("Failed to fetch tenant courses");
    }

    return response.json();
  },

  /**
   * Fetch available courses
   */
  async fetchAvailableCourses(assignedCourses: Course[]): Promise<Course[]> {
    const response = await fetch(`${BACKEND_URL}/api/courses`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch available courses");
    }

    const data = await response.json();
    console.log("All courses from API:", data);
    console.log("Assigned courses to filter out:", assignedCourses);

    const filtered = data.filter(
      (course: Course) =>
        !assignedCourses.some(
          (assignedCourse) => assignedCourse.courseId === course.id
        )
    );

    console.log("Filtered result:", filtered);
    return filtered;
  },

  /**
   * Fetch statistics for a specific tenant
   */
  async fetchStatistics(tenantId: string, token: string): Promise<Statistics> {
    const response = await fetch(
      `${BACKEND_URL}/api/admin/dashboard/statistics?tenantId=${tenantId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          totalUsers: 0,
          totalCourses: 0,
          completionRate: 0,
          trainingStatus: {
            completed: 0,
            inProgress: 0,
            notStarted: 0,
          },
        };
      }
      throw new Error("Failed to fetch statistics");
    }

    return response.json();
  },

  /**
   * Assign a course to a tenant
   */
  async assignCourse(
    payload: AssignCoursePayload,
    token: string
  ): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/api/courses/assign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Failed to assign course");
    }
  },

  /**
   * Fetch courses by status (active/inactive)
   */
  async fetchCoursesByStatus(
    tenantId: string,
    token: string,
    status: "active" | "inactive"
  ): Promise<Course[]> {
    const url =
      status === "active"
        ? `${BACKEND_URL}/api/tenant-admin/tenants/${tenantId}/courses/enabled`
        : `${BACKEND_URL}/api/tenant-admin/tenants/${tenantId}/courses/disabled`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch courses");
    }

    return response.json();
  },

  /**
   * Fetch course explanations
   */
  async fetchCourseExplanations(
    courseId: string,
    tenantId: string,
    token: string
  ): Promise<{ explanations: Explanation[] }> {
    const response = await fetch(
      `${BACKEND_URL}/api/courses/${courseId}/explanations?tenantId=${tenantId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch explanations");
    }

    return response.json();
  },

  /**
   * Fetch course material URL
   */
  async fetchCourseMaterial(
    courseId: string,
    tenantId: string,
    token: string
  ): Promise<{ materialUrl: string }> {
    const response = await fetch(
      `${BACKEND_URL}/api/courses/${courseId}/chatbot-material?tenantId=${tenantId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch course material URL");
    }

    const data = await response.json();
    if (!data.materialUrl) {
      throw new Error("Material URL is empty in the response");
    }

    return { materialUrl: data.materialUrl };
  },

  /**
   * Enhance course explanations
   */
  async enhanceExplanations(
    payload: EnhanceExplanationsPayload,
    token: string
  ): Promise<EnhanceExplanationsResponse> {
    const response = await fetch(
      `${BACKEND_URL}/api/courses/regenerate-explanations`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to enhance explanations");
    }

    return response.json();
  },

  /**
   * Update a single explanation
   */
  async updateExplanation(
    payload: UpdateExplanationPayload,
    token: string
  ): Promise<UpdateExplanationResponse> {
    const response = await fetch(
      `${BACKEND_URL}/api/courses/update-explanation`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update explanation");
    }

    return response.json();
  },

  /**
   * Generate explanation using AI service
   */
  async generateExplanation(
    explanations: Explanation[],
    currentSlideIndex: number,
    prompt: string
  ): Promise<{ explanation_array: Explanation[] }> {
    const response = await fetch(`${AI_SERVICE_URL}/enhance-slide`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        explanation_array: explanations.map((exp) => ({
          content: exp.content,
          explanation: exp.explanation,
          slide: exp.slide,
        })),
        query_index: currentSlideIndex,
        query_prompt: prompt,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate explanation");
    }

    return response.json();
  },
};
