import React, { useEffect, useRef } from "react";
import { MdSave } from "react-icons/md";

const Save = ({ hide }) => {
    const ref = useRef<HTMLInputElement>(null);

    useEffect(() => {
        ref.current.value = "";
    }, [hide]);

    return (
        <div className={"map-save" + (hide ? " hide" : "")}>
            <input placeholder="Input address..." ref={ref} />
            <MdSave id="savePolygon" />
        </div>
    );
};

export default Save;
