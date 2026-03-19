import { useState } from 'react';
import { Client } from '@/types/invoice';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (client: Client) => void;
}

export function CreateClientDialog({ open, onOpenChange, onSubmit }: CreateClientDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const company = formData.company.trim();
    const phone = formData.phone.trim();
    const address = formData.address.trim();

    if (!name || !email || !company) {
      toast({
        title: "Invalid input",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    if (phone && !/^[0-9+\-()\s]{7,20}$/.test(phone)) {
      toast({
        title: "Invalid input",
        description: "Phone number format is invalid.",
        variant: "destructive"
      });
      return;
    }

    const newClient: Client = {
      id: Date.now().toString(),
      name,
      email,
      company,
      phone,
      address,
      totalBilled: 0,
      pendingAmount: 0,
      invoiceCount: 0,
      createdAt: new Date(),
    };

    onSubmit(newClient);
    onOpenChange(false);
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
    });
    
    toast({
      title: "Client Added",
      description: `${company} has been added successfully.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add Audit Client</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Contact Name *</Label>
            <Input
              placeholder="Asha Nair"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Company Name *</Label>
            <Input
              placeholder="Acme Manufacturing Pvt Ltd"
              value={formData.company}
              onChange={(e) => handleChange('company', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              placeholder="audit@acme.in"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea
              placeholder="Chennai, Tamil Nadu, India"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Add Client
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
