import React from "react";

const Info = ({ infoRef, locationName, status, odpStatus, loading, hide }) => {
    return (
        <div className={"map-info" + (hide ? " hide" : "")} ref={infoRef}>
            {loading ? (
                <div className="loading">{status}</div>
            ) : (
                <>
                    <div className="odp">{odpStatus}</div>
                    <div className="address">{locationName}</div>
                </>
            )}
        </div>
    );
};

export default Info;
