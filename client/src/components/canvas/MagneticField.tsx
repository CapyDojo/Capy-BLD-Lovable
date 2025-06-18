
import React from 'react';

interface MagneticFieldProps {
  zone: 'detection' | 'strongPull' | 'snap';
  nodeId: string;
  position: { x: number; y: number };
}

export const MagneticField: React.FC<MagneticFieldProps> = ({ zone, position }) => {
  const getZoneStyles = () => {
    switch (zone) {
      case 'detection':
        return {
          size: 160, // 80px radius = 160px diameter
          color: 'rgba(255, 255, 255, 0.3)',
          animationDuration: '1s'
        };
      case 'strongPull':
        return {
          size: 80, // 40px radius = 80px diameter
          color: 'rgba(251, 191, 36, 0.5)', // gold
          animationDuration: '0.5s'
        };
      case 'snap':
        return {
          size: 40, // 20px radius = 40px diameter
          color: 'rgba(34, 197, 94, 0.6)', // green
          animationDuration: '0.2s'
        };
    }
  };

  const styles = getZoneStyles();

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: position.x - styles.size / 2,
        top: position.y - styles.size / 2,
        width: styles.size,
        height: styles.size,
        borderRadius: '50%',
        border: `2px solid ${styles.color}`,
        animation: `magnetic-pulse ${styles.animationDuration} ease-in-out infinite`,
        zIndex: 1000
      }}
    />
  );
};
