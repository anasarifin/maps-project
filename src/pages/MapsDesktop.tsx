/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import { isMobile as mb } from "mobile-device-detect";
import { useRecoilState } from "recoil";
import { profile as profileState } from "../recoil";
import checkUser from "../configs/checkUser";
import AxiosCancelRequest from "axios-cancel-request";
const AxiosLocation = AxiosCancelRequest(axios);
const AxiosDirection = AxiosCancelRequest(axios);
const AxiosStreet = AxiosCancelRequest(axios);
import ReactTooltip from "react-tooltip";
import "../styles/MapsDesktop.scss";
import Menu from "../components/Menu";
import Info from "../components/Info";
import BottomBar from "../components/BottomBar";
import Button from "../components/Button";
import Underspec from "../components/Underspec";
import StreetList from "../components/StreetList";
import Profile from "../components/Profile";

const center = {
    lat: -6.2088,
    lng: 106.8456,
};
const titleCase = (str: string) => {
    return str
        .toLowerCase()
        .split(" ")
        .map((word) => {
            return word.replace(word[0], word[0]?.toUpperCase());
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
                    name: x.odp_name.toUpperCase(),
                    latitude: parseFloat(x.latitude),
                    longitude: parseFloat(x.longitude),
                    status: x.status_occ_add,
                    idle_port: parseFloat(x.portidlenumber),
                    device_port: x.deviceportnumber,
                    underspec_detail: x.underspec_detail.filter((y) => y.hasil_ukur.inet != null).map((z) => z.hasil_ukur),
                };
            });
        default:
            return [];
    }
};

