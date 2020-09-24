import React from "react";

const klasifikasi = (onu: number, olt: number) => {
    const number = onu < olt ? onu : olt;
    if (number >= -24) {
        return "Very good";
    } else if (number < -24 && number >= -27) {
        return "Good";
    } else if (number < -27 && number >= -30) {
        return "Poor";
    } else if (number < -30) {
        return "Bad";
    } else {
        return "";
    }
};

const Underspec = ({ underspec, hide, mb, hideUnderspec }) => {
    return (
        <>
            {mb ? <div className={"popup-bg" + (hide ? " hide" : "")} /> : <></>}
            <div className={"map-underspec" + (mb ? " mobile" : "") + (hide ? " hide" : "")}>
                <table>
                    <tr>
                        <th>No. INET</th>
                        <th>RX OLT</th>
                        <th>RX ONT</th>
                        <th>Klasifikasi</th>
                    </tr>
                    {underspec.map((x) => {
                        return (
                            <tr>
                                <td>{x.inet}</td>
                                <td>{x.olt_rx_pwr}</td>
                                <td>{x.onu_rx_pwr}</td>
                                <td>{klasifikasi(parseFloat(x.onu_rx_pwr), parseFloat(x.olt_rx_pwr))}</td>
                            </tr>
                        );
                    })}
                </table>
                {mb ? (
                    <div className="close" onClick={hideUnderspec}>
                        Close
                    </div>
                ) : (
                    <></>
                )}
            </div>
        </>
    );
};

export default Underspec;
