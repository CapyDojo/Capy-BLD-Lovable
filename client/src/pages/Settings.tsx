import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Zap, Shield, Palette } from 'lucide-react';

interface PhysicsSettings {
  bounceEnabled: boolean;
  bounceStrength: number;
  preventOverlap: boolean;
  minDistance: number;
}

interface MagneticSettings {
  detectionRadius: number;
  strongPullRadius: number;
  snapRadius: number;
  previewMode: boolean;
}

export default function Settings() {
  const [physicsSettings, setPhysicsSettings] = useState<PhysicsSettings>({
    bounceEnabled: true,
    bounceStrength: 0.3,
    preventOverlap: true,
    minDistance: 220,
  });

  const [magneticSettings, setMagneticSettings] = useState<MagneticSettings>({
    detectionRadius: 90,
    strongPullRadius: 60,
    snapRadius: 30,
    previewMode: true,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedPhysics = localStorage.getItem('physicsSettings');
    const savedMagnetic = localStorage.getItem('magneticSettings');

    if (savedPhysics) {
      setPhysicsSettings(JSON.parse(savedPhysics));
    }

    if (savedMagnetic) {
      setMagneticSettings(JSON.parse(savedMagnetic));
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem('physicsSettings', JSON.stringify(physicsSettings));
    localStorage.setItem('magneticSettings', JSON.stringify(magneticSettings));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('settingsUpdated', {
      detail: { physicsSettings, magneticSettings }
    }));

    // Show success feedback
    console.log('⚙️ Settings saved successfully');
  };

  // Reset to defaults
  const resetToDefaults = () => {
    const defaultPhysics = {
      bounceEnabled: true,
      bounceStrength: 0.3,
      preventOverlap: true,
      minDistance: 220,
    };

    const defaultMagnetic = {
      detectionRadius: 90,
      strongPullRadius: 60,
      snapRadius: 30,
      previewMode: true,
    };

    setPhysicsSettings(defaultPhysics);
    setMagneticSettings(defaultMagnetic);
    
    localStorage.removeItem('physicsSettings');
    localStorage.removeItem('magneticSettings');
    
    window.dispatchEvent(new CustomEvent('settingsUpdated', {
      detail: { physicsSettings: defaultPhysics, magneticSettings: defaultMagnetic }
    }));
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Canvas Settings</h1>
          <p className="text-gray-600">Configure the revolutionary magnetic interaction system</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Physics Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              <CardTitle>Collision Physics</CardTitle>
            </div>
            <CardDescription>
              Control how entities interact when they collide
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="bounce-enabled">Bump & Bounce</Label>
                <p className="text-sm text-gray-600">
                  Enable physics-based bouncing when entities collide
                </p>
              </div>
              <Switch
                id="bounce-enabled"
                checked={physicsSettings.bounceEnabled}
                onCheckedChange={(checked) =>
                  setPhysicsSettings(prev => ({ ...prev, bounceEnabled: checked }))
                }
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Bounce Strength: {(physicsSettings.bounceStrength * 100).toFixed(0)}%</Label>
              <Slider
                value={[physicsSettings.bounceStrength]}
                onValueChange={([value]) =>
                  setPhysicsSettings(prev => ({ ...prev, bounceStrength: value }))
                }
                max={1}
                min={0.1}
                step={0.1}
                className="w-full"
                disabled={!physicsSettings.bounceEnabled}
              />
              <p className="text-sm text-gray-600">
                Higher values create more dramatic bouncing effects
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="prevent-overlap">Solid State Physics</Label>
                <p className="text-sm text-gray-600">
                  Prevent entities from overlapping (solid state behavior)
                </p>
              </div>
              <Switch
                id="prevent-overlap"
                checked={physicsSettings.preventOverlap}
                onCheckedChange={(checked) =>
                  setPhysicsSettings(prev => ({ ...prev, preventOverlap: checked }))
                }
              />
            </div>

            <div className="space-y-3">
              <Label>Minimum Distance: {physicsSettings.minDistance}px</Label>
              <Slider
                value={[physicsSettings.minDistance]}
                onValueChange={([value]) =>
                  setPhysicsSettings(prev => ({ ...prev, minDistance: value }))
                }
                max={300}
                min={180}
                step={10}
                className="w-full"
                disabled={!physicsSettings.preventOverlap}
              />
              <p className="text-sm text-gray-600">
                Minimum distance maintained between entity centers
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Magnetic Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-600" />
              <CardTitle>Magnetic Zones</CardTitle>
            </div>
            <CardDescription>
              Configure the aurora magnetic field system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="preview-mode">Preview Mode</Label>
                <p className="text-sm text-gray-600">
                  Show magnetic fields when hovering over entities
                </p>
              </div>
              <Switch
                id="preview-mode"
                checked={magneticSettings.previewMode}
                onCheckedChange={(checked) =>
                  setMagneticSettings(prev => ({ ...prev, previewMode: checked }))
                }
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Detection Radius: {magneticSettings.detectionRadius}px</Label>
              <Slider
                value={[magneticSettings.detectionRadius]}
                onValueChange={([value]) =>
                  setMagneticSettings(prev => ({ ...prev, detectionRadius: value }))
                }
                max={150}
                min={60}
                step={5}
                className="w-full"
              />
              <p className="text-sm text-gray-600">
                Purple zone - initial magnetic field detection
              </p>
            </div>

            <div className="space-y-3">
              <Label>Strong Pull Radius: {magneticSettings.strongPullRadius}px</Label>
              <Slider
                value={[magneticSettings.strongPullRadius]}
                onValueChange={([value]) =>
                  setMagneticSettings(prev => ({ ...prev, strongPullRadius: value }))
                }
                max={100}
                min={40}
                step={5}
                className="w-full"
              />
              <p className="text-sm text-gray-600">
                Blue zone - strong magnetic attraction
              </p>
            </div>

            <div className="space-y-3">
              <Label>Snap Radius: {magneticSettings.snapRadius}px</Label>
              <Slider
                value={[magneticSettings.snapRadius]}
                onValueChange={([value]) =>
                  setMagneticSettings(prev => ({ ...prev, snapRadius: value }))
                }
                max={50}
                min={20}
                step={2}
                className="w-full"
              />
              <p className="text-sm text-gray-600">
                Cyan zone - automatic connection creation
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Reset to Defaults
          </Button>
          
          <Button
            onClick={saveSettings}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <SettingsIcon className="w-4 h-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}