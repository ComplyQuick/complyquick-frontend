import React, { useEffect, useState } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import CourseHeader from "./CourseHeader";
import SlidePlayer from "./SlidePlayer";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Slide {
  id: string;
  title: string;
  content: string;
  completed: boolean;
}

const CoursePlayer = () => {
  const [searchParams] = useSearchParams();
  const { courseId } = useParams();
  const tenantId = searchParams.get("tenantId");
  const navigate = useNavigate();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingExplanations, setIsLoadingExplanations] = useState(true);
  const [explanations, setExplanations] = useState<Record<string, string>>({});

  useEffect(() => {
    console.log("CoursePlayer mounted with params:", {
      courseId,
      tenantId,
      fullPath: window.location.pathname,
      searchParams: Object.fromEntries(searchParams.entries()),
    });
  }, [courseId, tenantId, searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId || !tenantId) {
        console.error("Missing required parameters:", { courseId, tenantId });
        toast.error("Missing required parameters");
        navigate("/dashboard");
        return;
      }

      try {
        setIsLoading(true);
        setIsLoadingExplanations(true);

        // Fetch slides
        const slidesResponse = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/tenant-admin/tenants/${tenantId}/courses/${courseId}/slides`
        );

        if (!slidesResponse.ok) {
          throw new Error("Failed to fetch slides");
        }

        const slidesData = await slidesResponse.json();
        setSlides(slidesData);

        // Fetch explanations
        const explanationsResponse = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/tenant-admin/tenants/${tenantId}/courses/${courseId}/explanations`
        );

        if (!explanationsResponse.ok) {
          throw new Error("Failed to fetch explanations");
        }

        const explanationsData = await explanationsResponse.json();
        setExplanations(explanationsData);
      } catch (error) {
        console.error("Error fetching course data:", error);
        toast.error("Failed to load course content");
      } finally {
        setIsLoading(false);
        setIsLoadingExplanations(false);
      }
    };

    fetchData();
  }, [courseId, tenantId, navigate]);

  const handleComplete = async () => {
    if (!courseId || !tenantId) {
      toast.error("Missing required parameters");
      return;
    }

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/tenant-admin/tenants/${tenantId}/courses/${courseId}/complete`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark course as complete");
      }

      toast.success("Course completed successfully!");
    } catch (error) {
      console.error("Error completing course:", error);
      toast.error("Failed to complete course");
    }
  };

  if (!courseId || !tenantId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-600">
            Missing required parameters. Please return to the dashboard.
          </p>
          <div className="mt-4 space-y-2">
            <div>Course ID: {courseId || "Missing"}</div>
            <div>Tenant ID: {tenantId || "Missing"}</div>
          </div>
          <Button className="mt-4" onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CourseHeader
        courseTitle={slides[0]?.title || "Loading..."}
        onReturn={() => navigate("/dashboard")}
      />

      <div className="mt-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <SlidePlayer
            slides={slides}
            currentSlideIndex={currentSlideIndex}
            onSlideChange={setCurrentSlideIndex}
            onComplete={handleComplete}
            explanations={explanations}
            isLoadingExplanations={isLoadingExplanations}
          />
        )}
      </div>
    </div>
  );
};

export default CoursePlayer;
