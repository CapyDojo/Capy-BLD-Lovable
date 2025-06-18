import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex items-center space-x-2 mb-8">
        <SettingsIcon className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Canvas Settings</CardTitle>
          <CardDescription>
            Configure your entity canvas behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Settings panel ready for revolutionary magnetic system configuration.
          </p>
          <Button variant="outline" disabled>
            Coming Soon
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}