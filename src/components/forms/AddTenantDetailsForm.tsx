import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Building, Mail, Phone, UserCircle, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

// Define the form schema with validations
const tenantDetailsSchema = z.object({
  hrContactName: z.string().optional(),
  hrContactEmail: z.string().email().optional(),
  hrContactPhone: z.string().optional(),
  ceoName: z.string().optional(),
  ceoEmail: z.string().email().optional(),
  ceoContact: z.string().optional(),
  ctoName: z.string().optional(),
  ctoEmail: z.string().email().optional(),
  ctoContact: z.string().optional(),
});

type TenantDetailsFormValues = z.infer<typeof tenantDetailsSchema>;

interface AddTenantDetailsFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId?: string;
}

const AddTenantDetailsForm: React.FC<AddTenantDetailsFormProps> = ({
  open,
  onOpenChange,
  tenantId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [existingDetails, setExistingDetails] =
    useState<TenantDetailsFormValues | null>(null);

  const form = useForm<TenantDetailsFormValues>({
    resolver: zodResolver(tenantDetailsSchema),
    defaultValues: {
      hrContactName: "",
      hrContactEmail: "",
      hrContactPhone: "",
      ceoName: "",
      ceoEmail: "",
      ceoContact: "",
      ctoName: "",
      ctoEmail: "",
      ctoContact: "",
    },
  });

  useEffect(() => {
    const fetchExistingDetails = async () => {
      if (!tenantId) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/tenants/${tenantId}/details`
        );
        if (response.ok) {
          const data = await response.json();
          setExistingDetails(data);
          form.reset(data);
        }
      } catch (error) {
        console.error("Error fetching tenant details:", error);
      }
    };

    fetchExistingDetails();
  }, [tenantId, form]);

  async function onSubmit(data: TenantDetailsFormValues) {
    setIsLoading(true);
    try {
      // Get tenant ID from localStorage
      const storedTenantId = localStorage.getItem("tenantId");
      if (!storedTenantId) {
        throw new Error("No tenant ID found. Please create a tenant first.");
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/tenants/${storedTenantId}/details`,
        {
          method: existingDetails ? "POST" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save tenant details");
      }

      toast.success("Tenant details saved successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving tenant details:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save tenant details. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Organization Settings
          </DialogTitle>
          <DialogDescription>
            Configure your organization's contact details and key personnel
            information.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 py-4"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">HR Contact</h3>
                  <div className="h-px bg-border" />
                </div>
                <FormField
                  control={form.control}
                  name="hrContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HR Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hrContactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HR Contact Email</FormLabel>
                      <FormControl>
                        <Input placeholder="hr@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hrContactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>HR Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Executive Team</h3>
                  <div className="h-px bg-border" />
                </div>
                <FormField
                  control={form.control}
                  name="ceoName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEO Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ceoEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEO Email</FormLabel>
                      <FormControl>
                        <Input placeholder="ceo@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ceoContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEO Contact</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ctoName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CTO Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Mike Johnson" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ctoEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CTO Email</FormLabel>
                      <FormControl>
                        <Input placeholder="cto@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ctoContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CTO Contact</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-complybrand-700 hover:bg-complybrand-800"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTenantDetailsForm;
