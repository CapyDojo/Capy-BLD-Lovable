import React from 'react';
import { MagneticZone } from '@/hooks/useMagneticDragEngine';

interface MagneticFieldProps {
  zone: MagneticZone;
  isPreview?: boolean;
}

const MagneticField: React.FC<MagneticFieldProps> = ({ zone, isPreview = false }) => {
  const getZoneStyles = () => {
    const baseRadius = zone.zone === 'detection' ? 90 : zone.zone === 'strongPull' ? 60 : 30;
    const opacity = isPreview ? 0.15 : zone.zone === 'detection' ? 0.3 : zone.zone === 'strongPull' ? 0.5 : 0.7;
    
    const colors = {
      detection: 'rgba(139, 69, 190, ' + opacity + ')', // Deep purple
      strongPull: 'rgba(59, 130, 246, ' + opacity + ')', // Electric blue
      snap: 'rgba(6, 182, 212, ' + opacity + ')', // Vibrant cyan
      preview: 'rgba(139, 69, 190, ' + opacity + ')', // Purple for preview
    };

    const animations = {
      detection: 'magnetic-pulse-slow 2s ease-in-out infinite',
      strongPull: 'magnetic-pulse-medium 1s ease-in-out infinite',
      snap: 'magnetic-pulse-fast 0.5s ease-in-out infinite',
      preview: 'magnetic-preview 3s ease-in-out infinite',
    };

    return {
      position: 'absolute' as const,
      left: zone.connectionPoint.x,
      top: zone.connectionPoint.y,
      width: baseRadius * 2,
      height: baseRadius * 2,
      borderRadius: '50%',
      border: `2px solid ${colors[zone.zone]}`,
      backgroundColor: colors[zone.zone],
      animation: animations[zone.zone],
      pointerEvents: 'none' as const,
      zIndex: zone.zone === 'snap' ? 1000 : zone.zone === 'strongPull' ? 999 : 998,
      transform: 'translate(-50%, -50%)',
    };
  };

  return <div style={getZoneStyles()} />;
};

interface ConnectionPreviewLineProps {
  sourcePoint: { x: number; y: number };
  targetPoint: { x: number; y: number };
  percentage: number;
}

const ConnectionPreviewLine: React.FC<ConnectionPreviewLineProps> = ({ 
  sourcePoint, 
  targetPoint, 
  percentage 
}) => {
  const lineLength = Math.sqrt(
    Math.pow(targetPoint.x - sourcePoint.x, 2) + 
    Math.pow(targetPoint.y - sourcePoint.y, 2)
  );
  
  const angle = Math.atan2(
    targetPoint.y - sourcePoint.y, 
    targetPoint.x - sourcePoint.x
  ) * (180 / Math.PI);

  const midPoint = {
    x: (sourcePoint.x + targetPoint.x) / 2,
    y: (sourcePoint.y + targetPoint.y) / 2,
  };

  return (
    <>
      {/* Connection line */}
      <div
        style={{
          position: 'absolute',
          left: sourcePoint.x,
          top: sourcePoint.y,
          width: lineLength,
          height: 3,
          backgroundColor: 'rgba(6, 182, 212, 0.8)',
          transformOrigin: '0 50%',
          transform: `rotate(${angle}deg)`,
          animation: 'connection-preview-pulse 0.5s ease-in-out infinite',
          borderRadius: '2px',
          zIndex: 1001,
          pointerEvents: 'none',
        }}
      />
      
      {/* Percentage indicator */}
      <div
        style={{
          position: 'absolute',
          left: midPoint.x - 20,
          top: midPoint.y - 12,
          width: 40,
          height: 24,
          backgroundColor: 'rgba(6, 182, 212, 0.9)',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px',
          animation: 'percentage-bounce 0.5s ease-in-out infinite',
          zIndex: 1002,
          pointerEvents: 'none',
        }}
      >
        {percentage}%
      </div>

      {/* Success particles */}
      <div
        style={{
          position: 'absolute',
          left: targetPoint.x - 5,
          top: targetPoint.y - 5,
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: 'rgba(6, 182, 212, 1)',
          animation: 'success-particle 0.5s ease-out infinite',
          zIndex: 1003,
          pointerEvents: 'none',
        }}
      />
    </>
  );
};

interface MagneticFieldRendererProps {
  magneticZones: MagneticZone[];
  connectionPreview: {
    sourcePoint: { x: number; y: number };
    targetPoint: { x: number; y: number };
    percentage: number;
  } | null;
  isDragging: boolean;
  isPreview?: boolean;
}

export const MagneticFieldRenderer: React.FC<MagneticFieldRendererProps> = ({
  magneticZones,
  connectionPreview,
  isDragging,
  isPreview = false,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 997,
      }}
    >
      {/* Magnetic field zones */}
      {magneticZones.map((zone, index) => (
        <MagneticField
          key={`${zone.nodeId}-${zone.zone}-${index}`}
          zone={zone}
          isPreview={isPreview || (!isDragging && zone.zone === 'preview')}
        />
      ))}

      {/* Connection preview */}
      {connectionPreview && isDragging && (
        <ConnectionPreviewLine
          sourcePoint={connectionPreview.sourcePoint}
          targetPoint={connectionPreview.targetPoint}
          percentage={connectionPreview.percentage}
        />
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes magnetic-pulse-slow {
          0%, 100% { 
            transform: scale(1); 
            opacity: 0.3; 
          }
          50% { 
            transform: scale(1.05); 
            opacity: 0.5; 
          }
        }
        
        @keyframes magnetic-pulse-medium {
          0%, 100% { 
            transform: scale(1); 
            opacity: 0.5; 
          }
          50% { 
            transform: scale(1.1); 
            opacity: 0.7; 
          }
        }
        
        @keyframes magnetic-pulse-fast {
          0%, 100% { 
            transform: scale(1); 
            opacity: 0.7; 
          }
          50% { 
            transform: scale(1.15); 
            opacity: 0.9; 
          }
        }
        
        @keyframes magnetic-preview {
          0%, 100% { 
            transform: scale(1); 
            opacity: 0.1; 
          }
          50% { 
            transform: scale(1.02); 
            opacity: 0.2; 
          }
        }
        
        @keyframes connection-preview-pulse {
          0%, 100% { 
            opacity: 0.6;
            transform: rotate(var(--angle)) scaleX(1);
          }
          50% { 
            opacity: 1;
            transform: rotate(var(--angle)) scaleX(1.02);
          }
        }
        
        @keyframes percentage-bounce {
          0%, 100% { 
            transform: scale(1) translateY(0); 
          }
          50% { 
            transform: scale(1.1) translateY(-2px); 
          }
        }
        
        @keyframes success-particle {
          0% { 
            transform: scale(0); 
            opacity: 1; 
          }
          50% { 
            transform: scale(1.5); 
            opacity: 0.8; 
          }
          100% { 
            transform: scale(0); 
            opacity: 0; 
          }
        }
      `}</style>
    </div>
  );
};