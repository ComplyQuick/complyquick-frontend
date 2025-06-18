// import React, { useEffect, useState } from "react";
// import { useSearchParams, useParams, useNavigate } from "react-router-dom";
// import { Loader2 } from "lucide-react";
// import CourseHeader from "./CourseHeader";
// import SlidePlayer from "./SlidePlayer";
// import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
// import { Slide, Explanation } from "@/types/CoursePlayer";
// import { courseService } from "@/services/courseService";

// const CoursePlayer = () => {
//   const [searchParams] = useSearchParams();
//   const { courseId } = useParams();
//   const tenantId = searchParams.get("tenantId");
//   const navigate = useNavigate();
//   const [slides, setSlides] = useState<Slide[]>([]);
//   const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isLoadingExplanations, setIsLoadingExplanations] = useState(true);
//   const [explanations, setExplanations] = useState<Explanation[]>([]);

//   useEffect(() => {
//     const fetchData = async () => {
//       if (!courseId || !tenantId) {
//         toast.error("Missing required parameters");
//         navigate("/dashboard");
//         return;
//       }

//       try {
//         setIsLoading(true);
//         setIsLoadingExplanations(true);

//         // Fetch slides and explanations in parallel
//         const [slidesData, explanationsData] = await Promise.all([
//           courseService.fetchSlides(tenantId, courseId),
//           courseService.fetchExplanations(tenantId, courseId),
//         ]);

//         setSlides(slidesData);
//         setExplanations(explanationsData);
//       } catch (error) {
//         toast.error("Failed to load course content");
//       } finally {
//         setIsLoading(false);
//         setIsLoadingExplanations(false);
//       }
//     };

//     fetchData();
//   }, [courseId, tenantId, navigate]);

//   const handleComplete = async () => {
//     if (!courseId || !tenantId) {
//       toast.error("Missing required parameters");
//       return;
//     }

//     try {
//       await courseService.completeCourse(tenantId, courseId);
//       toast.success("Course completed successfully!");
//     } catch (error) {
//       toast.error("Failed to complete course");
//     }
//   };

//   if (!courseId || !tenantId) {
//     return (
//       <div className="container mx-auto px-4 py-8">
//         <div className="text-center">
//           <h1 className="text-2xl font-bold mb-4">Error</h1>
//           <p className="text-gray-600">
//             Missing required parameters. Please return to the dashboard.
//           </p>
//           <div className="mt-4 space-y-2">
//             <div>Course ID: {courseId || "Missing"}</div>
//             <div>Tenant ID: {tenantId || "Missing"}</div>
//           </div>
//           <Button className="mt-4" onClick={() => navigate("/dashboard")}>
//             Return to Dashboard
//           </Button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <CourseHeader
//         courseTitle={slides[0]?.title || "Loading..."}
//         onReturn={() => navigate("/dashboard")}
//       />

//       <div className="mt-8">
//         {isLoading ? (
//           <div className="flex justify-center items-center h-64">
//             <Loader2 className="h-8 w-8 animate-spin" />
//           </div>
//         ) : (
//           <SlidePlayer
//             slides={slides}
//             currentSlideIndex={currentSlideIndex}
//             onSlideChange={setCurrentSlideIndex}
//             onComplete={handleComplete}
//             explanations={explanations}
//             isLoadingExplanations={isLoadingExplanations}
//           />
//         )}
//       </div>
//     </div>
//   );
// };

// export default CoursePlayer;
