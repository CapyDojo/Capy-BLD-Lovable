
import React from 'react';
import { MagneticField } from './MagneticField';
import { ConnectionPreview } from './ConnectionPreview';

interface MagneticZone {
  nodeId: string;
  zone: 'attract' | 'snap' | null;
  screenPosition: { x: number; y: number };
}

interface ConnectionPreviewData {
  sourceId: string;
  targetId: string;
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
}

interface MagneticOverlaysProps {
  isDragging: boolean;
  magneticZones: MagneticZone[];
  connectionPreview: ConnectionPreviewData | null;
  getWrapperRelativePosition: (viewportPosition: { x: number; y: number }) => { x: number; y: number };
}

export const MagneticOverlays: React.FC<MagneticOverlaysProps> = ({
  isDragging,
  magneticZones,
  connectionPreview,
  getWrapperRelativePosition,
}) => {
  if (!isDragging) return null;

  return (
    <>
      {/* Magnetic Field Overlays */}
      {magneticZones.map((zone, index) => {
        const relativePosition = getWrapperRelativePosition(zone.screenPosition);
        return (
          <MagneticField
            key={`${zone.nodeId}-${zone.zone}-${index}`}
            zone={zone.zone!}
            nodeId={zone.nodeId}
            position={relativePosition}
          />
        );
      })}

      {/* Connection Preview */}
      {connectionPreview && (
        <ConnectionPreview
          sourcePosition={getWrapperRelativePosition(connectionPreview.sourcePosition)}
          targetPosition={getWrapperRelativePosition(connectionPreview.targetPosition)}
        />
      )}
    </>
  );
};
