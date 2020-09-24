import React, { useState, useEffect } from "react";
import { isMobile as mb } from "mobile-device-detect";
import { useHistory } from "react-router-dom";
import { useRecoilState, useSetRecoilState } from "recoil";
import { profile as profileState } from "../recoil";
import checkUser from "../configs/checkUser";
import "../styles/Home.scss";

const HomeComponent = ({ profile }) => {
    const setProfile = useSetRecoilState(profileState);
    const history = useHistory();

    const logout = () => {
        window.localStorage.removeItem("loginState");
        setProfile({ name: "", role: "", permission: { uim: false, valins: false, underspec: false } });
        history.replace({ pathname: "/login" });
    };

    return (
        <div className={"home-page" + (mb ? " mobile" : "")}>
            <div className="home-header">
                <span>{profile.name}</span>
                <span>|</span>
                <span>{profile.role}</span>
                <span>|</span>
                <span onClick={logout}>Logout</span>
            </div>
            <div className="home-container">
                <div
                    onClick={() => {
                        const { uim, valins, underspec } = profile.permission;
                        if (uim || valins || underspec) history.push({ pathname: "/view-odp" });
                    }}
                >
                    View ODP
                </div>
                <div
                    onClick={() => {
                        const { polygon, editPolygon } = profile.permission;
                        if (polygon || editPolygon) history.push({ pathname: "/polygon-editor" });
                    }}
                >
                    Polygon Editor
                </div>
            </div>
        </div>
    );
};

const HomeReady = () => {
    const [ready, setReady] = useState(false);
    const [profile, setProfile] = useRecoilState(profileState);
    const history = useHistory();

    useEffect(() => {
        if (profile.name) {
            setReady(true);
        } else {
            checkUser()
                .then((resolve: Profile) => {
                    setProfile(resolve);
                    setReady(true);
                })
                .catch(() => {
                    history.replace({ pathname: "/login" });
                });
        }
    });

    return <>{ready ? <HomeComponent profile={profile} /> : <></>}</>;
};

interface Profile {
    name: string;
    role: string;
    permission: any;
}

export default HomeReady;
