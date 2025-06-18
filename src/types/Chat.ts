export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
}

export interface TenantDetails {
  details: {
    hrContactName: string;
    hrContactEmail: string;
    hrContactPhone: string;
    ceoName: string;
    ceoEmail: string;
    ceoContant: string;
    ctoName: string;
    ctoEmail: string;
    ctoContact: string;
    companyName?: string;
  };
}

export interface CourseMaterial {
  materialUrl: string;
}

export interface POC {
  role: string;
  name: string;
  contact: string;
}

export interface ChatHelpProps {
  slideTitle: string;
  slideContent: string;
  tenantId: string;
}

export interface GeneralChatbotProps {
  tenantId: string;
  initialCourseId?: string;
  hideCourseSelector?: boolean;
  onClose?: () => void;
}
