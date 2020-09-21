import React from "react";
import { MdEdit, MdGpsFixed } from "react-icons/md";
import { BiPlus, BiMinus } from "react-icons/bi";

const Button = ({ findMe }) => {
    return (
        <div className="map-button">
            <MdGpsFixed onClick={findMe} data-tip="Find My Location" />
            <BiPlus id="zoomIn" data-tip="Zoom In" />
            <BiMinus id="zoomOut" data-tip="Zoom Out" />
        </div>
    );
};

export default Button;
