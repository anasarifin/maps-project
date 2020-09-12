/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import AxiosCancelRequest from "axios-cancel-request";
const AxiosLocation = AxiosCancelRequest(axios);
const AxiosDirection = AxiosCancelRequest(axios);
import "../styles/MapsDesktop.css";
import Menu from "../components/Menu";
import Info from "../components/Info";
import Button from "../components/Button";

const center = {
    lat: -6.2088,
    lng: 106.8456,
};
const titleCase = (str: string) => {
    return str
        .toLowerCase()
        .split(" ")
        .map((word) => {
            return word.replace(word[0], word[0].toUpperCase());
        })
        .join(" ");
};
const odpFormat = (odpList, source: number) => {
    switch (source) {
        case 0:
            return odpList.map((x) => {
                return {
                    id: x.device_id,
                    name: x.devicename,
                    latitude: x.lat,
                    longitude: x.long,
                    status: x.status_occ_add,
                    idle_port: parseFloat(x.portidlenumber),
                    device_port: parseFloat(x.deviceportnumber),
                };
            });
        case 1:
            return odpList.map((x) => {
                return {
                    id: x.device_id,
                    name: x.devicename,
                    latitude: x.lat,
                    longitude: x.long,
                    status: x.status_occ_add,
                    idle_port: parseFloat(x.portidlenumber),
                    device_port: parseFloat(x.deviceportnumber),
                };
            });
        case 2:
            return odpList.map((x) => {
                return {
                    id: x.odp_eid,
                    name: x.odp_name,
                    latitude: parseFloat(x.latitude),
                    longitude: parseFloat(x.longitude),
                    status: x.status_occ_add,
                    idle_port: parseFloat(x.portidlenumber),
                    device_port: x.deviceportnumber,
                };
            });
        case 3:
            return odpList.map((x) => {
                return {
                    id: x.odp_eid,
                    name: x.odp_name,
                    latitude: parseFloat(x.latitude),
                    longitude: parseFloat(x.longitude),
                    status: x.status_occ_add,
                    idle_port: parseFloat(x.portidlenumber),
                    device_port: x.deviceportnumber,
                    underspec_detail: x.underspec_detail.filter((y) => {
                        return y.hasil_ukur.inet != null;
                    }),
                };
            });
        default:
            return [];
    }
};

