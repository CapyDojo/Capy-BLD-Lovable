
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface OwnershipPercentageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (percentage: number) => void;
}

export const OwnershipPercentageModal: React.FC<OwnershipPercentageModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const [customPercentage, setCustomPercentage] = useState<string>('');
  const [selectedPercentage, setSelectedPercentage] = useState<number>(100);

  const quickOptions = [25, 50, 75, 100];

  const handleQuickSelect = (percentage: number) => {
    setSelectedPercentage(percentage);
    setCustomPercentage('');
  };

  const handleCustomChange = (value: string) => {
    setCustomPercentage(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setSelectedPercentage(numValue);
    }
  };

  const handleConfirm = () => {
    const finalPercentage = customPercentage ? parseFloat(customPercentage) : selectedPercentage;
    if (finalPercentage >= 0 && finalPercentage <= 100) {
      onConfirm(finalPercentage);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Ownership Percentage</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium mb-3 block">Quick Select</Label>
            <div className="grid grid-cols-4 gap-2">
              {quickOptions.map((percentage) => (
                <Button
                  key={percentage}
                  variant={selectedPercentage === percentage && !customPercentage ? "default" : "outline"}
                  onClick={() => handleQuickSelect(percentage)}
                  className="h-12 text-lg font-semibold"
                >
                  {percentage}%
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="custom-percentage" className="text-sm font-medium mb-2 block">
              Custom Percentage
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="custom-percentage"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="Enter percentage"
                value={customPercentage}
                onChange={(e) => handleCustomChange(e.target.value)}
                className="flex-1"
              />
              <span className="text-gray-500 font-medium">%</span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              className="bg-green-600 hover:bg-green-700"
            >
              Create Connection ({customPercentage || selectedPercentage}%)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
