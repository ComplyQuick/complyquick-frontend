import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Book, Users, Clock } from "lucide-react";
import { Link } from "react-router-dom";

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
}

const CourseCard = ({ 
  id, 
  title, 
  description, 
  duration, 
  enrolledCount, 
  progress = 0,
  userRole,
  actionButton,
  tenantId,
  token,
  className = ""
}: CourseCardProps) => {
  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${className}`}>
      <CardHeader className="bg-complybrand-50 border-b border-gray-100">
        <CardTitle className="text-complybrand-800">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{duration}</span>
          </div>
          
          {userRole !== "employee" && enrolledCount !== undefined && (
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{enrolledCount} enrolled</span>
            </div>
          )}
        </div>
        
        {userRole === "employee" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-gray-50 border-t border-gray-100 flex justify-between">
        <Link to={`/dashboard/course/${id}`}>
          <Button variant="outline" className="text-complybrand-700 border-complybrand-700">
            {userRole === "employee" ? "Continue" : "View Details"}
          </Button>
        </Link>
        
        {userRole === "employee" && (
          <Link to={`/dashboard/course/${id}/play?tenantId=${tenantId}&token=${token}&progress=${progress}`}>
            <Button className="bg-complybrand-700 hover:bg-complybrand-800">
              <Book className="mr-2 h-4 w-4" />
              {progress > 0 ? "Resume Course" : "Start Course"}
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
