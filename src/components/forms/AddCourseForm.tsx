import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Define the form schema with validations
const courseFormSchema = z.object({
  title: z.string().min(2, { message: "Title is required" }),
  description: z.string().min(10, { message: "Description is required" }),
  tags: z.string().min(1, { message: "Tags are required" }),
  learningObjectives: z
    .string()
    .min(1, { message: "Learning objectives are required" }),
  courseMaterial: z.any().refine((file) => file instanceof File, {
    message: "Course material is required",
  }),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

interface AddCourseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseCreated?: () => void;
  mode?: "add" | "update";
  course?: any;
}

const AddCourseForm: React.FC<AddCourseFormProps> = ({
  open,
  onOpenChange,
  onCourseCreated,
  mode = "add",
  course,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // If update mode, prefill fields
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(
      mode === "update"
        ? courseFormSchema.extend({
            courseMaterial: z.any().optional(),
          })
        : courseFormSchema
    ),
    defaultValues:
      mode === "update" && course
        ? {
            title: course.title || "",
            description: course.description || "",
            tags: Array.isArray(course.tags)
              ? course.tags.join(", ")
              : course.tags || "",
            learningObjectives: Array.isArray(course.learningObjectives)
              ? course.learningObjectives.join(", ")
              : course.learningObjectives || "",
            courseMaterial: null,
          }
        : {
            title: "",
            description: "",
            tags: "",
            learningObjectives: "",
            courseMaterial: null,
          },
  });

  useEffect(() => {
    if (mode === "update" && course) {
      form.reset({
        title: course.title || "",
        description: course.description || "",
        tags: Array.isArray(course.tags)
          ? course.tags.join(", ")
          : course.tags || "",
        learningObjectives: Array.isArray(course.learningObjectives)
          ? course.learningObjectives.join(", ")
          : course.learningObjectives || "",
        courseMaterial: null,
      });
    } else if (mode === "add") {
      form.reset({
        title: "",
        description: "",
        tags: "",
        learningObjectives: "",
        courseMaterial: null,
      });
    }
  }, [mode, course, form]);

  async function onSubmit(data: CourseFormValues) {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("tags", data.tags);
      formData.append("learningObjectives", data.learningObjectives);
      if (data.courseMaterial) {
        formData.append("courseMaterial", data.courseMaterial);
      }

      let response;
      if (mode === "update" && course) {
        response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/superadmin/course/${
            course.id
          }`,
          {
            method: "PATCH",
            body: formData,
          }
        );
      } else {
        response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/courses`,
          {
            method: "POST",
            body: formData,
          }
        );
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to ${mode === "update" ? "update" : "create"} course`
        );
      }

      toast.success(
        mode === "update"
          ? "Course updated successfully!"
          : "Course created successfully!"
      );
      onOpenChange(false);
      form.reset();
      onCourseCreated?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${
              mode === "update" ? "update" : "create"
            } course. Please try again.`
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
            {mode === "update" ? "Edit Course" : "Add New Course"}
          </DialogTitle>
          <DialogDescription>
            {mode === "update"
              ? "Edit the course details and upload new material if needed."
              : "Fill in the course details and upload the course material."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 py-4"
          >
            <div className="grid gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter course title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter course description"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (comma-separated)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., compliance, training, legal"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="learningObjectives"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Learning Objectives (comma-separated)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter learning objectives, one per line"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="courseMaterial"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Course Material (PPTX)</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".pdf,.pptx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                          }
                        }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                className="bg-complybrand-700 hover:bg-complybrand-800 text-white"
                disabled={isLoading}
              >
                {isLoading
                  ? mode === "update"
                    ? "Updating..."
                    : "Creating..."
                  : mode === "update"
                  ? "Update Course"
                  : "Create Course"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCourseForm;
