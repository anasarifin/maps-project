/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect } from "react";
import Axios from "axios";
import AxiosCancelRequest from "axios-cancel-request";
import "../styles/Map.css";
const AxiosCancelable = AxiosCancelRequest(Axios);

const MapComponent = () => {
	const mapRef = useRef();
	// const searchRef = useRef();
	const [center, setCenter] = useState({
		lat: -6.2088,
		lng: 106.8456,
	});
	const [data, setData] = useState({});

	// Cannot use React Element to create custom popup, must using string
	const contentString = `
	<div id="map-popup">
	</div>
	`;

	const contentStringInput = `
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

	const getLocation = (lat: number, lng: number) => {
		AxiosCancelable({ url: `https://siis-api.udata.id/dm_get_dagri/${lat}/${lng}` })
			.then((resolve) => {
				const parentElement = document.getElementById("map-popup");
				const { provinsi, kabupaten_kota, kecamatan, desa_kelurahan } = resolve.data[0];
				const child = `
				<div>
				<span>${provinsi}</span>
				<span>${kabupaten_kota}</span>
				<span>${kecamatan}</span>
				<span>${desa_kelurahan}</span>
				<span class="edit">Edit Data</span>
				</div>`;

				parentElement.insertAdjacentHTML("beforeend", child);
			})
			.catch((reject) => {
				if (!Axios.isCancel(reject)) {
					console.log(reject);
				}
			});
	};

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
			// document.getElementById("map-form").addEventListener("submit", onSubmitHandler);
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
			googleMap.panTo(e.latLng);
			infoWindow.setContent(contentString);
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
