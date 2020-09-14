import React from "react";

const Menu = ({ inputRef, radiusRef, radius, setRadius, source, setSource, sourceRef, hide }) => {
    return (
        <div className={"map-menu" + (hide ? " hide" : "")}>
            <input className="map-search-bar" ref={inputRef} placeholder="Search here..." />
            <div className="map-source-option" data-source={source} ref={sourceRef}>
                <span className={"option" + (source == 0 ? " active" : "")}>SIIS</span>
                <span
                    className={"option" + (source == 1 ? " active" : "")}
                    onClick={() => {
                        setSource(1);
                    }}
                >
                    UIM
                </span>
                <span
                    className={"option" + (source == 2 ? " active" : "")}
                    onClick={() => {
                        setSource(2);
                    }}
                >
                    Valins
                </span>
                <span
                    className={"option" + (source == 3 ? " active" : "")}
                    onClick={() => {
                        setSource(3);
                    }}
                >
                    Underspec
                </span>
            </div>
            <div className={"map-radius-slider" + (source == 3 ? " hide" : "")}>
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
