import React from "react";
import { useHistory } from "react-router-dom";

const Profile = ({ data, hide, mb }) => {
    const history = useHistory();

    return (
        <div className={"map-profile" + (mb ? " mobile" : "") + (hide ? " hide" : "")}>
            <div>{data.name}</div>
            <div className="role">{data.role}</div>
            <div
                onClick={() => {
                    window.localStorage.removeItem("loginState");
                    history.push({ pathname: "/" });
                }}
                className="logout"
            >
                back to home
            </div>
        </div>
    );
};

export default Profile;
