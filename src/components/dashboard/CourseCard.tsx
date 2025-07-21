import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import CourseDetailsModal from "./CourseDetailsModal";
import {
  Users,
  Award,
  MoreVertical,
  Trash2,
  Pencil,
  Check,
  Star,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import GeneralChatbot from "../course/GeneralChatbot";
import { toast } from "sonner";
import { CourseCardProps } from "@/types/course";
import { courseService } from "@/services/courseService";

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
  tags,
  onClick,
  onTakeQuiz,
  canRetakeQuiz = false,
  canDownloadCertificate = false,
  certificateUrl = "",
  explanations = [],
  courseDetails,
  onUpdateCourse,
  materialUrl,
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
  const [isHovered, setIsHovered] = useState(false);

  const defaultProperties = {
    mandatory: true,
    skippable: false,
    retryType: "DIFFERENT" as const,
    isEnabled: true,
  };

  const courseProperties = properties || defaultProperties;
  const isMandatory = courseProperties.mandatory;

  const circlePattern =
    'url(\'data:image/svg+xml;utf8,<svg width="100" height="100" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="20" height="20" fill="%23f87171"/><circle cx="10" cy="10" r="2" fill="%23fff" fill-opacity="0.08"/></svg>\')';
  const nonMandatoryPattern =
    'url(\'data:image/svg+xml;utf8,<svg width="100" height="100" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="20" height="20" fill="%233b82f6"/><circle cx="10" cy="10" r="2" fill="%23fff" fill-opacity="0.08"/></svg>\')';

  const pattern = isMandatory ? circlePattern : nonMandatoryPattern;
  const topBg = isMandatory
    ? "bg-rose-400 dark:bg-rose-600"
    : "bg-blue-400 dark:bg-blue-600";

  const handleCertificateDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!certificateUrl) return;
    const match = certificateUrl.match(/\/d\/([\w-]+)/);
    const fileId = match ? match[1] : null;
    if (!fileId) {
      toast.error("Invalid Google Drive URL");
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
      const data = await courseService.toggleCourse(
        tenantId,
        courseId,
        token,
        !isEnabled
      );
      setIsEnabled(!isEnabled);
    } catch (e) {
      toast.error("Failed to toggle course status");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      <Card
        className={`relative mx-auto rounded-2xl shadow-lg border-0 flex flex-col items-center bg-white dark:bg-neutral-900 overflow-hidden
          ${
            userRole === "employee" ? "h-[320px]" : "w-[320px] h-[340px]"
          } ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Star for mandatory course - only show for employees */}
        {isMandatory && userRole === "employee" && (
          <div className="absolute top-3 right-3 z-30">
            <Star
              className="h-6 w-6 text-yellow-400 drop-shadow"
              fill="#facc15"
            />
          </div>
        )}
        {/* Top colored section with pattern */}
        <div
          className={`w-full ${
            userRole === "employee" ? "h-[120px]" : "flex-[4]"
          } flex items-center justify-center ${topBg} relative`}
          style={{
            backgroundImage: pattern,
            backgroundSize: "cover",
            backgroundRepeat: "repeat",
            height: userRole === "employee" ? "150px" : "60%",
          }}
        >
          {/* Overlay large course title letters for context */}
          <span
            className="absolute inset-0 flex items-center justify-center select-none pointer-events-none overflow-hidden"
            aria-hidden="true"
          >
            <span
              className="font-extrabold text-[2.2rem] md:text-[3rem] lg:text-[3.5rem] tracking-tighter uppercase opacity-10 text-white dark:text-white"
              style={{
                whiteSpace: "nowrap",
                letterSpacing: "-.05em",
                left: 0,
                top: 0,
                position: "absolute",
                transform: "rotate(-8deg) translateY(10px)",
                width: "100%",
                textAlign: "center",
              }}
            >
              {(courseDetails?.title || title).slice(0, 8)}
            </span>
          </span>
        </div>

        {/* Bottom section (employee: previous layout, others: new layout) */}
        {userRole === "employee" ? (
          <div className="w-full flex-1 flex flex-col justify-between">
            {/* Title and Description */}
            <div className="w-full px-6 pt-4 pb-2 flex flex-col items-center text-center">
              <CardTitle
                className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1 truncate w-full"
                title={courseDetails?.title || title}
              >
                {courseDetails?.title || title}
              </CardTitle>
              {description && (
                <div
                  className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 w-full truncate"
                  title={description}
                >
                  {description}
                </div>
              )}
            </div>
            {/* Progress circle and action buttons aligned horizontally */}
            <div className="w-full px-6 pb-4 flex items-center justify-between">
              {/* Progress circle (left) - hidden when Take Quiz button is active */}
              {!(progress === 100 && onTakeQuiz && canRetakeQuiz) && (
                <div className="flex items-center">
                  {/* Show certificate if available, otherwise show progress circle */}
                  {canDownloadCertificate && certificateUrl ? (
                    <a
                      href={certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-700 text-sm font-medium flex items-center gap-1 no-underline"
                      style={{ textDecoration: "none" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Award className="h-4 w-4 text-green-600" />
                      Certificate
                    </a>
                  ) : (
                    /* Pie chart for progress with tooltip on hover */
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-pointer relative">
                            <svg
                              width="36"
                              height="36"
                              viewBox="0 0 36 36"
                              className="block"
                            >
                              <circle
                                cx="18"
                                cy="18"
                                r="16"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="4"
                              />
                              <circle
                                cx="18"
                                cy="18"
                                r="16"
                                fill="none"
                                stroke="#22c55e"
                                strokeWidth="4"
                                strokeDasharray={Math.PI * 2 * 16}
                                strokeDashoffset={
                                  Math.PI * 2 * 16 * (1 - (progress || 0) / 100)
                                }
                                strokeLinecap="round"
                                style={{ transition: "stroke-dashoffset 0.5s" }}
                              />
                            </svg>
                            {progress === 100 && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Check className="h-4 w-4 text-green-500" />
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span className="font-semibold text-green-500">
                            {progress}%
                          </span>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              )}

              {/* Action buttons (right) */}
              <div className="flex gap-3">
                {/* Horizontal alignment for Take Quiz and Start Again when both are shown */}
                {progress === 100 && onTakeQuiz && canRetakeQuiz ? (
                  <>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTakeQuiz();
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-1 text-xs font-semibold transition-colors duration-300"
                    >
                      Take Quiz
                    </Button>
                    <Button
                      className="rounded-xl px-4 py-1 text-xs font-semibold transition-colors duration-300 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onClick) {
                          onClick();
                        }
                      }}
                    >
                      Start Again
                    </Button>
                  </>
                ) : (
                  <Button
                    className="rounded-xl px-4 py-1 text-xs font-semibold transition-colors duration-300 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onClick) {
                        onClick();
                      }
                    }}
                  >
                    {progress === 100
                      ? "Start Again"
                      : progress > 0
                      ? "Resume Course"
                      : "Start Course"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex-[4] flex flex-col justify-between h-[40%]">
            {/* Title and Description */}
            <div className="w-full px-6 pt-4 pb-2 flex flex-col items-center text-center">
              <CardTitle
                className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1 truncate w-full"
                title={courseDetails?.title || title}
              >
                {courseDetails?.title || title}
              </CardTitle>
              {description && (
                <div
                  className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 w-full truncate"
                  title={description}
                >
                  {description}
                </div>
              )}
            </div>
            {/* Enrolled users, tags, buttons */}
            <div className="w-full px-6 pb-4 flex flex-col gap-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-300 text-sm">
                  {userRole === "superuser" && (
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{enrolledUsers}</span>
                    </span>
                  )}
                </div>
                {/* Tags removed from here as per new requirement */}
              </div>
              <div className="flex gap-2">
                {userRole !== "superuser" && (
                  <Button
                    className="flex-1 rounded-lg  bg-red-600 text-white font-semibold py-2 hover:bg-blue-600 dark:hover:bg-blue-700 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onClick) {
                        onClick();
                      } else {
                        navigate(
                          `/admin/course/${courseId}/play?tenantId=${tenantId}&token=${token}`
                        );
                      }
                    }}
                  >
                    Play
                  </Button>
                )}
                <Button
                  className="flex-1 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-semibold py-2 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDetailsModalOpen(true);
                  }}
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Three-dot menu for admin/superuser */}
        {(userRole === "admin" || userRole === "superuser") && (
          <div className="absolute top-3 right-3 z-20" ref={dropdownRef}>
            <button
              className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen((open) => !open);
              }}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
            >
              <MoreVertical className="h-5 w-5 text-neutral-500 dark:text-neutral-300" />
            </button>
            {dropdownOpen &&
              (userRole === "superuser" ? (
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg mt-2 min-w-[140px] absolute right-0 overflow-hidden">
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
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
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg mt-2 min-w-[140px] absolute right-0 overflow-hidden">
                  <button
                    disabled={isToggling}
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handleToggleCourse();
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    {isEnabled ? "Deactivate" : "Activate"}
                  </button>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Details Modal */}
      <CourseDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        tenantId={tenantId}
        courseId={courseId}
        course={{
          id: courseId,
          title: courseDetails?.title || title,
          description: courseDetails?.description || description,
          learningObjectives:
            courseDetails?.learningObjectives || learningObjectives,
          properties: courseProperties,
          tags: Array.isArray(tags) ? tags.join(", ") : tags || "",
          materialUrl: materialUrl,
          ...courseDetails,
        }}
        onUpdate={() => {
          if (onUpdateCourse) {
            onUpdateCourse();
          }
        }}
        hideProperties={userRole === "superuser"}
        userRole={userRole}
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
                    await courseService.deleteCourse(courseDeleteId);
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
