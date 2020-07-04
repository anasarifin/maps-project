/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import AxiosCancelRequest from "axios-cancel-request";
import "../styles/Map.css";
import pin_red from "../images/pin_red.png";
import pin_yellow from "../images/pin_yellow.png";
import pin_green from "../images/pin_green.png";
import pin_black from "../images/pin_black.png";
import my_location from "../images/my_location.png";
const AxiosLocation = AxiosCancelRequest(axios);
const AxiosDirection = AxiosCancelRequest(axios);
const center = {
	lat: -6.2088,
	lng: 106.8456,
};

function titleCase(str: String) {
	return str
		.toLowerCase()
		.split(" ")
		.map(function (word) {
			return word.replace(word[0], word[0].toUpperCase());
		})
		.join(" ");
}

const MapComponent = () => {
	const mapRef = useRef();
	const inputRef = useRef();
	const bottomRef = useRef();
	const radiusRef = useRef();
	const [data, setData] = useState("");
	const [status, setStatus] = useState("");
	const [odpStatus, setOdpStatus] = useState("");
	const [touchStart, setTouchStart] = useState();
	const [inputRadius, setInputRadius] = useState(200);
	const [bottomShow, setBottomShow] = useState(false);
	const [bottomFirstShow, setBottomFirstShow] = useState(true);

	// Initialize an variables to call it later
	let googleMap;
	let marker;
	let infoWindow;
	let polygon;
	let autoComplete;
	let odpMarker = [];
	let directionsService;
	let directionsRenderer;

	useEffect(() => {
		// Create script element and call google maps api
		const googleScript = document.createElement("script");
		googleScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_APIX}&libraries=places,geometry`;
		window.document.body.appendChild(googleScript);

		googleScript.addEventListener("load", async () => {
			// Maps initialize
			googleMap = new window.google.maps.Map(mapRef.current, {
				zoom: 15,
				center: center,
				clickableIcons: false,
				disableDefaultUI: true,
				gestureHandling: "greedy",
				mapTypeControlOptions: {
					position: window.google.maps.ControlPosition.BOTTOM_CENTER,
				},
			});

			// Marker initialize
			marker = new window.google.maps.Marker({
				map: googleMap,
				draggable: true,
				visible: false,
			});

			// InfoWindow initialize
			infoWindow = new window.google.maps.InfoWindow();

			// AutoComplete initialize, cannot use useRef to get element
			const inputElement = document.getElementById("map-search-mobile");
			autoComplete = new window.google.maps.places.Autocomplete(inputElement, {
				fields: ["geometry", "name"],
				types: ["geocode"],
				componentRestrictions: { country: ["id"] },
			});
			autoComplete.bindTo("bounds", googleMap);

			// Polygon initialize
			polygon = new window.google.maps.Polygon({
				map: googleMap,
				paths: [],
				strokeColor: "#FF0000",
				strokeOpacity: 0.5,
				strokeWeight: 3,
				fillOpacity: 0,
				clickable: false,
			});

			// Directions initialize
			directionsService = new window.google.maps.DirectionsService();
			directionsRenderer = new window.google.maps.DirectionsRenderer({
				suppressMarkers: true,
				preserveViewport: true,
			});

			mapEventListener();
		});
	}, []);

	const getLocation = (lat: number, lng: number) => {
		odpMarker.map((x) => x.setMap(null));
		if (directionsRenderer) directionsRenderer.setMap(null);

		AxiosLocation({ url: `https://siis-api.udata.id/point_kelurahan/${lng},${lat}` })
			.then((resolve) => {
				const { provinsi, kabupaten, kecamatan, kelurahan, shape } = resolve.data.data[0];
				const polygonLayer = shape
					.slice(11, -2)
					.split(", ")
					.map((x: string) => {
						const split = x.split(" ");
						return { lat: parseFloat(split[1]), lng: parseFloat(split[0]) };
					});
				polygon.setPath(polygonLayer);
				polygon.setMap(googleMap);
				const kota = kabupaten.split(" ")[0] === "KOTA" ? kabupaten.replace("KOTA ", "") : kabupaten;

				const name = `Kel. ${titleCase(kelurahan)}, Kec. ${titleCase(kecamatan)}, ${kota ? "Kota" : "Kab."} ${titleCase(kota)}, ${titleCase(provinsi).replace("Dki", "DKI")}`;

				setData(name);
				setOdpStatus("Fetching ODP data...");
				getDirection(lat, lng);
			})
			.catch((reject) => {
				if (!axios.isCancel(reject)) {
					console.log(reject);
					setStatus("Fetching failed!");
				}
			});
	};

	const getDirection = (lat: number, lng: number): void => {
		AxiosDirection({ url: "http://digitasi-consumer-siis-dev.vsan-apps.playcourt.id/api/siis/v1/get-odp", method: "post", data: { lat: lat, long: lng, radius: radiusRef.current.value }, auth: { username: "telkom", password: process.env.ODP_PASSWORD } })
			.then((resolve) => {
				const odpData = resolve.data.data.features.filter((x) => x.attributes.portidlenumber > 0);
				setOdpStatus(`${odpData.length} ODP available`);
				odpMarker = [];
				googleMap.setCenter({ lat: lat, lng: lng });
				if (odpData.length) googleMap.setZoom(17);

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
					setOdpStatus("Fetching ODP failed!");
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

			marker.setPosition(location);
			marker.setVisible(true);

			setStatus("Fetching data...");

			polygon.setMap(null);
			getLocation(location.lat(), location.lng());
		});

		marker.addListener("click", (): void => {
			if (!infoWindow.getMap()) {
				infoWindow.open(googleMap, marker);
			}
		});

		marker.addListener("dragend", (): void => {
			const location = marker.getPosition();

			setStatus("Fetching data...");

			polygon.setMap(null);
			getLocation(location.lat(), location.lng());
		});

		googleMap.addListener("click", (e: any): void => {
			if (inputRef.current) inputRef.current.value = "";

			marker.setPosition(e.latLng);
			marker.setVisible(true);

			setStatus("Fetching data...");

			polygon.setMap(null);
			getLocation(e.latLng.lat(), e.latLng.lng());
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

					marker.setPosition(position);
					marker.setVisible(true);

					infoWindow.setContent(`<div id="map-popup">Fetching data...</div>`);
					infoWindow.open(googleMap, marker);
					polygon.setMap(null);

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

	const touchMoveHandler = (e: TouchEvent) => {
		const touchPos = e.changedTouches[0].clientY;
		let touchStartEdge = window.innerHeight - touchStart;
		let value = window.innerHeight - touchPos + touchStartEdge;
		if (bottomShow) {
			touchStartEdge = 300 - (window.innerHeight - touchStart);
			value = 300 - (touchPos - (window.innerHeight - 300) - touchStartEdge);

			window;
		}

		if (value > 300) value = 300;
		bottomRef.current.style.transition = "none";
		bottomRef.current.style.bottom = value + "px";
	};

	const touchEndHandler = () => {
		const bottomPos = Number(bottomRef.current.style.bottom.replace("px", ""));
		if (bottomPos > 150) {
			bottomRef.current.style.transition = ".3s";
			bottomRef.current.style.bottom = "300px";
			setBottomShow(true);
		} else {
			bottomRef.current.style.transition = ".3s";
			bottomRef.current.style.bottom = bottomFirstShow ? "20px" : "70px";
			setBottomShow(false);
		}
	};

	return (
		<div className="map-page" style={{ height: window.innerHeight }}>
			<div className="map-container" ref={mapRef} />
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
			<div id="map-search-mobile">
				<input placeholder="Search here..." />
				<img src={my_location} alt="find-me" />
			</div>
			<div
				className="map-bottom"
				ref={bottomRef}
				style={{ bottom: bottomFirstShow ? 20 : 70 }}
				onTouchStart={(e: TouchEvent) => {
					setTouchStart(e.touches[0].clientY);
				}}
				onTouchMove={touchMoveHandler}
				onTouchEnd={touchEndHandler}>
				<div className="map-bottom-data">{data}</div>
				<div className="map-bottom-odp">{odpStatus}</div>
			</div>
		</div>
	);
};

declare global {
	interface Window {
		google: any;
	}
}

export default MapComponent;