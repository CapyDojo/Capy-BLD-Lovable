import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Building2, Users, Shield, Briefcase, User, Edit, Trash2, FileText } from 'lucide-react';
import { unifiedEntityService } from '@/services/UnifiedEntityService';
import { Entity, EntityTypes } from '@/types/entity';
import { useToast } from "@/hooks/use-toast";

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

const initialFormData: EntityFormData = {
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
};

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

export default function EntityManager() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [formData, setFormData] = useState<EntityFormData>(initialFormData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEntities();
  }, []);

  const loadEntities = async () => {
    try {
      const allEntities = await unifiedEntityService.getAllEntities();
      setEntities(allEntities);
    } catch (error) {
      toast({
        title: "Error Loading Entities",
        description: "Failed to load entity data from the database.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof EntityFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingEntity(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const entityData = {
        name: formData.name,
        type: formData.type,
        jurisdiction: formData.jurisdiction || undefined,
        registrationNumber: formData.registrationNumber || undefined,
        incorporationDate: formData.incorporationDate ? new Date(formData.incorporationDate) : undefined,
        taxId: formData.taxId || undefined,
        address: formData.address || undefined,
        metadata: {
          industry: formData.industry || undefined,
          stage: formData.stage || undefined,
          description: formData.description || undefined,
          title: formData.title || undefined,
          role: formData.role || undefined
        }
      };

      if (editingEntity) {
        await unifiedEntityService.updateEntity(editingEntity.id, entityData);
        toast({
          title: "Entity Updated",
          description: `${formData.name} has been updated successfully.`
        });
      } else {
        await unifiedEntityService.createEntity(entityData);
        toast({
          title: "Entity Created",
          description: `${formData.name} has been created successfully.`
        });
      }

      resetForm();
      setIsDialogOpen(false);
      loadEntities();
    } catch (error) {
      toast({
        title: "Error",
        description: editingEntity ? "Failed to update entity." : "Failed to create entity.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (entity: Entity) => {
    setEditingEntity(entity);
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
    setIsDialogOpen(true);
  };

  const handleDelete = async (entity: Entity) => {
    if (!confirm(`Are you sure you want to delete ${entity.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await unifiedEntityService.deleteEntity(entity.id);
      toast({
        title: "Entity Deleted",
        description: `${entity.name} has been deleted successfully.`
      });
      loadEntities();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete entity. It may have existing relationships.",
        variant: "destructive"
      });
    }
  };

  const getEntityIcon = (type: EntityTypes) => {
    const option = entityTypeOptions.find(opt => opt.value === type);
    return option ? option.icon : Building2;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading entities...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entity Management</h1>
          <p className="text-gray-600">Manage corporate entities, individuals, and organizational structures</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Entity</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEntity ? 'Edit Entity' : 'Create New Entity'}</DialogTitle>
              <DialogDescription>
                {editingEntity ? 'Update the entity information below.' : 'Enter the details for the new entity.'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Entity Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
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
              </div>

              {formData.type !== 'Individual' && (
                <div className="grid grid-cols-2 gap-4">
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
                  
                  <div className="col-span-2">
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
                </div>
              )}

              {formData.type === 'Individual' && (
                <div className="grid grid-cols-2 gap-4">
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
                </div>
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
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingEntity ? 'Update Entity' : 'Create Entity'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entities ({entities.length})</CardTitle>
          <CardDescription>
            All registered entities in your organizational structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Jurisdiction</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entities.map((entity) => {
                const Icon = getEntityIcon(entity.type);
                return (
                  <TableRow key={entity.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-medium">{entity.name}</div>
                          {entity.metadata?.title && (
                            <div className="text-sm text-gray-500">{entity.metadata.title}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getEntityBadgeColor(entity.type)}>
                        {entity.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{entity.jurisdiction || '-'}</TableCell>
                    <TableCell>{entity.registrationNumber || '-'}</TableCell>
                    <TableCell>{entity.metadata?.industry || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(entity)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(entity)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {entities.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No entities found. Create your first entity to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}