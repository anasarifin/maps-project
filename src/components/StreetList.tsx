import React from "react";

const StreetList = ({ streetList, status, hide, ref }) => {
    return (
        <div className={"map-street" + (hide ? " hide" : "")}>
            <div>{status}</div>
            {streetList.length ? (
                <div className="list">
                    {streetList.map((street) => {
                        return <div>{street}</div>;
                    })}
                </div>
            ) : (
                <></>
            )}
        </div>
    );
};

export default StreetList;
