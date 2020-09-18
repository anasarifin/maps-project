import React, { useState, useEffect, Suspense } from "react";
import { isMobile } from "mobile-device-detect";
import { Route, useHistory } from "react-router-dom";
import axios from "axios";
import Login from "./pages/Login";
import Editor from "./pages/Editor";
import { BiTrendingUp } from "react-icons/bi";
const MapsDesktop = React.lazy(() => import("./pages/MapsDesktop"));
const MapsMobile = React.lazy(() => import("./pages/MapsMobile"));

const App = () => {
    const [ready, setReady] = useState(false);
    const history = useHistory();

    useEffect(() => {
        const loginState = window.localStorage.getItem("loginState");
        if (loginState) {
            getUser(loginState);
        } else {
            history.replace({ pathname: "/login" });
            setReady(true);
        }
    }, []);

    const getUser = (jwt: string) => {
        axios
            .get("http://odpmap-ms-account-dev.vsan-apps.playcourt.id/api/users/v1", {
                headers: {
                    Authorization: "Bearer " + jwt,
                },
            })
            .then(async (resolve) => {
                if (resolve.data.success) {
                    const user = resolve.data.data;
                    const permission = user.role.permissions.lists.map((x) => x.key);
                    history.replace({
                        pathname: "/",
                        state: {
                            profile: {
                                name: user.fullName,
                                role: user.role.name,
                                permission: {
                                    uim: permission.includes("view-odp-uim"),
                                    valins: permission.includes("view-odp-valins"),
                                    underspec: permission.includes("view-odp-underspec"),
                                },
                            },
                        },
                    });
                }
            })
            .catch((reject) => {
                console.log(reject);
                history.replace({ pathname: "/login" });
            })
            .finally(() => setReady(true));
    };

    return (
        <>
            {ready ? (
                <>
                    <Route exact path="/">
                        <Suspense fallback="<></>">
                            <MapsDesktop />
                        </Suspense>
                    </Route>
                    <Route exact path="/login">
                        <Login
                            success={(e) => {
                                getUser(e);
                            }}
                        />
                    </Route>
                    <Route exact path="/editor">
                        <Editor />
                    </Route>
                </>
            ) : (
                <></>
            )}
        </>
    );
};

export default App;