const MapComponent = ({ profile }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const infoRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const radiusRef = useRef<HTMLInputElement>(null);
    const sourceRef = useRef<HTMLInputElement>(null);
    const [locationName, setLocationName] = useState("");
    const [status, setStatus] = useState("");
    const [odpStatus, setOdpStatus] = useState("");
    const [streetList, setStreetList] = useState([]);
    const [streetStatus, setStreetStatus] = useState("");
    const [mode, setMode] = useState("normal");
    const [loading, setLoading] = useState(true);
    const [radius, setRadius] = useState(200);
    const [source, setSource] = useState(1);
    const [satellite, setSatellite] = useState(false);
    const [underspec, setUnderspec] = useState([]);
    const [hideRadius, setHideRadius] = useState(true);
    const [hideStreet, setHideStreet] = useState(true);
    const [hideProfile, setHideProfile] = useState(true);
    const [hideUnderspec, setHideUnderspec] = useState(true);
    const [bottomShow, setBottomShow] = useState(false);

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
        const role = profile.permission;
        if (role.uim) {
            setSource(1);
        } else if (role.valins) {
            setSource(2);
        } else if (role.underspec) {
            setSource(3);
        }
    }, [profile]);

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
                disableDefaultUI: true,
                gestureHandling: "greedy",
            });

            // --- NOTE ---
            // You can't use React State inside window.google class,
            // so use traditional dom or React useRef
            // ------------

            // Marker initialize
            marker = new window.google.maps.Marker({
                map: googleMap,
                visible: false,
                zIndex: 2,
            });

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
                strokeWeight: 2,
                strokeColor: "#FF3300",
                fillOpacity: 0,
                clickable: false,
            });

            // Directions initialize
            directionsService = new window.google.maps.DirectionsService();
            directionsRenderer = new window.google.maps.DirectionsRenderer({
                suppressMarkers: true,
                preserveViewport: false,
            });

            // Distance Matrix initialize
            distanceMatrix = new window.google.maps.DistanceMatrixService();

            mapEventListener();
        });
    }, []);

    const mapEventListener = (): void => {
        googleMap.addListener("click", (e: any): any => {
            if (mapRef.current.dataset.mode != "normal") return false;

            if (inputRef.current) inputRef.current.value = "";
            getLocation(e.latLng.lat(), e.latLng.lng(), radiusRef.current.value, parseInt(sourceRef.current.dataset.source));
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

            getLocation(location.lat(), location.lng(), radiusRef.current.value, parseInt(sourceRef.current.dataset.source));
        });

        const sourceOption = document.getElementsByClassName("map-source-option")[0];
        window.google.maps.event.addDomListener(sourceOption, "click", (e) => {
            console.log("masuk");
            if (e.target.classList.contains("option")) {
                switch (e.target.innerText) {
                    case "SIIS":
                        setSource(0);
                        if (marker.visible) {
                            odpMarker.map((x) => x.setMap(null));
                            getDirection(marker.getPosition().lat(), marker.getPosition().lng(), radiusRef.current.value, 0);
                        }
                        break;
                    case "UIM":
                        setSource(1);
                        if (marker.visible) {
                            odpMarker.map((x) => x.setMap(null));
                            getDirection(marker.getPosition().lat(), marker.getPosition().lng(), radiusRef.current.value, 1);
                        }
                        break;
                    case "Valins":
                        setSource(2);
                        if (marker.visible) {
                            odpMarker.map((x) => x.setMap(null));
                            getDirection(marker.getPosition().lat(), marker.getPosition().lng(), radiusRef.current.value, 2);
                        }
                        break;
                    case "Underspec":
                        setSource(3);
                        if (marker.visible) {
                            odpMarker.map((x) => x.setMap(null));
                            getDirection(marker.getPosition().lat(), marker.getPosition().lng(), radiusRef.current.value, 3);
                        }
                        break;
                    default:
                        break;
                }
            }
        });

        const changeView = document.getElementById("changeView");
        window.google.maps.event.addDomListener(changeView, "click", () => {
            console.log("satelitte");
            if (mapRef.current.dataset.satellite != "true") {
                googleMap.setMapTypeId(window.google.maps.MapTypeId.HYBRID);
                setSatellite(true);
            } else {
                googleMap.setMapTypeId(window.google.maps.MapTypeId.ROADMAP);
                setSatellite(false);
            }
        });

        const find_me = document.getElementById("findMe");
        window.google.maps.event.addDomListener(find_me, "click", () => {
            findMe();
        });

        if (!mb) {
            const zoomIn = document.getElementById("zoomIn");
            window.google.maps.event.addDomListener(zoomIn, "click", () => {
                googleMap.setZoom(googleMap.getZoom() + 1);
            });

            const zoomOut = document.getElementById("zoomOut");
            window.google.maps.event.addDomListener(zoomOut, "click", () => {
                googleMap.setZoom(googleMap.getZoom() - 1);
            });
        }

        if (source == 3 && mb) {
            const element = document.getElementById("underspecButton");
            console.log(element);
            element.addEventListener("click", () => {
                console.log("under bisa");
                setHideUnderspec(false);
            });
        }
    };

    const getLocation = (lat: number, lng: number, radius: string, source: number) => {
        odpMarker.map((x) => x.setMap(null));
        if (directionsRenderer) directionsRenderer.setMap(null);

        setLoading(true);
        setStreetList([]);
        setStreetStatus("");
        setStatus("Fetching data...");
        marker.setPosition({ lat, lng });
        marker.setVisible(true);

        polygon.setMap(null);
        circle.setMap(null);
        if (source != 3) circle.setMap(googleMap);
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

                if (mb) {
                    bottomRef.current.style.transition = ".3s";
                    bottomRef.current.style.bottom = "200px";
                }

                setLoading(false);
                setLocationName(name);
                getStreetList(lat, lng);
                getDirection(lat, lng, radius, source);
            })
            .catch((reject) => {
                if (!axios.isCancel(reject)) {
                    console.log(reject);
                    setStatus("Fetching data failed!");
                }
            });
    };

    const getDirection = (lat: number, lng: number, radius: string, source: number): void => {
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
                if (source != 3) {
                    googleMap.setCenter({ lat: lat, lng: lng });
                    if (odpData.length) googleMap.setZoom(18);
                } else {
                    if (odpData.length) googleMap.setZoom(16);
                }

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

                    let content = `
                    <div class="map-infowindow">
                        <span>Device ID: ${data.id}</span><br/>
                        <span>Device name: ${data.name}</span><br/>
                        <span>Status: ${data.status}</span><br/>
                        <span>Device Port: ${data.device_port}</span><br/>
                        <span>Idle Port: ${data.idle_port}</span>
                        <span id="infoDistance"></span>
                        ${source == 3 && mb ? "<br/><span id='underspecButton'>Underspec Detail</span>" : ""}
                    </div>`;

                    odpMarker[i].infoWindow = new window.google.maps.InfoWindow({
                        content: content,
                        zIndex: 2,
                    });

                    odpMarker[i].addListener("mouseover", () => {
                        if (source == 3) {
                            setUnderspec(data.underspec_detail);
                        }

                        odpMarker.map((x) => x.infoWindow.close());
                        odpMarker[i].infoWindow.open(googleMap, odpMarker[i]);
                    });

                    odpMarker[i].addListener("mouseout", () => {
                        if (source == 3 && !mb) {
                            setUnderspec([]);
                        }
                        odpMarker[i].infoWindow.close();
                    });

                    odpMarker[i].addListener("click", () => {
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
                                    console.log(response.routes[0].legs[0].distance.value);
                                    const info = document.getElementById("infoDistance");
                                    if (info) info.innerHTML = `<br/>Distance: ${response.routes[0].legs[0].distance.value} m`;
                                    directionsRenderer.setMap(googleMap);
                                    directionsRenderer.setDirections(response);
                                } else {
                                    console.log("Directions request failed due to " + status);
                                }
                            }
                        );
                    });
                });

                if (!mb) {
                    const dataDistance = odpMarker
                        .map((x) => {
                            return { distance: x.distance, index: x.index, latlng: x.latlng };
                        })
                        .sort((a, b) => a.distance - b.distance)
                        .filter((x, i) => i < 3);
                    getDistance(dataDistance);
                }
            })
            .catch((reject) => {
                if (!axios.isCancel(reject)) {
                    console.log(reject);
                    setOdpStatus("Fetching ODP failed!");
                }
            });
    };

    const getStreetList = (lat: number, lng: number) => {
        setStreetStatus("Loading street data...");

        AxiosStreet({
            url: "https://siis-api.udata.id/point_to_address",
            method: "post",
            data: { lat: lat.toString(), long: lng.toString(), radius: "50" },
        })
            .then((resolve) => {
                if (resolve.data.status == "success") {
                    const list = resolve.data.data.filter((x) => x.st_name != " ").map((x) => titleCase(x.st_name));
                    if (list.length > 0) {
                        const uniqueList = [...new Set(list)];
                        setStreetStatus(`${uniqueList.length} street${uniqueList.length > 1 ? "s" : ""} found`);
                        setStreetList(uniqueList);
                    } else {
                        setStreetStatus("No street data found!");
                    }
                } else {
                    console.log(resolve.data);
                    setStreetStatus("No street data found!");
                }
            })
            .catch((reject) => {
                console.log(reject);
                setStreetStatus("Fetching street data failed!");
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
                    getLocation(coords.latitude, coords.longitude, radiusRef.current.value, parseInt(sourceRef.current.dataset.source));
                },
                () => {
                    alert("The Geolocation service failed.");
                }
            );
        } else {
            alert("Your browser doesn't support geolocation.");
        }
    };

    return (
        <div className="map-page">
            <div className="map-container" ref={mapRef} data-mode={mode} data-satellite={satellite} />

            <Menu
                inputRef={inputRef}
                radiusRef={radiusRef}
                radius={radius}
                role={profile.permission}
                setRadius={(e: number) => {
                    setRadius(e);
                }}
                source={source}
                setSource={(e: number) => {
                    setSource(e);
                }}
                mb={mb}
                sourceRef={sourceRef}
                hide={hideRadius}
            />
            {!mb ? (
                <>
                    <Info
                        infoRef={infoRef}
                        locationName={locationName}
                        status={status}
                        odpStatus={odpStatus}
                        loading={loading}
                        mb={mb}
                        hide={status ? false : true}
                    />
                    <Button
                        satellite={satellite}
                        mb={mb}
                        hide={loading && !status ? true : false}
                        showStreet={() => {
                            setHideStreet(false);
                        }}
                        toogleProfile={() => {
                            setHideProfile(!hideProfile);
                        }}
                        toogleRadius={() => {
                            setHideRadius(!hideRadius);
                        }}
                        bottomRef={bottomRef}
                    />
                </>
            ) : (
                <BottomBar
                    bottomRef={bottomRef}
                    locationName={locationName}
                    status={status}
                    odpStatus={odpStatus}
                    loading={loading}
                    bottomShow={bottomShow}
                    setBottomShow={(e) => {
                        setBottomShow(e);
                    }}
                    satellite={satellite}
                    mb={mb}
                    hide={loading && !status ? true : false}
                    showStreet={() => {
                        setHideStreet(false);
                    }}
                    toogleProfile={() => {
                        setHideProfile(!hideProfile);
                    }}
                    toogleRadius={() => {
                        setHideRadius(!hideRadius);
                    }}
                />
            )}
            <Profile data={profile} mb={mb} hide={hideProfile} />
            <Underspec
                underspec={underspec}
                hide={!mb ? !underspec.length : hideUnderspec}
                mb={mb}
                hideUnderspec={() => {
                    setHideUnderspec(true);
                }}
            />
            <StreetList
                streetList={streetList}
                status={streetStatus}
                mb={mb}
                hide={!mb ? !streetStatus : hideStreet}
                hideStreet={() => {
                    setHideStreet(true);
                }}
            />
            {!mb ? <ReactTooltip effect="solid" place="left" /> : <></>}
        </div>
    );
};

// hide={mode == "normal" && status && streetStatus ? false : true}

const MapReady = () => {
    const [ready, setReady] = useState(false);
    const [profile, setProfile] = useRecoilState(profileState);
    const history = useHistory();

    const checkPermission = (data: Profile) => {
        const { uim, valins, underspec } = data.permission;
        if (uim || valins || underspec) {
            setReady(true);
        } else {
            history.replace({ pathname: "/home" });
        }
    };

    useEffect(() => {
        if (profile.name) {
            checkPermission(profile);
        } else {
            checkUser()
                .then((resolve: Profile) => {
                    setProfile(resolve);
                    checkPermission(resolve);
                })
                .catch(() => {
                    history.replace({ pathname: "/login" });
                });
        }
    }, []);

    return <>{ready ? <MapComponent profile={profile} /> : <></>}</>;
};

declare global {
    interface Window {
        google: any;
    }
}
interface Profile {
    name: string;
    role: string;
    permission: any;
}
interface ODP {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    status: string;
    device_port: number;
    idle_port: number;
    underspec_detail?: Underspec[];
}
interface Underspec {
    inet: string;
    olt_rx_pwr: string;
    onu_rx_pwr: string;
}

export default MapReady;
