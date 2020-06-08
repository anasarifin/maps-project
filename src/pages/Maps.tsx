/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect } from "react";
// import Geocode from "react-geocode
import "../styles/Map.css";

const MapComponent = () => {
	const mapRef = useRef();
	// const searchRef = useRef();
	const [center, setCenter] = useState({
		lat: -6.2088,
		lng: 106.8456,
	});

	// --- Convert latlng to location name ---

	// Geocode.setApiKey(process.env.GOOGLE_API);
	// Geocode.setLanguage("en");
	// Geocode.setRegion("id");

	// const setGeo = (latlng) => {
	// 	Geocode.fromLatLng(latlng.lat, latlng.lng).then(
	// 		(response) => {
	// 			setName(response.results[0].formatted_address);
	// 		},
	// 		(error) => {
	// 			console.error(error);
	// 		},
	// 	);
	// };

	// useEffect(() => {
	// 	setGeo(center);
	// }, []);

	// ---------------------------------------

	// Cannot use React Element to create custom popup, must using string
	const contentString = `
	<form id="map-form">
	<label>Provinsi :</label>
	<input class="map-form-input" />
	<label>Kabupaten :</label>
	<input class="map-form-input" />
	<label>Kelurahan :</label>
	<input class="map-form-input" />
	<label>Kecamatan :</label>
	<input class="map-form-input" />
	<label>Jalan :</label>
	<input class="map-form-input" />
	<button type="submit">Submit</button>
    </form>`;

	// Get value using traditional dom, because can't use React Element
	const onSubmitHandler = (e: Event): void => {
		e.preventDefault();

		const inputValue = document.getElementsByClassName("map-form-input") as HTMLCollectionOf<HTMLInputElement>;
		const [provinsi, kabupaten, kelurahan, kecamatan, jalan] = inputValue;

		if (!provinsi.value) return alert("Nama provinsi belum diisi!");
		if (!kabupaten.value) return alert("Nama kabupaten belum diisi!");
		if (!kelurahan.value) return alert("Nama kelurahan belum diisi!");
		if (!kecamatan.value) return alert("Nama kecamatan belum diisi!");
		if (!jalan.value) return alert("Nama jalan belum diisi!");

		console.log({
			provinsi: provinsi.value,
			kabupaten: kabupaten.value,
			kelurahan: kelurahan.value,
			kecamatan: kecamatan.value,
			jalan: jalan.value,
		});

		alert("See console...");
	};

	// Initialize an variables to call it later
	let googleMap;
	let marker;

	useEffect(() => {
		// Create script element and call google maps api
		const googleScript = document.createElement("script");
		googleScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_API}&libraries=places`;
		window.document.body.appendChild(googleScript);

		googleScript.addEventListener("load", () => {
			googleMap = createGoogleMap();
			marker = createMarker();
			// searchBox = createSearchBox();
			mapEventListener();
		});
	}, []);

	const createGoogleMap = (): any => {
		return new window.google.maps.Map(mapRef.current, {
			zoom: 16,
			center: center,
			clickableIcons: false,
		});
	};

	// const createSearchBox = (): any => {
	// 	const searchRef = document.getElementById("searchRef");
	// 	const searchElement = new window.google.maps.places.SearchBox(searchRef);
	// 	googleMap.controls[window.google.maps.ControlPosition.TOP_LEFT].push(searchRef);
	// 	return searchElement;
	// };

	const createMarker = (): any => {
		return new window.google.maps.Marker({
			position: center,
			map: googleMap,
		});
	};

	// Apply onSubmitHandler event when dom is ready
	const watchSubmit = (infoWindow: any): void => {
		window.google.maps.event.addListener(infoWindow, "domready", (): void => {
			document.getElementById("map-form").addEventListener("submit", onSubmitHandler);
		});
	};

	const mapEventListener = (): void => {
		let infoWindow = new window.google.maps.InfoWindow({
			content: contentString,
			position: center,
		});
		infoWindow.open(googleMap);
		watchSubmit(infoWindow);

		// googleMap.addListener("bounds_changed", function () {
		// 	searchBox.setBounds(googleMap.getBounds());
		// 	console.log(googleMap.getBounds());
		// 	console.log(searchBox);
		// });

		googleMap.addListener("click", (e: any): any => {
			infoWindow.close();
			infoWindow = new window.google.maps.InfoWindow({ position: e.latLng });
			infoWindow.setContent(contentString);
			infoWindow.open(googleMap);
			watchSubmit(infoWindow);

			marker.setMap(null);
			return (marker = new window.google.maps.Marker({
				position: { lat: e.latLng.lat(), lng: e.latLng.lng() },
				map: googleMap,
			}));
		});
	};

	return (
		<div className="map-page">
			<div className="map-container" ref={mapRef} />
			<input className="map-search-bar" placeholder="Search here..." />
		</div>
	);
};

declare global {
	interface Window {
		google: any;
	}
}

export default MapComponent;
