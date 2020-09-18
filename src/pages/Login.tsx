import React, { useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import "../styles/Login.scss";

const Login = ({ success }) => {
    const [type, setType] = useState(0);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const idRef = useRef<HTMLInputElement>(null);
    const passRef = useRef<HTMLInputElement>(null);
    const history = useHistory();

    const login = (type: number) => {
        if (type == 1) return setMessage("Login via NIK is not available.");
        if (!idRef.current.value) return setMessage("Phone number is empty.");
        if (!passRef.current.value) return setMessage("Password is empty.");

        setLoading(true);
        const form = new FormData();
        form.append(type == 0 ? "username" : "nik", idRef.current.value);
        form.append("password", passRef.current.value);

        axios
            .post("http://odpmap-ms-account-dev.vsan-apps.playcourt.id/api/users/v1/login" + (type == 1 ? "-by-nik" : ""), form, {
                auth: { username: "telkom", password: process.env.ODP_PASSWORD },
            })
            .then((resolve) => {
                if (resolve.data.success) {
                    success(resolve.data.data);
                    window.localStorage.setItem("loginState", resolve.data.data);
                    history.replace({ pathname: "/" });
                }
            })
            .catch((reject) => {
                console.log(reject);
                if (reject.response.status == 404) {
                    setMessage("User not found.");
                } else if (reject.response.status == 401) {
                    setMessage("Password not correct.");
                }
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <div className="login-page">
            <div className="login-container">
                {message ? <div className="login-message">{message}</div> : <></>}
                <div className="login-option"></div>
                <label>{type == 0 ? "Phone or Email" : "NIK"}</label>
                <input ref={idRef} />
                <label>Password</label>
                <input type="password" ref={passRef} />
                <button
                    onClick={() => {
                        login(type);
                    }}
                    disabled={loading}
                >
                    Login
                </button>
                <div
                    className="login-type"
                    onClick={(e) => {
                        setType(type == 0 ? 1 : 0);
                    }}
                >
                    {"Login via " + (type == 0 ? "NIK" : "Phone / Email")}
                </div>
            </div>
        </div>
    );
};

export default Login;
