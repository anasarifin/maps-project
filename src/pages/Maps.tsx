/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import AxiosCancelRequest from "axios-cancel-request";
import "../styles/Map.css";
import InputForm from "../components/Maps/InputForm";
const Axios = AxiosCancelRequest(axios);

const MapComponent = () => {
	const mapRef = useRef();
	const inputRef = useRef();
	const inputLatLng = useRef();
	const [center, setCenter] = useState({
		lat: -6.2088,
		lng: 106.8456,
	});
	const [data, setData] = useState({});
	const [inputLat, setInputLat] = useState("");
	const [inputLng, setInputLng] = useState("");
	const [formShow, setFormShow] = useState(false);
	const [searchName, setSearchName] = useState(true);

	// Initialize an variables to call it later
	let googleMap;
	let marker;
	let infoWindow;
	let kmlLayer;
	let autoComplete;

	useEffect(() => {
		// Create script element and call google maps api
		const googleScript = document.createElement("script");
		googleScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_API}&libraries=places,geometry`;
		window.document.body.appendChild(googleScript);

		googleScript.addEventListener("load", async () => {
			googleMap = await createGoogleMap();
			marker = await createMarker();
			infoWindow = await createInfoWindow();
			autoComplete = await createAutoComplete();
			kmlLayer = await createKmlLayer();
			mapEventListener();
		});
	}, []);

	const getLocation = (lat: number, lng: number) => {
		Axios({ url: `https://siis-api.udata.id/point_kelurahan/${lng},${lat}` })
			.then((resolve) => {
				setData(resolve.data.data[0]);
				const polygon = resolve.data.data[0].shape
					.slice(11, -2)
					.split(", ")
					.map((x: string) => {
						const split = x.split(" ");
						return { lat: parseFloat(split[1]), lng: parseFloat(split[0]) };
					});
				kmlLayer.setPath(polygon);
				kmlLayer.setMap(googleMap);

				// Cannot use React Element to create custom popup, must using string
				const parentElement = document.getElementById("map-popup");
				const { provinsi, kabupaten, kecamatan, kelurahan } = resolve.data.data[0];
				const child = `
				<div>
					<span>${provinsi}</span>
					<span>${kabupaten}</span>
					<span>${kecamatan}</span>
					<span>${kelurahan}</span>
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
				if (!axios.isCancel(reject)) {
					console.log(reject);
					const parentElement = document.getElementById("map-popup");
					const child = `
					<div>
						<div>Fetching failed !</div>
						<span id="map-popup-edit">Try again...</span>
					</div>
					`;

					parentElement.innerHTML = "";
					parentElement.insertAdjacentHTML("beforeend", child);
					document.getElementById("map-popup-edit").addEventListener("click", () => {
						infoWindow.setContent(`<div id="map-popup">Fetching again...</div>`);
						const position = marker.getPosition();
						getLocation(position.lat(), position.lng());
					});
				}
			});
	};

	const createGoogleMap = (): any => {
		return new window.google.maps.Map(mapRef.current, {
			zoom: 15,
			center: center,
			clickableIcons: false,
			fullscreenControl: false,
			mapTypeControl: true,
			mapTypeControlOptions: {
				position: window.google.maps.ControlPosition.BOTTOM_CENTER,
			},
		});
	};

	const createMarker = (): any => {
		return new window.google.maps.Marker({
			position: center,
			map: googleMap,
			draggable: true,
		});
	};

	const createInfoWindow = (): any => {
		const returnInfoWindow = new window.google.maps.InfoWindow({
			content: `<div id="map-popup">Fetching data...</div>`,
			position: center,
		});
		returnInfoWindow.open(googleMap);
		getLocation(center.lat, center.lng);

		return returnInfoWindow;
	};

	const createKmlLayer = (): any => {
		const returnPolygon = new window.google.maps.Polygon({
			paths: [],
			strokeColor: "#FF0000",
			strokeOpacity: 0.8,
			strokeWeight: 2,
			fillColor: "#FF0000",
			fillOpacity: 0.25,
			clickable: false,
		});
		returnPolygon.setMap(googleMap);

		return returnPolygon;
	};

	const createAutoComplete = (): any => {
		// Cannot use useRef() to get element
		const inputElement = document.getElementById("map-search-name");
		const inputReturn = new window.google.maps.places.Autocomplete(inputElement);

		inputReturn.bindTo("bounds", googleMap);
		inputReturn.setTypes(["geocode"]);
		inputReturn.setComponentRestrictions({ country: ["id"] });
		inputReturn.setFields(["geometry", "name"]);

		return inputReturn;
	};

	const mapEventListener = (): void => {
		// SearchBox event listener
		// const dummyDiv = document.getElementsByClassName("map-padding")[0];
		// googleMap.controls[window.google.maps.ControlPosition.TOP_CENTER].push(dummyDiv);

		window.google.maps.event.addListener(autoComplete, "place_changed", () => {
			const place = autoComplete.getPlace();
			console.log(place);
			if (!place.geometry) {
				alert("Quota exceeded!");
				return;
			}

			const { location, viewport } = place.geometry;
			if (viewport) {
				googleMap.fitBounds(place.geometry.viewport);
			} else {
				googleMap.setCenter(place.geometry.location);
				googleMap.setZoom(16);
			}

			infoWindow.close();
			infoWindow.setContent(`<div id="map-popup">Fetching data...</div>`);
			infoWindow.open(googleMap);
			infoWindow.setPosition(location);

			marker.setVisible(false);
			marker.setPosition(location);
			marker.setVisible(true);

			getLocation(location.lat(), location.lng());
			kmlLayer.setMap(null);
		});

		marker.addListener("click", (): void => {
			if (!infoWindow.getMap()) {
				const location = marker.getPosition();

				infoWindow.close();
				infoWindow.setContent(`<div id="map-popup">Fetching data...</div>`);
				infoWindow.open(googleMap);
				infoWindow.setPosition(location);

				getLocation(location.lat(), location.lng());
			}
		});

		marker.addListener("dragstart", (): void => {
			infoWindow.close();
		});

		marker.addListener("dragend", (): void => {
			const location = marker.getPosition();

			infoWindow.close();
			infoWindow.setContent(`<div id="map-popup">Fetching data...</div>`);
			infoWindow.open(googleMap);
			infoWindow.setPosition(location);

			kmlLayer.setMap(null);
			getLocation(location.lat(), location.lng());
		});

		// Maps on click event listener
		googleMap.addListener("click", (e: any): void => {
			if (inputRef.current) inputRef.current.value = "";

			infoWindow.close();
			// googleMap.panTo(e.latLng);
			infoWindow.setContent(`<div id="map-popup">Fetching data...</div>`);
			infoWindow.open(googleMap);
			infoWindow.setPosition(e.latLng);

			kmlLayer.setMap(null);
			getLocation(e.latLng.lat(), e.latLng.lng());

			marker.setVisible(false);
			marker.setPosition(e.latLng);
			marker.setVisible(true);

			// const www = new window.google.maps.LatLngBounds();
			// www.extend(marker.getPosition());
			// googleMap.fitBounds(www);
			// if (e.tb.clientY <= 260) {
			// 	const centerNow = googleMap.getCenter();
			// 	setTimeout(() => {
			// 		googleMap.panTo({ lat: centerNow.lat() + 0.005, lng: centerNow.lng() });
			// 	}, 50);
			// }
		});

		inputLatLng.current.addEventListener("submit", (e: Event): void => {
			e.preventDefault();

			// Cannot use React state, must using traditional way to get value
			const element = inputLatLng.current.querySelectorAll("input");
			const location = {
				lat: parseFloat(element[0].value) || 0,
				lng: parseFloat(element[1].value) || 0,
			};

			console.log(location);
			infoWindow.close();
			googleMap.panTo(location);
			infoWindow.setContent(`<div id="map-popup">Fetching data...</div>`);
			infoWindow.open(googleMap);
			infoWindow.setPosition(location);
			getLocation(location.lat, location.lng);

			marker.setVisible(false);
			marker.setPosition(location);
			marker.setVisible(true);
		});
	};

	const onChangeLat = (value?: string): void => {
		const regex = /^[0-9.-]*$/;
		if (regex.test(value)) {
			setInputLat(value);
		}
	};
	const onChangeLng = (value?: string): void => {
		const regex = /^[0-9.-]*$/;
		if (regex.test(value)) {
			setInputLng(value);
		}
	};

	return (
		<div className="map-page">
			{/* <div className="map-padding" style={{ width: "100%", height: 30, backgroundColor: "red" }} /> */}
			<div className="map-container" ref={mapRef} />
			<div
				className="map-search-bar"
				onClick={() => {
					console.log(1);
				}}>
				<span onClick={() => setSearchName(true)} className={searchName ? "active" : ""}>
					Search by name
				</span>
				<span onClick={() => setSearchName(false)} className={searchName ? "" : "active"}>
					Search by latlong
				</span>
				<br />
				<input id="map-search-name" ref={inputRef} placeholder="Search here..." style={{ display: searchName ? "inline-block" : "none" }} />
				<form ref={inputLatLng} style={{ display: !searchName ? "block" : "none" }}>
					<input placeholder="Latitude" value={inputLat} onChange={(e) => onChangeLat(e.target.value)} />
					<br />
					<input placeholder="Longitude" value={inputLng} onChange={(e) => onChangeLng(e.target.value)} />
					<button type="submit">Search</button>
				</form>
			</div>
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
