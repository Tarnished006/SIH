import React, { useState, useRef, useEffect } from 'react';
import { CADASTRAL_PARCELS_MAP } from '../../data/stitchMockData';

export const CadastralCanvas = ({
  parcels = CADASTRAL_PARCELS_MAP,
  selectedSurvey = '142/3',
  onSelectParcel = () => {},
  showCanal = true,
  height = 420,
  interactive = true,
  showLabels = true,
  zoom = 1,
  pan = { x: 0, y: 0 },
  onPanChange = () => {},
}) => {
  const [hovered, setHovered] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  // SVG coordinate bounding box: 0, 100 to 480, 460
  const viewBox = '0 100 480 360';

  // Compute centroid of the selected parcel (or default to map center 240, 280)
  const selectedParcelObj = parcels.find((p) => p.surveyNumber === selectedSurvey);
  let targetCx = 240;
  let targetCy = 280;

  if (selectedParcelObj && selectedParcelObj.points?.length > 0) {
    targetCx = Math.round(
      selectedParcelObj.points.reduce((sum, p) => sum + p.x, 0) / selectedParcelObj.points.length
    );
    targetCy = Math.round(
      selectedParcelObj.points.reduce((sum, p) => sum + p.y, 0) / selectedParcelObj.points.length
    );
  }

  const formatPoints = (points) => {
    return points.map((p) => `${p.x},${p.y}`).join(' ');
  };

  // Drag-to-pan handlers
  const handleMouseDown = (e) => {
    if (!interactive || e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    onPanChange({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <div 
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: `${height}px`, 
        overflow: 'hidden',
        backgroundColor: 'var(--bg-card)',
        cursor: isDragging ? 'grabbing' : 'default',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      <svg
        ref={svgRef}
        viewBox={viewBox}
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'block', 
          backgroundColor: 'transparent',
        }}
      >
        {/* Cadastral Grid Pattern */}
        <defs>
          <pattern id="surveyGrid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(22, 51, 35, 0.06)" strokeWidth="0.8" />
          </pattern>
          <pattern id="disputedHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(200, 75, 49, 0.65)" strokeWidth="2.5" />
          </pattern>
        </defs>

        {/* Scaled Cadastral Map Group with Transform Origin */}
        <g
          id="cadastral-map-content-group"
          style={{
            transformOrigin: `${targetCx}px ${targetCy}px`,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)',
          }}
        >
          {/* Background Grid */}
          <rect x="-100" y="0" width="680" height="560" fill="url(#surveyGrid)" />

          {/* Natural Drainage Canal Stream */}
          {showCanal && (
            <g opacity="0.65">
              <path
                d="M -10 130 C 80 140, 160 120, 260 125 C 340 130, 420 115, 500 120"
                fill="none"
                stroke="#6b9b8a"
                strokeWidth="5"
                strokeDasharray="6 3"
              />
              <text x="70" y="125" fill="#4d7265" fontSize="8" fontFamily="monospace" letterSpacing="1">
                --- NATURAL DRAINAGE CANAL ---
              </text>
            </g>
          )}

          {/* Parcel Polygons */}
          {parcels.map((parcel) => {
            const isSelected = parcel.surveyNumber === selectedSurvey;
            const isHovered = hovered === parcel.surveyNumber;

            // Compute centroid for label placement
            const cx = Math.round(parcel.points.reduce((sum, p) => sum + p.x, 0) / parcel.points.length);
            const cy = Math.round(parcel.points.reduce((sum, p) => sum + p.y, 0) / parcel.points.length);

            // Restrained Government Colors
            let fillColor = '#ffffff';
            let strokeColor = '#1f382a';
            let strokeWidth = 1.4;

            if (parcel.isDisputed && !isSelected) {
              fillColor = 'rgba(254, 242, 242, 0.75)';
              strokeColor = '#c84b31';
              strokeWidth = 1.8;
            } else if (isSelected) {
              fillColor = parcel.isDisputed ? 'rgba(212, 163, 83, 0.35)' : 'rgba(45, 90, 65, 0.2)';
              strokeColor = parcel.isDisputed ? '#c84b31' : '#163323';
              strokeWidth = 2.4;
            } else {
              fillColor = 'rgba(255, 255, 255, 0.85)';
            }

            if (isHovered && interactive) {
              fillColor = 'rgba(212, 163, 83, 0.25)';
            }

            return (
              <g
                key={parcel.surveyNumber}
                onClick={(e) => {
                  e.stopPropagation();
                  if (interactive) onSelectParcel(parcel);
                }}
                onMouseEnter={() => interactive && setHovered(parcel.surveyNumber)}
                onMouseLeave={() => interactive && setHovered(null)}
                style={{ cursor: interactive ? 'pointer' : 'default' }}
              >
                <polygon
                  points={formatPoints(parcel.points)}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                />

                {/* Boundary Corner Pins */}
                {parcel.points.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 3.5 : 2}
                    fill={isSelected ? '#163323' : '#738276'}
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                ))}

                {/* Parcel Labels & Extents */}
                {showLabels && (
                  <g pointerEvents="none">
                    {isSelected && parcel.surveyNumber === '142/3' ? (
                      <g>
                        <rect
                          x={cx - 36}
                          y={cy - 16}
                          width="72"
                          height="30"
                          rx="4"
                          fill="#163323"
                          stroke="#d4a353"
                          strokeWidth="1.2"
                        />
                        <text
                          x={cx}
                          y={cy - 3}
                          fill="#ffffff"
                          fontSize="9.5"
                          fontWeight="700"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          142/3
                        </text>
                        <text
                          x={cx}
                          y={cy + 9}
                          fill="#d4a353"
                          fontSize="8"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          2A 14G • 9,510m²
                        </text>
                      </g>
                    ) : (
                      <g>
                        <text
                          x={cx}
                          y={cy}
                          fill={parcel.isDisputed ? '#c84b31' : '#152219'}
                          fontSize="9.5"
                          fontWeight="700"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {parcel.surveyNumber}
                        </text>
                        <text
                          x={cx}
                          y={cy + 10}
                          fill={parcel.isDisputed ? '#ea654c' : '#738276'}
                          fontSize="7.5"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {parcel.extent}
                        </text>
                      </g>
                    )}
                  </g>
                )}
              </g>
            );
          })}

          {/* Disputed Overlap Hatch Zone between 142/3 and 142/4 */}
          <polygon
            points="265,200 295,195 280,310 250,330"
            fill="url(#disputedHatch)"
            stroke="#c84b31"
            strokeWidth="1.5"
            strokeDasharray="3 2"
            opacity="0.85"
            pointerEvents="none"
          />

          {/* Warning Indicator on Disputed Intersection */}
          <g transform="translate(268, 240)" pointerEvents="none">
            <polygon points="0,-10 9,7 -9,7" fill="#c84b31" stroke="#ffffff" strokeWidth="1" />
            <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">
              !
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
};

export default CadastralCanvas;
