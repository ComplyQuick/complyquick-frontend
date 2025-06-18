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

export interface RecentActivity {
  email: string;
  name: string;
  coursesInProgress: number;
  totalCourses: number;
  status: string;
}

export interface TenantUsersListProps {
  tenantId: string;
  totalCourses: number;
}
