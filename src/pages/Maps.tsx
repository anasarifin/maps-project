/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import AxiosCancelRequest from "axios-cancel-request";
import "../styles/Map.css";
import InputForm from "../components/Maps/InputForm";
import pin_red from "../images/pin_red.png";
import pin_yellow from "../images/pin_yellow.png";
import pin_green from "../images/pin_green.png";
import pin_black from "../images/pin_black.png";
const AxiosLocation = AxiosCancelRequest(axios);
const AxiosDirection = AxiosCancelRequest(axios);

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
	let odpMarker = [];
	let directionsService;
	let directionsRenderer;

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
			directionsService = new window.google.maps.DirectionsService();
			directionsRenderer = new window.google.maps.DirectionsRenderer({
				map: googleMap,
				suppressMarkers: true,
				preserveViewport: true,
				// polylineOptions: {
				// 	strokeColor: "green",
				// },
			});
		});
	}, []);

	const getLocation = (lat: number, lng: number) => {
		AxiosLocation({ url: `https://siis-api.udata.id/point_kelurahan/${lng},${lat}` })
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
					// document.getElementById("map-popup-edit").addEventListener("click", () => {
					// 	document.getElementById("map-input-form").style.display = "grid";
					// 	setTimeout(() => {
					// 		setFormShow(true);
					// 	}, 10);
					// });
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
		AxiosDirection({ url: "http://digitasi-consumer-siis-dev.vsan-apps.playcourt.id/api/siis/v1/get-odp", method: "post", data: { lat: lat, long: lng, radius: 200 }, auth: { username: "telkom", password: process.env.ODP_PASSWORD } })
			.then((resolve) => {
				const odpData = resolve.data.data.features.filter((x) => x.attributes.portidlenumber > 0);
				const loading = document.getElementById("map-popup-odp-loading");
				loading.innerHTML = `Found ${odpData.length} ODP available`;
				odpMarker.map((x) => x.setMap(null));
				odpMarker = [];
				googleMap.setCenter({ lat: lat, lng: lng });
				googleMap.setZoom(17);

				console.log(odpData);
				odpData.forEach((x, i) => {
					const data = x.attributes;
					let pin: string;
					switch (data.status_occ_add) {
						case "RED":
							pin = pin_red;
							break;
						case "YELLOW":
							pin = pin_yellow;
							break;
						case "GREEN":
							pin = pin_green;
							break;
						default:
							pin = pin_black;
							break;
					}

					odpMarker.push(
						new window.google.maps.Marker({
							map: googleMap,
							position: { lat: data.lat, lng: data.long },
							icon: {
								url: pin,
								size: new window.google.maps.Size(32, 32),
								origin: new window.google.maps.Point(0, 0),
								anchor: new window.google.maps.Point(16, 32),
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
			map: googleMap,
			draggable: true,
			visible: false,
		});
	};

	const createInfoWindow = (): any => {
		return new window.google.maps.InfoWindow();
	};

	const createKmlLayer = (): any => {
		return new window.google.maps.Polygon({
			map: googleMap,
			paths: [],
			strokeColor: "#FF0000",
			strokeOpacity: 0.5,
			strokeWeight: 2,
			fillColor: "#FF0000",
			fillOpacity: 0.1,
			clickable: false,
		});
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

			marker.setPosition(location);
			marker.setVisible(true);

			infoWindow.setContent(`<div id="map-popup">Fetching data...</div>`);
			infoWindow.open(googleMap, marker);

			kmlLayer.setMap(null);
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

			kmlLayer.setMap(null);
			getLocation(location.lat(), location.lng());
		});

		// Maps on click event listener
		googleMap.addListener("click", (e: any): void => {
			if (inputRef.current) inputRef.current.value = "";

			marker.setPosition(e.latLng);
			marker.setVisible(true);

			// googleMap.panTo(e.latLng);
			infoWindow.setContent(`<div id="map-popup">Fetching data...</div>`);
			infoWindow.open(googleMap, marker);

			kmlLayer.setMap(null);
			getLocation(e.latLng.lat(), e.latLng.lng());

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

			marker.setPosition(location);
			marker.setVisible(true);
			googleMap.panTo(location);

			infoWindow.setContent(`<div id="map-popup">Fetching data...</div>`);
			infoWindow.open(googleMap, marker);

			getLocation(location.lat, location.lng);
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