const MapComponent = () => {
    const mapRef = useRef<HTMLDivElement>(null);
    const infoRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const radiusRef = useRef<HTMLInputElement>(null);
    const [locationName, setLocationName] = useState("");
    const [status, setStatus] = useState("Pick a location first.");
    const [odpStatus, setOdpStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [radius, setRadius] = useState(200);
    const [source, setSource] = useState(0);

    // Initialize an variables to call it later
    let googleMap;
    let marker;
    let infoWindow;
    let circle;
    let polygon;
    let autoComplete;
    let drawingManager;
    let drawingMode;
    let customPolygon;
    let odpMarker = [];
    let directionsService;
    let directionsRenderer;
    let distanceMatrix;

    useEffect(() => {
        // Create script element and call google maps api
        const googleScript = document.createElement("script");
        googleScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_API}&libraries=places,geometry,drawing`;
        window.document.body.appendChild(googleScript);

        googleScript.addEventListener("load", async () => {
            // Maps initialize
            googleMap = new window.google.maps.Map(mapRef.current, {
                zoom: 15,
                center: center,
                clickableIcons: false,
                fullscreenControl: false,
                mapTypeControl: false,
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
                visible: false,
            });

            // InfoWindow initialize
            infoWindow = new window.google.maps.InfoWindow();

            // AutoComplete initialize, cannot use useRef to get element
            const inputElement = inputRef.current;
            autoComplete = new window.google.maps.places.Autocomplete(inputElement, {
                fields: ["geometry", "name"],
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
                strokeOpacity: 0,
                strokeWeight: 2,
                fillColor: "#FF0000",
                fillOpacity: 0.1,
                clickable: false,
            });

            // Drawing Manager initialize
            const option = {
                editable: true,
                draggable: true,
                strokeColor: "#FF3300",
                strokeWeight: 2,
                fillOpacity: 0.5,
                fillColor: "#FF3300",
            };
            drawingManager = new window.google.maps.drawing.DrawingManager({
                polygonOptions: option,
                rectangleOptions: option,
            });
            drawingManager.setMap(googleMap);

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

    const mapEventListener = (): void => {
        googleMap.addListener("click", (e: any): void => {
            if (inputRef.current) inputRef.current.value = "";
            getLocation(e.latLng.lat(), e.latLng.lng(), radiusRef.current.value, source);
        });

        window.google.maps.event.addListener(autoComplete, "place_changed", () => {
            const place = autoComplete.getPlace();
            if (!place.geometry) {
                console.log("Quota exceeded!");
                return;
            }

            const { location, viewport } = place.geometry;
            if (viewport) {
                googleMap.fitBounds(place.geometry.viewport);
            } else {
                googleMap.setCenter(place.geometry.location);
                googleMap.setZoom(16);
            }

            getLocation(location.lat(), location.lng(), radiusRef.current.value, source);
        });

        window.google.maps.event.addListener(drawingManager, "polygoncomplete", (e) => {
            customPolygon?.shape.setMap(null);
            drawingManager.setDrawingMode(null);
            customPolygon = { type: "polygon", shape: e };
        });

        window.google.maps.event.addListener(drawingManager, "rectanglecomplete", (e) => {
            customPolygon?.shape.setMap(null);
            drawingManager.setDrawingMode(null);
            customPolygon = { type: "rectangle", shape: e };
        });
    };

    const getLocation = (lat: number, lng: number, radius: string, source: number) => {
        odpMarker.map((x) => x.setMap(null));
        if (directionsRenderer) directionsRenderer.setMap(null);
        infoRef.current.style.display = "block";

        setLoading(true);
        setStatus("Fetching data...");
        marker.setPosition({ lat, lng });
        marker.setVisible(true);

        // infoWindow.setContent(`<div id="map-popup">Fetching data...</div>`);
        // infoWindow.open(googleMap, marker);
        console.log(radius);
        console.log(source);

        polygon.setMap(null);
        circle.setMap(null);
        circle.setMap(googleMap);
        circle.setCenter({ lat, lng });
        circle.setRadius(parseFloat(radius));

        AxiosLocation({ url: `https://siis-api.udata.id/point_kelurahan/${lng},${lat}` })
            .then(async (resolve) => {
                const data = resolve.data.data[0];
                const polygonLayer = data.shape
                    .slice(11, -2)
                    .split(", ")
                    .map((x: string) => {
                        const split = x.split(" ");
                        return { lat: parseFloat(split[1]), lng: parseFloat(split[0]) };
                    });
                polygon.setPath(polygonLayer);
                polygon.setMap(googleMap);

                const streetName = await getStreetName(lat, lng);
                const regionType = data.kabupaten.split(" ")[0] == "KOTA";
                const kota = regionType ? data.kabupaten.replace("KOTA ", "") : data.kabupaten;
                const name = `${streetName}Kel. ${titleCase(data.kelurahan)}, Kec. ${titleCase(data.kecamatan)}, ${
                    regionType ? "Kota" : "Kab."
                } ${titleCase(kota)}, ${titleCase(data.provinsi).replace("Dki", "DKI")}`;

                setLoading(false);
                setLocationName(name);

                // Cannot use React Element to create custom popup, must using string
                // const parentElement = document.getElementById("map-popup");
                // if (parentElement) {
                //     const { provinsi, kabupaten, kecamatan, kelurahan } = resolve.data.data[0];
                //     const child = `
                // <div>
                // 	<span>${provinsi}</span>
                // 	<span>${kabupaten}</span>
                // 	<span>${kecamatan}</span>
                // 	<span>${kelurahan}</span><br/>
                // 	<span id="map-popup-odp-loading">Fetching ODP data...</span>
                // </div>`;

                //     parentElement.innerHTML = "";
                //     parentElement.insertAdjacentHTML("beforeend", child);
                // }

                getDirection(lat, lng, radius, source);
            })
            .catch((reject) => {
                if (!axios.isCancel(reject)) {
                    console.log(reject);
                    setStatus("Fetching failed!");
                    // const parentElement = document.getElementById("map-popup");
                    // const child = `
                    // <div>
                    // 	<div>Fetching failed !</div>
                    // 	<span id="map-popup-edit">Try again...</span>
                    // </div>
                    // `;

                    // parentElement.innerHTML = "";
                    // parentElement.insertAdjacentHTML("beforeend", child);
                    // document.getElementById("map-popup-edit").addEventListener("click", () => {
                    //     infoWindow.setContent(`<div id="map-popup">Fetching again...</div>`);
                    //     const position = marker.getPosition();
                    //     getLocation(position.lat(), position.lng());
                    // });
                }
            });
    };

    const getDirection = (lat: number, lng: number, radius: number, source: number): void => {
        setOdpStatus("Fetching ODP data...");

        let sourceUrl = "";
        switch (source) {
            case 0:
                sourceUrl = "siis";
                break;
            case 1:
                sourceUrl = "uim";
                break;
            case 2:
                sourceUrl = "valins";
                break;
            case 3:
                sourceUrl = "underspec";
                break;
            default:
                break;
        }

        let data = {};
        if (source != 3) {
            data = {
                lat: lat.toString(),
                long: lng.toString(),
                radius: radius,
            };
        } else {
            data = { lat: lat.toString(), long: lng.toString() };
        }

        AxiosDirection({
            url: `http://odpmap-ms-api-dev.vsan-apps.playcourt.id/api/odp/v1/get-odp-${sourceUrl}`,
            method: "post",
            data: data,
            auth: { username: "telkom", password: process.env.ODP_PASSWORD },
        })
            .then((resolve) => {
                const odpData = odpFormat(resolve.data.data, source);
                let odpPercent = 0;
                if (odpData.length) {
                    const devicePort = odpData.map((x: ODP) => x.device_port).reduce((acc: number, x: number) => acc + x);
                    const idlePort = odpData.map((x: ODP) => x.idle_port).reduce((acc: number, x: number) => acc + x);
                    odpPercent = parseFloat(((idlePort / devicePort) * 100).toFixed(1));
                }
                setOdpStatus(`${odpData.length} ODP found (${odpPercent}%)`);
                odpMarker = [];
                googleMap.setCenter({ lat: lat, lng: lng });
                if (odpData.length) googleMap.setZoom(17);

                odpData.forEach((data: ODP, i: number) => {
                    let color: string;
                    switch (data.status) {
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
                            position: { lat: data.latitude, lng: data.longitude },
                            icon: {
                                path: window.google.maps.SymbolPath.CIRCLE,
                                scale: 6,
                                fillColor: color,
                                fillOpacity: 0.9,
                                strokeWeight: 0,
                            },
                        })
                    );

                    odpMarker[i].latlng = { lat: data.latitude, lng: data.longitude };
                    odpMarker[i].index = i;
                    odpMarker[i].distance = window.google.maps.geometry.spherical.computeDistanceBetween(
                        marker.getPosition(),
                        odpMarker[i].getPosition()
                    );

                    odpMarker[i].infoWindow = new window.google.maps.InfoWindow({
                        content: `<div>
						<span>Device ID: ${data.id}</span><br/>
						<span>Device name: ${data.name}</span><br/>
						<span>Status: ${data.status}</span><br/>
						<span>Device Port: ${data.device_port}</span><br/>
						<span>Idle Port: ${data.idle_port}</span>
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
                                destination: `${data.latitude},${data.longitude}`,
                                travelMode: "WALKING",
                            },
                            (response, status) => {
                                if (status === "OK") {
                                    directionsRenderer.setMap(googleMap);
                                    directionsRenderer.setDirections(response);
                                } else {
                                    console.log("Directions request failed due to " + status);
                                }
                            }
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
                    // const loading = document.getElementById("map-popup-odp-loading");
                    // loading.innerHTML = `Fetching ODP failed!`;
                }
            });
    };

    const getStreetName = (lat: number, lng: number) => {
        return new Promise((resolve) => {
            axios
                .get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyCXU3EeZo0yexMDnmkigGJJvTvcVDpgPl0`)
                .then((response) => {
                    const streetFilter = response.data.results[0].address_components.filter((x) => x.types[0] == "route");
                    if (streetFilter.length > 0) {
                        resolve(`${streetFilter[0].short_name}, `);
                    } else {
                        resolve("");
                    }
                })
                .catch(() => {
                    resolve("");
                });
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
                    data.forEach((x, i) => {
                        odpMarker[data[i].index].infoDistance = new window.google.maps.InfoWindow({
                            content: `<div>
							<span>${response.rows[0].elements[i].distance.value} m</span>
						</div>`,
                        });
                        odpMarker[data[i].index].infoDistance.open(googleMap, odpMarker[data[i].index]);
                    });
                } else {
                    console.log("Distances request failed due to " + status);
                }
            }
        );
    };

    const findMe = () => {
        if (customPolygon?.type == "polygon") {
            const xxx = customPolygon.shape.getPath().getArray();
            console.log(
                xxx.map((x) => {
                    return {
                        lat: x.lat(),
                        lng: x.lng(),
                    };
                })
            );
        } else if (customPolygon?.type == "rectangle") {
            const bounds = customPolygon.shape.getBounds();
            var NE = bounds.getNorthEast();
            var SW = bounds.getSouthWest();
            console.log({
                1: bounds.getNorthEast(),
                2: bounds.getSouthWest(),
                3: new window.google.maps.LatLng(NE.lat(), SW.lng()),
                4: new window.google.maps.LatLng(SW.lat(), NE.lng()),
            });
        }
        // if (navigator.geolocation) {
        //     navigator.geolocation.getCurrentPosition(
        //         ({ coords }) => {
        //             if (inputRef.current) inputRef.current.value = "";
        //             const position = {
        //                 lat: coords.latitude,
        //                 lng: coords.longitude,
        //             };

        //             googleMap.setCenter(position);
        //             googleMap.setZoom(17);
        //             getLocation(coords.latitude, coords.longitude);
        //         },
        //         () => {
        //             alert("The Geolocation service failed.");
        //         }
        //     );
        // } else {
        //     alert("Your browser doesn't support geolocation.");
        // }
    };

    return (
        <div className="map-page">
            <div className="map-container" ref={mapRef} />
            <Menu
                inputRef={inputRef}
                radiusRef={radiusRef}
                radius={radius}
                setRadius={(e: number) => {
                    setRadius(e);
                }}
                source={source}
            />
            <Info infoRef={infoRef} locationName={locationName} status={status} odpStatus={odpStatus} loading={loading} />
            <Button
                findMe={findMe}
                setDrawingMode={(e) => {
                    drawingMode = e;
                }}
            />
        </div>
    );
};

declare global {
    interface Window {
        google: any;
    }
}

interface ODP {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    status: string;
    device_port: number;
    idle_port: number;
}

export default MapComponent;
