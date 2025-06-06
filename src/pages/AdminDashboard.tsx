import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  Users,
  BookOpen,
  BarChart,
  Settings,
  Loader2,
  PlusCircle,
  X,
} from "lucide-react";
import UsersList from "@/components/dashboard/UsersList";
import CourseCard from "@/components/dashboard/CourseCard";
import TenantUsersList from "@/components/dashboard/TenantUsersList";
import AddTenantDetailsForm from "@/components/forms/AddTenantDetailsForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader } from "@/components/ui/loader";

interface Course {
  id: string;
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
  // Add other properties as needed
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  coursesCompleted: number;
  totalCourses: number;
  lastActivity: string;
  // Add other properties as needed
}

interface Statistics {
  totalUsers: number;
  totalCourses: number;
  completionRate: number;
  trainingStatus: {
    completed: number;
    inProgress: number;
    notStarted: number;
  };
}

interface Activity {
  email: string;
  name: string;
  totalCourses: number;
  status: string;
  // Add other properties as needed
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [tenantDetailsDialogOpen, setTenantDetailsDialogOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignSkippable, setAssignSkippable] = useState(false);
  const [assignMandatory, setAssignMandatory] = useState(false);
  const [assignRetryType, setAssignRetryType] = useState<"SAME" | "DIFFERENT">(
    "SAME"
  );
  const [assigningCourseId, setAssigningCourseId] = useState<string | null>(
    null
  );
  const [isAssigningCourse, setIsAssigningCourse] = useState(false);
  const [pocs, setPocs] = useState<
    { role: string; name: string; contact: string }[]
  >([{ role: "", name: "", contact: "" }]);
  const [courseView, setCourseView] = useState<"active" | "inactive">("active");
  const [activeCourses, setActiveCourses] = useState<Course[]>([]);
  const [inactiveCourses, setInactiveCourses] = useState<Course[]>([]);

  useEffect(() => {
    const storedTenantId = localStorage.getItem("tenantId");
    if (!storedTenantId) {
      console.error("No tenant ID found in localStorage");
      setError("No tenant ID found. Please log in again.");
      return;
    }
    setTenantId(storedTenantId);
  }, []);

  useEffect(() => {
    if (tenantId) {
      const fetchTenantCourses = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            throw new Error("No authentication token found");
          }

          const response = await fetch(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/api/tenant-admin/tenants/${tenantId}/courses`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch tenant courses");
          }

          const data = await response.json();
          setCourses(data as Course[]);
          return data;
        } catch (error) {
          console.error("Error fetching tenant courses:", error);
          setError(
            error instanceof Error ? error.message : "Failed to fetch courses"
          );
          return [];
        } finally {
          setIsLoadingCourses(false);
        }
      };

      const fetchAvailableCourses = async (assignedCourses: any[]) => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/courses`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch available courses");
          }

          const data = await response.json();
          const filteredCourses = data.filter(
            (course: any) =>
              !assignedCourses.some(
                (assignedCourse: any) => assignedCourse.id === course.id
              )
          );
          setAvailableCourses(filteredCourses);
        } catch (error) {
          console.error("Error fetching available courses:", error);
        }
      };

      const initializeCourses = async () => {
        const assignedCourses = await fetchTenantCourses();
        await fetchAvailableCourses(assignedCourses);
      };

