import React, { useState } from "react";
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
import { AddOrganizationFormProps } from "@/types/AddOrganizationForm";
import { superuserService } from "@/services/superuserService";

// Define the form schema with validations
const organizationFormSchema = z.object({
  name: z.string().min(2, { message: "Organization name is required" }),
  domain: z.string().min(2, { message: "Domain is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type OrganizationFormValues = z.infer<typeof organizationFormSchema>;

const AddOrganizationForm = ({
  open,
  onOpenChange,
  onOrganizationCreated,
}: AddOrganizationFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: "",
      domain: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: OrganizationFormValues) {
    setIsLoading(true);
    try {
      const response = await superuserService.createOrganization({
        name: data.name,
        domain: data.domain,
        adminEmail: data.email,
        adminPassword: data.password,
      });

      // Store tenant ID in localStorage for admin dashboard
      if (response.tenant?.id) {
        localStorage.setItem("tenantId", response.tenant.id);
      }

      toast.success("Organization added successfully!");
      form.reset();
      onOpenChange(false);

      // Call the callback if provided
      if (onOrganizationCreated) {
        onOrganizationCreated();
      }
    } catch (error) {
      console.error("Error adding organization:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to add organization. Please try again."
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
            Add New Organization
          </DialogTitle>
          <DialogDescription>
            Fill in the basic details to create a new organization on
            ComplyQuick.
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
                  <h3 className="text-lg font-semibold">
                    Organization Details
                  </h3>
                  <div className="h-px bg-border" />
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building className="h-4 w-4" /> Organization Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <AtSign className="h-4 w-4" /> Domain
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="acmecorp.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" /> Admin Email
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="admin@acmecorp.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
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
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-complybrand-700 hover:bg-complybrand-800 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Organization"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddOrganizationForm;
