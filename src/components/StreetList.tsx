import React from "react";

const StreetList = ({ streetList, status, hide, mb, hideStreet }) => {
    return (
        <>
            {mb ? <div className={"popup-bg" + (hide ? " hide" : "")} /> : <></>}
            <div className={"map-street" + (mb ? " mobile" : "") + (hide ? " hide" : "")}>
                <div className="status">{status}</div>
                {streetList.length ? (
                    <div className="list">
                        {streetList.map((street) => {
                            return <div>{street}</div>;
                        })}
                    </div>
                ) : (
                    <></>
                )}
                {mb ? (
                    <div className="close" onClick={hideStreet}>
                        Close
                    </div>
                ) : (
                    <></>
                )}
            </div>
        </>
    );
};

export default StreetList;
