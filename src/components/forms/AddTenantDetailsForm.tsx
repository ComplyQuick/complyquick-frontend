import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Building,
  Mail,
  Phone,
  UserCircle,
  AtSign,
  Pencil,
} from "lucide-react";
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
import { AddTenantDetailsFormProps } from "@/types/AddTenantDetailsForm";
import { adminService } from "@/services/adminService";

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

const AddTenantDetailsForm = ({
  open,
  onOpenChange,
  tenantId,
}: AddTenantDetailsFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [existingDetails, setExistingDetails] =
    useState<TenantDetailsFormValues | null>(null);
  const [editMode, setEditMode] = useState(false);

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
        const response = await adminService.fetchTenantDetails(tenantId);
        console.log("Fetched tenant details:", response);
        if (response) {
          setExistingDetails(response.details);
          form.reset(response.details);
        }
      } catch (error) {
        console.error("Error fetching tenant details:", error);
      }
    };
    if (open) {
      fetchExistingDetails();
      setEditMode(false); // Always start in view mode
    }
  }, [tenantId, form, open]);

  // Helper to check if any field in existingDetails is non-empty
  const hasAnyDetails =
    existingDetails &&
    Object.values(existingDetails).some(
      (val) => val && String(val).trim() !== ""
    );

  async function onSubmit(data: TenantDetailsFormValues) {
    setIsLoading(true);
    try {
      const storedTenantId = localStorage.getItem("tenantId");
      if (!storedTenantId) {
        throw new Error("No tenant ID found. Please create a tenant first.");
      }
      await adminService.updateTenantDetails(storedTenantId, data);
      toast.success("Tenant details saved successfully!");
      setEditMode(false);
      // Refresh details
      const response = await adminService.fetchTenantDetails(storedTenantId);
      if (response) {
        setExistingDetails(response.details);
        form.reset(response.details);
      }
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
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            Organization Settings
            {!editMode && (
              <button
                className="ml-2 p-1 rounded hover:bg-muted"
                onClick={() => setEditMode(true)}
                aria-label="Edit details"
                type="button"
              >
                <Pencil className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </DialogTitle>
          <DialogDescription>
            {editMode
              ? "Edit your organization's contact details and key personnel information."
              : "View your organization's contact details and key personnel information."}
          </DialogDescription>
        </DialogHeader>

        {!editMode ? (
          hasAnyDetails ? (
            <div className="space-y-8 py-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">HR Contact</h3>
                  <div className="h-px bg-border mb-2" />
                  <div>
                    <span className="font-medium">Name:</span>{" "}
                    {existingDetails.hrContactName || "-"}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span>{" "}
                    {existingDetails.hrContactEmail || "-"}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span>{" "}
                    {existingDetails.hrContactPhone || "-"}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Executive Team</h3>
                  <div className="h-px bg-border mb-2" />
                  <div>
                    <span className="font-medium">CEO Name:</span>{" "}
                    {existingDetails.ceoName || "-"}
                  </div>
                  <div>
                    <span className="font-medium">CEO Email:</span>{" "}
                    {existingDetails.ceoEmail || "-"}
                  </div>
                  <div>
                    <span className="font-medium">CEO Contact:</span>{" "}
                    {existingDetails.ceoContact || "-"}
                  </div>
                  <div>
                    <span className="font-medium">CTO Name:</span>{" "}
                    {existingDetails.ctoName || "-"}
                  </div>
                  <div>
                    <span className="font-medium">CTO Email:</span>{" "}
                    {existingDetails.ctoEmail || "-"}
                  </div>
                  <div>
                    <span className="font-medium">CTO Contact:</span>{" "}
                    {existingDetails.ctoContact || "-"}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No details found.
            </div>
          )
        ) : (
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
                  onClick={() => setEditMode(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddTenantDetailsForm;
