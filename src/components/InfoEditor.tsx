import React from "react";

const Info = ({ location, status, polygonStatus, loading, mb }) => {
    return (
        <div className={"map-info-edit" + (mb ? " mobile" : "") + (!status ? " hide" : "")}>
            {loading ? (
                <div className="loading">{status}</div>
            ) : (
                <>
                    <div className="odp">{polygonStatus}</div>
                    <div className="address">Kelurahan: {location.kelurahan}</div>
                    <div className="address">Kecamatan: {location.kecamatan}</div>
                    <div className="address">
                        {location.kabupaten ? "Kabupaten" : "Kota"}: {location.kota}
                    </div>
                </>
            )}
        </div>
    );
};

export default Info;
