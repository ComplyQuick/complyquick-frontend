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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  BookOpen,
  Users,
} from "lucide-react";
import {
  User,
  RecentActivity,
  TenantUsersListProps,
  InProgressCourse,
  CompletedCourse,
  NotStartedCourse,
  CourseStats,
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

  const getOverallStatus = (courses: CourseStats | undefined) => {
    if (!courses) return "Not Started";

    if (courses.completed === courses.total) {
      return "Completed";
    } else if (courses.inProgress > 0 || courses.completed > 0) {
      return "In Progress";
    } else {
      return "Not Started";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return (
          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        );
      case "In Progress":
        return <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      default:
        return (
          <AlertCircle className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";
      case "In Progress":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700";
    }
  };

  const InProgressModal = ({ courses }: { courses: InProgressCourse[] }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all duration-200 rounded-full"
        >
          <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        <DialogHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Courses In Progress
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto space-y-3 py-4">
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No courses in progress
              </p>
            </div>
          ) : (
            courses.map((course, index) => (
              <div
                key={index}
                className="group p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 hover:shadow-md transition-all duration-200"
              >
                <h4 className="font-medium text-sm leading-tight text-slate-900 dark:text-slate-100 mb-3">
                  {course.title}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-medium">Progress</span>
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {course.progress.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={course.progress}
                    className="h-2 bg-slate-200 dark:bg-slate-700"
                    indicatorClassName="bg-blue-600 dark:bg-blue-400"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  const CompletedModal = ({ courses }: { courses: CompletedCourse[] }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-all duration-200 rounded-full"
        >
          <Eye className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        <DialogHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Completed Courses
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto space-y-3 py-4">
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No completed courses
              </p>
            </div>
          ) : (
            courses.map((course, index) => (
              <div
                key={index}
                className="group p-4 border border-emerald-200 dark:border-emerald-700 rounded-xl bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-900 dark:to-slate-900 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <h4 className="font-medium text-sm leading-tight text-slate-900 dark:text-slate-100">
                    {course.title}
                  </h4>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  const NotStartedModal = ({ courses }: { courses: NotStartedCourse[] }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 rounded-full"
        >
          <Eye className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        <DialogHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <AlertCircle className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            Not Started Courses
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto space-y-3 py-4">
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No courses not started
              </p>
            </div>
          ) : (
            courses.map((course, index) => (
              <div
                key={index}
                className="group p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                  <h4 className="font-medium text-sm leading-tight text-slate-900 dark:text-slate-100">
                    {course.title}
                  </h4>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  if (loading || isLoadingActivity) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Loading users...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-3" />
        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-slate-50 dark:bg-slate-800 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-10 w-10 text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-slate-600 dark:text-slate-400 font-medium">
          No users found for this organization.
        </p>
      </div>
    );
  }

  const userRows = users.map((user) => {
    const activity = recentActivity.find((a) => a.email === user.email);
    const courses = activity?.courses;

    return {
      ...user,
      courses: courses || {
        total: 0,
        notStarted: 0,
        inProgress: 0,
        completed: 0,
        inProgressDetails: [],
        completedDetails: [],
        notStartedDetails: [],
      },
      overallStatus: getOverallStatus(courses),
    };
  });

  return (
    <Card className="overflow-hidden shadow-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
        <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          Organization Users
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          View and manage users in your organization
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                  Name
                </TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">
                  Email
                </TableHead>
                <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300">
                  Not Started
                </TableHead>
                <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300">
                  In Progress
                </TableHead>
                <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300">
                  Completed
                </TableHead>
                <TableHead className="text-center font-semibold text-slate-700 dark:text-slate-300">
                  Overall Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRows.map((user, index) => (
                <TableRow
                  key={user.id}
                  className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150"
                >
                  <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      {user.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">
                    {user.email}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 font-mono"
                      >
                        {user.courses.notStarted}/{user.courses.total}
                      </Badge>
                      {user.courses.notStarted > 0 &&
                        user.courses.notStartedDetails && (
                          <NotStartedModal
                            courses={user.courses.notStartedDetails}
                          />
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700 font-mono"
                      >
                        {user.courses.inProgress}/{user.courses.total}
                      </Badge>
                      {user.courses.inProgress > 0 && (
                        <InProgressModal
                          courses={user.courses.inProgressDetails}
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700 font-mono"
                      >
                        {user.courses.completed}/{user.courses.total}
                      </Badge>
                      {user.courses.completed > 0 &&
                        user.courses.completedDetails && (
                          <CompletedModal
                            courses={user.courses.completedDetails}
                          />
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getStatusIcon(user.overallStatus)}
                      <Badge
                        className={`${getStatusColor(
                          user.overallStatus
                        )} font-medium shadow-sm`}
                      >
                        {user.overallStatus}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TenantUsersList;
