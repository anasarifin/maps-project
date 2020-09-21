import React, { useState, useEffect, Suspense } from "react";
// import { isMobile } from "mobile-device-detect";
import { BrowserRouter, Route } from "react-router-dom";
import { RecoilRoot } from "recoil";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Editor from "./pages/Editor";
const MapsDesktop = React.lazy(() => import("./pages/MapsDesktop"));
// const MapsMobile = React.lazy(() => import("./pages/MapsMobile"));

const App = () => {
    return (
        <RecoilRoot>
            <BrowserRouter>
                <Route exact path="/">
                    <Home />
                </Route>
                <Route exact path="/view-odp">
                    <Suspense fallback="">
                        <MapsDesktop />
                    </Suspense>
                </Route>
                <Route exact path="/polygon-editor">
                    <Suspense fallback="">
                        <Editor />
                    </Suspense>
                </Route>
                <Route exact path="/login">
                    <Login />
                </Route>
            </BrowserRouter>
        </RecoilRoot>
    );
};

export default App;
