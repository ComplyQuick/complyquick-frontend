import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Building, BookOpen, Users } from "lucide-react";
import UsersList from "@/components/dashboard/UsersList";
import CourseCard from "@/components/dashboard/CourseCard";
import AddOrganizationForm from "@/components/forms/AddOrganizationForm";
import AddCourseForm from "@/components/forms/AddCourseForm";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  description: string;
  duration: number;
  tags: string[];
  learningObjectives: string[];
  targetAudience: string[];
  materialUrl: string;
  createdAt: string;
}

interface Tenant {
  id: string;
  name: string;
  domain: string;
  adminEmail: string;
  details?: {
    presidingOfficerEmail?: string;
    poshCommitteeEmail?: string;
    hrContactName?: string;
    hrContactEmail?: string;
    hrContactPhone?: string;
    ceoName?: string;
    ceoEmail?: string;
    ceoContact?: string;
    ctoName?: string;
    ctoEmail?: string;
    ctoContact?: string;
    ccoEmail?: string;
    ccoContact?: string;
    croName?: string;
    croEmail?: string;
    croContact?: string;
    legalOfficerName?: string;
    legalOfficerEmail?: string;
    legalOfficerContact?: string;
  };
  users?: {
    id: string;
    name: string;
    email: string;
    role: string;
  }[];
  courses?: {
    id: string;
    title: string;
  }[];
}

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  coursesCompleted: number;
  totalCourses: number;
  lastActivity: string;
  role?: string;
  status?: string;
}

const SuperUserDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [organizationDialogOpen, setOrganizationDialogOpen] = useState(false);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch courses
        const coursesResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/courses`);
        if (!coursesResponse.ok) {
          throw new Error('Failed to fetch courses');
        }
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);

        // Fetch tenants
        const tenantsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tenants`);
        if (!tenantsResponse.ok) {
          throw new Error('Failed to fetch tenants');
        }
        const tenantsData = await tenantsResponse.json();
        setTenants(tenantsData);

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
        toast.error('Failed to load data. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCourseCreated = () => {
    // Refresh courses after a new one is created
    const fetchCourses = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/courses`);
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }
        const data = await response.json();
        setCourses(data);
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error('Failed to refresh courses');
      }
    };

    fetchCourses();
  };

  const handleOrganizationCreated = () => {
    // Refresh tenants after a new one is created
    const fetchTenants = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tenants`);
        if (!response.ok) {
          throw new Error('Failed to fetch tenants');
        }
        const data = await response.json();
        setTenants(data);
      } catch (error) {
        console.error('Error fetching tenants:', error);
        toast.error('Failed to refresh tenants');
      }
    };

    fetchTenants();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted/30">
      <Navbar userRole="superuser" />
      <main className="flex-grow pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="animate-fade-in">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Super User Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage organizations, courses, and system-wide settings</p>
            </div>
            <div className="flex space-x-3 animate-fade-in">
              <Button 
                className="bg-complybrand-700 hover:bg-complybrand-800 hover:shadow-lg transition-all duration-300 text-white"
                onClick={() => setOrganizationDialogOpen(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Organization
              </Button>
              <Button 
                className="bg-complybrand-700 hover:bg-complybrand-800 hover:shadow-lg transition-all duration-300 text-white"
                onClick={() => setCourseDialogOpen(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Course
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Organizations
                </CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold animate-fade-in">{tenants.length}</div>
                <p className="text-xs text-muted-foreground">
                  {tenants.length > 0 ? `+${tenants.length} from last month` : 'No organizations yet'}
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Courses
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold animate-fade-in">{courses.length}</div>
                <p className="text-xs text-muted-foreground">
                  {courses.length > 0 ? `+${courses.length} from last month` : 'No courses yet'}
                </p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold animate-fade-in">
                  {tenants.reduce((acc, tenant) => acc + (tenant.users?.length || 0), 0)}
                </div>
                {/* <p className="text-xs text-muted-foreground">
                  +43 from last month
                </p> */}
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-muted/50 backdrop-blur-sm">
              <TabsTrigger value="overview" className="data-[state=active]:bg-complybrand-600 data-[state=active]:text-white">Overview</TabsTrigger>
              <TabsTrigger value="organizations" className="data-[state=active]:bg-complybrand-600 data-[state=active]:text-white">Organizations</TabsTrigger>
              <TabsTrigger value="courses" className="data-[state=active]:bg-complybrand-600 data-[state=active]:text-white">Courses</TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-complybrand-600 data-[state=active]:text-white">Users</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 animate-fade-in">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground">Loading courses...</p>
                  </div>
                ) : error ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-destructive">{error}</p>
                  </div>
                ) : courses.length > 0 ? (
                  courses.slice(0, 3).map((course) => (
                    <CourseCard
                      key={course.id}
                      id={course.id}
                      title={course.title}
                      description={course.description}
                      duration={`${course.duration} minutes`}
                      enrolledCount={0} // This would need to be fetched from the backend
                      userRole="superuser"
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground">No courses available</p>
                  </div>
                )}
              </div>
              
              <Card className="mt-6 overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50">
                <CardHeader>
                  <CardTitle>Recent Organizations</CardTitle>
                  <CardDescription>
                    Organizations recently added to the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {isLoading ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Loading organizations...</p>
                      </div>
                    ) : error ? (
                      <div className="text-center py-8">
                        <p className="text-destructive">{error}</p>
                      </div>
                    ) : tenants.length > 0 ? (
                      tenants.slice(0, 3).map((tenant) => (
                        <div key={tenant.id} className="flex items-center p-3 rounded-md hover:bg-muted/20 transition-all duration-200">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{tenant.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {tenant.users?.length || 0} users · {tenant.courses?.length || 0} courses
                            </p>
                          </div>
                          <div className="ml-auto font-medium">
                            Domain: {tenant.domain}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No organizations available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="organizations" className="space-y-4 animate-fade-in">
              <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50">
                <CardHeader>
                  <CardTitle>Organizations</CardTitle>
                  <CardDescription>
                    Manage all organizations registered on ComplyQuick
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Loading organizations...</p>
                      </div>
                    ) : error ? (
                      <div className="text-center py-8">
                        <p className="text-destructive">{error}</p>
                      </div>
                    ) : tenants.length > 0 ? (
                      tenants.map((tenant) => (
                        <div key={tenant.id} className="flex items-center p-4 border border-border/30 rounded-md hover:bg-muted/20 transition-all duration-200">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{tenant.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {tenant.users?.length || 0} users · {tenant.courses?.length || 0} courses
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Admin: {tenant.adminEmail}
                            </p>
                          </div>
                          <div className="ml-auto">
                            <Button variant="outline" className="hover:bg-complybrand-600 hover:text-white transition-colors">
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No organizations available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="courses" className="animate-fade-in">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground">Loading courses...</p>
                  </div>
                ) : error ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-destructive">{error}</p>
                  </div>
                ) : courses.length > 0 ? (
                  courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      id={course.id}
                      title={course.title}
                      description={course.description}
                      duration={`${course.duration} minutes`}
                      enrolledCount={0} // This would need to be fetched from the backend
                      userRole="superuser"
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground">No courses available</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="users" className="animate-fade-in">
              <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50">
                <CardContent className="pt-6">
                  <UsersList 
                    users={tenants.flatMap(tenant => 
                      (tenant.users || []).map(user => ({
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        department: "N/A",
                        coursesCompleted: 0,
                        totalCourses: tenant.courses?.length || 0,
                        lastActivity: "N/A"
                      }))
                    )} 
                    title="All Platform Users" 
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <AddOrganizationForm 
        open={organizationDialogOpen}
        onOpenChange={setOrganizationDialogOpen}
        onOrganizationCreated={handleOrganizationCreated}
      />

      <AddCourseForm
        open={courseDialogOpen}
        onOpenChange={setCourseDialogOpen}
        onCourseCreated={handleCourseCreated}
      />
      
      <Footer />
    </div>
  );
};

export default SuperUserDashboard;
