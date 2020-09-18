import React from "react";
import { useHistory } from "react-router-dom";

const Profile = ({ data, hide }) => {
    const history = useHistory();

    return (
        <div className={"map-profile" + (hide ? " hide" : "")}>
            <div>{data.name}</div>
            <div className="role">{data.role}</div>
            <div
                onClick={() => {
                    window.localStorage.removeItem("loginState");
                    history.replace({ pathname: "/login" });
                }}
                className="logout"
            >
                Logout
            </div>
        </div>
    );
};

export default Profile;
