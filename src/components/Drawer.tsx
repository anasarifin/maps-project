import React, { useEffect } from "react";
import { BiRectangle, BiShapePolygon, BiTrash } from "react-icons/bi";
import { MdSave } from "react-icons/md";
import { HiOutlineHand } from "react-icons/hi";

const Drawer = ({ mode, hide, hideSave, saveRef }) => {
    return (
        <div className="map-drawer">
            <div className={"map-save" + (hideSave ? " hide" : "")}>
                <input placeholder="Input address..." ref={saveRef} />
                <MdSave id="savePolygon" />
            </div>
            <div className="map-drawer-option">
                <HiOutlineHand
                    id="handMode"
                    data-place="top"
                    data-mode="hand"
                    data-tip="Move"
                    className={"option" + (mode == "hand" ? " active" : "")}
                />
                <BiRectangle
                    id="rectangleMode"
                    data-place="top"
                    data-mode="rectangle"
                    data-tip="Rectangle"
                    className={"option" + (mode == "rectangle" ? " active" : "")}
                />
                <BiShapePolygon
                    id="polygonMode"
                    data-place="top"
                    data-mode="polygon"
                    data-tip="Custom"
                    className={"option" + (mode == "polygon" ? " active" : "")}
                />
                <BiTrash
                    id="deleteMode"
                    data-place="top"
                    data-mode="delete"
                    data-tip="Delete"
                    className={"option" + (mode == "delete" ? " active" : "")}
                />
            </div>
        </div>
    );
};

export default Drawer;
