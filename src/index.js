import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
// import * as serviceWorker from "./serviceWorker";
import App from "./App";
import "./index.css";
import "regenerator-runtime";

ReactDOM.render(<App />, document.getElementById("root"));

// if ("serviceWorker" in navigator) {
// 	window.addEventListener("load", () => {
// 		navigator.serviceWorker
// 			.register("/service-worker.js")
// 			.then((registration) => {
// 				console.log("SW registered: ", registration);
// 			})
// 			.catch((registrationError) => {
// 				console.log("SW registration failed: ", registrationError);
// 			});
// 	});
// }
