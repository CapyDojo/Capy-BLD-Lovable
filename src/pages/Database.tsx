import React, { useState, useEffect } from 'react';
import { dataStore } from '@/services/dataStore';
import { Entity } from '@/types/entity';
import { EntityCapTable, ShareClass } from '@/types/capTable';
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
  const [capTables, setCapTables] = useState<EntityCapTable[]>([]);
  const [shareClasses, setShareClasses] = useState<ShareClass[]>([]);
  const [editingEntity, setEditingEntity] = useState<string | null>(null);
  const [editingCapTable, setEditingCapTable] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    const loadData = () => {
      setEntities(dataStore.getEntities());
      setCapTables(dataStore.getCapTables());
      setShareClasses(dataStore.getShareClasses());
    };

    // Load initial data
    loadData();

    // Subscribe to changes
    const unsubscribe = dataStore.subscribe(loadData);

    return unsubscribe;
  }, []);

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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

  const startEditingCapTable = (capTable: EntityCapTable) => {
    setEditingCapTable(capTable.entityId);
    setEditData({
      authorizedShares: capTable.authorizedShares,
      totalValuation: capTable.totalValuation || 0
    });
  };

  const cancelEditing = () => {
    setEditingEntity(null);
    setEditingCapTable(null);
    setEditData({});
  };

  const saveEntityChanges = (entityId: string) => {
    try {
      dataStore.updateEntity(entityId, {
        name: editData.name,
        type: editData.type,
        jurisdiction: editData.jurisdiction,
        registrationNumber: editData.registrationNumber
      });
      setEditingEntity(null);
      setEditData({});
    } catch (error) {
      console.error('Error updating entity:', error);
    }
  };

  const deleteEntity = (entityId: string, entityName: string) => {
    if (confirm(`Are you sure you want to delete ${entityName}? This will also remove all related cap table data.`)) {
      dataStore.deleteEntity(entityId);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold text-gray-900">Database Viewer</h1>
        <p className="text-gray-600 mt-1">
          Raw data from the definitive single source of truth - Click edit to modify entries
        </p>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <Tabs defaultValue="entities" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="entities">Entities ({entities.length})</TabsTrigger>
            <TabsTrigger value="captables">Cap Tables ({capTables.length})</TabsTrigger>
            <TabsTrigger value="shareclasses">Share Classes ({shareClasses.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="entities" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Entities Table</CardTitle>
                <CardDescription>All registered entities in the system - Click edit to modify</CardDescription>
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

          <TabsContent value="captables" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Cap Tables</CardTitle>
                <CardDescription>Capitalization tables for each entity with individual investments - Click edit to modify</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entity Name</TableHead>
                      <TableHead>Authorized Shares</TableHead>
                      <TableHead>Investments Count</TableHead>
                      <TableHead>Total Invested Shares</TableHead>
                      <TableHead>Available Shares</TableHead>
                      <TableHead>Total Valuation</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {capTables.map((capTable) => {
                      const entity = entities.find(e => e.id === capTable.entityId);
                      const totalInvestedShares = capTable.investments.reduce((sum, inv) => sum + inv.sharesOwned, 0);
                      const availableShares = capTable.authorizedShares - totalInvestedShares;
                      return (
                        <TableRow key={capTable.entityId}>
                          <TableCell className="font-medium">{entity?.name || 'Unknown'}</TableCell>
                          <TableCell>
                            {editingCapTable === capTable.entityId ? (
                              <Input
                                type="number"
                                value={editData.authorizedShares}
                                onChange={(e) => setEditData({...editData, authorizedShares: parseInt(e.target.value) || 0})}
                                className="w-32"
                              />
                            ) : (
                              capTable.authorizedShares.toLocaleString()
                            )}
                          </TableCell>
                          <TableCell>{capTable.investments.length}</TableCell>
                          <TableCell>{totalInvestedShares.toLocaleString()}</TableCell>
                          <TableCell>{availableShares.toLocaleString()}</TableCell>
                          <TableCell>
                            {editingCapTable === capTable.entityId ? (
                              <Input
                                type="number"
                                value={editData.totalValuation}
                                onChange={(e) => setEditData({...editData, totalValuation: parseInt(e.target.value) || 0})}
                                className="w-32"
                              />
                            ) : (
                              formatCurrency(capTable.totalValuation)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingCapTable === capTable.entityId ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    // Note: Would need to implement cap table update in dataStore
                                    console.log('Cap table update not yet implemented');
                                    cancelEditing();
                                  }}
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
                              <button
                                onClick={() => startEditingCapTable(capTable)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shareclasses" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Share Classes</CardTitle>
                <CardDescription>All share classes and their characteristics</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Voting Rights</TableHead>
                      <TableHead>Liquidation Preference</TableHead>
                      <TableHead>Dividend Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shareClasses.map((shareClass) => (
                      <TableRow key={shareClass.id}>
                        <TableCell className="font-mono text-xs">{shareClass.id}</TableCell>
                        <TableCell className="font-medium">{shareClass.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{shareClass.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={shareClass.votingRights ? 'default' : 'secondary'}>
                            {shareClass.votingRights ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>{shareClass.liquidationPreference || 'N/A'}</TableCell>
                        <TableCell>{shareClass.dividendRate ? `${shareClass.dividendRate}%` : 'N/A'}</TableCell>
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
            <CardDescription>Summary of all data in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{entities.length}</div>
                <div className="text-sm text-blue-600">Total Entities</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{capTables.length}</div>
                <div className="text-sm text-green-600">Cap Tables</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-700">{shareClasses.length}</div>
                <div className="text-sm text-orange-600">Share Classes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Database;
