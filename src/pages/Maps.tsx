/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect } from "react";
import Axios from "axios";
import AxiosCancelRequest from "axios-cancel-request";
import "../styles/Map.css";
import InputForm from "../components/Maps/InputForm";
const AxiosCancelable = AxiosCancelRequest(Axios);

const MapComponent = () => {
	const mapRef = useRef();
	// const searchRef = useRef();
	const [center, setCenter] = useState({
		lat: -6.2088,
		lng: 106.8456,
	});
	const [data, setData] = useState({});
	const [formShow, setFormShow] = useState(false);

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
			mapEventListener();
		});
	}, []);

	const getLocation = (lat: number, lng: number) => {
		AxiosCancelable({ url: `https://siis-api.udata.id/dm_get_dagri/${lat}/${lng}` })
			.then((resolve) => {
				setData(resolve.data[0]);

				// Cannot use React Element to create custom popup, must using string
				const parentElement = document.getElementById("map-popup");
				const { provinsi, kabupaten_kota, kecamatan, desa_kelurahan } = resolve.data[0];
				const child = `
				<div>
				<span>${provinsi}</span>
				<span>${kabupaten_kota}</span>
				<span>${kecamatan}</span>
				<span>${desa_kelurahan}</span>
				<span id="map-popup-edit">Edit Data</span>
				</div>`;

				parentElement.innerHTML = "";
				parentElement.insertAdjacentHTML("beforeend", child);
				document.getElementById("map-popup-edit").addEventListener("click", () => {
					document.getElementById("map-input-form").style.display = "grid";
					setTimeout(() => {
						setFormShow(true);
					}, 10);
				});
			})
			.catch((reject) => {
				if (!Axios.isCancel(reject)) {
					console.log(reject);
				}
			});
	};

	useEffect(() => {
		getLocation(center.lat, center.lng);
	}, []);

	const createGoogleMap = (): any => {
		return new window.google.maps.Map(mapRef.current, {
			zoom: 16,
			center: center,
			clickableIcons: false,
		});
	};

	const createMarker = (): any => {
		return new window.google.maps.Marker({
			position: center,
			map: googleMap,
		});
	};

	// Apply onSubmitHandler event when dom is ready
	const watchSubmit = (infoWindow: any): void => {
		window.google.maps.event.addListener(infoWindow, "domready", (): void => {
			// document.getElementById("map-form").addEventListener("submit", onSubmitHandler);
		});
	};

	const mapEventListener = (): void => {
		let infoWindow = new window.google.maps.InfoWindow({
			content: `<div id="map-popup">Fetching data...</div>`,
			position: center,
		});
		infoWindow.open(googleMap);
		watchSubmit(infoWindow);

		googleMap.addListener("click", (e: any): any => {
			infoWindow.close();
			infoWindow = new window.google.maps.InfoWindow({ position: e.latLng });
			googleMap.panTo(e.latLng);
			infoWindow.setContent(`<div id="map-popup"/>Fetching data...</>`);
			getLocation(e.latLng.lat(), e.latLng.lng());
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
			<input className="map-search-bar" placeholder="Search here... (not working yet)" />
			<div className={"map-input-bg" + (formShow ? " show" : "")} />
			<InputForm show={formShow} hide={() => setFormShow(false)} data={data} />
		</div>
	);
};

declare global {
	interface Window {
		google: any;
	}
}

export default MapComponent;
