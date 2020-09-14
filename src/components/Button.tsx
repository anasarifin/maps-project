import React from "react";
import { MdEdit, MdGpsFixed } from "react-icons/md";
import { BiPlus, BiMinus } from "react-icons/bi";

const Button = ({ findMe, hide }) => {
    return (
        <div className="map-button">
            <div className={hide ? "hide" : ""}>
                <MdEdit id="drawingMode" data-tip="Editor Mode" />
                <MdGpsFixed onClick={findMe} data-tip="Find My Location" />
            </div>
            <BiPlus id="zoomIn" data-tip="Zoom In" />
            <BiMinus id="zoomOut" data-tip="Zoom Out" />
        </div>
    );
};

export default Button;
