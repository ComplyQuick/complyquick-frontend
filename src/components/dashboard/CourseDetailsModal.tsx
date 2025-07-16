import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Pencil,
  Plus,
  Trash2,
  Settings,
  CheckCircle,
  X,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { POC, CourseDetailsModalProps } from "@/types/course";
import { courseService } from "@/services/courseService";

const CourseDetailsModal = ({
  isOpen,
  onClose,
  tenantId,
  courseId,
  course,
  onUpdate,
  hideProperties = false,
  userRole,
}: CourseDetailsModalProps) => {
  const [editMode, setEditMode] = React.useState(false);
  const [editProperties, setEditProperties] = React.useState(course.properties);
  const [editPocs, setEditPocs] = React.useState<POC[]>(
    (course.pocs || []).map((poc) => ({
      ...poc,
      role: poc.role || "",
      contact: poc.contact || "",
    }))
  );

  React.useEffect(() => {
    setEditProperties(course.properties);
    setEditPocs(
      (course.pocs || []).map((poc) => ({
        ...poc,
        role: poc.role || "",
        contact: poc.contact || "",
      }))
    );
  }, [course]);

  const handlePocChange = (idx: number, field: keyof POC, value: string) => {
    setEditPocs((prev) =>
      prev.map((poc, i) => (i === idx ? { ...poc, [field]: value } : poc))
    );
  };
  const handleAddPoc = () => {
    setEditPocs((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        name: "",
        email: "",
        role: "",
        contact: "",
      },
    ]);
  };
  const handleDeletePoc = (idx: number) => {
    setEditPocs((prev) => prev.filter((_, i) => i !== idx));
  };
  const handleCancel = () => {
    setEditMode(false);
    setEditProperties(course.properties);
    setEditPocs(
      (course.pocs || []).map((poc) => ({
        ...poc,
        role: poc.role || "",
        contact: poc.contact || "",
      }))
    );
  };

  const handleSave = async () => {
    try {
      if (!tenantId || !courseId) {
        toast.error("Missing tenantId or courseId");
        return;
      }

      const token = localStorage.getItem("token");
      const updated = await courseService.updateCourseProperties(
        {
          tenantId,
          courseId,
          skippable: editProperties.skippable,
          mandatory: editProperties.mandatory,
          retryType: editProperties.retryType,
          pocs: editPocs.map(({ id, ...rest }) => rest),
        },
        token || undefined
      );

      // Update modal state with new data
      setEditMode(false);
      setEditProperties({
        mandatory: updated.mandatory,
        skippable: updated.skippable,
        retryType: updated.retryType,
      });
      setEditPocs(updated.details || []);
      toast.success("Course properties updated!");
      // Call onUpdate to refresh parent component data
      if (onUpdate) {
        onUpdate();
      }
    } catch (e) {
      if (e instanceof Error) {
        toast.error(e.message);
      } else {
        toast.error("Failed to update course properties");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              {course.title}
            </DialogTitle>
            {userRole === "superuser" && course.materialUrl && (
              <button
                onClick={() => window.open(course.materialUrl, "_blank")}
                className="p-2 rounded-full hover:bg-muted transition-colors group"
                title="Open Course Material"
              >
                <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
              </button>
            )}
          </div>
        </DialogHeader>
        <div className="space-y-6">
          <div className="bg-muted/20 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground leading-relaxed">
              {course.description}
            </p>
          </div>

          <div className="bg-muted/20 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Learning Objectives</h3>
            <p className="text-muted-foreground leading-relaxed">
              {course.learningObjectives}
            </p>
          </div>

          {course.tags && (
            <div className="bg-muted/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-3">
                {course.tags.split(",").map((tag, index) => (
                  <span
                    key={index}
                    className="px-0 py-0 text-sm font-mono tracking-wide uppercase text-blue-700 dark:text-blue-300 border-b border-blue-200 dark:border-blue-700"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!hideProperties && (
            <>
              <div className="bg-muted/20 p-4 rounded-lg">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="h-5 w-5 text-complybrand-600" />
                    Course Properties
                  </h3>
                </div>
                {editMode ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <div className="flex items-center gap-3 bg-background/50 p-3 rounded-lg border border-border/50">
                      <Switch
                        checked={editProperties.mandatory}
                        onCheckedChange={(v) =>
                          setEditProperties((p) => ({ ...p, mandatory: v }))
                        }
                        className="data-[state=checked]:bg-red-600 data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-600"
                      />
                      <div>
                        <span className="font-medium">Mandatory</span>
                        <p className="text-xs text-muted-foreground">
                          Course must be completed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-background/50 p-3 rounded-lg border border-border/50">
                      <Switch
                        checked={editProperties.skippable}
                        onCheckedChange={(v) =>
                          setEditProperties((p) => ({ ...p, skippable: v }))
                        }
                        className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-600"
                      />
                      <div>
                        <span className="font-medium">Skippable</span>
                        <p className="text-xs text-muted-foreground">
                          Sections can be skipped
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-background/50 p-3 rounded-lg border border-border/50">
                      <Select
                        value={editProperties.retryType}
                        onValueChange={(v) =>
                          setEditProperties((p) => ({
                            ...p,
                            retryType: v as "SAME" | "DIFFERENT",
                          }))
                        }
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SAME">Same</SelectItem>
                          <SelectItem value="DIFFERENT">Different</SelectItem>
                        </SelectContent>
                      </Select>
                      <div>
                        <span className="font-medium">Retry Type</span>
                        <p className="text-xs text-muted-foreground">
                          Quiz retry behavior
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 bg-background/50 p-3 rounded-lg border border-border/50">
                      <div
                        className={`p-2 rounded-full ${
                          course.properties.mandatory
                            ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {course.properties.mandatory ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <X className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium">
                          {course.properties.mandatory
                            ? "Mandatory"
                            : "Optional"}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          Course must be completed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-background/50 p-3 rounded-lg border border-border/50">
                      <div
                        className={`p-2 rounded-full ${
                          course.properties.skippable
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {course.properties.skippable ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <X className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium">
                          {course.properties.skippable
                            ? "Skippable"
                            : "Non-skippable"}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          Sections can be skipped
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-background/50 p-3 rounded-lg border border-border/50">
                      <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                        <RefreshCw className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-medium">
                          Retry: {course.properties.retryType}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          Quiz retry behavior
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-muted/20 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Points of Contact</h3>
                  {editMode && (
                    <button
                      onClick={handleAddPoc}
                      className="hover:bg-muted p-1 rounded transition flex items-center gap-1 text-sm"
                    >
                      <Plus className="h-4 w-4" /> Add
                    </button>
                  )}
                </div>
                {editMode ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {editPocs.map((poc, idx) => (
                      <div
                        key={poc.id}
                        className="bg-background p-4 rounded-lg border border-border/50 relative"
                      >
                        <button
                          onClick={() => handleDeletePoc(idx)}
                          className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors duration-200 shadow-sm"
                          disabled={editPocs.length === 1}
                          aria-label="Remove POC"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <div className="space-y-2">
                          <Input
                            value={poc.name}
                            onChange={(e) =>
                              handlePocChange(idx, "name", e.target.value)
                            }
                            placeholder="Name"
                            className="mb-1"
                          />
                          <Input
                            value={poc.role}
                            onChange={(e) =>
                              handlePocChange(idx, "role", e.target.value)
                            }
                            placeholder="Role"
                            className="mb-1"
                          />
                          <Input
                            value={poc.email}
                            onChange={(e) =>
                              handlePocChange(idx, "email", e.target.value)
                            }
                            placeholder="Email (optional)"
                            className="mb-1"
                          />
                          <Input
                            value={poc.contact}
                            onChange={(e) =>
                              handlePocChange(idx, "contact", e.target.value)
                            }
                            placeholder="Contact (email or phone)"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : course.pocs && course.pocs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {course.pocs.map((poc) => {
                      // Helper to check if a string is an email
                      const isEmail = (val: string) => /@\w+\./.test(val);
                      // Helper to check if a string is a phone number (digits, optional +, min 7 digits)
                      const isPhone = (val: string) => /^\+?\d{7,}$/.test(val);
                      return (
                        <div
                          key={poc.id}
                          className="bg-background p-4 rounded-lg border border-border/50 hover:border-border transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="bg-primary/10 p-2 rounded-full">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div className="space-y-2 flex-1">
                              <div>
                                <p className="font-medium">{poc.name}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  {poc.role}
                                </p>
                              </div>
                              <div className="space-y-1">
                                {/* Only show email if it exists */}
                                {poc.email && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {poc.email}
                                  </p>
                                )}
                                {/* Show contact as email or phone */}
                                {poc.contact && isEmail(poc.contact) && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {poc.contact}
                                  </p>
                                )}
                                {poc.contact &&
                                  !isEmail(poc.contact) &&
                                  isPhone(poc.contact) && (
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {poc.contact}
                                    </p>
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      No points of contact assigned
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <DialogFooter className="mt-6">
          {!hideProperties && editMode ? (
            <>
              <Button variant="outline" onClick={handleCancel} className="mr-2">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-black font-semibold"
              >
                Save Changes
              </Button>
            </>
          ) : (
            !hideProperties && (
              <Button
                onClick={() => setEditMode(true)}
                className="bg-complybrand-600 hover:bg-complybrand-700 text-white"
              >
                Edit Properties
              </Button>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CourseDetailsModal;
