import { User as BaseUser } from "./UsersList";
import { Course as BaseCourse } from "./AddCourseForm";
import { POC } from "./course";

export interface Course
  extends Omit<BaseCourse, "learningObjectives" | "tags"> {
  courseId: string;
  duration: string;
  enrolledUsers: number;
  learningObjectives: string[];
  tags: string[];
  targetAudience: string;
  isEnabled: boolean;
  mandatory: boolean;
  skippable: boolean;
  retryType: "SAME" | "DIFFERENT";
  pocs?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    contact: string;
  }>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  enrollments: {
    course: {
      id: string;
      title: string;
    };
  }[];
}

export interface Statistics {
  totalUsers: number;
  totalCourses: number;
  completionRate: number;
  trainingStatus: {
    completed: number;
    inProgress: number;
    notStarted: number;
  };
}

export interface Activity {
  email: string;
  name: string;
  coursesInProgress: number;
  totalCourses: number;
  status: string;
}

export interface TenantDetailsPayload {
  hrContactName?: string;
  hrContactEmail?: string;
  hrContactPhone?: string;
  ceoName?: string;
  ceoEmail?: string;
  ceoContact?: string;
  ctoName?: string;
  ctoEmail?: string;
  ctoContact?: string;
}

export interface TenantDetailsResponse {
  details: TenantDetailsPayload;
}

export interface EnhanceExplanationsPayload {
  tenantId: string;
  courseId: string;
  queryPrompt: string;
  batchSize: number;
}

export interface EnhanceExplanationsResponse {
  success: boolean;
  message: string;
  explanations: Array<{
    slide: number;
    content: string;
    explanation: string;
    explanation_audio: string;
  }>;
}

export interface UpdateExplanationPayload {
  courseId: string;
  tenantId: string;
  slideIndex: number;
  explanation: string;
}

export interface UpdateExplanationResponse {
  success: boolean;
  message: string;
  slide: {
    explanation: string;
    explanation_audio: string;
  };
}

export interface AssignCoursePayload {
  courseId: string;
  tenantId: string;
  skippable: boolean;
  mandatory: boolean;
  retryType: "SAME" | "DIFFERENT";
  pocs: Array<Omit<POC, "id" | "email">>;
}
