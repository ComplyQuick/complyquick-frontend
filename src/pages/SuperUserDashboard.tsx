import React, { useState, useEffect } from "react";
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
  PlusCircle,
  Building,
  BookOpen,
  Users,
  MoreVertical,
  Trash2,
  Pencil,
} from "lucide-react";
import CourseCard from "@/components/dashboard/CourseCard";
import AddOrganizationForm from "@/components/forms/AddOrganizationForm";
import AddCourseForm from "@/components/forms/AddCourseForm";
import { toast } from "sonner";
import { Menu } from "@headlessui/react";
import {
  Course,
  Tenant,
  CourseEnrolledUsers,
  RecentTenant,
} from "@/types/SuperuserDashboard";
import { superuserService } from "@/services/superuserService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const SuperUserDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [organizationDialogOpen, setOrganizationDialogOpen] = useState(false);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCourseActions, setShowCourseActions] = useState(false);
  const [updateCourse, setUpdateCourse] = useState<Course | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [enrolledUsersData, setEnrolledUsersData] = useState<
    CourseEnrolledUsers[]
  >([]);
  const [recentTenants, setRecentTenants] = useState<RecentTenant[]>([]);
  const [orgTab, setOrgTab] = useState<"active" | "inactive">("active");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "deactivate" | "activate" | null
  >(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [totalOrganizationsCount, setTotalOrganizationsCount] = useState(0);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesData, tenantsData] = await Promise.all([
          superuserService.getCourses(),
          superuserService.getTenants(),
        ]);
        setCourses(coursesData);
        setTenants(tenantsData);
        setIsLoading(false);
      } catch (error) {
        setError("Failed to load data");
        toast.error("Failed to load data. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchEnrolledUsers = async () => {
      try {
        const data = await superuserService.getEnrolledUsers();
        setEnrolledUsersData(data);
      } catch (e) {
        // Optionally handle error
      }
    };
    fetchEnrolledUsers();
  }, []);

  useEffect(() => {
    const fetchRecentTenants = async () => {
      try {
        const data = await superuserService.getRecentTenants();
        setRecentTenants(data);
      } catch (e) {
        // Optionally handle error
      }
    };
    fetchRecentTenants();
  }, []);

  useEffect(() => {
    const fetchTotalOrganizationsCount = async () => {
      try {
        const [activeData, inactiveData] = await Promise.all([
          superuserService.getActiveTenants(),
          superuserService.getInactiveTenants(),
        ]);
        setTotalOrganizationsCount(activeData.length + inactiveData.length);
      } catch (e) {
        // Optionally handle error
      }
    };
    fetchTotalOrganizationsCount();
  }, []);

  useEffect(() => {
    const fetchTenants = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let data;
        if (orgTab === "active") {
          data = await superuserService.getActiveTenants();
        } else {
          data = await superuserService.getInactiveTenants();
        }
        setTenants(data);
      } catch (err) {
        setError("Failed to load organizations");
        toast.error("Failed to load organizations. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTenants();
  }, [orgTab]);

  const handleCourseCreated = () => {
    const fetchCourses = async () => {
      try {
        const data = await superuserService.getCourses();
        setCourses(data);
      } catch (error) {
        toast.error("Failed to refresh courses");
      }
    };

    fetchCourses();
  };

  const handleOrganizationCreated = () => {
    const fetchTenants = async () => {
      try {
        const data = await superuserService.getTenants();
        setTenants(data);

        // Also refresh total organizations count
        const [activeData, inactiveData] = await Promise.all([
          superuserService.getActiveTenants(),
          superuserService.getInactiveTenants(),
        ]);
        setTotalOrganizationsCount(activeData.length + inactiveData.length);
      } catch (error) {
        toast.error("Failed to refresh tenants");
      }
    };

    fetchTenants();
  };

  // Handler for menu click
  const handleMenuAction = (
    tenant: Tenant,
    action: "deactivate" | "activate"
  ) => {
    setSelectedTenant(tenant);
    setConfirmAction(action);
    setConfirmModalOpen(true);
  };

  // Handler for confirming modal
  const handleConfirm = async () => {
    if (!selectedTenant || !confirmAction) return;
    setConfirmModalOpen(false);
    try {
      if (confirmAction === "deactivate") {
        await superuserService.inactivateTenant(selectedTenant.id);
        setTenants((prev) => prev.filter((t) => t.id !== selectedTenant.id));
        toast.success("Organization deactivated successfully");
      } else {
        await superuserService.activateTenant(selectedTenant.id);
        setTenants((prev) => prev.filter((t) => t.id !== selectedTenant.id));
        toast.success("Organization activated successfully");
      }

      // Refresh total organizations count
      try {
        const [activeData, inactiveData] = await Promise.all([
          superuserService.getActiveTenants(),
          superuserService.getInactiveTenants(),
        ]);
        setTotalOrganizationsCount(activeData.length + inactiveData.length);
      } catch (e) {
        // Optionally handle error
      }
    } catch (err) {
      toast.error(`Failed to ${confirmAction} organization`);
    } finally {
      setSelectedTenant(null);
      setConfirmAction(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted/30">
      <Navbar userRole="superuser" />
      <main className="flex-grow pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="animate-fade-in">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Super User Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage organizations, courses, and system-wide settings
              </p>
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
                <div className="text-2xl font-bold animate-fade-in">
                  {totalOrganizationsCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalOrganizationsCount > 0
                    ? `+${totalOrganizationsCount} from last month`
                    : "No organizations yet"}
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
                <div className="text-2xl font-bold animate-fade-in">
                  {courses.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {courses.length > 0
                    ? `+${courses.length} from last month`
                    : "No courses yet"}
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
                  {tenants.reduce(
                    (acc, tenant) => acc + (tenant.users?.length || 0),
                    0
                  )}
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
                value="organizations"
                className="data-[state=active]:bg-complybrand-600 data-[state=active]:text-white"
              >
                Organizations
              </TabsTrigger>
              <TabsTrigger
                value="courses"
                className="data-[state=active]:bg-complybrand-600 data-[state=active]:text-white"
              >
                Courses
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 animate-fade-in">
              <div className="px-8">
                <div className="grid w-full gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {isLoading ? (
                    <div className="col-span-full text-center py-8">
                      <p className="text-muted-foreground">
                        Loading courses...
                      </p>
                    </div>
                  ) : error ? (
                    <div className="col-span-full text-center py-8">
                      <p className="text-destructive">{error}</p>
                    </div>
                  ) : courses.length > 0 ? (
                    courses
                      .slice(0, 3)
                      .map((course) => (
                        <CourseCard
                          key={course.id}
                          id={course.id}
                          title={course.title}
                          description={course.description}
                          duration={`${course.duration} minutes`}
                          enrolledUsers={
                            enrolledUsersData.find(
                              (c) => c.courseId === course.id
                            )?.totalEnrolledUsers || 0
                          }
                          userRole="superuser"
                          learningObjectives={course.learningObjectives}
                          tags={course.tags}
                          materialUrl={course.materialUrl}
                        />
                      ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <p className="text-muted-foreground">
                        No courses available
                      </p>
                    </div>
                  )}
                </div>
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
                        <p className="text-muted-foreground">
                          Loading organizations...
                        </p>
                      </div>
                    ) : error ? (
                      <div className="text-center py-8">
                        <p className="text-destructive">{error}</p>
                      </div>
                    ) : recentTenants.length > 0 ? (
                      recentTenants.slice(0, 3).map((tenant) => (
                        <div
                          key={tenant.id}
                          className="flex items-center p-3 rounded-md hover:bg-muted/20 transition-all duration-200"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {tenant.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {tenant.userCount} users ·{" "}
                              {tenant.enabledCourseCount} courses
                            </p>
                          </div>
                          <div className="ml-auto font-medium">
                            Domain: {tenant.domain}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          No recent organizations found.
                        </p>
                      </div>
                    )}
                    {recentTenants.length > 3 && (
                      <div className="pt-4 border-t border-border/30">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setActiveTab("organizations")}
                        >
                          View All Organizations ({recentTenants.length})
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="organizations"
              className="space-y-4 animate-fade-in"
            >
              <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50">
                <CardHeader>
                  <CardTitle>Organizations</CardTitle>
                  <CardDescription>
                    Manage all organizations registered on ComplyQuick
                  </CardDescription>
                  <div className="flex gap-2 mt-4">
                    <button
                      className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors ${
                        orgTab === "active"
                          ? "bg-blue-600 text-white"
                          : "bg-muted text-gray-600 dark:text-gray-300"
                      }`}
                      onClick={() => setOrgTab("active")}
                    >
                      Active Organizations
                    </button>
                    <button
                      className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors ${
                        orgTab === "inactive"
                          ? "bg-blue-600 text-white"
                          : "bg-muted text-gray-600 dark:text-gray-300"
                      }`}
                      onClick={() => setOrgTab("inactive")}
                    >
                      Inactive Organizations
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoading ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          Loading organizations...
                        </p>
                      </div>
                    ) : error ? (
                      <div className="text-center py-8">
                        <p className="text-destructive">{error}</p>
                      </div>
                    ) : tenants.length > 0 ? (
                      tenants.map((tenant) => {
                        const recent = recentTenants.find(
                          (t) => t.id === tenant.id
                        );
                        return (
                          <div
                            key={tenant.id}
                            className="flex items-center p-4 border border-border/30 rounded-md hover:bg-muted/20 transition-all duration-200"
                          >
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">
                                {tenant.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {tenant.users?.length || 0} users ·{" "}
                                {recent?.enabledCourseCount ?? 0} courses
                              </p>
                              <span className="block text-xs text-muted-foreground">
                                Admin: {tenant.adminEmail}
                              </span>
                            </div>
                            <div className="ml-auto">
                              <Menu
                                as="div"
                                className="relative inline-block text-left"
                              >
                                <Menu.Button className="p-1 rounded-full hover:bg-muted focus:outline-none">
                                  <MoreVertical className="h-5 w-5 text-gray-500" />
                                </Menu.Button>
                                <Menu.Items
                                  className="absolute right-0 bottom-full mb-2 w-auto origin-bottom-right bg-transparent border-none shadow-none z-[9999]"
                                  style={{ zIndex: 9999 }}
                                >
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        className={`px-2 py-1 rounded-xl font-semibold text-m text-white ${
                                          orgTab === "active"
                                            ? "bg-red-600 hover:bg-red-700"
                                            : "bg-green-600 hover:bg-green-700"
                                        } transition flex items-center gap-1`}
                                        style={{ minWidth: 120 }}
                                        onClick={() =>
                                          handleMenuAction(
                                            tenant,
                                            orgTab === "active"
                                              ? "deactivate"
                                              : "activate"
                                          )
                                        }
                                      >
                                        {orgTab === "active" ? (
                                          <span className="flex items-center gap-1">
                                            <Trash2 className="h-4 w-4" />
                                            Deactivate
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-1">
                                            <Pencil className="h-4 w-4" />
                                            Activate
                                          </span>
                                        )}
                                      </button>
                                    )}
                                  </Menu.Item>
                                </Menu.Items>
                              </Menu>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          No organizations available
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              {/* Confirmation Modal */}
              <Dialog
                open={confirmModalOpen}
                onOpenChange={setConfirmModalOpen}
              >
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {confirmAction === "deactivate"
                        ? "Deactivate Organization"
                        : "Activate Organization"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p>
                      Are you sure you want to {confirmAction} the organization{" "}
                      <span className="font-semibold">
                        {selectedTenant?.name}
                      </span>
                      ?
                    </p>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setConfirmModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className={
                        confirmAction === "deactivate"
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }
                      onClick={handleConfirm}
                    >
                      {confirmAction === "deactivate"
                        ? "Deactivate"
                        : "Activate"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="courses" className="animate-fade-in">
              <AddCourseForm
                open={!!updateCourse}
                onOpenChange={(open) => {
                  if (!open) setUpdateCourse(null);
                }}
                course={updateCourse}
                mode="update"
                onCourseCreated={handleCourseCreated}
              />
              <div className="px-8">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {isLoading ? (
                    <div className="col-span-full text-center py-8">
                      <p className="text-muted-foreground">
                        Loading courses...
                      </p>
                    </div>
                  ) : error ? (
                    <div className="col-span-full text-center py-8">
                      <p className="text-destructive">{error}</p>
                    </div>
                  ) : courses.length > 0 ? (
                    courses.map((course) => (
                      <div key={course.id} className="relative">
                        <CourseCard
                          id={course.id}
                          title={course.title}
                          description={course.description}
                          duration={`${course.duration} minutes`}
                          enrolledUsers={
                            enrolledUsersData.find(
                              (c) => c.courseId === course.id
                            )?.totalEnrolledUsers || 0
                          }
                          userRole="superuser"
                          onUpdateCourse={() => setUpdateCourse(course)}
                          learningObjectives={course.learningObjectives}
                          tags={course.tags}
                          materialUrl={course.materialUrl}
                        />
                        {dropdownOpen &&
                          (course.id === selectedCourse?.id ? (
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-lg mt-2 min-w-[120px] absolute right-0">
                              <button
                                className="w-full text-left text-white px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDropdownOpen(false);
                                  setUpdateCourse(course);
                                }}
                              >
                                <Pencil className="h-4 w-4 text-white bg-green-600" />
                                <span className="text-white">
                                  Update Course
                                </span>
                              </button>
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDropdownOpen(false);
                                  setShowCourseActions(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete Course
                              </button>
                            </div>
                          ) : null)}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <p className="text-muted-foreground">
                        No courses available
                      </p>
                    </div>
                  )}
                </div>
              </div>
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
