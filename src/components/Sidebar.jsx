import React from 'react';
import SearchControls from './SearchControls';
import ResultsList from './ResultsList';

const Sidebar = ({
  collection,
  setCollection,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  cloudCover,
  setCloudCover,
  loading,
  results,
  selectedResult,
  hoveredResult,
  onSearch,
  onClear,
  onResultClick,
  onResultHover,
    onResultHoverEnd,
}) => {
  return (
    <div className="w-96 bg-gray-900 text-gray-100 flex flex-col h-screen">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-2xl font-bold">Satellite Data Viewer</h2>
        <p className="text-gray-400 text-sm mt-1">Earth Search STAC API</p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <SearchControls
          collection={collection}
          setCollection={setCollection}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          cloudCover={cloudCover}
          setCloudCover={setCloudCover}
          loading={loading}
          onSearch={onSearch}
          onClear={onClear}
        />
        
        <ResultsList
          results={results}
          selectedResult={selectedResult}
          onResultClick={onResultClick}
          loading={loading}
          hoveredResult={hoveredResult}
          onResultHover={onResultHover}
          onResultHoverEnd={onResultHoverEnd}
        />
      </div>
    </div>
  );
};

export default Sidebar;