      initializeCourses();
    }
  }, [tenantId]);

  useEffect(() => {
    const fetchStatistics = async () => {
      if (!tenantId) return;

      try {
        setIsLoadingStats(true);
        const response = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/admin/dashboard/statistics?tenantId=${tenantId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            console.warn(
              "Statistics endpoint not found. Using default values."
            );
            setStatistics({
              totalUsers: 0,
              totalCourses: 0,
              completionRate: 0,
              trainingStatus: {
                completed: 0,
                inProgress: 0,
                notStarted: 0,
              },
            });
            return;
          }
          throw new Error("Failed to fetch statistics");
        }

        const data = await response.json();
        setStatistics(data);
      } catch (error) {
        console.error("Error fetching statistics:", error);
        toast.error("Failed to load statistics. Using default values.");
        setStatistics({
          totalUsers: 0,
          totalCourses: 0,
          completionRate: 0,
          trainingStatus: {
            completed: 0,
            inProgress: 0,
            notStarted: 0,
          },
        });
      } finally {
        setIsLoadingStats(false);
      }
    };

    const fetchRecentActivity = async () => {
      if (!tenantId) return;

      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/admin/dashboard/recent-activity?tenantId=${tenantId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            console.warn(
              "Recent activity endpoint not found. Using empty array."
            );
            setRecentActivity([]);
            return;
          }
          throw new Error("Failed to fetch recent activity");
        }

        const data = await response.json();
        setRecentActivity(data);
      } catch (error) {
        console.error("Error fetching recent activity:", error);
        toast.error("Failed to load recent activity. Using empty array.");
        setRecentActivity([]);
      }
    };

    fetchStatistics();
    fetchRecentActivity();
  }, [tenantId]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!tenantId) return;

      try {
        setIsLoadingUsers(true);
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
        toast.error("Failed to load users");
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [tenantId]);

  const handleAddCourse = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      if (!tenantId) {
        throw new Error("No tenant ID found");
      }
      if (!selectedCourses || selectedCourses.length === 0) {
        throw new Error("No courses selected");
      }
      // Take the first selected course since we can only assign one at a time
      const courseId = selectedCourses[0];
      setAssigningCourseId(courseId);
      setShowAssignModal(true);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to start course assignment"
      );
    }
  };

  const fetchCourses = async () => {
    if (!tenantId) return;
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/tenant-admin/tenants/${tenantId}/courses`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }
      const data = await response.json();
      setCourses(data as Course[]);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to load courses");
    }
  };

  const handleAssignCourse = async () => {
    if (!assigningCourseId || !tenantId) return;

    setIsAssigningCourse(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/courses/assign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            courseId: assigningCourseId,
            tenantId: tenantId,
            skippable: assignSkippable,
            mandatory: assignMandatory,
            retryType: assignRetryType,
            pocs: pocs,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to assign course");
      }

      toast.success("Course assigned successfully!");
      setShowAssignModal(false);
      // Refresh courses list
      fetchCourses();
    } catch (error) {
      console.error("Error assigning course:", error);
      toast.error("Failed to assign course");
    } finally {
      setIsAssigningCourse(false);
    }
  };

  const handleCourseSelect = async (course: Course) => {
    setSelectedCourse(course);
    setAssigningCourseId(course.id);
    setAssignSkippable(course.skippable);
    setAssignMandatory(course.mandatory);
    setAssignRetryType(course.retryType);
    setPocs([{ role: "", name: "", contact: "" }]);
    setShowAssignModal(true);
  };

  const completedCount = users.filter(
    (user: any) =>
      user.enrollments?.length > 0 &&
      user.enrollments.every((enrollment: any) => enrollment.completed)
  ).length;

  const inProgressCount = users.filter(
    (user: any) =>
      user.enrollments?.length > 0 &&
      user.enrollments.some((enrollment: any) => !enrollment.completed)
  ).length;

  const notStartedCount = users.filter(
    (user: any) => !user.enrollments || user.enrollments.length === 0
  ).length;

  // Fetch active/inactive courses when tenantId or courseView changes
  useEffect(() => {
    if (!tenantId) return;
    const fetchCoursesByStatus = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      const url =
        courseView === "active"
          ? `${
              import.meta.env.VITE_BACKEND_URL
            }/api/tenant-admin/tenants/${tenantId}/courses/enabled`
          : `${
              import.meta.env.VITE_BACKEND_URL
            }/api/tenant-admin/tenants/${tenantId}/courses/disabled`;
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch courses");
        const data = await response.json();
        if (courseView === "active") setActiveCourses(data);
        else setInactiveCourses(data);
      } catch (e) {
        // Optionally handle error
      }
    };
    fetchCoursesByStatus();
  }, [tenantId, courseView]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted/30">
      <Navbar userRole="admin" />
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="animate-fade-in">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Organization Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your organization's compliance training
              </p>
            </div>
            <div className="flex space-x-3 animate-fade-in">
              <Button
                className="bg-complybrand-700 hover:bg-complybrand-800 hover:shadow-lg transition-all duration-300 text-white"
                onClick={() => {
                  setSelectedTenantId(tenantId);
                  setTenantDetailsDialogOpen(true);
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                Organization Settings
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold animate-fade-in">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    statistics?.totalUsers || 0
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold animate-fade-in">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    statistics?.totalCourses || 0
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completion Rate
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold animate-fade-in">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    statistics?.completionRate || "0%"
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Training Status
                </CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>Completed:</span>
                  <span className="font-medium text-green-600">
                    {isLoadingStats ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      statistics?.trainingStatus?.completed || 0
                    )}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>In Progress:</span>
                  <span className="font-medium text-yellow-600">
                    {isLoadingStats ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      statistics?.trainingStatus?.inProgress || 0
                    )}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>Not Started:</span>
                  <span className="font-medium text-red-600">
                    {isLoadingStats ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      statistics?.trainingStatus?.notStarted || 0
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs
            defaultValue="overview"
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="bg-muted/50 backdrop-blur-sm">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-complybrand-600 data-[state=active]:text-white"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="data-[state=active]:bg-complybrand-600 data-[state=active]:text-white"
              >
                Users
              </TabsTrigger>
              <TabsTrigger
                value="courses"
                className="data-[state=active]:bg-complybrand-600 data-[state=active]:text-white"
              >
                Courses
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 animate-fade-in">
              <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50">
                <CardHeader>
                  <CardTitle>Recent User Activity</CardTitle>
                  <CardDescription>
                    Track employee progress across all compliance courses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingStats ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-complybrand-600" />
                    </div>
                  ) : recentActivity.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent activity found.
                    </div>
                  ) : (
                    <UsersList
                      users={recentActivity.map((activity) => ({
                        id: activity.email,
                        name: activity.name,
                        email: activity.email,
                        coursesCompleted: activity.totalCourses,
                        totalCourses: activity.totalCourses,
                        lastActivity: activity.status,
                      }))}
                    />
                  )}
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("users")}
                      className="hover:bg-complybrand-600 hover:text-white transition-colors"
                    >
                      View All Users
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-8 animate-fade-in flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-medium mb-0">Courses</h3>
                  <span className="flex items-center gap-2 ml-4">
                    <span
                      className={`cursor-pointer select-none transition-colors ${
                        courseView === "active"
                          ? "text-gray-900 dark:text-white font-semibold"
                          : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      }`}
                      onClick={() => setCourseView("active")}
                      style={{ opacity: courseView === "active" ? 1 : 0.5 }}
                    >
                      Active Courses
                    </span>
                    <span className="mx-2 text-gray-400">|</span>
                    <span
                      className={`cursor-pointer select-none transition-colors ${
                        courseView === "inactive"
                          ? "text-gray-900 dark:text-white font-semibold"
                          : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      }`}
                      onClick={() => setCourseView("inactive")}
                      style={{ opacity: courseView === "inactive" ? 1 : 0.5 }}
                    >
                      Inactive Courses
                    </span>
                  </span>
                </div>
                <Button
                  onClick={() => setIsAddCourseDialogOpen(true)}
                  className="bg-complybrand-700 hover:bg-complybrand-800 text-white px-3 py-1 rounded-full text-xs shadow-sm flex items-center"
                >
                  <PlusCircle className="mr-1 h-4 w-4" /> Add Course
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(courseView === "active"
                  ? activeCourses
                  : inactiveCourses
                ).map((item) => (
                  <CourseCard
                    key={item.id}
                    id={item.id}
                    courseId={item.courseId}
                    title={item.title}
                    description={item.description}
                    duration={item.duration || ""}
                    enrolledUsers={item.enrolledUsers}
                    userRole="admin"
                    tenantId={tenantId || ""}
                    token={localStorage.getItem("token") || ""}
                    learningObjectives={item.learningObjectives || ""}
                    properties={{
                      mandatory: item.mandatory,
                      skippable: item.skippable,
                      retryType: item.retryType,
                      isEnabled: item.isEnabled,
                    }}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="users" className="animate-fade-in">
              <TenantUsersList tenantId={tenantId} />
            </TabsContent>

            <TabsContent value="courses" className="animate-fade-in">
              <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50">
                <CardHeader>
                  <CardTitle>Courses</CardTitle>
                  <CardDescription>
                    View all compliance courses available to your organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingCourses ? (
                    <div className="text-center py-4">Loading courses...</div>
                  ) : error ? (
                    <div className="text-center text-red-500 py-4">{error}</div>
                  ) : courses.length === 0 ? (
                    <div className="text-center py-4">
                      No courses available for your organization.
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-3">
                      {courses.map((course) => (
                        <Card
                          key={course.id}
                          className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50 cursor-pointer"
                          onClick={() => handleCourseSelect(course)}
                        >
                          <CardHeader>
                            <CardTitle>{course.title}</CardTitle>
                            <CardDescription>
                              {course.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p>Duration: {course.duration} minutes</p>
                            <p>Tags: {course.tags}</p>
                            <p>
                              Learning Objectives: {course.learningObjectives}
                            </p>
                            <p>Target Audience: {course.targetAudience}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Video Display Section */}
              {selectedCourse && (
                <div className="mt-8">
                  <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50">
                    <CardHeader>
                      <CardTitle>
                        {selectedCourse.title} - Video Presentation
                      </CardTitle>
                      <CardDescription>
                        {isGeneratingVideo
                          ? "Generating video..."
                          : "Watch the course presentation"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isGeneratingVideo ? (
                        <div className="flex flex-col items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-complybrand-600" />
                          <p className="mt-4 text-sm text-muted-foreground">
                            Generating video presentation...
                          </p>
                        </div>
                      ) : videoUrl ? (
                        <div className="aspect-video w-full">
                          <video
                            controls
                            className="w-full h-full rounded-lg"
                            src={videoUrl}
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Click on a course to generate its video presentation
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <AddTenantDetailsForm
        open={tenantDetailsDialogOpen}
        onOpenChange={setTenantDetailsDialogOpen}
        tenantId={selectedTenantId || ""}
      />

      <Dialog
        open={isAddCourseDialogOpen}
        onOpenChange={setIsAddCourseDialogOpen}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
            <DialogDescription>
              Select courses to add to your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {availableCourses.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No new courses available to add.
              </div>
            ) : (
              availableCourses.map((course: any) => (
                <div
                  key={course.id}
                  className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    id={course.id}
                    checked={selectedCourses.includes(course.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCourses([...selectedCourses, course.id]);
                      } else {
                        setSelectedCourses(
                          selectedCourses.filter((id) => id !== course.id)
                        );
                      }
                    }}
                  />
                  <div className="flex-1">
                    <Label htmlFor={course.id} className="text-lg font-medium">
                      {course.title}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {course.description}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <span className="text-xs bg-muted px-2 py-1 rounded-full">
                        {course.duration} minutes
                      </span>
                      <span className="text-xs bg-muted px-2 py-1 rounded-full">
                        {course.tags}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddCourse}
              disabled={selectedCourses.length === 0}
              className="bg-complybrand-600 hover:bg-complybrand-700"
            >
              Add Selected Courses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Generation Section */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card w-full max-w-4xl mx-4 rounded-lg shadow-xl">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {selectedCourse.title} - Video Generation
              </h2>
              {isGeneratingVideo ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-12 w-12 animate-spin text-complybrand-600 mb-4" />
                  <p className="text-lg text-muted-foreground">
                    Generating video presentation...
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This may take a few minutes. Please don't close this window.
                  </p>
                </div>
              ) : videoUrl ? (
                <div className="space-y-4">
                  <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                    <video controls className="w-full h-full" src={videoUrl}>
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={() => {
                        setSelectedCourse(null);
                        setVideoUrl(null);
                      }}
                      variant="outline"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Click the button below to start generating the video
                    presentation.
                  </p>
                  <Button
                    onClick={() => handleCourseSelect(selectedCourse)}
                    className="mt-4 bg-complybrand-600 hover:bg-complybrand-700"
                  >
                    Generate Video
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Course Modal */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Course Properties</DialogTitle>
          </DialogHeader>
          {isAssigningCourse ? (
            <div className="py-8">
              <Loader message="Please wait until we generate a personalized course for you" />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="skippable"
                    checked={assignSkippable}
                    onCheckedChange={(checked) =>
                      setAssignSkippable(checked as boolean)
                    }
                  />
                  <label htmlFor="skippable">Skippable</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="mandatory"
                    checked={assignMandatory}
                    onCheckedChange={(checked) =>
                      setAssignMandatory(checked as boolean)
                    }
                  />
                  <label htmlFor="mandatory">Mandatory</label>
                </div>
                <div>
                  <label htmlFor="retryType">Retry Type</label>
                  <div className="w-48">
                    <Select
                      value={assignRetryType}
                      onValueChange={(v) =>
                        setAssignRetryType(v as "SAME" | "DIFFERENT")
                      }
                    >
                      <SelectTrigger id="retryType" className="w-full">
                        <SelectValue placeholder="Select retry type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAME">Same</SelectItem>
                        <SelectItem value="DIFFERENT">Different</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Course POC Section */}
                <div className="mt-6">
                  <h4 className="font-semibold text-lg mb-2">Course POC</h4>
                  {pocs.map((poc, idx) => (
                    <div key={idx} className="flex gap-2 mb-2 items-end">
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Role
                        </label>
                        <Input
                          value={poc.role}
                          onChange={(e) => {
                            const newPocs = [...pocs];
                            newPocs[idx].role = e.target.value;
                            setPocs(newPocs);
                          }}
                          placeholder="Role"
                          className="w-32"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Name
                        </label>
                        <Input
                          value={poc.name}
                          onChange={(e) => {
                            const newPocs = [...pocs];
                            newPocs[idx].name = e.target.value;
                            setPocs(newPocs);
                          }}
                          placeholder="Name"
                          className="w-32"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Contact
                        </label>
                        <Input
                          value={poc.contact}
                          onChange={(e) => {
                            const newPocs = [...pocs];
                            newPocs[idx].contact = e.target.value;
                            setPocs(newPocs);
                          }}
                          placeholder="Contact"
                          className="w-40"
                        />
                      </div>
                      <div>
                        <button
                          type="button"
                          className="ml-2 flex items-center justify-center w-8 h-8 bg-red-600 hover:bg-red-700 rounded-sm text-white transition-colors"
                          onClick={() =>
                            setPocs(pocs.filter((_, i) => i !== idx))
                          }
                          disabled={pocs.length === 1}
                          aria-label="Remove POC"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      setPocs([...pocs, { role: "", name: "", contact: "" }])
                    }
                  >
                    + Add POC
                  </Button>
                  <div className="flex justify-center mt-4">
                    <Button onClick={handleAssignCourse} size="sm" className="">
                      Assign Course
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
