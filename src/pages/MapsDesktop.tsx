/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import AxiosCancelRequest from "axios-cancel-request";
import "../styles/MapsDesktop.css";
import my_location from "../images/my_location.png";
const AxiosLocation = AxiosCancelRequest(axios);
const AxiosDirection = AxiosCancelRequest(axios);
const center = {
	lat: -6.2088,
	lng: 106.8456,
};

const MapComponent = () => {
	const mapRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const inputLatLng = useRef<HTMLFormElement>(null);
	const radiusRef = useRef<HTMLInputElement>(null);
	const [inputLat, setInputLat] = useState("");
	const [inputLng, setInputLng] = useState("");
	const [inputRadius, setInputRadius] = useState("200");
	const [searchName, setSearchName] = useState(true);

	// Initialize an variables to call it later
	let googleMap;
	let marker;
	let infoWindow;
	let circle;
	let polygon;
	let autoComplete;
	let odpMarker = [];
	let directionsService;
	let directionsRenderer;

	useEffect(() => {
		// Create script element and call google maps api
		const googleScript = document.createElement("script");
		googleScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_API}&libraries=places,geometry`;
		window.document.body.appendChild(googleScript);

		googleScript.addEventListener("load", async () => {
			// Maps initialize
			googleMap = new window.google.maps.Map(mapRef.current, {
				zoom: 15,
				center: center,
				clickableIcons: false,
				fullscreenControl: false,
				mapTypeControl: true,
				gestureHandling: "greedy",
				mapTypeControlOptions: {
					position: window.google.maps.ControlPosition.BOTTOM_CENTER,
				},
			});

			// --- NOTE ---
			// You can't use React State inside window.google class,
			// so use traditional dom or React useRef
			// ------------

			// Marker initialize
			marker = new window.google.maps.Marker({
				map: googleMap,
				draggable: true,
				visible: false,
			});

			// InfoWindow initialize
			infoWindow = new window.google.maps.InfoWindow();

			// AutoComplete initialize, cannot use useRef to get element
			const inputElement = document.getElementById("map-search-name");
			autoComplete = new window.google.maps.places.Autocomplete(inputElement, {
				fields: ["geometry", "name"],
				types: ["geocode"],
				componentRestrictions: { country: ["id"] },
			});
			autoComplete.bindTo("bounds", googleMap);

			// Radius circle initialize
			circle = new window.google.maps.Circle({
				map: googleMap,
				strokeColor: "#FF0000",
				strokeOpacity: 0,
				strokeWeight: 0,
				fillColor: "#FF0000",
				fillOpacity: 0.2,
				clickable: false,
			});

			// Polygon initialize
			polygon = new window.google.maps.Polygon({
				map: googleMap,
				paths: [],
				strokeColor: "#FF0000",
				strokeOpacity: 0.5,
				strokeWeight: 2,
				fillColor: "#FF0000",
				fillOpacity: 0.1,
				clickable: false,
			});

			// Directions initialize
			directionsService = new window.google.maps.DirectionsService();
			directionsRenderer = new window.google.maps.DirectionsRenderer({
				suppressMarkers: true,
				preserveViewport: true,
			});

			const searchBar = document.getElementsByClassName("map-search-bar")[0];
			const findMeIcon = document.getElementsByClassName("map-find-me")[0];
			const radiusSlider = document.getElementsByClassName("map-radius-slider")[0];
			googleMap.controls[window.google.maps.ControlPosition.TOP_LEFT].push(searchBar);
			googleMap.controls[window.google.maps.ControlPosition.RIGHT_BOTTOM].push(findMeIcon);
			googleMap.controls[window.google.maps.ControlPosition.TOP_LEFT].push(radiusSlider);

			mapEventListener();
		});
	}, []);

	const getLocation = (lat: number, lng: number) => {
		odpMarker.map((x) => x.setMap(null));
		if (directionsRenderer) directionsRenderer.setMap(null);

		marker.setPosition({ lat, lng });
		marker.setVisible(true);

		infoWindow.setContent(`<div id="map-popup">Fetching data...</div>`);
		infoWindow.open(googleMap, marker);

		polygon.setMap(null);
		circle.setMap(null);
		circle.setMap(googleMap);
		circle.setCenter({ lat, lng });
		circle.setRadius(parseFloat(radiusRef.current.value));

		AxiosLocation({ url: `https://siis-api.udata.id/point_kelurahan/${lng},${lat}` })
			.then((resolve) => {
				const polygonLayer = resolve.data.data[0].shape
					.slice(11, -2)
					.split(", ")
					.map((x: string) => {
						const split = x.split(" ");
						return { lat: parseFloat(split[1]), lng: parseFloat(split[0]) };
					});
				polygon.setPath(polygonLayer);
				polygon.setMap(googleMap);

				// Cannot use React Element to create custom popup, must using string
				const parentElement = document.getElementById("map-popup");
				if (parentElement) {
					const { provinsi, kabupaten, kecamatan, kelurahan } = resolve.data.data[0];
					const child = `
				<div>
					<span>${provinsi}</span>
					<span>${kabupaten}</span>
					<span>${kecamatan}</span>
					<span>${kelurahan}</span><br/>
					<span id="map-popup-odp-loading">Fetching ODP data...</span>
				</div>`;

					parentElement.innerHTML = "";
					parentElement.insertAdjacentHTML("beforeend", child);
				}

				getDirection(lat, lng);
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

	const getDirection = (lat: number, lng: number): void => {
		console.log(radiusRef.current.value);
		AxiosDirection({ url: "http://digitasi-consumer-siis-dev.vsan-apps.playcourt.id/api/siis/v1/get-odp", method: "post", data: { lat: lat, long: lng, radius: radiusRef.current.value }, auth: { username: "telkom", password: process.env.ODP_PASSWORD } })
			.then((resolve) => {
				const odpData = resolve.data.data.features.filter((x: ODP) => x.attributes.portidlenumber > 0);
				let odpPercent = 0;
				if (odpData.length) {
					const devicePort = odpData.map((x: ODP) => x.attributes.deviceportnumber).reduce((acc: number, x: number) => acc + x);
					const idlePort = odpData.map((x: ODP) => x.attributes.portidlenumber).reduce((acc: number, x: number) => acc + x);
					odpPercent = parseFloat(((idlePort / devicePort) * 100).toFixed(1));
				}
				const loading = document.getElementById("map-popup-odp-loading");
				loading.innerHTML = `${odpData.length} ODP found (${odpPercent}%)`;
				odpMarker = [];
				googleMap.setCenter({ lat: lat, lng: lng });
				if (odpData.length) googleMap.setZoom(17);

				odpData.forEach((x: ODP, i: number) => {
					const data = x.attributes;
					let color: string;
					switch (data.status_occ_add) {
						case "RED":
							color = "red";
							break;
						case "YELLOW":
							color = "yellow";
							break;
						case "GREEN":
							color = "green";
							break;
						default:
							color = "black";
					}

					odpMarker.push(
						new window.google.maps.Marker({
							map: googleMap,
							position: { lat: data.lat, lng: data.long },
							icon: {
								path: window.google.maps.SymbolPath.CIRCLE,
								scale: 6,
								fillColor: color,
								fillOpacity: 0.9,
								strokeWeight: 0,
							},
						}),
					);

					odpMarker[i].infoWindow = new window.google.maps.InfoWindow({
						content: `<div>
						<span>Latitude: ${data.lat}</span><br/>
						<span>Longitude: ${data.long}</span><br/>
						<span>Device ID: ${data.device_id}</span><br/>
						<span>Device name: ${data.devicename}</span><br/>
						<span>Status: ${data.status_occ_add}</span><br/>
						<span>Port number: ${data.deviceportnumber}</span><br/>
						<span>Idle port: ${data.portidlenumber}</span>
					</div>`,
					});

					odpMarker[i].addListener("mouseover", () => {
						infoWindow.close();
						odpMarker.map((x) => x.infoWindow.close());
						odpMarker[i].infoWindow.open(googleMap, odpMarker[i]);
					});

					odpMarker[i].addListener("mouseout", () => {
						odpMarker[i].infoWindow.close();
					});

					odpMarker[i].addListener("click", () => {
						infoWindow.close();
						odpMarker.map((x) => x.infoWindow.close());
						odpMarker[i].infoWindow.open(googleMap, odpMarker[i]);
						directionsService.route(
							{
								origin: `${lat},${lng}`,
								destination: `${data.lat},${data.long}`,
								travelMode: "WALKING",
							},
							(response, status) => {
								if (status === "OK") {
									directionsRenderer.setMap(googleMap);
									directionsRenderer.setDirections(response);
								} else {
									window.alert("Directions request failed due to " + status);
								}
							},
						);
					});
				});
			})
			.catch((reject) => {
				if (!axios.isCancel(reject)) {
					console.log(reject);
					const loading = document.getElementById("map-popup-odp-loading");
					loading.innerHTML = `Fetching ODP failed!`;
				}
			});
	};

	const mapEventListener = (): void => {
		window.google.maps.event.addListener(autoComplete, "place_changed", () => {
			const place = autoComplete.getPlace();
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

			getLocation(location.lat(), location.lng());
		});

		marker.addListener("click", (): void => {
			if (!infoWindow.getMap()) {
				infoWindow.open(googleMap, marker);
			}
		});

		marker.addListener("mouseover", (): void => {
			odpMarker.map((x) => x.infoWindow.close());
			infoWindow.open(googleMap, marker);
		});

		marker.addListener("dragstart", (): void => {
			infoWindow.close();
		});

		marker.addListener("dragend", (): void => {
			const location = marker.getPosition();

			infoWindow.setContent(`<div id="map-popup">Fetching data...</div>`);
			infoWindow.open(googleMap, marker);

			polygon.setMap(null);
			getLocation(location.lat(), location.lng());
		});

		googleMap.addListener("click", (e: any): void => {
			if (inputRef.current) inputRef.current.value = "";
			getLocation(e.latLng.lat(), e.latLng.lng());
		});

		inputLatLng.current.addEventListener("submit", (e: Event): void => {
			e.preventDefault();

			const element = inputLatLng.current.querySelectorAll("input");
			const location = {
				lat: parseFloat(element[0].value) || 0,
				lng: parseFloat(element[1].value) || 0,
			};

			getLocation(location.lat, location.lng);
		});
	};

	const findMe = () => {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				({ coords }) => {
					if (inputRef.current) inputRef.current.value = "";
					const position = {
						lat: coords.latitude,
						lng: coords.longitude,
					};

					googleMap.setCenter(position);
					googleMap.setZoom(17);
					getLocation(coords.latitude, coords.longitude);
				},
				() => {
					alert("The Geolocation service failed.");
				},
			);
		} else {
			alert("Your browser doesn't support geolocation.");
		}
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
			<div className="map-container" ref={mapRef} />
			<div className="map-search-bar">
				<div className="map-search-option">
					<div onClick={() => setSearchName(true)} className={searchName ? "active" : ""}>
						Search by name
					</div>
					<div onClick={() => setSearchName(false)} className={searchName ? "" : "active"}>
						Search by latlong
					</div>
				</div>
				<input id="map-search-name" ref={inputRef} placeholder="Search here..." style={{ display: searchName ? "inline-block" : "none" }} />
				<form ref={inputLatLng} style={{ display: !searchName ? "block" : "none" }}>
					<input placeholder="Latitude" value={inputLat} onChange={(e) => onChangeLat(e.target.value)} />
					<br />
					<input placeholder="Longitude" value={inputLng} onChange={(e) => onChangeLng(e.target.value)} />
					<button type="submit">Search</button>
				</form>
			</div>
			<div className="map-find-me" onClick={findMe}>
				<img src={my_location} alt="find_me" />
			</div>
			<div className="map-radius-slider">
				<input
					type="range"
					ref={radiusRef}
					min="100"
					max="300"
					step="25"
					value={inputRadius}
					onChange={(e) => {
						setInputRadius(e.target.value);
					}}
				/>
				<br />
				<span>Radius: {inputRadius}</span>
			</div>
		</div>
	);
};

declare global {
	interface Window {
		google: any;
	}
}

interface Attributes {
	device_id: number;
	devicename: string;
	lat: number;
	long: number;
	status_occ_add: string;
	portidlenumber: number;
	deviceportnumber: number;
}
interface ODP {
	attributes: Attributes;
}

export default MapComponent;
