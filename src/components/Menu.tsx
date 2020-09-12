import React from "react";

const Menu = ({ inputRef, radiusRef, radius, setRadius, source }) => {
    return (
        <div className="map-menu">
            <input className="map-search-bar" ref={inputRef} placeholder="Search here..." />
            <div className="map-radius-slider">
                <span>Radius: {radius}</span>
                <input
                    ref={radiusRef}
                    type="range"
                    min="100"
                    max="300"
                    step="25"
                    value={radius}
                    onChange={(e) => {
                        setRadius(parseFloat(e.target.value));
                    }}
                />
            </div>
        </div>
    );
};

export default Menu;
