import React, { useEffect } from "react";
import { MdGpsFixed, MdAccountCircle } from "react-icons/md";
import { FaRoad } from "react-icons/fa";
import { BiPlus, BiMinus, BiMapAlt, BiRadar } from "react-icons/bi";

const Button = ({ satellite, mb, hide, showStreet, toogleProfile, toogleRadius, editor }: Props) => {
    return (
        <div className={"map-button" + (mb ? " mobile" : "")}>
            {mb ? <MdAccountCircle onClick={toogleProfile} /> : <></>}
            <BiRadar className={editor ? "hide" : ""} onClick={toogleRadius} />
            <BiMapAlt id="changeView" data-tip={!satellite ? "Satellite View" : "Normal View"} />
            <MdGpsFixed id="findMe" data-tip="Find My Location" />
            {!mb ? (
                <>
                    <BiPlus id="zoomIn" data-tip="Zoom In" />
                    <BiMinus id="zoomOut" data-tip="Zoom Out" />
                    <FaRoad className={editor || hide ? "hide" : ""} onClick={showStreet} />
                </>
            ) : (
                <></>
            )}
        </div>
    );
};

interface Props {
    satellite: boolean;
    mb: boolean;
    hide?: boolean;
    editor?: boolean;
    bottomRef?: any;
    toogleProfile?: () => void;
    showStreet?: () => void;
    toogleRadius?: () => void;
}

export default Button;
