import { UserRole } from "@/App";

export interface NavbarProps {
  userRole?: UserRole;
  onLogin?: (role: UserRole) => void;
  showBackButton?: boolean;
  onBackClick?: () => void;
}
