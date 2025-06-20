import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Save, Building2, User, Users, Shield, Briefcase } from 'lucide-react';
import { Entity, EntityTypes } from '@/types/entity';
import { unifiedEntityService } from '@/services/UnifiedEntityService';
import { useToast } from "@/hooks/use-toast";

interface EntityEditPanelProps {
  entity: Entity | null;
  isOpen: boolean;
  onClose: () => void;
  onEntityUpdated: (updatedEntity: Entity) => void;
}

interface EntityFormData {
  name: string;
  type: EntityTypes;
  jurisdiction: string;
  registrationNumber: string;
  incorporationDate: string;
  taxId: string;
  address: string;
  industry: string;
  stage: string;
  description: string;
  title: string; // For individuals
  role: string;   // For individuals
}

const entityTypeOptions = [
  { value: 'Corporation', label: 'Corporation', icon: Building2 },
  { value: 'LLC', label: 'Limited Liability Company', icon: Shield },
  { value: 'Partnership', label: 'Partnership', icon: Users },
  { value: 'Trust', label: 'Trust', icon: Briefcase },
  { value: 'Individual', label: 'Individual', icon: User }
];

const jurisdictionOptions = [
  'Delaware', 'California', 'New York', 'Nevada', 'Texas', 'Florida',
  'UK', 'Canada', 'Singapore', 'Cayman Islands', 'British Virgin Islands'
];

const industryOptions = [
  'Technology', 'SaaS', 'Fintech', 'Healthcare', 'E-commerce', 'Media',
  'Real Estate', 'Manufacturing', 'Consulting', 'Investment', 'Other'
];

const stageOptions = [
  'Seed', 'Series A', 'Series B', 'Series C', 'Growth', 'Public', 'Mature'
];

const EntityEditPanel: React.FC<EntityEditPanelProps> = ({ 
  entity, 
  isOpen, 
  onClose, 
  onEntityUpdated 
}) => {
  const [formData, setFormData] = useState<EntityFormData>({
    name: '',
    type: 'Corporation',
    jurisdiction: '',
    registrationNumber: '',
    incorporationDate: '',
    taxId: '',
    address: '',
    industry: '',
    stage: '',
    description: '',
    title: '',
    role: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (entity) {
      setFormData({
        name: entity.name,
        type: entity.type,
        jurisdiction: entity.jurisdiction || '',
        registrationNumber: entity.registrationNumber || '',
        incorporationDate: entity.incorporationDate ? entity.incorporationDate.toISOString().split('T')[0] : '',
        taxId: entity.taxId || '',
        address: entity.address || '',
        industry: entity.metadata?.industry || '',
        stage: entity.metadata?.stage || '',
        description: entity.metadata?.description || '',
        title: entity.metadata?.title || '',
        role: entity.metadata?.role || ''
      });
    }
  }, [entity]);

  const handleInputChange = (field: keyof EntityFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!entity) return;

    setIsLoading(true);
    try {
      const updateData = {
        name: formData.name,
        type: formData.type,
        jurisdiction: formData.jurisdiction || undefined,
        registrationNumber: formData.registrationNumber || undefined,
        incorporationDate: formData.incorporationDate ? new Date(formData.incorporationDate) : undefined,
        taxId: formData.taxId || undefined,
        address: formData.address || undefined,
        metadata: {
          ...entity.metadata,
          industry: formData.industry || undefined,
          stage: formData.stage || undefined,
          description: formData.description || undefined,
          title: formData.title || undefined,
          role: formData.role || undefined
        }
      };

      const updatedEntity = await unifiedEntityService.updateEntity(entity.id, updateData, 'canvas-edit');
      
      onEntityUpdated(updatedEntity);
      
      toast({
        title: "Entity Updated",
        description: `${formData.name} has been updated successfully.`
      });

      console.log(`📝 Canvas Edit: Updated entity ${updatedEntity.name} (${updatedEntity.id})`);
      
    } catch (error) {
      console.error('Failed to update entity:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update entity. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getEntityIcon = (type: EntityTypes) => {
    const option = entityTypeOptions.find(opt => opt.value === type);
    const Icon = option ? option.icon : Building2;
    return <Icon className="h-4 w-4" />;
  };

  const getEntityBadgeColor = (type: EntityTypes) => {
    switch (type) {
      case 'Corporation': return 'bg-blue-100 text-blue-800';
      case 'LLC': return 'bg-green-100 text-green-800';
      case 'Partnership': return 'bg-purple-100 text-purple-800';
      case 'Trust': return 'bg-orange-100 text-orange-800';
      case 'Individual': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen || !entity) {
    return null;
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-xl z-50 overflow-y-auto">
      <Card className="h-full rounded-none border-0">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getEntityIcon(entity.type)}
              <div>
                <CardTitle className="text-lg">Edit Entity</CardTitle>
                <CardDescription>
                  <Badge className={getEntityBadgeColor(entity.type)}>
                    {entity.type}
                  </Badge>
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div>
            <Label htmlFor="name">Entity Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., TechFlow Inc, Alex Chen"
            />
          </div>

          <div>
            <Label htmlFor="type">Entity Type *</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value as EntityTypes)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {entityTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="jurisdiction">Jurisdiction</Label>
            <Select value={formData.jurisdiction} onValueChange={(value) => handleInputChange('jurisdiction', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select jurisdiction" />
              </SelectTrigger>
              <SelectContent>
                {jurisdictionOptions.map(jurisdiction => (
                  <SelectItem key={jurisdiction} value={jurisdiction}>
                    {jurisdiction}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.type !== 'Individual' && (
            <>
              <div>
                <Label htmlFor="registrationNumber">Registration Number</Label>
                <Input
                  id="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                  placeholder="e.g., DE-7823456"
                />
              </div>

              <div>
                <Label htmlFor="incorporationDate">Incorporation Date</Label>
                <Input
                  id="incorporationDate"
                  type="date"
                  value={formData.incorporationDate}
                  onChange={(e) => handleInputChange('incorporationDate', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="taxId">Tax ID / EIN</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => handleInputChange('taxId', e.target.value)}
                  placeholder="e.g., 12-3456789"
                />
              </div>

              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industryOptions.map(industry => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="stage">Business Stage</Label>
                <Select value={formData.stage} onValueChange={(value) => handleInputChange('stage', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stageOptions.map(stage => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {formData.type === 'Individual' && (
            <>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., CEO, CTO, Chairman"
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  placeholder="e.g., Founder, Investor, Director"
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Business or registered address"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the entity or individual's role"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EntityEditPanel;