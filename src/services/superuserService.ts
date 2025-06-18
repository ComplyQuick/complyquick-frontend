import {
  Course,
  Tenant,
  CourseEnrolledUsers,
  RecentTenant,
} from "@/types/SuperuserDashboard";
import { Course as AddCourseFormCourse } from "@/types/AddCourseForm";
import {
  CreateOrganizationPayload,
  CreateOrganizationResponse,
} from "@/types/SuperuserDashboard";
import { CreateCourseResponse, UpdateCourseResponse } from "@/types/course";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface RawCourse extends Omit<Course, "learningObjectives" | "tags"> {
  learningObjectives: string;
  tags: string;
}

export const superuserService = {
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

  /**
   * Fetch all courses
   */
  async getCourses(): Promise<Course[]> {
    const response = await fetch(`${BACKEND_URL}/api/courses`);
    if (!response.ok) {
      throw new Error("Failed to fetch courses");
    }
    const coursesData = await response.json();
    return coursesData.map((course: RawCourse) => ({
      ...course,
      learningObjectives: course.learningObjectives
        ? course.learningObjectives.split(",").map((obj: string) => obj.trim())
        : [],
      tags: course.tags
        ? course.tags.split(",").map((tag: string) => tag.trim())
        : [],
    }));
  },

  /**
   * Fetch all tenants
   */
  async getTenants(): Promise<Tenant[]> {
    const response = await fetch(`${BACKEND_URL}/api/tenants`);
    if (!response.ok) {
      throw new Error("Failed to fetch tenants");
    }
    return response.json();
  },

  /**
   * Fetch enrolled users count for all courses
   */
  async getEnrolledUsers(): Promise<CourseEnrolledUsers[]> {
    const response = await fetch(
      `${BACKEND_URL}/api/superadmin/courses/enrolled-users`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch enrolled users");
    }
    return response.json();
  },

  /**
   * Fetch recent tenants with course counts
   */
  async getRecentTenants(): Promise<RecentTenant[]> {
    const response = await fetch(
      `${BACKEND_URL}/api/superadmin/tenants/recent`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch recent tenants");
    }
    return response.json();
  },

  /**
   * Delete a tenant
   */
  async deleteTenant(tenantId: string): Promise<void> {
    const response = await fetch(
      `${BACKEND_URL}/api/superadmin/tenant/${tenantId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error("Failed to delete organization");
    }
  },
};
