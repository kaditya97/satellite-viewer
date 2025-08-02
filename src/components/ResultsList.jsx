// components/ResultsList.jsx
import React from "react";

const ResultsList = ({
  results,
  selectedResult,
  onResultClick,
  loading,
  hoveredResult,
  onResultHover,
  onResultHoverEnd,
  compareMode = false,
  leftImageIndex = null,
  rightImageIndex = null,
  activeCompareSlot = "left",
}) => {
  if (loading) {
    return null;
  }

  return (
    <div className="p-6">
      {results.length > 0 ? (
        <>
          <h3 className="text-lg font-semibold mb-4 text-gray-200">
            Search Results ({results.length})
          </h3>
          {compareMode && (
            <div className="mb-4 p-3 bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">
                Compare Mode Active - Selecting for:
                <span className="font-semibold text-blue-400 ml-1">
                  {activeCompareSlot === "left" ? "Left" : "Right"} Image
                </span>
              </p>
              <div className="flex gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-400">Left</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span className="text-gray-400">Right</span>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {results.map((feature, index) => (
              <ResultItem
                key={feature.id}
                feature={feature}
                index={index}
                isSelected={!compareMode && selectedResult === index}
                isLeftImage={compareMode && leftImageIndex === index}
                isRightImage={compareMode && rightImageIndex === index}
                isHovered={hoveredResult === index}
                onClick={() => onResultClick(feature, index)}
                onMouseEnter={() => onResultHover(feature, index)}
                onMouseLeave={onResultHoverEnd}
                compareMode={compareMode}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="text-gray-400 text-center py-8">
          <p className="text-sm">No results to display</p>
          <p className="text-xs mt-2">
            Draw a bounding box and search for satellite imagery
          </p>
        </div>
      )}
    </div>
  );
};

const ResultItem = ({
  feature,
  index,
  isSelected,
  isLeftImage,
  isRightImage,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
  compareMode,
}) => {
  const date = new Date(feature.properties.datetime).toLocaleDateString();
  const cloudCover = feature.properties["eo:cloud_cover"];

  const getBackgroundClass = () => {
    if (compareMode) {
      if (isLeftImage && isRightImage) {
        return "bg-gradient-to-r from-green-600 to-orange-600 text-white shadow-lg";
      } else if (isLeftImage) {
        return "bg-green-600 text-white shadow-lg";
      } else if (isRightImage) {
        return "bg-orange-600 text-white shadow-lg";
      }
    } else if (isSelected) {
      return "bg-blue-600 text-white shadow-lg";
    }

    return isHovered
      ? "bg-gray-700 text-gray-200"
      : "bg-gray-800 hover:bg-gray-700 text-gray-200";
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`p-4 rounded-lg cursor-pointer transition-all relative ${getBackgroundClass()}`}
    >
      {compareMode && (isLeftImage || isRightImage) && (
        <div className="absolute top-2 right-2 flex gap-1">
          {isLeftImage && (
            <span className="text-xs bg-green-700 px-2 py-1 rounded">L</span>
          )}
          {isRightImage && (
            <span className="text-xs bg-orange-700 px-2 py-1 rounded">R</span>
          )}
        </div>
      )}
      <div className="font-medium text-sm truncate pr-12">{feature.id}</div>
      <div
        className={`text-xs mt-1 ${
          isSelected || isLeftImage || isRightImage
            ? "text-gray-100"
            : "text-gray-400"
        }`}
      >
        {date}
      </div>
      {cloudCover !== undefined && (
        <div
          className={`text-xs mt-1 ${
            isSelected || isLeftImage || isRightImage
              ? "text-gray-100"
              : "text-gray-400"
          }`}
        >
          Cloud Cover: {cloudCover.toFixed(1)}%
        </div>
      )}
    </div>
  );
};

export default ResultsList;
