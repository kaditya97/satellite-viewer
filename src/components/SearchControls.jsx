import React from 'react';

const SearchControls = ({
  collection,
  setCollection,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  cloudCover,
  setCloudCover,
  loading,
  onSearch,
  onClear
}) => {
  return (
    <div className="p-6 space-y-4 border-b border-gray-800">
      {/* Collection Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Collection
        </label>
        <select 
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="sentinel-2-l2a">Sentinel-2 L2A</option>
        </select>
      </div>

      {/* Date Range */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Date Range
        </label>
        <div className="space-y-2">
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Cloud Cover */}
      {(collection === 'sentinel-2-l2a' || collection === 'landsat-c2-l2') && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Max Cloud Cover: {cloudCover}%
          </label>
          <input 
            type="range" 
            value={cloudCover}
            onChange={(e) => setCloudCover(e.target.value)}
            min="0" 
            max="100" 
                        step="5"
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button 
          onClick={onSearch}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
        <button 
          onClick={onClear}
          className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="text-xs text-gray-400 mt-3">
        Tip: Draw a bounding box on the map or press 'D' to redraw
      </div>
    </div>
  );
};

export default SearchControls;