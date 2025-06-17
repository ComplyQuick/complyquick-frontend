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
  explanation_subtitle?: string;
}

export interface CourseHeaderProps {
  courseTitle: string;
  onReturn: () => void;
}

export interface SlideNavigationProps {
  totalSlides: number;
  currentSlide: number;
  onSlideSelect: (index: number) => void;
  slideExplanations: { content: string }[];
  progress: number;
  maxVisitedSlide: number;
  isAdminView?: boolean;
}

export interface SlidePlayerProps {
  slides: {
    id: string;
    title: string;
    content: string;
    completed: boolean;
  }[];
  setSlides: (
    slides: {
      id: string;
      title: string;
      content: string;
      completed: boolean;
    }[]
  ) => void;
  currentSlideIndex: number;
  onSlideChange: (index: number) => void;
  onComplete: () => void;
  explanations: {
    slide: number;
    content: string;
    explanation: string;
    explanation_audio: string;
  }[];
  isLoadingExplanations: boolean;
  properties: {
    skippable: boolean;
    mandatory: boolean;
    retryType: "SAME" | "DIFFERENT";
  };
  onSkipForward: () => void;
  onSkipBackward: () => void;
  resumeSlideIndex: number;
  isAdminView?: boolean;
}

export interface SlideControlsProps {
  isPlaying: boolean;
  togglePlayback: () => void;
  handlePrev: () => void;
  handleNext: () => void;
  isFirstSlide: boolean;
  isLastSlide: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  volume: number;
  handleVolumeChange: (value: number[]) => void;
  playbackRate: number;
  changePlaybackRate: (rate: number) => void;
  onComplete: () => void;
  showSubtitles: boolean;
  toggleSubtitles: () => void;
  canAdvance: boolean;
  progress: number;
  setProgress: (progress: number) => void;
  setCanAdvance: (canAdvance: boolean) => void;
  isAdminView?: boolean;
  onFullScreen?: () => void;
}

export interface CourseCardProps {
  id: string;
  courseId?: string;
  title: string;
  description: string;
  duration: string;
  enrolledUsers: number;
  progress?: number;
  userRole: "superuser" | "admin" | "employee";
  actionButton?: React.ReactNode;
  tenantId?: string;
  token?: string;
  className?: string;
  properties?: {
    mandatory: boolean;
    skippable: boolean;
    retryType: "DIFFERENT" | "SAME";
    isEnabled?: boolean;
  } | null;
  learningObjectives?: string | string[];
  tags?: string | string[];
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

export interface POC {
  id: string;
  name: string;
  email: string;
  role: string;
  contact: string;
}

export interface CourseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  courseId: string;
  course: {
    title: string;
    description: string;
    learningObjectives: string;
    properties: {
      mandatory: boolean;
      skippable: boolean;
      retryType: "SAME" | "DIFFERENT";
    };
    pocs?: POC[];
    tags?: string;
  };
  onUpdate?: () => void;
  hideProperties?: boolean;
}
