export interface AddOrganizationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrganizationCreated?: () => void;
}
