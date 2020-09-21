import React from "react";
import { useHistory } from "react-router-dom";

const Profile = ({ data, hide }: Props) => {
    const history = useHistory();

    return (
        <div className={"map-profile" + (hide ? " hide" : "")}>
            <div>{data.name}</div>
            <div className="role">{data.role}</div>
            <div
                onClick={() => {
                    window.localStorage.removeItem("loginState");
                    history.push({ pathname: "/" });
                }}
                className="logout"
            >
                Logout
            </div>
        </div>
    );
};

interface Props {
    data: any;
    hide?: boolean;
}

export default Profile;
