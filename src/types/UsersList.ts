import { User as TenantUser } from "./TenantUsersList";

export interface User extends Omit<TenantUser, "enrollments"> {
  coursesCompleted: number;
  totalCourses: number;
  lastActivity: string;
}

export interface UsersListProps {
  users: User[];
  title?: string;
}
