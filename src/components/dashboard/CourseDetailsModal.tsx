import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface CourseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    title: string;
    description: string;
    learningObjectives: string;
    properties: {
      mandatory: boolean;
      skippable: boolean;
      retryType: "SAME" | "DIFFERENT";
    };
  };
}

const CourseDetailsModal = ({
  isOpen,
  onClose,
  course,
}: CourseDetailsModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {course.title}
            {course.properties.mandatory && (
              <span className="text-red-500 ml-2">*</span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-600 dark:text-gray-300">
              {course.description}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Learning Objectives</h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
                {course.learningObjectives}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Course Properties</h3>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={
                  course.properties.mandatory ? "destructive" : "secondary"
                }
              >
                {course.properties.mandatory ? "Mandatory" : "Optional"}
              </Badge>
              <Badge
                variant={course.properties.skippable ? "default" : "secondary"}
              >
                {course.properties.skippable ? "Skippable" : "Non-skippable"}
              </Badge>
              <Badge variant="outline">
                Retry: {course.properties.retryType}
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseDetailsModal;
