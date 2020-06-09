/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect } from "react";
import Axios from "axios";
import AxiosCancelRequest from "axios-cancel-request";
import "../styles/Map.css";
import InputForm from "../components/Maps/InputForm";
const AxiosCancelable = AxiosCancelRequest(Axios);

const MapComponent = () => {
	const mapRef = useRef();
	const inputRef = useRef();
	const [center, setCenter] = useState({
		lat: -6.2088,
		lng: 106.8456,
	});
	const [data, setData] = useState({});
	const [formShow, setFormShow] = useState(false);

	// Initialize an variables to call it later
	let googleMap;
	let marker;
	let autoComplete;

	useEffect(() => {
		// Create script element and call google maps api
		const googleScript = document.createElement("script");
		googleScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_API}&libraries=places,geometry`;
		window.document.body.appendChild(googleScript);

		googleScript.addEventListener("load", async () => {
			googleMap = await createGoogleMap();
			marker = await createMarker();
			autoComplete = await createAutoComplete();
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
			fullscreenControl: false,
		});
	};

	const createMarker = (): any => {
		return new window.google.maps.Marker({
			position: center,
			map: googleMap,
		});
	};

	const createAutoComplete = (): any => {
		// Cannot use useRef() to get element
		const inputElement = document.getElementsByClassName("map-search-bar")[0];
		return new window.google.maps.places.Autocomplete(inputElement);
	};

	const mapEventListener = (): void => {
		let infoWindow = new window.google.maps.InfoWindow({
			content: `<div id="map-popup">Fetching data...</div>`,
			position: center,
		});
		infoWindow.open(googleMap);

		autoComplete.bindTo("bounds", googleMap);
		autoComplete.setTypes(["geocode"]);
		autoComplete.setComponentRestrictions({ country: ["id"] });
		autoComplete.setFields(["address_components", "geometry", "icon", "name"]);

		window.google.maps.event.addListener(autoComplete, "place_changed", function () {
			infoWindow.close();
			marker.setVisible(false);
			var place = autoComplete.getPlace();
			console.log(place);
			if (!place.geometry) {
				alert("No details available for input: '" + place.name + "'");
				return;
			}

			if (place.geometry.viewport) {
				googleMap.fitBounds(place.geometry.viewport);
			} else {
				googleMap.setCenter(place.geometry.location);
				googleMap.setZoom(17);
			}

			const { location } = place.geometry;
			infoWindow.setContent(`<div id="map-popup">Fetching data...</div>`);
			getLocation(location.lat(), location.lng());
			infoWindow.open(googleMap);

			marker.setPosition(place.geometry.location);
			marker.setVisible(true);
		});

		googleMap.addListener("click", (e: any): any => {
			infoWindow.close();
			infoWindow = new window.google.maps.InfoWindow({ position: e.latLng });
			googleMap.panTo(e.latLng);
			infoWindow.setContent(`<div id="map-popup">Fetching data...</div>`);
			getLocation(e.latLng.lat(), e.latLng.lng());
			infoWindow.open(googleMap);

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
			<input className="map-search-bar" ref={inputRef} placeholder="Search here... (not working yet)" />
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
