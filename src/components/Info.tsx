import React from "react";

const Info = ({ infoRef, locationName, status, odpStatus, loading }) => {
    return (
        <div className="map-info" ref={infoRef}>
            {loading ? (
                <div>{status}</div>
            ) : (
                <>
                    <div>{odpStatus}</div>
                    <div>{locationName}</div>
                </>
            )}
        </div>
    );
};

export default Info;
