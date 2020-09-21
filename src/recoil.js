import { atom } from "recoil";

export const profile = atom({
    key: "profile",
    default: {
        name: "",
        role: "",
        permission: {
            uim: false,
            valins: false,
            underspec: false,
        },
    },
});
