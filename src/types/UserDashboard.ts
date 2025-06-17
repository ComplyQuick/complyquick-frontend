export interface CourseData {
  id: string;
  courseId?: string;
  title: string;
  description: string;
  duration: string;
  skippable: boolean;
  mandatory: boolean;
  retryType: "DIFFERENT" | "SAME";
  enrolledUsers: number;
  properties?: {
    skippable: boolean;
    mandatory: boolean;
    retryType: "DIFFERENT" | "SAME";
  };
  tags?: string[];
}

export interface UserProfile {
  success: boolean;
  name: string;
  email: string;
}

export interface ProgressData {
  courseId: string;
  progress: number;
}

export interface UserCourse {
  courseId: string;
  canDownloadCertificate?: boolean;
  certificateUrl?: string;
  canRetakeQuiz?: boolean;
  // Add other fields as needed
}
