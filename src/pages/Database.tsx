
import React, { useState, useEffect } from 'react';
import { dataStore } from '@/services/dataStore';
import { Entity } from '@/types/entity';
import { EntityCapTable, ShareClass } from '@/types/capTable';
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

const Database: React.FC = () => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [capTables, setCapTables] = useState<EntityCapTable[]>([]);
  const [shareClasses, setShareClasses] = useState<ShareClass[]>([]);

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

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold text-gray-900">Database Viewer</h1>
        <p className="text-gray-600 mt-1">
          Raw data from the definitive single source of truth
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
                <CardDescription>All registered entities in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Jurisdiction</TableHead>
                      <TableHead>Registration #</TableHead>
                      <TableHead>Incorporation Date</TableHead>
                      <TableHead>Canvas Position</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Version</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entities.map((entity) => (
                      <TableRow key={entity.id}>
                        <TableCell className="font-mono text-xs">{entity.id}</TableCell>
                        <TableCell className="font-medium">{entity.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{entity.type}</Badge>
                        </TableCell>
                        <TableCell>{entity.jurisdiction || 'N/A'}</TableCell>
                        <TableCell className="font-mono text-xs">{entity.registrationNumber || 'N/A'}</TableCell>
                        <TableCell>{formatDate(entity.incorporationDate)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {entity.position ? `(${entity.position.x}, ${entity.position.y})` : 'N/A'}
                        </TableCell>
                        <TableCell>{formatDate(entity.createdAt)}</TableCell>
                        <TableCell>{entity.version}</TableCell>
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
                <CardDescription>Capitalization tables for each entity with individual investments</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entity ID</TableHead>
                      <TableHead>Entity Name</TableHead>
                      <TableHead>Authorized Shares</TableHead>
                      <TableHead>Investments Count</TableHead>
                      <TableHead>Total Invested Shares</TableHead>
                      <TableHead>Available Shares</TableHead>
                      <TableHead>Total Valuation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {capTables.map((capTable) => {
                      const entity = entities.find(e => e.id === capTable.entityId);
                      const totalInvestedShares = capTable.investments.reduce((sum, inv) => sum + inv.sharesOwned, 0);
                      const availableShares = capTable.authorizedShares - totalInvestedShares;
                      return (
                        <TableRow key={capTable.entityId}>
                          <TableCell className="font-mono text-xs">{capTable.entityId}</TableCell>
                          <TableCell className="font-medium">{entity?.name || 'Unknown'}</TableCell>
                          <TableCell>{capTable.authorizedShares.toLocaleString()}</TableCell>
                          <TableCell>{capTable.investments.length}</TableCell>
                          <TableCell>{totalInvestedShares.toLocaleString()}</TableCell>
                          <TableCell>{availableShares.toLocaleString()}</TableCell>
                          <TableCell>{formatCurrency(capTable.totalValuation)}</TableCell>
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
