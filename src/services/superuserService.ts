import { Course } from "@/types/AddCourseForm";
import { Tenant } from "@/types/SuperuserDashboard";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export interface CreateCourseResponse {
  success: boolean;
  message: string;
  course?: Course;
}

export interface UpdateCourseResponse {
  success: boolean;
  message: string;
  course?: Course;
}

export interface CreateOrganizationPayload {
  name: string;
  domain: string;
  adminEmail: string;
  adminPassword: string;
}

export interface CreateOrganizationResponse {
  success: boolean;
  message: string;
  tenant?: Tenant;
}

export const superuserService = {
  /**
   * Create a new course
   */
  async createCourse(formData: FormData): Promise<CreateCourseResponse> {
    const response = await fetch(`${BACKEND_URL}/api/courses`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to create course");
    }

    return response.json();
  },

  /**
   * Update an existing course
   */
  async updateCourse(
    courseId: string,
    formData: FormData
  ): Promise<UpdateCourseResponse> {
    const response = await fetch(
      `${BACKEND_URL}/api/superadmin/course/${courseId}`,
      {
        method: "PATCH",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update course");
    }

    return response.json();
  },

  /**
   * Create a new organization (tenant)
   */
  async createOrganization(
    data: CreateOrganizationPayload
  ): Promise<CreateOrganizationResponse> {
    const response = await fetch(`${BACKEND_URL}/api/tenants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: data.name,
        domain: data.domain,
        adminEmail: data.adminEmail,
        adminPassword: data.adminPassword,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to create organization");
    }

    return response.json();
  },
};
