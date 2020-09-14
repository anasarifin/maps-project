import React from "react";

const Underspec = ({ underspec, hide }) => {
    return (
        <div className={"map-underspec" + (hide ? " hide" : "")}>
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
                            <td>{x.olt_rx_pwr}</td>
                            <td>Baik sekali</td>
                        </tr>
                    );
                })}
            </table>
        </div>
    );
};

export default Underspec;
