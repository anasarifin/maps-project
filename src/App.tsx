import React, { useEffect } from "react";
import MapsDesktop from "./pages/MapsDesktop";
import MapsMobile from "./pages/MapsMobile";
import { isMobile } from "mobile-device-detect";

const App = () => {
	useEffect(() => {
		if (isMobile) {
			console.log("waaaw");
		}
	}, []);

	return <div className="App">{isMobile ? <MapsMobile /> : <MapsDesktop />}</div>;
};

export default App;
