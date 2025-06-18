export interface Slide {
  id: string;
  title: string;
  content: string;
  completed: boolean;
}

export interface Explanation {
  slide: number;
  content: string;
  explanation: string;
  explanation_audio: string;
  explanation_subtitle: string;
}

export interface CoursePlayerProps {
  courseId: string;
  tenantId: string;
  token: string;
  progress: number;
  properties?: {
    mandatory: boolean;
    skippable: boolean;
    retryType: "DIFFERENT" | "SAME";
  } | null;
}
