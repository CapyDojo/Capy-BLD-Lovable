
import React, { useState, useEffect } from 'react';
import { getUnifiedRepository } from '@/services/repositories/unified';
import { IUnifiedEntityRepository } from '@/services/repositories/unified/IUnifiedRepository';
import { Entity } from '@/types/entity';
import { UnifiedOwnership, CapTableView } from '@/types/unified';
import { Edit, Check, X } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

const Database: React.FC = () => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [ownerships, setOwnerships] = useState<UnifiedOwnership[]>([]);
  const [capTableViews, setCapTableViews] = useState<CapTableView[]>([]);
  const [editingEntity, setEditingEntity] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [repository, setRepository] = useState<IUnifiedEntityRepository | null>(null);

  useEffect(() => {
    const initRepository = async () => {
      try {
        console.log('🔄 Database: Initializing unified repository...');
        const repo = await getUnifiedRepository('ENTERPRISE');
        setRepository(repo);
        console.log('✅ Database: Unified repository initialized');
      } catch (error) {
        console.error('❌ Database: Failed to initialize repository:', error);
      }
    };

    initRepository();
  }, []);

  useEffect(() => {
    if (!repository) return;

    const loadData = async () => {
      try {
        console.log('🔄 Database: Loading data from unified repository...');
        const entitiesData = await repository.getAllEntities();
        setEntities(entitiesData);

        // Load ownerships for all entities
        const allOwnerships: UnifiedOwnership[] = [];
        for (const entity of entitiesData) {
          const entityOwnerships = await repository.getOwnershipsByEntity(entity.id);
          allOwnerships.push(...entityOwnerships);
        }
        setOwnerships(allOwnerships);

        // Load cap table views
        const capTables: CapTableView[] = [];
        for (const entity of entitiesData) {
          const capTable = await repository.getCapTableView(entity.id);
          if (capTable) {
            capTables.push(capTable);
          }
        }
        setCapTableViews(capTables);

        console.log('✅ Database: Data loaded from unified repository');
      } catch (error) {
        console.error('❌ Database: Error loading data:', error);
      }
    };

    // Load initial data
    loadData();

    // Subscribe to changes
    const unsubscribe = repository.subscribe((event) => {
      console.log('📡 Database: Received repository event:', event.type);
      loadData(); // Reload all data on any change
    });

    return unsubscribe;
  }, [repository]);

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const startEditingEntity = (entity: Entity) => {
    setEditingEntity(entity.id);
    setEditData({
      name: entity.name,
      type: entity.type,
      jurisdiction: entity.jurisdiction || '',
      registrationNumber: entity.registrationNumber || ''
    });
  };

  const cancelEditing = () => {
    setEditingEntity(null);
    setEditData({});
  };

  const saveEntityChanges = async (entityId: string) => {
    if (!repository) return;

    try {
      await repository.updateEntity(entityId, {
        name: editData.name,
        type: editData.type,
        jurisdiction: editData.jurisdiction,
        registrationNumber: editData.registrationNumber
      }, 'user', 'Updated via Database page');
      
      setEditingEntity(null);
      setEditData({});
      console.log('✅ Entity updated successfully');
    } catch (error) {
      console.error('❌ Error updating entity:', error);
    }
  };

  const deleteEntity = async (entityId: string, entityName: string) => {
    if (!repository) return;

    if (confirm(`Are you sure you want to delete ${entityName}? This will also remove all related data.`)) {
      try {
        await repository.deleteEntity(entityId, 'user', 'Deleted via Database page');
        console.log('✅ Entity deleted successfully');
      } catch (error) {
        console.error('❌ Error deleting entity:', error);
      }
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold text-gray-900">Database Viewer</h1>
        <p className="text-gray-600 mt-1">
          Unified repository data - Click edit to modify entries
        </p>
        <div className="mt-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            ✅ Using Enterprise Data Store
          </Badge>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <Tabs defaultValue="entities" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="entities">Entities ({entities.length})</TabsTrigger>
            <TabsTrigger value="ownerships">Ownership ({ownerships.length})</TabsTrigger>
            <TabsTrigger value="captables">Cap Tables ({capTableViews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="entities" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Entities Table</CardTitle>
                <CardDescription>All registered entities in the unified system - Click edit to modify</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Jurisdiction</TableHead>
                      <TableHead>Registration #</TableHead>
                      <TableHead>Incorporation Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entities.map((entity) => (
                      <TableRow key={entity.id}>
                        <TableCell className="font-medium">
                          {editingEntity === entity.id ? (
                            <Input
                              value={editData.name}
                              onChange={(e) => setEditData({...editData, name: e.target.value})}
                              className="w-full"
                            />
                          ) : (
                            entity.name
                          )}
                        </TableCell>
                        <TableCell>
                          {editingEntity === entity.id ? (
                            <select
                              value={editData.type}
                              onChange={(e) => setEditData({...editData, type: e.target.value})}
                              className="w-full px-3 py-1 border border-gray-300 rounded"
                            >
                              <option value="Corporation">Corporation</option>
                              <option value="LLC">LLC</option>
                              <option value="Partnership">Partnership</option>
                              <option value="Trust">Trust</option>
                              <option value="Individual">Individual</option>
                            </select>
                          ) : (
                            <Badge variant="outline">{entity.type}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingEntity === entity.id ? (
                            <Input
                              value={editData.jurisdiction}
                              onChange={(e) => setEditData({...editData, jurisdiction: e.target.value})}
                              className="w-full"
                            />
                          ) : (
                            entity.jurisdiction || 'N/A'
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {editingEntity === entity.id ? (
                            <Input
                              value={editData.registrationNumber}
                              onChange={(e) => setEditData({...editData, registrationNumber: e.target.value})}
                              className="w-full"
                            />
                          ) : (
                            entity.registrationNumber || 'N/A'
                          )}
                        </TableCell>
                        <TableCell>{formatDate(entity.incorporationDate)}</TableCell>
                        <TableCell>
                          {editingEntity === entity.id ? (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => saveEntityChanges(entity.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => startEditingEntity(entity)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteEntity(entity.id, entity.name)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ownerships" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Ownership Relationships</CardTitle>
                <CardDescription>Share-based ownership relationships between entities</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Owner</TableHead>
                      <TableHead>Owned Entity</TableHead>
                      <TableHead>Shares</TableHead>
                      <TableHead>Share Class</TableHead>
                      <TableHead>Effective Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ownerships.map((ownership) => {
                      const owner = entities.find(e => e.id === ownership.ownerEntityId);
                      const owned = entities.find(e => e.id === ownership.ownedEntityId);
                      return (
                        <TableRow key={ownership.id}>
                          <TableCell className="font-medium">{owner?.name || 'Unknown'}</TableCell>
                          <TableCell>{owned?.name || 'Unknown'}</TableCell>
                          <TableCell>{ownership.shares.toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-xs">{ownership.shareClassId}</TableCell>
                          <TableCell>{formatDate(ownership.effectiveDate)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="captables" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Cap Table Views</CardTitle>
                <CardDescription>Computed capitalization table views for each entity</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entity Name</TableHead>
                      <TableHead>Total Shares</TableHead>
                      <TableHead>Shareholders</TableHead>
                      <TableHead>Share Classes</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {capTableViews.map((capTable) => (
                      <TableRow key={capTable.entityId}>
                        <TableCell className="font-medium">{capTable.entityName}</TableCell>
                        <TableCell>{capTable.totalShares.toLocaleString()}</TableCell>
                        <TableCell>{capTable.ownershipSummary.length}</TableCell>
                        <TableCell>{capTable.shareClasses.length}</TableCell>
                        <TableCell>{formatDate(capTable.lastUpdated)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Database Statistics</CardTitle>
            <CardDescription>Summary of all data in the unified system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{entities.length}</div>
                <div className="text-sm text-blue-600">Total Entities</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{ownerships.length}</div>
                <div className="text-sm text-green-600">Ownership Relations</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-700">{capTableViews.length}</div>
                <div className="text-sm text-orange-600">Cap Tables</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Database;
