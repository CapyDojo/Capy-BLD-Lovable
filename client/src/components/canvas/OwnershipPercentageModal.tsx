import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface OwnershipPercentageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (percentage: number) => void;
  defaultPercentage: number;
  sourceEntityName: string;
  targetEntityName: string;
}

export const OwnershipPercentageModal: React.FC<OwnershipPercentageModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  defaultPercentage,
  sourceEntityName,
  targetEntityName
}) => {
  const [selectedPercentage, setSelectedPercentage] = useState(defaultPercentage);
  const [customPercentage, setCustomPercentage] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const presetPercentages = [25, 75, 100];

  const handleConfirm = () => {
    const finalPercentage = isCustom ? parseFloat(customPercentage) : selectedPercentage;
    if (finalPercentage > 0 && finalPercentage <= 100) {
      onConfirm(finalPercentage);
      onClose();
    }
  };

  const handlePresetClick = (percentage: number) => {
    setSelectedPercentage(percentage);
    setIsCustom(false);
  };

  const handleCustomInputChange = (value: string) => {
    setCustomPercentage(value);
    setIsCustom(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Ownership Percentage</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <strong>{sourceEntityName}</strong> owns <strong>{targetEntityName}</strong>
          </div>

          <div className="space-y-3">
            <Label>Select ownership percentage:</Label>
            
            {/* Default percentage */}
            <Button
              variant={!isCustom && selectedPercentage === defaultPercentage ? "default" : "outline"}
              className="w-full"
              onClick={() => handlePresetClick(defaultPercentage)}
            >
              {defaultPercentage}% (Default)
            </Button>

            {/* Preset percentages */}
            <div className="grid grid-cols-3 gap-2">
              {presetPercentages.map(percentage => (
                <Button
                  key={percentage}
                  variant={!isCustom && selectedPercentage === percentage ? "default" : "outline"}
                  onClick={() => handlePresetClick(percentage)}
                >
                  {percentage}%
                </Button>
              ))}
            </div>

            {/* Custom percentage */}
            <div className="space-y-2">
              <Label htmlFor="custom-percentage">Custom percentage:</Label>
              <Input
                id="custom-percentage"
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                placeholder="Enter custom percentage"
                value={customPercentage}
                onChange={(e) => handleCustomInputChange(e.target.value)}
                className={isCustom ? "border-blue-500" : ""}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Confirm {isCustom ? `${customPercentage}%` : `${selectedPercentage}%`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};