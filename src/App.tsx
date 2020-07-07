import React, { Suspense } from "react";
import { isMobile } from "mobile-device-detect";
const MapsDesktop = React.lazy(() => import("./pages/MapsDesktop"));
const MapsMobile = React.lazy(() => import("./pages/MapsMobile"));

const App = () => {
	// return <div className="App">{isMobile ? <MapsMobile /> : <MapsDesktop />}</div>;
	return (
		<div>
			<Suspense fallback={<div></div>}>{isMobile ? <MapsMobile /> : <MapsDesktop />}</Suspense>
		</div>
	);
};

export default App;
