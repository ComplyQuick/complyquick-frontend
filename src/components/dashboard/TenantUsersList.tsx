import React, { useEffect, useState } from "react";
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
import { Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import {
  User,
  RecentActivity,
  TenantUsersListProps,
} from "@/types/TenantUsersList";
import { adminService } from "@/services/adminService";

const TenantUsersList = ({ tenantId, totalCourses }: TenantUsersListProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch users and recent activity in parallel
        const [usersData, activityData] = await Promise.all([
          adminService.fetchTenantUsers(tenantId),
          adminService.fetchRecentActivity(tenantId),
        ]);

        setUsers(usersData);
        setRecentActivity(activityData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
        setIsLoadingActivity(false);
      }
    };

    fetchData();
  }, [tenantId]);

  if (loading || isLoadingActivity) {
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
      coursesInProgress: activity ? activity.coursesInProgress : 0,
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
                  {user.coursesInProgress}/{user.totalCourses}
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
