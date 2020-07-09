/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect, TouchEvent } from "react";
import axios from "axios";
import AxiosCancelRequest from "axios-cancel-request";
import "../styles/MapsMobile.css";
import my_location from "../images/my_location.png";
const AxiosLocation = AxiosCancelRequest(axios);
const AxiosDirection = AxiosCancelRequest(axios);
const center = {
	lat: -6.2088,
	lng: 106.8456,
};

function titleCase(str: string): string {
	return str
		.toLowerCase()
		.split(" ")
		.map(function (word) {
			return word.replace(word[0], word[0].toUpperCase());
		})
		.join(" ");
}

const MapComponent = () => {
	const mapRef = useRef<HTMLDivElement>();
	const inputRef = useRef<HTMLInputElement>();
	const bottomRef = useRef<HTMLDivElement>();
	const radiusRef = useRef<HTMLInputElement>();
	const [data, setData] = useState("");
	const [status, setStatus] = useState("No location selected.");
	const [loading, setLoading] = useState(true);
	const [odpStatus, setOdpStatus] = useState("");
	const [touchStart, setTouchStart] = useState(0);
	const [inputRadius, setInputRadius] = useState("200");
	const [radiusShow, setRadiusShow] = useState(false);
	const [bottomShow, setBottomShow] = useState(false);

	// 0: No menu, 1: Menu hide, 2: Menu show
	const [nearest, setNearest] = useState(0);

	// Initialize an variables to call it later
	let googleMap;
	let marker;
	let circle;
	let polygon;
	let autoComplete;
	let odpMarker = [];
	let directionsService;
	let directionsRenderer;
	let distanceMatrix;

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
				disableDefaultUI: true,
				gestureHandling: "greedy",
				mapTypeControlOptions: {
					position: window.google.maps.ControlPosition.BOTTOM_CENTER,
				},
			});

			// Marker initialize
			marker = new window.google.maps.Marker({
				map: googleMap,
				visible: false,
			});

			// AutoComplete initialize, cannot use useRef to get element
			autoComplete = new window.google.maps.places.Autocomplete(inputRef.current, {
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
				fillOpacity: 0,
				clickable: false,
			});

			// Directions initialize
			directionsService = new window.google.maps.DirectionsService();
			directionsRenderer = new window.google.maps.DirectionsRenderer({
				suppressMarkers: true,
				preserveViewport: true,
			});

			// Distance Matrix initialize
			distanceMatrix = new window.google.maps.DistanceMatrixService();

			mapEventListener();
		});
	}, []);

	const getLocation = (lat: number, lng: number) => {
		odpMarker.map((x) => x.setMap(null));
		if (directionsRenderer) directionsRenderer.setMap(null);

		marker.setPosition({ lat, lng });
		marker.setVisible(true);

		polygon.setMap(null);
		googleMap.panTo({ lat, lng });

		circle.setMap(null);
		circle.setMap(googleMap);
		circle.setCenter({ lat, lng });
		circle.setRadius(parseFloat(radiusRef.current.value));

		setLoading(true);
		setStatus("Fetching data...");

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

				setLoading(false);
				setData(name);
				setOdpStatus("Fetching ODP data...");

				bottomRef.current.style.transition = ".3s";
				bottomRef.current.style.bottom = "200px";
				setBottomShow(true);
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
				const odpData = resolve.data.data.features.filter((x: ODP) => x.attributes.portidlenumber > 0);
				let odpPercent = 0;
				if (odpData.length) {
					const devicePort = odpData.map((x: ODP) => x.attributes.deviceportnumber).reduce((acc: number, x: number) => acc + x);
					const idlePort = odpData.map((x: ODP) => x.attributes.portidlenumber).reduce((acc: number, x: number) => acc + x);
					odpPercent = parseFloat(((idlePort / devicePort) * 100).toFixed(1));
				}
				setOdpStatus(`${odpData.length} ODP found (${odpPercent}%)`);
				odpMarker = [];
				googleMap.setCenter({ lat: lat, lng: lng });
				if (odpData.length) {
					if (parseFloat(radiusRef.current.value) <= 150) {
						googleMap.setZoom(18);
					} else if (parseFloat(radiusRef.current.value) >= 250) {
						googleMap.setZoom(16);
					} else {
						googleMap.setZoom(17);
					}
				}
				if (bottomRef.current.dataset.show === "true") googleMap.panBy(0, 70);

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

					odpMarker[i].latlng = { lat: data.lat, lng: data.long };
					odpMarker[i].index = i;
					odpMarker[i].distance = window.google.maps.geometry.spherical.computeDistanceBetween(marker.getPosition(), odpMarker[i].getPosition());

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
						odpMarker.map((x) => {
							x.infoWindow.close();
							x.infoDistance?.close();
						});
						odpMarker[i].infoWindow.open(googleMap, odpMarker[i]);
						setNearest(1);
					});

					odpMarker[i].addListener("mouseout", () => {
						odpMarker[i].infoWindow.close();
					});

					odpMarker[i].addListener("click", () => {
						odpMarker.map((x) => {
							x.infoWindow.close();
							x.infoDistance?.close();
						});
						setNearest(1);

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

				const dataDistance = odpMarker
					.map((x) => {
						return { distance: x.distance, index: x.index, latlng: x.latlng };
					})
					.sort((a, b) => a.distance - b.distance)
					.filter((x, i) => i < 3);
				getDistance(dataDistance);
			})
			.catch((reject) => {
				if (!axios.isCancel(reject)) {
					console.log(reject);
					setOdpStatus("Fetching ODP failed!");
				}
			});
	};

	const getDistance = (data) => {
		distanceMatrix.getDistanceMatrix(
			{
				origins: [marker.getPosition()],
				destinations: data.map((x) => new window.google.maps.LatLng(x.latlng.lat, x.latlng.lng)),
				travelMode: "WALKING",
			},
			(response, status) => {
				if (status === "OK") {
					setNearest(2);
					data.forEach((x, i) => {
						odpMarker[data[i].index].infoDistance = new window.google.maps.InfoWindow({
							content: `<div>
							<span>${response.rows[0].elements[i].distance.value} m</span>
						</div>`,
						});
						odpMarker[data[i].index].infoDistance.open(googleMap, odpMarker[data[i].index]);
					});
				} else {
					window.alert("Distances request failed due to " + status);
				}
			},
		);
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

		const element = document.getElementsByClassName("map-nearest")[0] as HTMLElement;
		window.google.maps.event.addDomListener(element, "click", () => {
			if (element.dataset.nearest === "1") {
				odpMarker.map((x, i) => {
					x.infoDistance?.open(googleMap, odpMarker[i]);
					x.infoWindow.setMap(null);
				});
				setNearest(2);
			} else {
				odpMarker.map((x) => {
					x.infoDistance?.close();
				});
				setNearest(1);
			}
		});

		googleMap.addListener("click", (e: any): void => {
			if (inputRef.current) inputRef.current.value = "";
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
			touchStartEdge = 200 - (window.innerHeight - touchStart);
			value = 200 - (touchPos - (window.innerHeight - 200) - touchStartEdge);
		}

		if (value > 200) value = 200;
		bottomRef.current.style.transition = "none";
		bottomRef.current.style.bottom = value + "px";
	};

	const touchEndHandler = () => {
		const bottomPos = Number(bottomRef.current.style.bottom.replace("px", ""));
		if (bottomPos > 100) {
			bottomRef.current.style.transition = ".3s";
			bottomRef.current.style.bottom = "200px";
			setBottomShow(true);
		} else {
			bottomRef.current.style.transition = ".3s";
			bottomRef.current.style.bottom = "20px";
			setBottomShow(false);
		}
	};

	return (
		<div className="map-page" style={{ height: window.innerHeight }}>
			<div className="map-container" ref={mapRef} />
			<div className="map-top">
				<input placeholder="Search here..." className="map-top-search" ref={inputRef} />
				<img src={my_location} alt="find-me" className="map-top-findme" onClick={findMe} />
			</div>
			<div
				className="map-radius-icon"
				onClick={() => {
					setRadiusShow(true);
				}}
			/>
			{radiusShow ? (
				<>
					<div
						className="map-radius-bg"
						onClick={() => {
							setRadiusShow(false);
						}}
					/>
					<div className="map-radius-con">
						<span>Radius: {inputRadius}</span>
						<input
							type="range"
							min="100"
							max="300"
							step="25"
							value={inputRadius}
							onChange={(e) => {
								setInputRadius(e.target.value);
							}}
						/>
					</div>
				</>
			) : (
				<></>
			)}
			<input type="number" ref={radiusRef} value={inputRadius} readOnly style={{ display: "none" }} />
			<div
				className="map-bottom"
				ref={bottomRef}
				data-show={bottomShow}
				onTouchStart={(e: TouchEvent) => {
					setTouchStart(e.touches[0].clientY);
				}}
				onTouchMove={touchMoveHandler}
				onTouchEnd={touchEndHandler}>
				<div className="map-nearest" data-nearest={nearest} style={{ display: nearest ? "block" : "none" }}>
					{nearest === 1 ? "Show nearest" : "Hide nearest"}
				</div>
				{loading ? (
					<div className="map-bottom-nopick">{status}</div>
				) : (
					<>
						<div className="map-bottom-data map-bottom-body">{data}</div>
						<div className="map-bottom-odp map-bottom-body">{odpStatus}</div>
					</>
				)}
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
