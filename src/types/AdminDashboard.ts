import { User as BaseUser } from "./UsersList";

export interface Course {
  id: string;
  courseId: string;
  title: string;
  description: string;
  duration: string;
  enrolledUsers: number;
  learningObjectives: string[];
  mandatory: boolean;
  skippable: boolean;
  retryType: "SAME" | "DIFFERENT";
  tags: string[];
  targetAudience: string;
  isEnabled: boolean;
  pocs?: Array<{
    id: string;
    name: string;
    email: string;
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
 