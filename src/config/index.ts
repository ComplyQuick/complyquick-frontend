export const config = {
  api: {
    baseUrl: import.meta.env.VITE_BACKEND_URL,
    aiServiceUrl: import.meta.env.VITE_AI_SERVICE_URL,
    endpoints: {
      user: {
        profile: "/api/user-dashboard/profile",
        courses: {
          enabled: "/api/tenant-admin/user/enabled-courses",
          details: "/api/tenant-admin/tenants",
          progress: "/api/courses/progress/user",
          userCourses: "/api/user-dashboard/dashboard",
          material: "/api/courses",
        },
        certificate: "/api/user-dashboard/certificates/store",
        mcq: "/generate_mcq",
      },
    },
  },
};
