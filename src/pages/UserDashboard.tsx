import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
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
import { Progress } from "@/components/ui/progress";
import { Award, Clock, BookOpen, Download } from "lucide-react";
import CourseCard from "@/components/dashboard/CourseCard";
import { toast } from "sonner";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import GeneralChatbot from "@/components/course/GeneralChatbot";
import { decodeJWT } from "@/utils/auth";
import { jwtDecode } from "jwt-decode";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader } from "@/components/ui/loader";
import { useAuthStore } from "@/store/authStore";

interface CourseData {
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

interface UserProfile {
  success: boolean;
  name: string;
  email: string;
}

interface ProgressData {
  courseId: string;
  progress: number;
}

interface UserCourse {
  courseId: string;
  canDownloadCertificate?: boolean;
  certificateUrl?: string;
  canRetakeQuiz?: boolean;
  // Add other fields as needed
}

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState<
    "all" | "inProgress" | "completed"
  >("all");
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [searchParams] = useSearchParams();
  const { token, tenantId } = useAuthStore();
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>(
    {}
  );
  const navigate = useNavigate();
  const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
  const [userId, setUserId] = useState("");
  const [progressView, setProgressView] = useState("all");

  // Store tenantId in localStorage when it's available
  useEffect(() => {
    if (tenantId) {
      localStorage.setItem("tenantId", tenantId);
    }
    // Remove currentQuiz from localStorage when dashboard loads
    localStorage.removeItem("currentQuiz");
  }, [tenantId]);

