import React, { useEffect, useState } from 'react';

interface SuccessAnimation {
  id: string;
  position: { x: number; y: number };
  timestamp: number;
}

interface ConnectionAnimatorProps {
  successConnections: Array<{
    sourcePoint: { x: number; y: number };
    targetPoint: { x: number; y: number };
    timestamp: number;
  }>;
}

export const ConnectionAnimator: React.FC<ConnectionAnimatorProps> = ({
  successConnections,
}) => {
  const [activeAnimations, setActiveAnimations] = useState<SuccessAnimation[]>([]);

  useEffect(() => {
    // Add new success animations
    const newAnimations = successConnections.map(connection => ({
      id: `success-${connection.timestamp}`,
      position: connection.targetPoint,
      timestamp: connection.timestamp,
    }));

    setActiveAnimations(prev => [...prev, ...newAnimations]);

    // Remove animations after duration
    const timer = setTimeout(() => {
      setActiveAnimations(prev => 
        prev.filter(anim => Date.now() - anim.timestamp < 2000)
      );
    }, 2100);

    return () => clearTimeout(timer);
  }, [successConnections]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1010,
      }}
    >
      {activeAnimations.map(animation => (
        <SuccessBurst
          key={animation.id}
          position={animation.position}
          timestamp={animation.timestamp}
        />
      ))}
    </div>
  );
};

interface SuccessBurstProps {
  position: { x: number; y: number };
  timestamp: number;
}

const SuccessBurst: React.FC<SuccessBurstProps> = ({ position, timestamp }) => {
  const particles = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * 2 * Math.PI;
    return {
      id: i,
      x: Math.cos(angle) * 30,
      y: Math.sin(angle) * 30,
      delay: i * 0.05,
    };
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x - 4,
        top: position.y - 4,
        width: 8,
        height: 8,
      }}
    >
      {/* Central success pulse */}
      <div
        style={{
          position: 'absolute',
          width: 8,
          height: 8,
          backgroundColor: '#06B6D4',
          borderRadius: '50%',
          animation: 'success-pulse 0.6s ease-out',
        }}
      />
      
      {/* Particle burst */}
      {particles.map(particle => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            width: 4,
            height: 4,
            backgroundColor: '#10B981',
            borderRadius: '50%',
            left: 2,
            top: 2,
            animation: `particle-burst 1s ease-out ${particle.delay}s`,
            transform: `translate(${particle.x}px, ${particle.y}px)`,
          }}
        />
      ))}

      {/* Satisfaction wiggle for nearby entity */}
      <div
        style={{
          position: 'absolute',
          left: -15,
          top: -15,
          width: 30,
          height: 30,
          border: '2px solid #10B981',
          borderRadius: '50%',
          animation: 'satisfaction-wiggle 0.8s ease-out 0.2s',
          opacity: 0.6,
        }}
      />

      <style>{`
        @keyframes success-pulse {
          0% { 
            transform: scale(1); 
            opacity: 1; 
          }
          50% { 
            transform: scale(3); 
            opacity: 0.8; 
          }
          100% { 
            transform: scale(5); 
            opacity: 0; 
          }
        }

        @keyframes particle-burst {
          0% { 
            transform: translate(0, 0) scale(1); 
            opacity: 1; 
          }
          100% { 
            transform: translate(var(--x, 0), var(--y, 0)) scale(0); 
            opacity: 0; 
          }
        }

        @keyframes satisfaction-wiggle {
          0%, 100% { 
            transform: rotate(0deg) scale(1); 
            opacity: 0.6; 
          }
          25% { 
            transform: rotate(5deg) scale(1.1); 
            opacity: 0.8; 
          }
          75% { 
            transform: rotate(-5deg) scale(1.1); 
            opacity: 0.8; 
          }
        }
      `}</style>
    </div>
  );
};