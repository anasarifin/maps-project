import React from "react";
import { MdGpsFixed } from "react-icons/md";

const Button = ({ findMe, setDrawingMode }) => {
    return (
        <div className="map-button">
            <div className="map-find-me" onClick={findMe}>
                <MdGpsFixed />
            </div>
        </div>
    );
};

export default Button;
