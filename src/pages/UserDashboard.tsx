import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Award, Clock, BookOpen } from "lucide-react";
import CourseCard from "@/components/dashboard/CourseCard";
import CourseProgress from "@/components/dashboard/CourseProgress";
import { toast } from "sonner";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import GeneralChatbot from "@/components/course/GeneralChatbot";
import { decodeJWT } from "@/utils/auth";

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  progress: number;
}

interface UserProfile {
  success: boolean;
  name: string;
  email: string;
}

interface CourseProgress {
  courseId: string;
  progress: number;
}

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState<"all" | "inProgress" | "completed">("all");
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('tenantId');
  const token = searchParams.get('token');
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>({});

  // Store tenantId in localStorage when it's available
  useEffect(() => {
    if (tenantId) {
      localStorage.setItem('tenantId', tenantId);
      console.log('Stored tenantId in localStorage:', tenantId);
    }
  }, [tenantId]);

  // Fetch user profile and course progress
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        console.error('No token available');
        return;
      }

      try {
        // Decode JWT to get user ID
        const decodedToken = decodeJWT(token);
        console.log('Decoded token:', decodedToken);
        
        // Try different possible fields for user ID
        const userId = decodedToken?.sub || decodedToken?.userId || decodedToken?.id;
        if (!userId) {
          console.error('Token structure:', decodedToken);
          throw new Error('User ID not found in token');
        }

        // Fetch user profile
        const profileResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user-dashboard/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!profileResponse.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const profileData = await profileResponse.json();
        setUserProfile(profileData);
        if (profileData?.name) {
          localStorage.setItem('userName', profileData.name);
        }

        // Fetch courses
        const coursesResponse = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/tenant-admin/tenants/${tenantId}/courses`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!coursesResponse.ok) {
          throw new Error('Failed to fetch courses');
        }

        const coursesData = await coursesResponse.json();
        setCourses(coursesData);

        // Fetch progress for each course
        const progressPromises = coursesData.map(async (course: Course) => {
          const progressResponse = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/courses/progress/user?userId=${userId}&courseId=${course.id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (!progressResponse.ok) {
            return { courseId: course.id, progress: 0 };
          }

          const progressData = await progressResponse.json();
          return { courseId: course.id, progress: progressData.progress || 0 };
        });

        const progressResults = await Promise.all(progressPromises);
        const progressMap = progressResults.reduce((acc, curr) => {
          acc[curr.courseId] = curr.progress;
          return acc;
        }, {} as Record<string, number>);

        setCourseProgress(progressMap);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token, tenantId]);

  // Calculate overall progress and completed courses
  const totalProgress = Object.values(courseProgress).reduce((sum, progress) => sum + progress, 0);
  const overallProgress = Object.keys(courseProgress).length > 0 
    ? Math.round(totalProgress / Object.keys(courseProgress).length) 
    : 0;
  
  const completedCourses = Object.values(courseProgress).filter(progress => progress === 100).length;

  // Filter courses based on active tab
  const filteredCourses = courses.filter(course => {
    const progress = courseProgress[course.id] || 0;
    if (activeTab === "all") return true;
    if (activeTab === "inProgress") return progress > 0 && progress < 100;
    if (activeTab === "completed") return progress === 100;
    return true;
  });

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
      <Navbar userRole="employee" />
      {/* Chat Drawer Trigger */}
      <Drawer>
        <DrawerTrigger asChild>
          <button
            className="fixed bottom-8 right-8 z-50 bg-complybrand-700 hover:bg-complybrand-800 text-white rounded-full shadow-lg p-4 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-complybrand-700"
            aria-label="Open Chatbot"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 20l.8-3.2A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </button>
        </DrawerTrigger>
        <DrawerContent className="max-w-lg mx-auto w-full">
          <DrawerHeader>
            <DrawerTitle>General Chatbot</DrawerTitle>
            <DrawerClose className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">✕</DrawerClose>
          </DrawerHeader>
          <div className="p-2 pb-8">
            <GeneralChatbot tenantId={tenantId || ''} />
          </div>
        </DrawerContent>
      </Drawer>
      {/* End Chat Drawer */}
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/4">
              <Card className="animate-fade-in hover:shadow-md transition-all duration-300 overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle>Welcome back, {userProfile?.name || 'Employee'}!</CardTitle>
                  <CardDescription>Your training dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <h3 className="font-medium text-lg">{userProfile?.email || 'Employee'}</h3>
                    <p className="text-gray-500 text-sm">Tenant ID: {tenantId}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Overall Progress</span>
                        <span className="text-sm font-medium">{overallProgress}%</span>
                      </div>
                      <Progress value={overallProgress} className="h-2 bg-gray-200 dark:bg-gray-700" />
                    </div>
                    
                    <div className="pt-2 border-t flex justify-between items-center hover:bg-muted/20 p-2 rounded-md transition-colors">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">Total Courses</span>
                      </div>
                      <span className="font-medium">{courses.length}</span>
                    </div>
                    
                    <div className="flex justify-between items-center hover:bg-muted/20 p-2 rounded-md transition-colors">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">Completed</span>
                      </div>
                      <span className="font-medium">{completedCourses}</span>
                    </div>
                    
                    <div className="flex justify-between items-center hover:bg-muted/20 p-2 rounded-md transition-colors">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">In Progress</span>
                      </div>
                      <span className="font-medium">{courses.length - completedCourses}</span>
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
                    className={`transition-all duration-200 ${activeTab === "all" ? "bg-complybrand-700 hover:bg-complybrand-800" : "hover:bg-muted/20"}`}
                  >
                    All
                  </Button>
                  <Button 
                    variant={activeTab === "inProgress" ? "default" : "outline"} 
                    onClick={() => setActiveTab("inProgress")}
                    className={`transition-all duration-200 ${activeTab === "inProgress" ? "bg-complybrand-700 hover:bg-complybrand-800" : "hover:bg-muted/20"}`}
                  >
                    In Progress
                  </Button>
                  <Button 
                    variant={activeTab === "completed" ? "default" : "outline"} 
                    onClick={() => setActiveTab("completed")}
                    className={`transition-all duration-200 ${activeTab === "completed" ? "bg-complybrand-700 hover:bg-complybrand-800" : "hover:bg-muted/20"}`}
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
                    
                    return (
                      <CourseCard
                        key={course.id}
                        id={course.id}
                        title={course.title}
                        description={course.description}
                        duration={course.duration}
                        progress={progress}
                        userRole="employee"
                        tenantId={tenantId || ''}
                        token={token || ''}
                        className={isCompleted ? "bg-green-10" : isInProgress ? "bg-yellow-10" : ""}
                      />
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
