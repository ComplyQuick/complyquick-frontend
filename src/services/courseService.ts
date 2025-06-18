import { Slide, Explanation } from "@/types/CoursePlayer";
import {
  CourseToggleResponse,
  UpdateCoursePropertiesPayload,
  UpdateCoursePropertiesResponse,
  POC,
} from "@/types/course";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const courseService = {
  async fetchSlides(tenantId: string, courseId: string): Promise<Slide[]> {
    const response = await fetch(
      `${BACKEND_URL}/api/tenant-admin/tenants/${tenantId}/courses/${courseId}/slides`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch slides");
    }

    return response.json();
  },

  async fetchExplanations(
    tenantId: string,
    courseId: string
  ): Promise<Explanation[]> {
    const response = await fetch(
      `${BACKEND_URL}/api/tenant-admin/tenants/${tenantId}/courses/${courseId}/explanations`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch explanations");
    }

    return response.json();
  },

  async completeCourse(tenantId: string, courseId: string): Promise<void> {
    const response = await fetch(
      `${BACKEND_URL}/api/tenant-admin/tenants/${tenantId}/courses/${courseId}/complete`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to mark course as complete");
    }
  },

  async toggleCourse(
    tenantId: string,
    courseId: string,
    token: string,
    isEnabled: boolean
  ): Promise<CourseToggleResponse> {
    const response = await fetch(
      `${BACKEND_URL}/api/tenant-admin/tenants/${tenantId}/courses/${courseId}/toggle`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isEnabled }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to toggle course status");
    }

    return response.json();
  },

  async deleteCourse(courseId: string): Promise<void> {
    const response = await fetch(
      `${BACKEND_URL}/api/superadmin/course/${courseId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete course");
    }
  },

  async updateCourseProperties(
    payload: UpdateCoursePropertiesPayload,
    token?: string
  ): Promise<UpdateCoursePropertiesResponse> {
    const response = await fetch(
      `${BACKEND_URL}/api/tenant-admin/courses/properties`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update course properties");
    }

    return response.json();
  },
};
