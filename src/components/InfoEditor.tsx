import React from "react";

const Info = ({ location, status, polygonStatus, loading }) => {
    return (
        <div className="map-info">
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
