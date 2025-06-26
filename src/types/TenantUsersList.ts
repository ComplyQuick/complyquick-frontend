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

export interface InProgressCourse {
  title: string;
  progress: number;
}

export interface CompletedCourse {
  title: string;
  progress: number;
}

export interface NotStartedCourse {
  title: string;
  progress: number;
}

export interface CourseStats {
  total: number;
  inProgress: number;
  completed: number;
  notStarted: number;
  inProgressDetails: InProgressCourse[];
  completedDetails: CompletedCourse[];
  notStartedDetails: NotStartedCourse[];
}

export interface RecentActivity {
  email: string;
  name: string;
  status: string;
  courses: CourseStats;
}

export interface TenantUsersListProps {
  tenantId: string;
  totalCourses: number;
}
