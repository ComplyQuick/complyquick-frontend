import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface User {
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

interface RecentActivity {
  email: string;
  name: string;
  totalCourses: number;
  status: string;
}

interface TenantUsersListProps {
  tenantId: string;
  totalCourses: number;
}

const TenantUsersList = ({ tenantId, totalCourses }: TenantUsersListProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/tenant-admin/tenants/${tenantId}/users`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Failed to load users. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchRecentActivity = async () => {
      try {
        setIsLoadingActivity(true);
        const response = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/admin/dashboard/recent-activity?tenantId=${tenantId}`
        );
        if (!response.ok) throw new Error("Failed to fetch recent activity");
        const data = await response.json();
        setRecentActivity(data);
      } catch (error) {
        setRecentActivity([]);
      } finally {
        setIsLoadingActivity(false);
      }
    };

    fetchUsers();
    fetchRecentActivity();
  }, [tenantId]);

  if (isLoading || isLoadingActivity) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-complybrand-600" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No users found for this organization.
      </div>
    );
  }

  const userRows = users.map((user) => {
    const activity = recentActivity.find((a) => a.email === user.email);
    return {
      ...user,
      coursesCompleted: activity ? activity.totalCourses : 0,
      totalCourses,
      status: activity ? activity.status : "-",
    };
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Organization Users</CardTitle>
        <CardDescription>
          View and manage users in your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userRows.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.coursesCompleted}/{user.totalCourses}
                </TableCell>
                <TableCell>
                  {user.status === "Completed" ? (
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-green-100 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-medium">Completed</span>
                        <p className="text-xs text-muted-foreground">
                          Courses finished
                        </p>
                      </div>
                    </div>
                  ) : user.status === "In Progress" ? (
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-medium">In Progress</span>
                        <p className="text-xs text-muted-foreground">
                          Currently learning
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-gray-100 text-gray-600">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-medium">Not Started</span>
                        <p className="text-xs text-muted-foreground">
                          No courses started
                        </p>
                      </div>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TenantUsersList;