  // Fetch user profile and course progress
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        console.error("No token available");
        return;
      }

      try {
        // Decode JWT to get user ID
        const decodedToken = decodeJWT(token);

        // Try different possible fields for user ID
        const userId =
          decodedToken?.sub || decodedToken?.userId || decodedToken?.id;
        if (!userId) {
          console.error("Token structure:", decodedToken);
          throw new Error("User ID not found in token");
        }

        // Fetch user profile
        const profileResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/user-dashboard/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!profileResponse.ok) {
          throw new Error("Failed to fetch user profile");
        }

        const profileData = await profileResponse.json();
        setUserProfile(profileData);
        if (profileData?.name) {
          localStorage.setItem("userName", profileData.name);
        }

        // Fetch courses
        const coursesResponse = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/tenant-admin/user/enabled-courses?tenantId=${tenantId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!coursesResponse.ok) {
          throw new Error("Failed to fetch courses");
        }

        const coursesData = await coursesResponse.json();
        // Map top-level fields into a properties object for UI compatibility
        const mappedCourses = coursesData.map((course: CourseData) => ({
          ...course,
          properties: {
            skippable: course.skippable,
            mandatory: course.mandatory,
            retryType: course.retryType,
          },
        }));
        setCourses(mappedCourses);

        // Fetch progress for each course
        const progressPromises = mappedCourses.map(
          async (course: CourseData) => {
            const progressResponse = await fetch(
              `${
                import.meta.env.VITE_BACKEND_URL
              }/api/courses/progress/user?userId=${userId}&courseId=${
                course.id
              }`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (!progressResponse.ok) {
              return { courseId: course.id, progress: 0 };
            }

            const progressData: ProgressData = await progressResponse.json();
            return {
              courseId: course.id,
              progress: progressData.progress || 0,
            };
          }
        );

        const progressResults = await Promise.all(progressPromises);
        const progressMap = progressResults.reduce((acc, curr) => {
          acc[curr.courseId] = curr.progress;
          return acc;
        }, {} as Record<string, number>);

        setCourseProgress(progressMap);
        setIsLoading(false);
      } catch (error: unknown) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token, tenantId]);

  useEffect(() => {
    // Decode userId from token
    let decodedUserId = "";
    if (token) {
      try {
        const decoded: Record<string, any> = jwtDecode(token);
        decodedUserId = decoded.sub || decoded.id || decoded.userId || "";
        setUserId(decodedUserId);
      } catch (e: unknown) {
        console.error("Failed to decode token", e);
      }
    }
    if (decodedUserId) {
      fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/user-dashboard/dashboard/${decodedUserId}/courses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
        .then((res) => res.json())
        .then((data) => {
          setUserCourses(data);
        })
        .catch((err) => {
          console.error("Failed to fetch user courses:", err);
        });
    }
  }, []);

  // Calculate overall progress and completed courses
  const totalProgress = Object.values(courseProgress).reduce(
    (sum, progress) => sum + progress,
    0
  );
  const overallProgress =
    Object.keys(courseProgress).length > 0
      ? Math.round(totalProgress / Object.keys(courseProgress).length)
      : 0;

  const completedCourses = Object.values(courseProgress).filter(
    (progress) => progress === 100
  ).length;

  // Filter courses based on active tab
  const filteredCourses = courses.filter((course) => {
    const progress = courseProgress[course.id] || 0;
    if (activeTab === "all") return true;
    if (activeTab === "inProgress") return progress > 0 && progress < 100;
    if (activeTab === "completed") return progress === 100;
    return true;
  });

  // Calculate progress for mandatory and non-mandatory courses separately
  const mandatoryCourses = courses.filter(
    (course) => course.properties?.mandatory
  );
  const nonMandatoryCourses = courses.filter(
    (course) => !course.properties?.mandatory
  );

  const mandatoryProgress =
    mandatoryCourses.length > 0
      ? Math.round(
          mandatoryCourses.reduce(
            (sum, course) => sum + (courseProgress[course.id] || 0),
            0
          ) / mandatoryCourses.length
        )
      : 0;

  const nonMandatoryProgress =
    nonMandatoryCourses.length > 0
      ? Math.round(
          nonMandatoryCourses.reduce(
            (sum, course) => sum + (courseProgress[course.id] || 0),
            0
          ) / nonMandatoryCourses.length
        )
      : 0;

  const handleCourseSelect = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);

    if (course) {
      const defaultProperties = {
        mandatory: true,
        skippable: false,
        retryType: "SAME" as const,
      };

      const courseProperties = course.properties || defaultProperties;

      navigate(
        `/dashboard/course/${courseId}/play?tenantId=${tenantId}&token=${token}&progress=${
          courseProgress[courseId] || 0
        }`,
        {
          state: { properties: courseProperties },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted/30">
        <Navbar userRole="employee" />
        <main className="flex-grow pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-complybrand-700"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted/30">
      {isGeneratingQuiz && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card w-full max-w-md mx-4 rounded-lg shadow-xl p-6">
            <Loader message="Please wait while we generate your assessment..." />
          </div>
        </div>
      )}
      <Navbar userRole="employee" />
      {/* Chat Drawer Trigger */}
      <Drawer>
        <DrawerTrigger asChild>
          <button
            className="fixed bottom-8 right-8 z-50 bg-complybrand-700 hover:bg-complybrand-800 text-white rounded-full shadow-lg p-4 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-complybrand-700"
            aria-label="Open Chatbot"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 20l.8-3.2A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </button>
        </DrawerTrigger>
        <DrawerContent className="max-w-lg mx-auto w-full">
          <DrawerHeader>
            <DrawerTitle>General Chatbot</DrawerTitle>
            <DrawerClose className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              ✕
            </DrawerClose>
          </DrawerHeader>
          <div className="p-2 pb-8">
            <GeneralChatbot tenantId={tenantId || ""} />
          </div>
        </DrawerContent>
      </Drawer>
      {/* End Chat Drawer */}
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/3 w-full">
              <Card className="animate-fade-in mt-8 shadow-lg rounded-2xl bg-white dark:bg-neutral-900 border-0 p-0 overflow-hidden">
                <CardHeader className="pb-2 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800">
                  <CardTitle className="text-xl font-bold text-neutral-900 dark:text-white mb-1">
                    Welcome back, {userProfile?.name || "Employee"}!
                  </CardTitle>
                  <CardDescription className="text-neutral-500 dark:text-neutral-400 text-base font-medium">
                    Your Training Dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-6 px-6">
                  <div className="mb-6 flex items-center gap-2">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      Email:
                    </span>
                    <span className="text-base font-semibold text-neutral-900 dark:text-white">
                      {userProfile?.email || "Employee"}
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        Progress Overview
                      </span>
                      <Select
                        value={progressView}
                        onValueChange={setProgressView}
                      >
                        <SelectTrigger className="w-[160px] bg-neutral-100 dark:bg-neutral-800 border-0 text-neutral-700 dark:text-neutral-200">
                          <SelectValue placeholder="Select view" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Courses</SelectItem>
                          <SelectItem value="mandatory">
                            Mandatory Courses
                          </SelectItem>
                          <SelectItem value="non-mandatory">
                            Non-Mandatory Courses
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {progressView === "all" && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-500 dark:text-neutral-400">
                            Overall Progress
                          </span>
                          <span className="text-sm font-medium">
                            {overallProgress}%
                          </span>
                        </div>
                        <Progress
                          value={overallProgress}
                          className="h-2 bg-neutral-200 dark:bg-neutral-700"
                        />
                      </>
                    )}
                    {progressView === "mandatory" && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-500 dark:text-neutral-400">
                            Mandatory Courses Progress
                          </span>
                          <span className="text-sm font-medium">
                            {mandatoryProgress}%
                          </span>
                        </div>
                        <Progress
                          value={mandatoryProgress}
                          className="h-2 bg-red-200 dark:bg-red-700"
                        />
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {mandatoryCourses.length} mandatory courses
                        </div>
                      </>
                    )}
                    {progressView === "non-mandatory" && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-500 dark:text-neutral-400">
                            Non-Mandatory Courses Progress
                          </span>
                          <span className="text-sm font-medium">
                            {nonMandatoryProgress}%
                          </span>
                        </div>
                        <Progress
                          value={nonMandatoryProgress}
                          className="h-2 bg-blue-200 dark:bg-blue-700"
                        />
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {nonMandatoryCourses.length} non-mandatory courses
                        </div>
                      </>
                    )}
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      <div className="flex justify-between items-center py-3">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                          <span className="text-sm text-neutral-700 dark:text-neutral-200">
                            Total Courses
                          </span>
                        </div>
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {courses.length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-green-500 dark:text-green-400" />
                          <span className="text-sm text-neutral-700 dark:text-neutral-200">
                            Completed
                          </span>
                        </div>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {completedCourses}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                          <span className="text-sm text-neutral-700 dark:text-neutral-200">
                            In Progress
                          </span>
                        </div>
                        <span className="font-bold text-yellow-600 dark:text-yellow-400">
                          {courses.length - completedCourses}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:w-3/4 animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h1 className="text-2xl font-bold">Your Courses</h1>
                <div className="mt-4 md:mt-0 flex space-x-2">
                  <Button
                    variant={activeTab === "all" ? "default" : "outline"}
                    onClick={() => setActiveTab("all")}
                    className={`transition-all duration-200 ${
                      activeTab === "all"
                        ? "bg-complybrand-700 text-white hover:bg-complybrand-800"
                        : "hover:bg-muted/20"
                    }`}
                  >
                    All
                  </Button>
                  <Button
                    variant={activeTab === "inProgress" ? "default" : "outline"}
                    onClick={() => setActiveTab("inProgress")}
                    className={`transition-all duration-200 ${
                      activeTab === "inProgress"
                        ? "bg-complybrand-700 text-white hover:bg-complybrand-800"
                        : "hover:bg-muted/20"
                    }`}
                  >
                    In Progress
                  </Button>
                  <Button
                    variant={activeTab === "completed" ? "default" : "outline"}
                    onClick={() => setActiveTab("completed")}
                    className={`transition-all duration-200 ${
                      activeTab === "completed"
                        ? "bg-complybrand-700 text-white hover:bg-complybrand-800"
                        : "hover:bg-muted/20"
                    }`}
                  >
                    Completed
                  </Button>
                </div>
              </div>

              {filteredCourses.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {filteredCourses.map((course) => {
                    const progress = courseProgress[course.id] || 0;
                    const isCompleted = progress === 100;
                    const isInProgress = progress > 0 && progress < 100;

                    // Find userCourse info for this course
                    const userCourse = userCourses.find(
                      (uc: UserCourse) => uc.courseId === course.id
                    );
                    const canDownloadCertificate =
                      userCourse?.canDownloadCertificate;
                    const certificateUrl = userCourse?.certificateUrl;
                    const canRetakeQuiz = userCourse?.canRetakeQuiz;

                    return (
                      <div key={course.id} className="relative">
                        <CourseCard
                          id={course.id}
                          courseId={course.courseId || course.id}
                          title={course.title}
                          description={course.description}
                          duration={course.duration}
                          enrolledUsers={course.enrolledUsers}
                          progress={progress}
                          userRole="employee"
                          tenantId={tenantId || ""}
                          token={token || ""}
                          className={
                            isCompleted
                              ? "bg-green-10"
                              : isInProgress
                              ? "bg-yellow-10"
                              : ""
                          }
                          properties={course.properties}
                          canRetakeQuiz={canRetakeQuiz}
                          onTakeQuiz={
                            isCompleted
                              ? async () => {
                                  setIsGeneratingQuiz(true);
                                  try {
                                    // Get the material URL from localStorage
                                    const storedMaterialUrl =
                                      localStorage.getItem(
                                        `course_material_${course.id}`
                                      );
                                    let s3Url;

                                    if (!storedMaterialUrl) {
                                      const materialResponse = await fetch(
                                        `${
                                          import.meta.env.VITE_BACKEND_URL
                                        }/api/courses/${
                                          course.id
                                        }/chatbot-material?tenantId=${tenantId}`
                                      );

                                      if (!materialResponse.ok) {
                                        throw new Error(
                                          "Failed to fetch course material URL"
                                        );
                                      }

                                      const materialData =
                                        await materialResponse.json();
                                      s3Url = materialData.materialUrl;

                                      if (!s3Url) {
                                        throw new Error(
                                          "Material URL is empty in the response"
                                        );
                                      }

                                      localStorage.setItem(
                                        `course_material_${course.id}`,
                                        s3Url
                                      );
                                    } else {
                                      s3Url = storedMaterialUrl;
                                    }

                                    // Generate MCQs
                                    const mcqResponse = await fetch(
                                      `${
                                        import.meta.env.VITE_AI_SERVICE_URL
                                      }/generate_mcq`,
                                      {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          presentation_url: s3Url,
                                          course_id: course.id,
                                          tenant_id: tenantId,
                                        }),
                                      }
                                    );

                                    if (!mcqResponse.ok) {
                                      throw new Error(
                                        "Failed to generate MCQs"
                                      );
                                    }

                                    const mcqData = await mcqResponse.json();

                                    if (
                                      !mcqData.mcqs ||
                                      !Array.isArray(mcqData.mcqs)
                                    ) {
                                      throw new Error(
                                        "Invalid MCQ data received"
                                      );
                                    }

                                    // Store MCQ data and navigate to quiz
                                    localStorage.setItem(
                                      "currentQuiz",
                                      JSON.stringify(mcqData.mcqs)
                                    );
                                    navigate(
                                      `/dashboard/course/${course.id}/quiz?tenantId=${tenantId}&token=${token}`
                                    );
                                  } catch (error) {
                                    console.error(
                                      "Error preparing quiz:",
                                      error
                                    );
                                    toast.error(
                                      error instanceof Error
                                        ? error.message
                                        : "Failed to prepare quiz. Please try again."
                                    );
                                  } finally {
                                    setIsGeneratingQuiz(false);
                                  }
                                }
                              : undefined
                          }
                          canDownloadCertificate={canDownloadCertificate}
                          certificateUrl={certificateUrl}
                          tags={
                            Array.isArray(course.tags)
                              ? course.tags.join(", ")
                              : course.tags
                          }
                          onClick={() => handleCourseSelect(course.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Card className="animate-fade-in overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50">
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium">No courses found</h3>
                    <p className="text-gray-500 text-center mt-2">
                      There are no courses in this category yet.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserDashboard;
