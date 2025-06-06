import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import CourseDetailsModal from "./CourseDetailsModal";
import {
  Users,
  MessageCircle,
  Award,
  MoreVertical,
  Trash2,
  Pencil,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import GeneralChatbot from "../course/GeneralChatbot";
import { Menu } from "@headlessui/react";
import { toast } from "sonner";

interface CourseCardProps {
  id: string;
  courseId: string;
  title: string;
  description: string;
  duration: string;
  enrolledUsers: number;
  progress?: number;
  userRole: "superuser" | "admin" | "employee";
  actionButton?: React.ReactNode;
  tenantId: string;
  token: string;
  className?: string;
  properties?: {
    mandatory: boolean;
    skippable: boolean;
    retryType: "DIFFERENT" | "SAME";
    isEnabled?: boolean;
  } | null;
  learningObjectives?: string;
  onClick?: () => void;
  onTakeQuiz?: () => void;
  canRetakeQuiz?: boolean;
  canDownloadCertificate?: boolean;
  certificateUrl?: string;
  explanations?: Array<{
    id: string;
    content: string;
    slideId: string;
  }>;
  courseDetails?: {
    id: string;
    title: string;
    description: string;
    learningObjectives: string;
    properties: {
      mandatory: boolean;
      skippable: boolean;
      retryType: "DIFFERENT" | "SAME";
    };
  };
  onUpdateCourse?: () => void;
}

const CourseCard = ({
  id,
  courseId,
  title,
  description,
  duration,
  enrolledUsers = 0,
  progress = 0,
  userRole,
  actionButton,
  tenantId,
  token,
  className = "",
  properties = null,
  learningObjectives = "",
  onClick,
  onTakeQuiz,
  canRetakeQuiz = false,
  canDownloadCertificate = false,
  certificateUrl = "",
  explanations = [],
  courseDetails,
  onUpdateCourse,
}: CourseCardProps) => {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [showCardOverlay, setShowCardOverlay] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const navigate = useNavigate();
  const [isToggling, setIsToggling] = useState(false);
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showCourseActions, setShowCourseActions] = useState(false);

  const defaultProperties = {
    mandatory: true,
    skippable: false,
    retryType: "DIFFERENT" as const,
    isEnabled: true,
  };

  const courseProperties = properties || defaultProperties;
  const isMandatory = courseProperties.mandatory;

  const headerGradient = isMandatory
    ? "bg-[linear-gradient(93deg,_#A80000_-30%,_#1A294C_60%)]"
    : "bg-[linear-gradient(93deg,_#3D60B2_-70.32%,_#1A294C_39.28%)]";

  const titleColor = isMandatory ? "text-[#FFB4B4]" : "text-[#92AAFF]";

  const cardBorder = "border border-[#313F5A]/50";
  const cardShadow = "shadow-none";

  const progressIndicator = isMandatory
    ? "bg-[linear-gradient(93deg,_#A80000_-30%,_#1A294C_60%)]"
    : "bg-[#3D60B2]";

  const getButtonText = () => {
    if (progress === 100) return "Start Again";
    if (progress > 0) return "Resume Course";
    return "Start Course";
  };

  const buttonClass =
    progress === 100
      ? "bg-green-600 hover:bg-green-700 text-white"
      : progress > 0
      ? "bg-black text-white border border-white hover:bg-gray-900"
      : isMandatory
      ? "bg-[#1746FF] text-white hover:bg-[#1746FF]/90"
      : "border border-white text-white bg-transparent hover:bg-white/10";

  const handleChatbotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsChatbotOpen(true);
  };

  // Download certificate handler
  const handleCertificateDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!certificateUrl) return;
    const match = certificateUrl.match(/\/d\/([\w-]+)/);
    const fileId = match ? match[1] : null;
    if (!fileId) {
      console.error("Invalid Google Drive URL");
      return;
    }
    const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const a = document.createElement("a");
    a.href = directUrl;
    a.download = `certificate-${title.replace(/[^a-z0-9]/gi, "_")}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  useEffect(() => {
    if (typeof courseProperties.isEnabled === "boolean") {
      setIsEnabled(courseProperties.isEnabled);
    }
  }, [courseProperties.isEnabled]);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleToggleCourse = async () => {
    if (isToggling || isEnabled === null) return;
    setIsToggling(true);
    try {
      console.log("Toggle request params:", {
        tenantId,
        courseId,
        isEnabled: !isEnabled,
        token: token ? "present" : "missing",
      });

      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/tenant-admin/tenants/${tenantId}/courses/${courseId}/toggle`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isEnabled: !isEnabled }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("Toggle request failed:", {
          status: response.status,
          statusText: response.statusText,
          error,
        });
        throw new Error(error.error || "Failed to toggle course status");
      }

      const data = await response.json();
      console.log("Toggle request successful:", data);
      setIsEnabled(!isEnabled);
    } catch (e) {
      console.error("Error toggling course:", e);
      toast.error(
        e instanceof Error ? e.message : "Failed to toggle course status"
      );
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      <Card
        style={{ backgroundColor: "#000000" }}
        className={`overflow-hidden min-h-[220px] ${cardBorder} ${cardShadow} rounded-2xl ${className} transition-all duration-300 transform highlight-shadow-hover relative`}
        onClick={userRole !== "employee" ? onClick : undefined}
        onMouseDown={() => {
          if (userRole === "employee") setShowCardOverlay(true);
        }}
        onMouseUp={() => {
          if (userRole === "employee")
            setTimeout(() => setShowCardOverlay(false), 300);
        }}
        onMouseLeave={() => {
          if (userRole === "employee") setShowCardOverlay(false);
        }}
      >
        {/* Animation overlay for employee */}
        {userRole === "employee" && showCardOverlay && (
          <div className="absolute inset-0 z-20 pointer-events-none animate-pulse bg-white/10 rounded-2xl transition-all duration-300" />
        )}

        {/* Chatbot Icon for employee role */}
        {userRole === "employee" && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleChatbotClick}
                  className="absolute bottom-4 left-4 z-30 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-white" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ask away</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Admin/Superuser 3-dot menu - custom dropdown */}
        {(userRole === "admin" || userRole === "superuser") && (
          <div className="absolute top-4 right-4 z-30" ref={dropdownRef}>
            <button
              className="p-2 rounded-full hover:bg-white/10 focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen((open) => !open);
              }}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
            >
              <MoreVertical className="h-5 w-5 text-white" />
            </button>
            {dropdownOpen &&
              (userRole === "superuser" ? (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg mt-2 min-w-[120px] absolute right-0 overflow-hidden">
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen(false);
                      if (onUpdateCourse) onUpdateCourse();
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Update
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 transition flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen(false);
                      setShowCourseActions(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg mt-2 min-w-[120px] absolute right-0 overflow-hidden">
                  <button
                    disabled={isToggling}
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handleToggleCourse();
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {isEnabled ? "Deactivate" : "Activate"}
                  </button>
                </div>
              ))}
          </div>
        )}

        <div className={`px-6 pt-5 pb-3 ${headerGradient}`}>
          <CardTitle
            className={`${titleColor} text-xl font-semibold flex items-center gap-1`}
          >
            {courseDetails?.title || title}
            {isMandatory && <span className={`${titleColor} text-xl`}>*</span>}
          </CardTitle>
          <CardDescription className="text-[#A3B0C7] mt-0.5 text-sm">
            {courseDetails?.description || description}
          </CardDescription>
        </div>

        <CardContent className="pt-4 px-6 pb-0">
          {userRole === "employee" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white font-medium">Progress</span>
                <span className="text-sm font-bold text-white">
                  {progress}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={progress}
                  className="h-2 bg-[#232B41] flex-1 min-w-0"
                  style={{
                    width:
                      canDownloadCertificate && certificateUrl
                        ? "calc(100% - 32px)"
                        : "100%",
                  }}
                  indicatorClassName={`rounded-full ${
                    isMandatory ? "" : "bg-[#3D60B2]"
                  }`}
                  indicatorStyle={
                    isMandatory
                      ? {
                          background:
                            "linear-gradient(93deg, #A80000 -30%, #5779C9 60%)",
                        }
                      : undefined
                  }
                />
                {canDownloadCertificate && certificateUrl && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleCertificateDownload}
                          className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        >
                          <Award className="h-5 w-5 text-green-400" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        align="center"
                        className="max-w-xs text-xs px-2 py-1"
                      >
                        <p>
                          Download
                          <br />
                          certificate
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white font-medium">
                  Learning Objectives
                </span>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-[#A3B0C7]" />
                  <span className="text-sm text-[#A3B0C7]">
                    {enrolledUsers}
                  </span>
                </div>
              </div>
              <p className="text-sm text-[#A3B0C7] line-clamp-2">
                {courseDetails?.learningObjectives || learningObjectives}
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end px-6 pb-6 pt-4 bg-transparent border-none gap-2">
          {userRole === "employee" ? (
            <>
              {progress === 100 && onTakeQuiz && canRetakeQuiz && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTakeQuiz();
                  }}
                  className={`bg-green-600 hover:bg-green-700 text-white rounded-xl ${
                    userRole === "employee"
                      ? "px-4 py-1 text-xs"
                      : "px-6 py-2 text-sm"
                  } font-semibold`}
                >
                  Take Quiz
                </Button>
              )}
              <Link
                to={`/dashboard/course/${id}/play?tenantId=${tenantId}&token=${token}&progress=${progress}`}
              >
                <Button
                  className={`rounded-xl ${
                    userRole === "employee"
                      ? "px-4 py-1 text-xs"
                      : "px-6 py-2 text-sm"
                  } font-semibold ${buttonClass}`}
                >
                  {getButtonText()}
                </Button>
              </Link>
            </>
          ) : (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setIsDetailsModalOpen(true);
              }}
              className={`rounded-xl ${
                userRole === "employee"
                  ? "px-4 py-1 text-xs"
                  : "px-6 py-2 text-sm"
              } font-semibold border border-white text-white bg-transparent hover:bg-white/10`}
            >
              View Details
            </Button>
          )}
        </CardFooter>
      </Card>

      <CourseDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        course={{
          id: courseId,
          title: courseDetails?.title || title,
          description: courseDetails?.description || description,
          learningObjectives:
            courseDetails?.learningObjectives || learningObjectives,
          properties: courseProperties,
          enrolledUsers,
          ...courseDetails,
        }}
      />

      {/* Chatbot Overlay - minimal, no extra styling */}
      {isChatbotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            onClick={() => setIsChatbotOpen(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close chatbot"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <GeneralChatbot
            tenantId={tenantId}
            initialCourseId={id}
            hideCourseSelector={true}
            onClose={() => setIsChatbotOpen(false)}
          />
        </div>
      )}

      {/* Dialog for Delete Course (superuser) */}
      {userRole === "superuser" && (
        <Dialog open={showCourseActions} onOpenChange={setShowCourseActions}>
          <DialogContent className="max-w-xs">
            <div className="flex flex-col gap-2">
              <div className="text-lg font-semibold mb-2">Delete Course</div>
              <div className="text-muted-foreground mb-4">
                Are you sure you want to delete this course? This action cannot
                be undone.
              </div>
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-muted rounded"
                onClick={async () => {
                  try {
                    const courseDeleteId =
                      userRole === "superuser" ? id : courseId;
                    const res = await fetch(
                      `${
                        import.meta.env.VITE_BACKEND_URL
                      }/api/superadmin/course/${courseDeleteId}`,
                      {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                      }
                    );
                    if (!res.ok) throw new Error("Failed to delete course");
                    toast.success("Course deleted successfully");
                    setShowCourseActions(false);
                    // Optionally trigger a refresh in parent
                  } catch (err) {
                    toast.error("Failed to delete course");
                  }
                }}
              >
                Confirm Delete
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-muted rounded"
                onClick={() => setShowCourseActions(false)}
              >
                Cancel
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default CourseCard;
