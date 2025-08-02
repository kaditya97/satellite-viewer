import React from 'react';

const ResultsList = ({ results, selectedResult, onResultClick, loading, hoveredResult, onResultHover, onResultHoverEnd }) => {
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
          <div className="space-y-2">
            {results.map((feature, index) => (
              <ResultItem
                key={feature.id}
                feature={feature}
                index={index}
                isSelected={selectedResult === index}
                isHovered={hoveredResult === index}
                onClick={() => onResultClick(feature, index)}
                onMouseEnter={() => onResultHover(feature, index)}
                onMouseLeave={onResultHoverEnd}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="text-gray-400 text-center py-8">
          <p className="text-sm">No results to display</p>
          <p className="text-xs mt-2">Draw a bounding box and search for satellite imagery</p>
        </div>
      )}
    </div>
  );
};

const ResultItem = ({ feature, index, isSelected, isHovered, onClick, onMouseEnter, onMouseLeave }) => {
  const date = new Date(feature.properties.datetime).toLocaleDateString();
  const cloudCover = feature.properties['eo:cloud_cover'];
  
  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`p-4 rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? 'bg-blue-600 text-white shadow-lg' 
          : isHovered
            ? 'bg-gray-700 text-gray-200'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
      }`}
    >
      <div className="font-medium text-sm truncate">
        {feature.id}
      </div>
      <div className={`text-xs mt-1 ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
        {date}
      </div>
      {cloudCover !== undefined && (
        <div className={`text-xs mt-1 ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
          Cloud Cover: {cloudCover.toFixed(1)}%
        </div>
      )}
    </div>
  );
};

export default ResultsList;