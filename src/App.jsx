import { useState, useEffect, useRef } from "react";
import MapView from "./components/MapView";
import Sidebar from "./components/Sidebar";
import BandCombinationSelector from "./components/BandCombinationSelector";
import { searchSatelliteData } from "./services/satelliteService";

const SatelliteDataViewer = () => {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [limit, setLimit] = useState(10);
  const [collection, setCollection] = useState("sentinel-2-l2a");
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2024-01-31");
  const [cloudCover, setCloudCover] = useState(20);
  const [loading, setLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [bandCombination, setBandCombination] = useState("trueColor");
  const [currentBandStyle, setCurrentBandStyle] = useState(null);
  const [currentSatelliteType, setCurrentSatelliteType] = useState(null);
  const [showBandSelector, setShowBandSelector] = useState(false);
  const [isBandSelectorMinimized, setIsBandSelectorMinimized] = useState(false);
  const [bandSelectorPosition, setBandSelectorPosition] = useState({
    x: 20,
    y: 20,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoveredResult, setHoveredResult] = useState(null);
  // Compare mode state
  const [compareMode, setCompareMode] = useState(false);
  const [leftImageIndex, setLeftImageIndex] = useState(null);
  const [rightImageIndex, setRightImageIndex] = useState(null);
  const [activeCompareSlot, setActiveCompareSlot] = useState("left");

  const mapRef = useRef(null);
  const bandSelectorRef = useRef(null);

  const handleCustomBandChange = (bands, style) => {
    setCurrentBandStyle(style);
  };

  const handleSearch = async (page = 1) => {
    if (!mapRef.current) return;

    const bbox = mapRef.current.getCurrentBBox();
    setLoading(true);

    // Only clear results if it's a new search (page 1)
    if (page === 1) {
      setResults([]);
      setSelectedResult(null);
      setCurrentSatelliteType(null);
      setShowBandSelector(false);
    }

    try {
      const data = await searchSatelliteData({
        bbox,
        collection,
        startDate,
        endDate,
        cloudCover,
        limit,
        page,
      });

      setResults(data.features || []);
    } catch (error) {
      console.error("Error searching satellite data:", error);
      alert("Error searching satellite data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (feature, index) => {
    if (!compareMode) {
      // Normal mode
      setSelectedResult(index);
      setCurrentSatelliteType(feature.collection);
      setBandCombination("trueColor");
      setShowBandSelector(true);
      setIsBandSelectorMinimized(false);

      if (mapRef.current) {
        mapRef.current.addImageryToMap(feature);
      }
    } else {
      // Compare mode
      if (activeCompareSlot === "left") {
        setLeftImageIndex(index);
        if (mapRef.current) {
          mapRef.current.setActiveCompareSlot("left");
          mapRef.current.addImageryToMap(feature);
        }
      } else {
        setRightImageIndex(index);
        if (mapRef.current) {
          mapRef.current.setActiveCompareSlot("right");
          mapRef.current.addImageryToMap(feature);
        }
      }

      setCurrentSatelliteType(feature.collection);
      setShowBandSelector(true);
    }
  };

  const handleResultHover = (feature, index) => {
    setHoveredResult(index);
    if (mapRef.current && feature) {
      mapRef.current.showFootprint(feature);
    }
  };

  const handleResultHoverEnd = () => {
    setHoveredResult(null);
    if (mapRef.current) {
      mapRef.current.hideFootprint();
    }
  };

  const handleClear = () => {
    if (mapRef.current) {
      mapRef.current.clearLayers();
    }
    setResults([]);
    setSelectedResult(null);
    setCurrentSatelliteType(null);
    setShowBandSelector(false);
    setBandCombination("trueColor");
  };

  const toggleCompareMode = () => {
    const newCompareMode = !compareMode;
    setCompareMode(newCompareMode);

    if (newCompareMode) {
      // Entering compare mode
      setSelectedResult(null);
      setShowBandSelector(false);
    } else {
      // Exiting compare mode
      setLeftImageIndex(null);
      setRightImageIndex(null);
      setActiveCompareSlot("left");
      if (mapRef.current) {
        mapRef.current.clearLayers();
      }
    }
  };

  const handleCompareSlotChange = (slot) => {
    setActiveCompareSlot(slot);
    if (mapRef.current) {
      mapRef.current.setActiveCompareSlot(slot);
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    // Calculate offset from mouse position to top-left corner of the element
    setDragOffset({
      x: e.clientX - bandSelectorPosition.x,
      y: e.clientY - bandSelectorPosition.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !bandSelectorRef.current) return;

    // Get the dimensions of the band selector
    const rect = bandSelectorRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate new position
    let newX = e.clientX - dragOffset.x;
    let newY = e.clientY - dragOffset.y;

    // Constrain to viewport boundaries
    newX = Math.max(0, Math.min(newX, viewportWidth - width));
    newY = Math.max(0, Math.min(newY, viewportHeight - height));

    setBandSelectorPosition({
      x: newX,
      y: newY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <div className="h-screen flex">
      <div
        className={`${
          sidebarVisible ? "w-96" : "w-0"
        } transition-all duration-300 ease-in-out overflow-hidden`}
      >
        <Sidebar
          collection={collection}
          setCollection={setCollection}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          cloudCover={cloudCover}
          setCloudCover={setCloudCover}
          loading={loading}
          results={results}
          selectedResult={selectedResult}
          hoveredResult={hoveredResult}
          onSearch={handleSearch}
          onClear={handleClear}
          onResultClick={handleResultClick}
          onResultHover={handleResultHover}
          onResultHoverEnd={handleResultHoverEnd}
          compareMode={compareMode}
          leftImageIndex={leftImageIndex}
          rightImageIndex={rightImageIndex}
          activeCompareSlot={activeCompareSlot}
          limit={limit}
          setLimit={setLimit}
        />
      </div>

      <div className="flex-1 flex relative">
        <MapView
          ref={mapRef}
          mapLoading={mapLoading}
          setMapLoading={setMapLoading}
          bandStyle={currentBandStyle}
          compareMode={compareMode}
        />

        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setSidebarVisible(!sidebarVisible)}
          className="absolute top-2 left-2 z-40 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg shadow-lg transition-colors"
          title={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {sidebarVisible ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            )}
          </svg>
        </button>

        {/* Compare Mode Controls - Compact version */}
        <div className="absolute bottom-4 right-4 z-40">
          {!compareMode ? (
            <button
              onClick={toggleCompareMode}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors flex items-center gap-2"
              title="Enable compare mode"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Compare
            </button>
          ) : (
            <div className="bg-gray-800 rounded-lg shadow-xl p-2 flex items-center gap-2">
              <button
                onClick={() => handleCompareSlotChange("left")}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  activeCompareSlot === "left"
                    ? "bg-green-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Left
              </button>
              <button
                onClick={() => handleCompareSlotChange("right")}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  activeCompareSlot === "right"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Right
              </button>
              <div className="h-6 w-px bg-gray-600" />
              <button
                onClick={toggleCompareMode}
                className="text-gray-400 hover:text-white transition-colors p-1"
                title="Exit compare mode"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Band selector - show only when appropriate */}
        {showBandSelector && currentSatelliteType && (
          <div
            ref={bandSelectorRef}
            className="absolute bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden"
            style={{
              left: `${bandSelectorPosition.x}px`,
              top: `${bandSelectorPosition.y}px`,
              width: isBandSelectorMinimized ? "200px" : "320px",
              zIndex: 1000,
              transition: isDragging ? "none" : "width 0.3s ease-in-out",
            }}
          >
            {/* Header */}
            <div
              className="bg-gray-800 px-4 py-2 flex items-center justify-between cursor-move select-none"
              onMouseDown={handleMouseDown}
            >
              <h3 className="text-sm font-semibold text-gray-200">
                Band Combinations
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setIsBandSelectorMinimized(!isBandSelectorMinimized)
                  }
                  className="text-gray-400 hover:text-gray-200 focus:outline-none transition-colors"
                  title={isBandSelectorMinimized ? "Expand" : "Minimize"}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {isBandSelectorMinimized ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 12H4"
                      />
                    )}
                  </svg>
                </button>
                <button
                  onClick={() => setShowBandSelector(false)}
                  className="text-gray-400 hover:text-gray-200 focus:outline-none transition-colors"
                  title="Close"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            {!isBandSelectorMinimized && (
              <div className="p-4 max-h-96 bg-gray-900 overflow-y-auto">
                <BandCombinationSelector
                  currentCombination={bandCombination}
                  onCombinationChange={setBandCombination}
                  satelliteType={currentSatelliteType}
                  onCustomBandChange={handleCustomBandChange}
                />
              </div>
            )}

            {/* Minimized state */}
            {isBandSelectorMinimized && (
              <div className="px-4 py-2 text-sm text-gray-300">
                Current:{" "}
                <span className="font-medium text-gray-100">
                  {bandCombination}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SatelliteDataViewer;
