export interface Course {
  id: string;
  title: string;
  description: string;
  learningObjectives: string | string[];
  properties: {
    mandatory: boolean;
    skippable: boolean;
    retryType: "SAME" | "DIFFERENT";
  };
  tags?: string | string[];
  pocs?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    contact: string;
  }>;
}

export interface AddCourseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseCreated?: () => void;
  mode?: "add" | "update";
  course?: Course;
}
