import React from 'react';
import './ColorWheelQuestion.css';

const ColorWheelQuestion = ({
                                id,
                                text,
                                onSelect,
                                selectedColor = null  // Changed from selectedValue to selectedColor to match parent component
                            }) => {
    // Define wheel dimensions
    const outerRadius = 250;
    const centerRadius = 30;  // Smaller center

    // Calculate ring widths (5 rings)
    const ringWidth = (outerRadius - centerRadius) / 5;

    // Define 5 rings from outer to inner
    const ringRadii = [
        [outerRadius - ringWidth, outerRadius],     // Ring 1 (outermost)
        [outerRadius - 2*ringWidth, outerRadius - ringWidth],   // Ring 2
        [outerRadius - 3*ringWidth, outerRadius - 2*ringWidth], // Ring 3
        [outerRadius - 4*ringWidth, outerRadius - 3*ringWidth], // Ring 4
        [centerRadius, outerRadius - 4*ringWidth]               // Ring 5 (innermost)
    ];

    // Organize colors into 10 equal slices
    const colorSlices = [
        // Slice 1: Greens
        {
            startAngle: 0,
            endAngle: 36,
            colors: [
                { name: 'pine', hex: '#1D5638', ring: 0 },       // Darkest (outer ring)
                { name: 'cactus', hex: '#4CA66B', ring: 1 },
                { name: 'cucumber', hex: '#5BB86C', ring: 2 },
                { name: 'grass', hex: '#8BD346', ring: 3 },
                { name: 'kelly', hex: '#51B848', ring: 4 }      // Lightest (inner ring)
            ]
        },
        // Slice 2: Lime/Yellow Greens
        {
            startAngle: 36,
            endAngle: 72,
            colors: [
                { name: 'sprout', hex: '#73A546', ring: 0 },
                { name: 'lime', hex: '#A6CE39', ring: 1 },
                { name: 'kiwi', hex: '#C7D52F', ring: 2 },
                { name: 'parakeet', hex: '#D8DB54', ring: 3 },
                { name: 'canary', hex: '#FFE61F', ring: 4 }
            ]
        },
        // Slice 3: Gold/Yellows
        {
            startAngle: 72,
            endAngle: 108,
            colors: [
                { name: 'gold dark', hex: '#D4AF37', ring: 0 },  // Darkened gold
                { name: 'gold', hex: '#FBD05A', ring: 1 },
                { name: 'sunset', hex: '#FEBD5D', ring: 2 },
                { name: 'yellow-orange', hex: '#FFCC66', ring: 3 },
                { name: 'pale yellow', hex: '#FFF59D', ring: 4 }
            ]
        },
        // Slice 4: Oranges
        {
            startAngle: 108,
            endAngle: 144,
            colors: [
                { name: 'terra cotta', hex: '#E87345', ring: 0 },
                { name: 'tangerine', hex: '#F19153', ring: 1 },
                { name: 'pumpkin', hex: '#F7AB4B', ring: 2 },
                { name: 'peach', hex: '#FFCC99', ring: 3 },
                { name: 'light peach', hex: '#FFE5CC', ring: 4 }
            ]
        },
        // Slice 5: Browns
        {
            startAngle: 144,
            endAngle: 180,
            colors: [
                { name: 'mudpie', hex: '#4A2E1E', ring: 0 },
                { name: 'coco', hex: '#6B4226', ring: 1 },
                { name: 'espresso', hex: '#8E623B', ring: 2 },
                { name: 'mocha', hex: '#A67E4F', ring: 3 },
                { name: 'sand', hex: '#D5AA75', ring: 4 }
            ]
        },
        // Slice 6: Blacks/Grays
        {
            startAngle: 180,
            endAngle: 216,
            colors: [
                { name: 'black', hex: '#000000', ring: 0 },
                { name: 'smoke', hex: '#3D3D3D', ring: 1 },
                { name: 'slate', hex: '#5D5D5D', ring: 2 },
                { name: 'steel', hex: '#797979', ring: 3 },
                { name: 'pewter', hex: '#A4A4A4', ring: 4 }
            ]
        },
        // Slice 7: Light Grays/White
        {
            startAngle: 216,
            endAngle: 252,
            colors: [
                { name: 'rainy day', hex: '#6E7073', ring: 0 },
                { name: 'concrete', hex: '#9B9B9B', ring: 1 },
                { name: 'silverplate', hex: '#B9B9B9', ring: 2 },
                { name: 'fog', hex: '#D6D6D6', ring: 3 },
                { name: 'white', hex: '#FFFFFF', ring: 4 }
            ]
        },
        // Slice 8: Reds
        {
            startAngle: 252,
            endAngle: 288,
            colors: [
                { name: 'cherry', hex: '#7D1D1D', ring: 0 },
                { name: 'candy apple', hex: '#A71B1B', ring: 1 },
                { name: 'blush', hex: '#CE383B', ring: 2 },
                { name: 'red hot', hex: '#E73135', ring: 3 },
                { name: 'light red', hex: '#FF6666', ring: 4 }
            ]
        },
        // Slice 9: Pinks/Magentas
        {
            startAngle: 288,
            endAngle: 324,
            colors: [
                { name: 'raspberry', hex: '#A12A5E', ring: 0 },
                { name: 'rose', hex: '#E24D71', ring: 1 },
                { name: 'magenta', hex: '#D93C9D', ring: 2 },
                { name: 'poppy', hex: '#CE4BA4', ring: 3 },
                { name: 'bubble gum', hex: '#F095C8', ring: 4 }
            ]
        },
        // Slice 10: Blues/Purples
        {
            startAngle: 324,
            endAngle: 360,
            colors: [
                { name: 'navy', hex: '#202060', ring: 0 },
                { name: 'blue', hex: '#253C80', ring: 1 },
                { name: 'sailboat', hex: '#3D65A4', ring: 2 },
                { name: 'bright blue', hex: '#2891CF', ring: 3 },
                { name: 'sea', hex: '#62C5DF', ring: 4 }
            ]
        }
    ];

    // Helper function to create an SVG arc path
    const createArcPath = (startAngle, endAngle, innerRadius, outerRadius) => {
        // Convert angles to radians
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        // Calculate coordinates (center at 250,250)
        const centerX = 250;
        const centerY = 250;

        const innerStartX = centerX + innerRadius * Math.cos(startRad);
        const innerStartY = centerY + innerRadius * Math.sin(startRad);
        const innerEndX = centerX + innerRadius * Math.cos(endRad);
        const innerEndY = centerY + innerRadius * Math.sin(endRad);

        const outerStartX = centerX + outerRadius * Math.cos(startRad);
        const outerStartY = centerY + outerRadius * Math.sin(startRad);
        const outerEndX = centerX + outerRadius * Math.cos(endRad);
        const outerEndY = centerY + outerRadius * Math.sin(endRad);

        // Determine which arc to use (large arc flag)
        const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

        // SVG path
        return `
      M ${innerStartX} ${innerStartY}
      L ${outerStartX} ${outerStartY}
      A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEndX} ${outerEndY}
      L ${innerEndX} ${innerEndY}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}
      Z
    `;
    };

    // Create flattened array of all color segments with paths
    const createSegments = () => {
        const segments = [];

        colorSlices.forEach((slice, sliceIndex) => {
            slice.colors.forEach((color) => {
                const ringIndex = color.ring;
                const [innerRadius, outerRadius] = ringRadii[ringIndex];

                // Create path for this segment
                const path = createArcPath(
                    slice.startAngle,
                    slice.endAngle,
                    innerRadius,
                    outerRadius
                );

                // Calculate label position (centered in the segment)
                const midAngle = (slice.startAngle + slice.endAngle) / 2;
                const midRadius = (innerRadius + outerRadius) / 2;
                const labelX = 250 + midRadius * Math.cos(midAngle * Math.PI / 180);
                const labelY = 250 + midRadius * Math.sin(midAngle * Math.PI / 180);

                segments.push({
                    ...color,
                    path,
                    labelX,
                    labelY,
                    sliceIndex
                });
            });
        });

        return segments;
    };

    const segments = createSegments();

    const handleColorSelect = (color) => {
        // Call the onSelect function with the correct parameters
        onSelect(id, { name: color.name, hex: color.hex });
    };

    // Helper function to determine if a color needs dark text
    const needsDarkText = (hex) => {
        // Light colors that need dark text
        const lightColors = [
            '#FFFFFF', '#EFEFEF', '#D6D6D6', '#FFE5CC', '#FFF59D',
            '#FFE61F', '#FBD05A', '#FEBD5D', '#FFCC66', '#FFCC99',
            '#D5AA75', '#F095C8', '#FF6666'
        ];
        return lightColors.includes(hex);
    };

    // Debug: console log selected value for troubleshooting
    console.log("Selected Color:", selectedColor);

    return (
        <div className="question-item">
            <p className="question-text">{text}</p>

            <div className="color-wheel-container">
                <svg
                    viewBox="0 0 500 500"
                    className="color-wheel-svg"
                    aria-label="Color wheel for pain description"
                >
                    {segments.map((segment, index) => {
                        // Check if this segment is selected
                        const isSelected = selectedColor && selectedColor.name === segment.name;

                        return (
                            <g
                                key={`${segment.name}-${index}`}
                                onClick={() => handleColorSelect(segment)}
                                className={`segment-group ${isSelected ? 'selected' : ''}`}
                            >
                                <path
                                    d={segment.path}
                                    fill={segment.hex}
                                    stroke={isSelected ? "#000000" : "#FFFFFF"}
                                    strokeWidth={isSelected ? 2 : 0.5}
                                    className={`color-segment ${isSelected ? 'selected' : ''}`}
                                />
                                {isSelected && (
                                    <text
                                        x={segment.labelX}
                                        y={segment.labelY}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fill={needsDarkText(segment.hex) ? '#000000' : '#FFFFFF'}
                                        fontSize="10"
                                        fontFamily="Inter, sans-serif"
                                        className="color-name"
                                    >
                                        {segment.name}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export default ColorWheelQuestion;