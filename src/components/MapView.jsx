import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw, { createBox } from 'ol/interaction/Draw';
import { fromLonLat, transformExtent } from 'ol/proj';
import { Style, Stroke, Fill } from 'ol/style';
import LayerGroup from 'ol/layer/Group';
import WebGLTile from 'ol/layer/WebGLTile';
import GeoTIFFSource from 'ol/source/GeoTIFF';
import { Polygon } from 'ol/geom';
import Feature from 'ol/Feature';

const MapView = forwardRef(({ mapLoading, setMapLoading, bandStyle }, ref) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const vectorSourceRef = useRef(null);
  const satelliteLayerGroupRef = useRef(null);
  const drawRef = useRef(null);
  const currentFeatureRef = useRef(null);
  const currentLayerRef = useRef(null);
  const footprintSourceRef = useRef(null);
  const footprintLayerRef = useRef(null);

  console.log(bandStyle, "bandStyle in MapView");

  useImperativeHandle(ref, () => ({
    getCurrentBBox: () => {
      const features = vectorSourceRef.current.getFeatures();
      if (features.length > 0) {
        const extent = features[0].getGeometry().getExtent();
        return transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
      }

      const extent = mapInstanceRef.current.getView().calculateExtent(mapInstanceRef.current.getSize());
      return transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
    },

    showFootprint: (feature) => {
      if (!feature || !feature.bbox) return;
      
      // Clear any existing footprint
      footprintSourceRef.current?.clear();
      
      // Create a polygon from the bbox
      const [minLon, minLat, maxLon, maxLat] = feature.bbox;
      const coordinates = [[
        fromLonLat([minLon, minLat]),
        fromLonLat([maxLon, minLat]),
        fromLonLat([maxLon, maxLat]),
        fromLonLat([minLon, maxLat]),
        fromLonLat([minLon, minLat])
      ]];
      
      const polygon = new Polygon(coordinates);
      const footprintFeature = new Feature({
        geometry: polygon
      });
      
      footprintSourceRef.current.addFeature(footprintFeature);
    },
    
    hideFootprint: () => {
      if (footprintSourceRef.current) {
        footprintSourceRef.current.clear();
      }
    },

    addImageryToMap: async (feature) => {
        footprintSourceRef.current?.clear();
      satelliteLayerGroupRef.current.getLayers().clear();
      setMapLoading(true);
      currentFeatureRef.current = feature;

      try {
        const collectionType = feature.collection;

        if (collectionType === 'sentinel-2-l2a') {
          // Load all available bands in order
          const redUrl = feature.assets.red?.href;
          const greenUrl = feature.assets.green?.href;
          const blueUrl = feature.assets.blue?.href;
          const nirUrl = feature.assets.nir?.href;

          if (redUrl || greenUrl || blueUrl || nirUrl) {
            const source = new GeoTIFFSource({
              normalize: false,
              sources: [
                { url: redUrl },
                { url: greenUrl },
                { url: blueUrl },
                { url: nirUrl }
              ],
            });

            const extent = transformExtent(feature.bbox, 'EPSG:4326', 'EPSG:3857');
            
            const defaultStyle = {
              color: ['array', ['/', ['band', 4], 3000], ['/', ['band', 3], 3000], ['/', ['band', 2], 3000], 1],
              gamma: 1.1,
            };

            const tileLayer = new WebGLTile({
              source: source,
              style: bandStyle || defaultStyle,
              extent: extent,
              resample: true,
            });

            currentLayerRef.current = tileLayer;
            satelliteLayerGroupRef.current.getLayers().push(tileLayer);
          }
        }


        if (feature.bbox) {
          const extent = transformExtent(feature.bbox, 'EPSG:4326', 'EPSG:3857');
          mapInstanceRef.current.getView().fit(extent, {
            padding: [50, 50, 50, 50],
            duration: 1000
          });
        }

        setTimeout(() => {
          setMapLoading(false);
        }, 1000);

      } catch (error) {
        console.error('Error loading imagery:', error);
        alert('Error loading imagery. The image might be too large or unavailable.');
        setMapLoading(false);
      }
    },
    clearLayers: () => {
      satelliteLayerGroupRef.current.getLayers().clear();
      vectorSourceRef.current.clear();
      footprintSourceRef.current?.clear();
      currentFeatureRef.current = null;
      currentLayerRef.current = null;
      addDrawInteraction();
    },
    updateBandStyle: (style) => {
      if (currentLayerRef.current && style) {
        currentLayerRef.current.setStyle(style);
      }
    }
  }));

  // Update style when bandStyle prop changes
  useEffect(() => {
    if (currentLayerRef.current && bandStyle) {
      currentLayerRef.current.setStyle(bandStyle);
    }
  }, [bandStyle]);

  const addDrawInteraction = () => {
    drawRef.current = new Draw({
      source: vectorSourceRef.current,
      type: 'Circle',
      geometryFunction: createBox()
    });

    drawRef.current.on('drawend', () => {
      const features = vectorSourceRef.current.getFeatures();
      if (features.length > 1) {
        vectorSourceRef.current.removeFeature(features[0]);
      }
      mapInstanceRef.current.removeInteraction(drawRef.current);
    });

    mapInstanceRef.current.addInteraction(drawRef.current);
  };

  useEffect(() => {
    vectorSourceRef.current = new VectorSource();
    footprintSourceRef.current = new VectorSource();
    satelliteLayerGroupRef.current = new LayerGroup({
      layers: []
    });

    const vectorLayer = new VectorLayer({
      source: vectorSourceRef.current,
      style: new Style({
        stroke: new Stroke({
          color: 'rgba(239, 68, 68, 0.8)',
          width: 2
        }),
        fill: new Fill({
          color: 'rgba(239, 68, 68, 0.1)'
        })
      })
    });

    // Create footprint layer with distinct styling
    footprintLayerRef.current = new VectorLayer({
      source: footprintSourceRef.current,
      style: new Style({
        stroke: new Stroke({
          color: 'rgba(59, 130, 246, 0.8)', // Blue color
          width: 2,
          lineDash: [5, 5] // Dashed line
        }),
        fill: new Fill({
          color: 'rgba(59, 130, 246, 0.1)' // Light blue fill
        })
      }),
      zIndex: 10 // Ensure it appears above base layers but below imagery
    });

    mapInstanceRef.current = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        satelliteLayerGroupRef.current,
        footprintLayerRef.current,
        vectorLayer
      ],
      view: new View({
        center: fromLonLat([-98.5795, 39.8283]),
        zoom: 4
      })
    });

    addDrawInteraction();

    const handleKeyDown = (e) => {
      if (e.key === 'd' || e.key === 'D') {
        vectorSourceRef.current.clear();
        mapInstanceRef.current.removeInteraction(drawRef.current);
        addDrawInteraction();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      mapInstanceRef.current.dispose();
    };
  }, []);

  return (
    <div className="relative flex-1">
      <div ref={mapRef} className="w-full h-full" />
      
      {mapLoading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 bg-opacity-90 p-5 rounded-lg shadow-lg z-50">
          <div className="text-gray-100">Loading imagery...</div>
        </div>
      )}
    </div>
  );
});

MapView.displayName = 'MapView';

export default MapView;