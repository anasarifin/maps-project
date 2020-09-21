/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import { useRecoilState } from "recoil";
import { profile as profileState } from "../recoil";
import checkUser from "../configs/checkUser";
import AxiosCancelRequest from "axios-cancel-request";
const AxiosLocation = AxiosCancelRequest(axios);
import ReactTooltip from "react-tooltip";
import "../styles/Editor.scss";
import Info from "../components/InfoEditor";
import Drawer from "../components/Drawer";
import Button from "../components/Button";
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

const DrawerComponent = ({ profile }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const saveRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [location, setLocation] = useState({});
    const [status, setStatus] = useState("");
    const [polygonStatus, setPolygonStatus] = useState("");
    const [mode, setMode] = useState("hand");
    const [loading, setLoading] = useState(true);
    const [showSave, setShowSave] = useState(false);

    // Initialize an variables to call it later
    let googleMap;
    let marker;
    let infoWindow;
    let polygon;
    let autoComplete;
    let drawingManager;
    let customPolygon;
    let polygonList = [];

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

            // InfoWindow initialize
            infoWindow = new window.google.maps.InfoWindow({
                map: googleMap,
            });

            // AutoComplete nitialize, cannot use useRef to get element
            const inputElement = inputRef.current;
            autoComplete = new window.google.maps.places.Autocomplete(inputElement, {
                fields: ["geometry", "name"],
                componentRestrictions: { country: ["id"] },
            });
            autoComplete.bindTo("bounds", googleMap);

            // Polygon initialize
            polygon = new window.google.maps.Polygon({
                map: googleMap,
                paths: [],
                strokeWeight: 2,
                strokeColor: "#FF3300",
                fillOpacity: 0,
                clickable: false,
            });

            window.google.maps.Polygon.prototype.getBounds = function () {
                var bounds = new window.google.maps.LatLngBounds();
                this.getPath().forEach(function (element) {
                    bounds.extend(element);
                });
                return bounds;
            };

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

            mapEventListener();
        });
    }, []);

    const mapEventListener = (): void => {
        googleMap.addListener("click", (e: any): any => {
            if (mapRef.current.dataset.mode != "hand") return false;
            if (inputRef.current) inputRef.current.value = "";
            getLocation(e.latLng.lat(), e.latLng.lng());
        });

        window.google.maps.event.addListener(autoComplete, "place_changed", () => {
            const place = autoComplete.getPlace();
            if (!place.geometry) {
                console.log("Place not have an geometry point.");
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

        const drawingComplete = (e: any, type: string) => {
            setMode("hand");
            customPolygon?.shape.setMap(null);
            drawingManager.setDrawingMode(null);
            customPolygon = { type: type, shape: e };
            saveRef.current.value = "";
            setShowSave(true);
        };

        window.google.maps.event.addListener(drawingManager, "polygoncomplete", (e) => {
            drawingComplete(e, "polygon");
        });

        window.google.maps.event.addListener(drawingManager, "rectanglecomplete", (e) => {
            drawingComplete(e, "rectangle");
        });

        // To asign listener to component, use listener provided by Google Maps (addDomListener)
        // Because onClick is not working inside mapEventListener function

        const save = document.getElementById("savePolygon");
        window.google.maps.event.addDomListener(save, "click", () => {
            savePolygon(saveRef.current.value);
        });

        const zoomIn = document.getElementById("zoomIn");
        window.google.maps.event.addDomListener(zoomIn, "click", () => {
            googleMap.setZoom(googleMap.getZoom() + 1);
        });

        const zoomOut = document.getElementById("zoomOut");
        window.google.maps.event.addDomListener(zoomOut, "click", () => {
            googleMap.setZoom(googleMap.getZoom() - 1);
        });

        // const handMode = () => {
        //     setMode("hand");
        //     customPolygon?.shape.setMap(null);
        //     setShowSave(false);
        //     drawingManager.setDrawingMode(null);
        // };

        const drawMode = (type, drawType) => {
            if (mapRef.current.dataset.mode != type) {
                setMode(type);
                customPolygon?.shape.setMap(null);
                setShowSave(false);
                drawingManager.setDrawingMode(drawType);
            }
        };

        const handMode = document.getElementById("handMode");
        window.google.maps.event.addDomListener(handMode, "click", () => {
            drawMode("hand", null);
        });

        const rectangleMode = document.getElementById("rectangleMode");
        window.google.maps.event.addDomListener(rectangleMode, "click", () => {
            drawMode("rectangle", window.google.maps.drawing.OverlayType.RECTANGLE);
        });

        const polygonMode = document.getElementById("polygonMode");
        window.google.maps.event.addDomListener(polygonMode, "click", () => {
            drawMode("polygon", window.google.maps.drawing.OverlayType.POLYGON);
        });

        const deleteMode = document.getElementById("deleteMode");
        window.google.maps.event.addDomListener(deleteMode, "click", () => {
            drawMode("delete", null);
        });
    };

    const getLocation = (lat: number, lng: number) => {
        marker.setPosition({ lat, lng });
        marker.setVisible(true);
        polygon.setMap(null);

        setLoading(true);
        setStatus("Fetching data...");

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

                const regionType = data.kabupaten.split(" ")[0] == "KOTA";
                const kota = regionType ? data.kabupaten.replace("KOTA ", "") : data.kabupaten;

                setLoading(false);
                setPolygonStatus(`${polygonList.length} polygon found`);
                setLocation({
                    kelurahan: titleCase(data.kelurahan),
                    kecamatan: titleCase(data.kecamatan),
                    kota: titleCase(kota),
                    kabupaten: !regionType,
                    provinsi: titleCase(data.provinsi).replace("Dki", "DKI"),
                });
            })
            .catch((reject) => {
                if (!axios.isCancel(reject)) {
                    console.log(reject);
                    setStatus("Fetching data failed!");
                }
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
                }
            );
        } else {
            alert("Your browser doesn't support geolocation.");
        }
    };

    const savePolygon = (address) => {
        let path = [];
        if (customPolygon?.type == "polygon") {
            const shape = customPolygon.shape.getPath().getArray();
            path = shape.map((x) => {
                return new window.google.maps.LatLng(x.lat(), x.lng());
            });
        } else if (customPolygon?.type == "rectangle") {
            const bounds = customPolygon.shape.getBounds();
            var NE = bounds.getNorthEast();
            var SW = bounds.getSouthWest();
            path = [
                new window.google.maps.LatLng(SW.lat(), NE.lng()),
                bounds.getNorthEast(),
                new window.google.maps.LatLng(NE.lat(), SW.lng()),
                bounds.getSouthWest(),
            ];
        }

        const polygon = new window.google.maps.Polygon({
            map: googleMap,
            paths: path,
            strokeColor: "#FF3300",
            strokeWeight: 2,
            fillOpacity: 0.5,
            fillColor: "#FF3300",
            clickable: true,
        });

        polygon.addListener("mouseover", () => {
            if (mapRef.current.dataset.mode == "delete") polygon.setOptions({ fillColor: "#00FF00" });
            const center = polygon.getBounds().getCenter();
            infoWindow.setContent(address);
            infoWindow.setPosition(new window.google.maps.LatLng(center.lat(), center.lng()));
            infoWindow.open(googleMap);
        });
        polygon.addListener("mouseout", () => {
            polygon.setOptions({ fillColor: "#FF3300" });
            infoWindow.close();
        });
        polygon.addListener("click", () => {
            if (mapRef.current.dataset.mode == "delete") {
                setPolygonStatus(`${polygonList.length - 1} polygon found`);
                polygon.setMap(null);
            }
        });

        customPolygon?.shape.setMap(null);
        if (customPolygon) {
            setPolygonStatus(`${polygonList.length + 1} polygon found`);
            polygonList.push(polygon);
        }

        drawingManager.setDrawingMode(null);
        setMode("hand");
        setShowSave(false);
    };

    return (
        <div className="map-page">
            <div className="map-container" ref={mapRef} data-mode={mode} />
            <input className="map-search" ref={inputRef} placeholder="Search here..." />
            <Info location={location} status={status} polygonStatus={polygonStatus} loading={loading} />
            <Button findMe={findMe} />
            <Drawer mode={mode} hide={status ? false : true} hideSave={showSave ? false : true} saveRef={saveRef} />
            <Profile data={profile} />
            <ReactTooltip effect="solid" place="left" />
        </div>
    );
};

const DrawerReady = () => {
    const [ready, setReady] = useState(false);
    const [profile, setProfile] = useRecoilState(profileState);
    const history = useHistory();

    useEffect(() => {
        if (profile.name) {
            setReady(true);
        } else {
            checkUser()
                .then((resolve: Profile) => {
                    setProfile(resolve);
                    setReady(true);
                })
                .catch(() => {
                    history.replace({ pathname: "/login" });
                });
        }
    });

    return <>{ready ? <DrawerComponent profile={profile} /> : <></>}</>;
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

export default DrawerReady;
