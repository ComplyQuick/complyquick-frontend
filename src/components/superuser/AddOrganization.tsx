// import { useState } from 'react';
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
// import { toast } from "sonner";

// interface AddOrganizationProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
// }

// export const AddOrganization = ({ isOpen, onClose, onSuccess }: AddOrganizationProps) => {
//   const [formData, setFormData] = useState({
//     organizationName: "",
//     domain: "",
//     adminEmail: "",
//     adminPassword: "",
//     presidingOfficerEmail: "",
//     poshCommitteeEmail: "",
//     hrContactName: "",
//     hrContactEmail: "",
//     hrContactPhone: "",
//     ceoName: "",
//     ceoEmail: "",
//     ceoContact: "",
//     ctoName: "",
//     ctoEmail: "",
//     ctoContact: "",
//     ccoEmail: "",
//     ccoContact: "",
//     croName: "",
//     croEmail: "",
//     croContact: "",
//     legalOfficerName: "",
//     legalOfficerEmail: "",
//     legalOfficerContact: ""
//   });

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     try {
//       // First create the tenant
//       const tenantResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tenants`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           name: formData.organizationName,
//           domain: formData.domain
//         })
//       });

//       if (!tenantResponse.ok) {
//         throw new Error('Failed to create tenant');
//       }

//       const tenant = await tenantResponse.json();

//       // Then add tenant details
//       const detailsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tenants/${tenant.id}/details`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(formData)
//       });

//       if (!detailsResponse.ok) {
//         throw new Error('Failed to add tenant details');
//       }

//       toast.success('Organization added successfully');
//       onSuccess();
//       onClose();
//     } catch (error) {
//       console.error('Error adding organization:', error);
//       toast.error('Failed to add organization');
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle>Add New Organization</DialogTitle>
//           <DialogDescription>
//             Fill in the organization details below. All fields marked with * are required.
//           </DialogDescription>
//         </DialogHeader>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="grid grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="organizationName">Organization Name *</Label>
//               <Input
//                 id="organizationName"
//                 name="organizationName"
//                 value={formData.organizationName}
//                 onChange={handleChange}
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="domain">Domain *</Label>
//               <Input
//                 id="domain"
//                 name="domain"
//                 value={formData.domain}
//                 onChange={handleChange}
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="adminEmail">Admin Email *</Label>
//               <Input
//                 id="adminEmail"
//                 name="adminEmail"
//                 type="email"
//                 value={formData.adminEmail}
//                 onChange={handleChange}
//                 required
//               />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="adminPassword">Admin Password *</Label>
//               <Input
//                 id="adminPassword"
//                 name="adminPassword"
//                 type="password"
//                 value={formData.adminPassword}
//                 onChange={handleChange}
//                 required
//               />
//             </div>
//           </div>

//           <div className="space-y-4">
//             <h3 className="font-medium">Contact Information</h3>
//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="presidingOfficerEmail">Presiding Officer Email</Label>
//                 <Input
//                   id="presidingOfficerEmail"
//                   name="presidingOfficerEmail"
//                   type="email"
//                   value={formData.presidingOfficerEmail}
//                   onChange={handleChange}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="poshCommitteeEmail">POSH Committee Email</Label>
//                 <Input
//                   id="poshCommitteeEmail"
//                   name="poshCommitteeEmail"
//                   type="email"
//                   value={formData.poshCommitteeEmail}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="hrContactName">HR Contact Name</Label>
//                 <Input
//                   id="hrContactName"
//                   name="hrContactName"
//                   value={formData.hrContactName}
//                   onChange={handleChange}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="hrContactEmail">HR Contact Email</Label>
//                 <Input
//                   id="hrContactEmail"
//                   name="hrContactEmail"
//                   type="email"
//                   value={formData.hrContactEmail}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="hrContactPhone">HR Contact Phone</Label>
//               <Input
//                 id="hrContactPhone"
//                 name="hrContactPhone"
//                 value={formData.hrContactPhone}
//                 onChange={handleChange}
//               />
//             </div>
//           </div>

//           <div className="space-y-4">
//             <h3 className="font-medium">Executive Team</h3>
//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="ceoName">CEO Name</Label>
//                 <Input
//                   id="ceoName"
//                   name="ceoName"
//                   value={formData.ceoName}
//                   onChange={handleChange}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="ceoEmail">CEO Email</Label>
//                 <Input
//                   id="ceoEmail"
//                   name="ceoEmail"
//                   type="email"
//                   value={formData.ceoEmail}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="ceoContact">CEO Contact</Label>
//               <Input
//                 id="ceoContact"
//                 name="ceoContact"
//                 value={formData.ceoContact}
//                 onChange={handleChange}
//               />
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="ctoName">CTO Name</Label>
//                 <Input
//                   id="ctoName"
//                   name="ctoName"
//                   value={formData.ctoName}
//                   onChange={handleChange}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="ctoEmail">CTO Email</Label>
//                 <Input
//                   id="ctoEmail"
//                   name="ctoEmail"
//                   type="email"
//                   value={formData.ctoEmail}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="ctoContact">CTO Contact</Label>
//               <Input
//                 id="ctoContact"
//                 name="ctoContact"
//                 value={formData.ctoContact}
//                 onChange={handleChange}
//               />
//             </div>
//           </div>

//           <div className="space-y-4">
//             <h3 className="font-medium">Other Officers</h3>
//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="ccoEmail">CCO Email</Label>
//                 <Input
//                   id="ccoEmail"
//                   name="ccoEmail"
//                   type="email"
//                   value={formData.ccoEmail}
//                   onChange={handleChange}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="ccoContact">CCO Contact</Label>
//                 <Input
//                   id="ccoContact"
//                   name="ccoContact"
//                   value={formData.ccoContact}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="croName">CRO Name</Label>
//                 <Input
//                   id="croName"
//                   name="croName"
//                   value={formData.croName}
//                   onChange={handleChange}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="croEmail">CRO Email</Label>
//                 <Input
//                   id="croEmail"
//                   name="croEmail"
//                   type="email"
//                   value={formData.croEmail}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="croContact">CRO Contact</Label>
//               <Input
//                 id="croContact"
//                 name="croContact"
//                 value={formData.croContact}
//                 onChange={handleChange}
//               />
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="legalOfficerName">Legal Officer Name</Label>
//                 <Input
//                   id="legalOfficerName"
//                   name="legalOfficerName"
//                   value={formData.legalOfficerName}
//                   onChange={handleChange}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="legalOfficerEmail">Legal Officer Email</Label>
//                 <Input
//                   id="legalOfficerEmail"
//                   name="legalOfficerEmail"
//                   type="email"
//                   value={formData.legalOfficerEmail}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="legalOfficerContact">Legal Officer Contact</Label>
//               <Input
//                 id="legalOfficerContact"
//                 name="legalOfficerContact"
//                 value={formData.legalOfficerContact}
//                 onChange={handleChange}
//               />
//             </div>
//           </div>

//           <DialogFooter>
//             <Button type="button" variant="outline" onClick={onClose}>
//               Cancel
//             </Button>
//             <Button type="submit">
//               Add Organization
//             </Button>
//           </DialogFooter>
//         </form>
//       </DialogContent>
//     </Dialog>
//   );
// }; 