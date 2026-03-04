import React from 'react';

/**
 * Orb — The central AI core visual element.
 * Shows an animated, glowing orb with orbiting rings and particles.
 * Switches between 'idle' and 'processing' visual states.
 *
 * @param {{ isProcessing: boolean }} props
 */
export default function Orb({ isProcessing = false }) {
    return (
        <div className="orb-container" aria-label="AI Core Orb">
            {/* Orbiting rings */}
            <div className="orb-ring-outer" />
            <div className="orb-ring-mid" />
            <div className="orb-ring-inner" />

            {/* Floating particles */}
            <div className="orb-particles">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="orb-particle" />
                ))}
            </div>

            {/* Glowing core */}
            <div className={`orb-core ${isProcessing ? 'processing' : ''}`} />
        </div>
    );
}
