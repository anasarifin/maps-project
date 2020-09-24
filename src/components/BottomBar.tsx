import React, { useState, useRef } from "react";
import Button from "./Button";

const BottomBar = ({
    bottomRef,
    locationName,
    status,
    odpStatus,
    loading,
    bottomShow,
    setBottomShow,
    satellite,
    mb,
    hide,
    showStreet,
    toogleProfile,
    toogleRadius,
}) => {
    const [touchStart, setTouchStart] = useState(0);

    const touchMoveHandler = (e) => {
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
        <div
            className="map-bottom"
            ref={bottomRef}
            data-show={bottomShow}
            onTouchStart={(e) => {
                setTouchStart(e.touches[0].clientY);
            }}
            onTouchMove={touchMoveHandler}
            onTouchEnd={touchEndHandler}
        >
            <Button
                satellite={satellite}
                mb={mb}
                hide={hide}
                showStreet={showStreet}
                toogleProfile={toogleProfile}
                toogleRadius={toogleRadius}
                bottomRef={bottomRef}
            />
            {loading ? (
                <div className="map-bottom-nopick">{status || "Pick a location first"}</div>
            ) : (
                <>
                    <div className="map-bottom-odp map-bottom-body">{odpStatus}</div>
                    <div className="map-bottom-data map-bottom-body">{locationName}</div>
                </>
            )}
        </div>
    );
};

export default BottomBar;
