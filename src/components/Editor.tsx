import React, { useEffect } from "react";
import { BiRectangle, BiShapePolygon, BiTrash } from "react-icons/bi";

const Editor = ({ mode, disabled }) => {
    useEffect(() => {
        console.log(mode);
    }, [mode]);

    return (
        <div className={"map-drawer" + (mode == "normal" ? " hide" : "")}>
            <div className="map-drawer-option">
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
            <div className="map-drawer-button">
                <div id="exitEditor">Exit Editor</div>
                <div id="savePolygon" className={disabled ? "disabled" : ""}>
                    Save Polygon
                </div>
            </div>
        </div>
    );
};

export default Editor;
