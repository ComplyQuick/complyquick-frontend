import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Users, BookOpen, BarChart, Settings, Loader2 } from "lucide-react";
import UsersList from "@/components/dashboard/UsersList";
import CourseCard from "@/components/dashboard/CourseCard";
import TenantUsersList from "@/components/dashboard/TenantUsersList";
import AddTenantDetailsForm from "@/components/forms/AddTenantDetailsForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [tenantDetailsDialogOpen, setTenantDetailsDialogOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [tenantId, setTenantId] = useState<string | null>(() => {
    const storedTenantId = localStorage.getItem('tenantId');
    if (!storedTenantId) {
      console.error('No tenant ID found in localStorage');
      return null;
    }
    return storedTenantId;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    const storedTenantId = localStorage.getItem('tenantId');
    if (!storedTenantId) {
      console.error('No tenant ID found in localStorage');
      setError('No tenant ID found. Please log in again.');
      setIsLoading(false);
      return;
    }
    setTenantId(storedTenantId);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!tenantId) return;
      
      try {
        setIsLoadingUsers(true);
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tenant-admin/tenants/${tenantId}/users`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [tenantId]);

  useEffect(() => {
    const fetchTenantCourses = async () => {
      if (!tenantId) {
        setError('No tenant ID available. Please log in again.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        console.log('Fetching courses for tenant:', tenantId);
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tenant-admin/tenants/${tenantId}/courses`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('Error response:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
          throw new Error(errorData?.message || 'Failed to fetch tenant courses');
        }

        const data = await response.json();
        console.log('Received courses data:', data);
        
        // The response is already in the correct format, no need to map
        setCourses(data);
      } catch (error) {
        console.error('Error fetching tenant courses:', error);
        setError(error instanceof Error ? error.message : 'Failed to load courses. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAvailableCourses = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/courses`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch available courses');
        }

        const data = await response.json();
        setAvailableCourses(data);
      } catch (error) {
        console.error('Error fetching available courses:', error);
      }
    };

    fetchTenantCourses();
    fetchAvailableCourses();
  }, [tenantId]);

  const handleAddCourse = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      if (!tenantId) {
        throw new Error('No tenant ID found');
      }

      if (!selectedCourses || selectedCourses.length === 0) {
        throw new Error('No courses selected');
      }

      // Take the first selected course since we can only assign one at a time
      const courseId = selectedCourses[0];

      console.log('Making course assignment request with:', {
        tenantId,
        courseId,
        token: token.substring(0, 10) + '...' // Log only part of token for security
      });

      const requestBody = {
        courseId,
        tenantId
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/courses/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      let responseData;
      try {
        responseData = await response.json();
        console.log('Response data:', responseData);
      } catch (e) {
        console.error('Error parsing response:', e);
        responseData = null;
      }

      if (!response.ok) {
        console.error('Error response data:', responseData);
        throw new Error(responseData?.error || responseData?.message || `Failed to assign courses. Status: ${response.status}`);
      }

      // Check if explanations were generated
      if (responseData && !responseData.explanations) {
        console.warn('Course was assigned but explanations were not generated');
        toast.warning('Course was assigned but explanations were not generated. Please try again later.');
      } else {
        console.log('Course assigned successfully with explanations');
        toast.success('Course assigned successfully!');
      }
      
      setIsAddCourseDialogOpen(false);

      // Refresh the tenant courses after assignment
      const fetchResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tenant-admin/tenants/${tenantId}/courses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (fetchResponse.ok) {
        const updatedCourses = await fetchResponse.json();
        setCourses(updatedCourses);
        
        // Also refresh available courses to update the list
        const availableResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/courses`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (availableResponse.ok) {
          const allCourses = await availableResponse.json();
          // Filter out courses that are already assigned to the tenant
          const unassignedCourses = allCourses.filter((course: any) => 
            !updatedCourses.some((assignedCourse: any) => assignedCourse.id === course.id)
          );
          setAvailableCourses(unassignedCourses);
        }
      }
    } catch (error) {
      console.error('Error assigning courses:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to assign courses');
    }
  };

  const handleCourseSelect = async (course: any) => {
    setSelectedCourse(course);
    setIsGeneratingVideo(true);
    setVideoUrl(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/courses/${course.id}/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId,
          courseId: course.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate video');
      }

      const data = await response.json();
      console.log('Video generation response:', data);

      // Poll for video generation status
      const pollVideoStatus = async () => {
        const statusResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/courses/${course.id}/video-status`);
        const statusData = await statusResponse.json();

        if (statusData.status === 'completed') {
          setVideoUrl(statusData.videoUrl);
          setIsGeneratingVideo(false);
          toast.success('Video generated successfully!');
        } else if (statusData.status === 'failed') {
          setIsGeneratingVideo(false);
          toast.error('Failed to generate video. Please try again.');
        } else {
          // Continue polling
          setTimeout(pollVideoStatus, 5000);
        }
      };

      pollVideoStatus();
    } catch (error) {
      console.error('Error generating video:', error);
      setIsGeneratingVideo(false);
      toast.error('Failed to generate video. Please try again.');
    }
  };

  const completedCount = users.filter(
    (user: any) => user.enrollments?.length > 0 && 
    user.enrollments.every((enrollment: any) => enrollment.completed)
  ).length;

  const inProgressCount = users.filter(
    (user: any) => user.enrollments?.length > 0 && 
    user.enrollments.some((enrollment: any) => !enrollment.completed)
  ).length;

  const notStartedCount = users.filter(
    (user: any) => !user.enrollments || user.enrollments.length === 0
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted/30">
      <Navbar userRole="admin" />
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="animate-fade-in">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Organization Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your organization's compliance training</p>
            </div>
            <div className="flex space-x-3 animate-fade-in">
              <Button 
                className="bg-complybrand-700 hover:bg-complybrand-800 hover:shadow-lg transition-all duration-300"
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
                <div className="text-2xl font-bold animate-fade-in">{users.length}</div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Courses
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold animate-fade-in">{courses.length}</div>
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
                  {users.length > 0 ? Math.round((completedCount / users.length) * 100) : 0}%
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
                  <span className="font-medium text-green-600">{completedCount}</span>
                </div>
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>In Progress:</span>
                  <span className="font-medium text-yellow-600">{inProgressCount}</span>
                </div>
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>Not Started:</span>
                  <span className="font-medium text-red-600">{notStartedCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-muted/50 backdrop-blur-sm">
              <TabsTrigger value="overview" className="data-[state=active]:bg-complybrand-600 data-[state=active]:text-white">Overview</TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-complybrand-600 data-[state=active]:text-white">Users</TabsTrigger>
              <TabsTrigger value="courses" className="data-[state=active]:bg-complybrand-600 data-[state=active]:text-white">Courses</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 animate-fade-in">
              <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50">
                <CardHeader>
                  <CardTitle>User Completion Status</CardTitle>
                  <CardDescription>
                    Track employee progress across all compliance courses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingUsers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-complybrand-600" />
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No users found in your organization.
                    </div>
                  ) : (
                  <UsersList 
                      users={users.slice(0, 3)} 
                    title="Recent User Activity" 
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
              
              <div className="mt-8 animate-fade-in">
                <h3 className="text-lg font-medium mb-4">Active Courses</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      id={course.id}
                      title={course.title}
                      description={course.description}
                      duration={course.duration}
                      enrolledCount={course.enrolledCount}
                      userRole="admin"
                    />
                  ))}
                </div>
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
                  {isLoading ? (
                    <div className="text-center py-4">Loading courses...</div>
                  ) : error ? (
                    <div className="text-center text-red-500 py-4">{error}</div>
                  ) : courses.length === 0 ? (
                    <div className="text-center py-4">No courses available for your organization.</div>
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
                            <CardDescription>{course.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p>Duration: {course.duration} minutes</p>
                            <p>Tags: {course.tags}</p>
                            <p>Learning Objectives: {course.learningObjectives}</p>
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
                      <CardTitle>{selectedCourse.title} - Video Presentation</CardTitle>
                      <CardDescription>
                        {isGeneratingVideo ? 'Generating video...' : 'Watch the course presentation'}
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

      <Button onClick={() => setIsAddCourseDialogOpen(true)}>Add Course</Button>

      <Dialog open={isAddCourseDialogOpen} onOpenChange={setIsAddCourseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Course</DialogTitle>
            <DialogDescription>Select courses to add to your organization.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {availableCourses.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No new courses available to add.
              </div>
            ) : (
              availableCourses.map((course: any) => (
                <div key={course.id} className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
                  <Checkbox
                    id={course.id}
                    checked={selectedCourses.includes(course.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCourses([...selectedCourses, course.id]);
                      } else {
                        setSelectedCourses(selectedCourses.filter(id => id !== course.id));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <Label htmlFor={course.id} className="text-lg font-medium">{course.title}</Label>
                    <p className="text-sm text-muted-foreground">{course.description}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="text-xs bg-muted px-2 py-1 rounded-full">{course.duration} minutes</span>
                      <span className="text-xs bg-muted px-2 py-1 rounded-full">{course.tags}</span>
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
              <h2 className="text-2xl font-bold mb-4">{selectedCourse.title} - Video Generation</h2>
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
                    <video 
                      controls 
                      className="w-full h-full"
                      src={videoUrl}
                    >
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
                    Click the button below to start generating the video presentation.
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

      <Footer />
    </div>
  );
};

export default AdminDashboard;
