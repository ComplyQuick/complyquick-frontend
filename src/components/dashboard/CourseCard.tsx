import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { useState } from "react";
import CourseDetailsModal from "./CourseDetailsModal";
import { Users } from "lucide-react";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  duration: string;
  enrolledCount?: number;
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
  } | null;
  learningObjectives?: string;
  onClick?: () => void;
  onTakeQuiz?: () => void;
  canRetakeQuiz?: boolean;
}

const CourseCard = ({
  id,
  title,
  description,
  duration,
  enrolledCount = 0,
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
}: CourseCardProps) => {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [showCardOverlay, setShowCardOverlay] = useState(false);

  const defaultProperties = {
    mandatory: true,
    skippable: false,
    retryType: "DIFFERENT" as const,
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
        <div className={`px-6 pt-5 pb-3 ${headerGradient}`}>
          <CardTitle
            className={`${titleColor} text-xl font-semibold flex items-center gap-1`}
          >
            {title}
            {isMandatory && <span className={`${titleColor} text-xl`}>*</span>}
          </CardTitle>
          <CardDescription className="text-[#A3B0C7] mt-0.5 text-sm">
            {description}
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
              <Progress
                value={progress}
                className="h-2 bg-[#232B41]"
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
                    {enrolledCount}
                  </span>
                </div>
              </div>
              <p className="text-sm text-[#A3B0C7] line-clamp-2">
                {learningObjectives}
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
          id,
          title,
          description,
          learningObjectives: learningObjectives ? [learningObjectives] : [],
          properties: courseProperties,
        }}
      />
    </>
  );
};

export default CourseCard;
