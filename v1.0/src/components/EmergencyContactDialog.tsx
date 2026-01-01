import { Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface EmergencyContactDialogProps {
  studentName: string;
  emergencyContact: {
    name?: string;
    relationship?: string;
    phone?: string;
    email?: string;
  };
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function EmergencyContactDialog({
  studentName,
  emergencyContact,
  variant = "outline",
  size = "sm",
}: EmergencyContactDialogProps) {
  const hasEmergencyContact = emergencyContact.name && emergencyContact.phone;

  if (!hasEmergencyContact) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Phone className="h-4 w-4 mr-2" />
          Emergency Contact
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Emergency Contact</DialogTitle>
          <DialogDescription>
            Emergency contact information for {studentName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Contact Name</p>
              <p className="text-base font-semibold">{emergencyContact.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Relationship</p>
              <p className="text-base font-semibold">{emergencyContact.relationship || 'N/A'}</p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <a 
                    href={`tel:${emergencyContact.phone}`}
                    className="text-lg font-semibold text-primary hover:underline"
                  >
                    {emergencyContact.phone}
                  </a>
                </div>
              </div>
              
              {emergencyContact.email && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a 
                      href={`mailto:${emergencyContact.email}`}
                      className="text-base font-semibold text-primary hover:underline"
                    >
                      {emergencyContact.email}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
