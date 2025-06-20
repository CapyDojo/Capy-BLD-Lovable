import React, { useState } from 'react';
import WorkingBumpConnect from '../components/canvas/WorkingBumpConnectFixed';

interface CleanStructureChartProps {
  sensitivity?: {
    approachZone: number;
    connectionZone: number;
    dwellTime: number;
  };
}

export default function CleanStructureChart({ sensitivity }: CleanStructureChartProps) {
  return (
    <div className="w-full h-screen bg-gray-50">
      <WorkingBumpConnect sensitivity={sensitivity} />
    </div>
  );
}