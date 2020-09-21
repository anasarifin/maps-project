import axios from "axios";
import { ResolvePlugin } from "webpack";

const getUser = (token: string) => {
    return new Promise((resolve, reject) => {
        axios
            .get("http://odpmap-ms-account-dev.vsan-apps.playcourt.id/api/users/v1", {
                headers: {
                    Authorization: "Bearer " + token,
                },
            })
            .then(async (response) => {
                if (response.data.success) {
                    const user = response.data.data;
                    const permission = user.role.permissions.lists.map((x) => x.key);
                    resolve({
                        name: user.fullName,
                        role: user.role.name,
                        permission: {
                            uim: permission.includes("view-odp-uim"),
                            valins: permission.includes("view-odp-valins"),
                            underspec: permission.includes("view-odp-underspec"),
                        },
                    });
                } else {
                    console.log(response.data);
                    reject(true);
                }
            })
            .catch((error) => {
                console.log(error);
                reject(true);
            });
    });
};

const checkUser = () => {
    return new Promise((resolve, reject) => {
        const token = window.localStorage.getItem("loginState");

        if (token) {
            getUser(token)
                .then((response) => {
                    resolve(response);
                })
                .catch(() => {
                    window.localStorage.removeItem("loginState");
                    reject(true);
                });
        } else {
            reject(true);
        }
    });
};

export default checkUser;
