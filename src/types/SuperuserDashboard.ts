export interface Course {
  id: string;
  title: string;
  description: string;
  duration: number;
  tags: string[];
  learningObjectives: string[];
  targetAudience: string[];
  materialUrl: string;
  createdAt: string;
  properties: {
    mandatory: boolean;
    skippable: boolean;
    retryType: "DIFFERENT" | "SAME";
    isEnabled?: boolean;
  };
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  adminEmail: string;
  details?: {
    presidingOfficerEmail?: string;
    poshCommitteeEmail?: string;
    hrContactName?: string;
    hrContactEmail?: string;
    hrContactPhone?: string;
    ceoName?: string;
    ceoEmail?: string;
    ceoContact?: string;
    ctoName?: string;
    ctoEmail?: string;
    ctoContact?: string;
    ccoEmail?: string;
    ccoContact?: string;
    croName?: string;
    croEmail?: string;
    croContact?: string;
    legalOfficerName?: string;
    legalOfficerEmail?: string;
    legalOfficerContact?: string;
  };
  users?: {
    id: string;
    name: string;
    email: string;
    role: string;
  }[];
  courses?: {
    id: string;
    title: string;
  }[];
}

export interface CourseEnrolledUsers {
  courseId: string;
  totalEnrolledUsers: number;
}

export interface RecentTenant {
  id: string;
  name: string;
  domain: string;
  userCount: number;
  enabledCourseCount: number;
}

export interface CreateOrganizationPayload {
  name: string;
  domain: string;
  adminEmail: string;
  adminPassword: string;
}

export interface CreateOrganizationResponse {
  success: boolean;
  message: string;
  tenant?: Tenant;
}
