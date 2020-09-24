import React from "react";

const Info = ({ infoRef, locationName, status, odpStatus, loading, hide, mb }) => {
    return (
        <div className={"map-info" + (mb ? " mobile" : "") + (hide ? " hide" : "")} ref={infoRef}>
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
