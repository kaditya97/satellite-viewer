// components/MapView.jsx
import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Draw, { createBox } from "ol/interaction/Draw";
import { fromLonLat, transformExtent } from "ol/proj";
import { Style, Stroke, Fill } from "ol/style";
import LayerGroup from "ol/layer/Group";
import WebGLTile from "ol/layer/WebGLTile";
import GeoTIFFSource from "ol/source/GeoTIFF";
import { Polygon } from "ol/geom";
import Feature from "ol/Feature";

const MapView = forwardRef(
  (
    {
      mapLoading,
      setMapLoading,
      bandStyle,
      compareMode = false,
      compareType = "sideBySide",
    },
    ref
  ) => {
    const mapRef = useRef(null);
    const leftMapRef = useRef(null);
    const rightMapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const leftMapInstanceRef = useRef(null);
    const rightMapInstanceRef = useRef(null);
    const vectorSourceRef = useRef(null);
    const satelliteLayerGroupRef = useRef(null);
    const leftSatelliteLayerGroupRef = useRef(null);
    const rightSatelliteLayerGroupRef = useRef(null);
    const drawRef = useRef(null);
    const currentFeatureRef = useRef(null);
    const currentLayerRef = useRef(null);
    const footprintSourceRef = useRef(null);
    const footprintLayerRef = useRef(null);

    // Compare mode state
    const [leftFeature, setLeftFeature] = useState(null);
    const [rightFeature, setRightFeature] = useState(null);
    const [leftBandStyle, setLeftBandStyle] = useState(null);
    const [rightBandStyle, setRightBandStyle] = useState(null);
    const [activeSlot, setActiveSlot] = useState("left"); // 'left' or 'right'

    const createGeoTIFFLayer = (feature, bandStyle) => {
      if (!feature || feature.collection !== "sentinel-2-l2a") return null;

      const redUrl = feature.assets.red?.href;
      const greenUrl = feature.assets.green?.href;
      const blueUrl = feature.assets.blue?.href;
      const nirUrl = feature.assets.nir?.href;

      if (!redUrl && !greenUrl && !blueUrl && !nirUrl) return null;

      const source = new GeoTIFFSource({
        normalize: false,
        sources: [
          { url: redUrl },
          { url: greenUrl },
          { url: blueUrl },
          { url: nirUrl },
        ],
      });

      const extent = transformExtent(feature.bbox, "EPSG:4326", "EPSG:3857");

      const defaultStyle = {
        color: [
          "array",
          ["/", ["band", 4], 3000],
          ["/", ["band", 3], 3000],
          ["/", ["band", 2], 3000],
          1,
        ],
        gamma: 1.1,
      };

      return new WebGLTile({
        source: source,
        style: bandStyle || defaultStyle,
        extent: extent,
        resample: true,
      });
    };

    useImperativeHandle(ref, () => ({
      getCurrentBBox: () => {
        const features = vectorSourceRef.current.getFeatures();
        if (features.length > 0) {
          const extent = features[0].getGeometry().getExtent();
          return transformExtent(extent, "EPSG:3857", "EPSG:4326");
        }

        const map = compareMode
          ? leftMapInstanceRef.current
          : mapInstanceRef.current;
        const extent = map.getView().calculateExtent(map.getSize());
        return transformExtent(extent, "EPSG:3857", "EPSG:4326");
      },

      showFootprint: (feature) => {
        if (!feature || !feature.bbox) return;

        footprintSourceRef.current?.clear();

        const [minLon, minLat, maxLon, maxLat] = feature.bbox;
        const coordinates = [
          [
            fromLonLat([minLon, minLat]),
            fromLonLat([maxLon, minLat]),
            fromLonLat([maxLon, maxLat]),
            fromLonLat([minLon, maxLat]),
            fromLonLat([minLon, minLat]),
          ],
        ];

        const polygon = new Polygon(coordinates);
        const footprintFeature = new Feature({
          geometry: polygon,
        });

        footprintSourceRef.current.addFeature(footprintFeature);
      },

      hideFootprint: () => {
        if (footprintSourceRef.current) {
          footprintSourceRef.current.clear();
        }
      },

      setActiveCompareSlot: (slot) => {
        setActiveSlot(slot);
      },

      getCompareState: () => ({
        leftFeature,
        rightFeature,
        leftBandStyle,
        rightBandStyle,
        activeSlot,
      }),

      addImageryToMap: async (feature) => {
        if (!compareMode) {
          // Normal mode
          footprintSourceRef.current?.clear();
          satelliteLayerGroupRef.current.getLayers().clear();
          setMapLoading(true);
          currentFeatureRef.current = feature;

          try {
            const layer = createGeoTIFFLayer(feature, bandStyle);
            if (layer) {
              currentLayerRef.current = layer;
              satelliteLayerGroupRef.current.getLayers().push(layer);

              const extent = transformExtent(
                feature.bbox,
                "EPSG:4326",
                "EPSG:3857"
              );
              mapInstanceRef.current.getView().fit(extent, {
                padding: [50, 50, 50, 50],
                duration: 1000,
              });
            }
          } catch (error) {
            console.error("Error loading imagery:", error);
            alert(
              "Error loading imagery. The image might be too large or unavailable."
            );
          } finally {
            setMapLoading(false);
          }
        } else {
          // Compare mode - side by side only
          setMapLoading(true);

          try {
            if (activeSlot === "left") {
              setLeftFeature(feature);
              const layer = createGeoTIFFLayer(
                feature,
                leftBandStyle || bandStyle
              );

              leftSatelliteLayerGroupRef.current.getLayers().clear();
              if (layer) {
                leftSatelliteLayerGroupRef.current.getLayers().push(layer);
                const extent = transformExtent(
                  feature.bbox,
                  "EPSG:4326",
                  "EPSG:3857"
                );
                leftMapInstanceRef.current.getView().fit(extent, {
                  padding: [50, 50, 50, 50],
                  duration: 1000,
                });
              }
            } else {
              setRightFeature(feature);
              const layer = createGeoTIFFLayer(
                feature,
                rightBandStyle || bandStyle
              );

              rightSatelliteLayerGroupRef.current.getLayers().clear();
              if (layer) {
                rightSatelliteLayerGroupRef.current.getLayers().push(layer);
                const extent = transformExtent(
                  feature.bbox,
                  "EPSG:4326",
                  "EPSG:3857"
                );
                rightMapInstanceRef.current.getView().fit(extent, {
                  padding: [50, 50, 50, 50],
                  duration: 1000,
                });
              }
            }
          } catch (error) {
            console.error("Error loading imagery:", error);
            alert(
              "Error loading imagery. The image might be too large or unavailable."
            );
          } finally {
            setMapLoading(false);
          }
        }
      },

      clearLayers: () => {
        if (!compareMode) {
          if (satelliteLayerGroupRef.current) {
            satelliteLayerGroupRef.current.getLayers().clear();
          }
          if (vectorSourceRef.current) {
            vectorSourceRef.current.clear();
          }
          if (footprintSourceRef.current) {
            footprintSourceRef.current.clear();
          }
          currentFeatureRef.current = null;
          currentLayerRef.current = null;
          addDrawInteraction();
        } else {
          setLeftFeature(null);
          setRightFeature(null);
          setLeftBandStyle(null);
          setRightBandStyle(null);

          if (leftSatelliteLayerGroupRef.current) {
            leftSatelliteLayerGroupRef.current.getLayers().clear();
          }
          if (rightSatelliteLayerGroupRef.current) {
            rightSatelliteLayerGroupRef.current.getLayers().clear();
          }

          if (vectorSourceRef.current) {
            vectorSourceRef.current.clear();
          }
          if (footprintSourceRef.current) {
            footprintSourceRef.current.clear();
          }
          addDrawInteraction();
        }
      },

      updateBandStyle: (style) => {
        if (!compareMode) {
          if (currentLayerRef.current && style) {
            currentLayerRef.current.setStyle(style);
          }
        } else {
          if (activeSlot === "left") {
            setLeftBandStyle(style);
            const layers = leftSatelliteLayerGroupRef.current.getLayers();
            if (layers.getLength() > 0) {
              layers.item(0).setStyle(style);
            }
          } else {
            setRightBandStyle(style);
            const layers = rightSatelliteLayerGroupRef.current.getLayers();
            if (layers.getLength() > 0) {
              layers.item(0).setStyle(style);
            }
          }
        }
      },
    }));

    // Update style when bandStyle prop changes
    useEffect(() => {
      if (!compareMode && currentLayerRef.current && bandStyle) {
        currentLayerRef.current.setStyle(bandStyle);
      }
    }, [bandStyle, compareMode]);

    const addDrawInteraction = () => {
      const map = compareMode
        ? leftMapInstanceRef.current
        : mapInstanceRef.current;
      if (!map) return;

      drawRef.current = new Draw({
        source: vectorSourceRef.current,
        type: "Circle",
        geometryFunction: createBox(),
      });

      drawRef.current.on("drawend", () => {
        const features = vectorSourceRef.current.getFeatures();
        if (features.length > 1) {
          vectorSourceRef.current.removeFeature(features[0]);
        }
        map.removeInteraction(drawRef.current);
      });

      map.addInteraction(drawRef.current);
    };

    // Initialize maps based on mode
    useEffect(() => {
      // Clean up previous instances
      if (mapInstanceRef.current) {
        mapInstanceRef.current.dispose();
        mapInstanceRef.current = null;
      }
      if (leftMapInstanceRef.current) {
        leftMapInstanceRef.current.dispose();
        leftMapInstanceRef.current = null;
      }
      if (rightMapInstanceRef.current) {
        rightMapInstanceRef.current.dispose();
        rightMapInstanceRef.current = null;
      }

      // Reset refs
      vectorSourceRef.current = new VectorSource();
      footprintSourceRef.current = new VectorSource();

      const vectorLayer = new VectorLayer({
        source: vectorSourceRef.current,
        style: new Style({
          stroke: new Stroke({
            color: "rgba(239, 68, 68, 0.8)",
            width: 2,
          }),
          fill: new Fill({
            color: "rgba(239, 68, 68, 0.1)",
          }),
        }),
      });

      footprintLayerRef.current = new VectorLayer({
        source: footprintSourceRef.current,
        style: new Style({
          stroke: new Stroke({
            color: "rgba(59, 130, 246, 0.8)",
            width: 2,
            lineDash: [5, 5],
          }),
          fill: new Fill({
            color: "rgba(59, 130, 246, 0.1)",
          }),
        }),
        zIndex: 10,
      });

      // Initialize based on mode
      if (!compareMode) {
        // Normal mode
        satelliteLayerGroupRef.current = new LayerGroup({
          layers: [],
        });

        mapInstanceRef.current = new Map({
          target: mapRef.current,
          layers: [
            new TileLayer({
              source: new OSM(),
            }),
            satelliteLayerGroupRef.current,
            footprintLayerRef.current,
            vectorLayer,
          ],
          view: new View({
            center: fromLonLat([-98.5795, 39.8283]),
            zoom: 4,
          }),
        });

        addDrawInteraction();
      } else {
        // Side-by-side mode
        leftSatelliteLayerGroupRef.current = new LayerGroup({ layers: [] });
        rightSatelliteLayerGroupRef.current = new LayerGroup({ layers: [] });

        const sharedView = new View({
          center: fromLonLat([-98.5795, 39.8283]),
          zoom: 4,
        });

        // Ensure containers are ready before creating maps
        setTimeout(() => {
          if (!leftMapRef.current || !rightMapRef.current) return;

          leftMapInstanceRef.current = new Map({
            target: leftMapRef.current,
            layers: [
              new TileLayer({ source: new OSM() }),
              leftSatelliteLayerGroupRef.current,
              footprintLayerRef.current,
              vectorLayer,
            ],
            view: sharedView,
          });

          rightMapInstanceRef.current = new Map({
            target: rightMapRef.current,
            layers: [
              new TileLayer({ source: new OSM() }),
              rightSatelliteLayerGroupRef.current,
            ],
            view: new View({
              center: sharedView.getCenter(),
              zoom: sharedView.getZoom(),
              rotation: sharedView.getRotation(),
            }),
          });

          // Force update sizes
          leftMapInstanceRef.current.updateSize();
          rightMapInstanceRef.current.updateSize();

          // Sync view changes
          const syncViews = (sourceMap, targetMap) => {
            const sourceView = sourceMap.getView();
            const targetView = targetMap.getView();
            targetView.setCenter(sourceView.getCenter());
            targetView.setZoom(sourceView.getZoom());
            targetView.setRotation(sourceView.getRotation());
          };

          leftMapInstanceRef.current.on("moveend", () => {
            syncViews(leftMapInstanceRef.current, rightMapInstanceRef.current);
          });

          rightMapInstanceRef.current.on("moveend", () => {
            syncViews(rightMapInstanceRef.current, leftMapInstanceRef.current);
          });

          // Add draw interaction to left map
          drawRef.current = new Draw({
            source: vectorSourceRef.current,
            type: "Circle",
            geometryFunction: createBox(),
          });

          drawRef.current.on("drawend", () => {
            const features = vectorSourceRef.current.getFeatures();
            if (features.length > 1) {
              vectorSourceRef.current.removeFeature(features[0]);
            }
            leftMapInstanceRef.current.removeInteraction(drawRef.current);
          });

          leftMapInstanceRef.current.addInteraction(drawRef.current);
        }, 0);
      }

      const handleKeyDown = (e) => {
        if (e.key === "d" || e.key === "D") {
          vectorSourceRef.current.clear();
          if (compareMode) {
            leftMapInstanceRef.current?.removeInteraction(drawRef.current);
          } else {
            mapInstanceRef.current?.removeInteraction(drawRef.current);
          }
          addDrawInteraction();
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        mapInstanceRef.current?.dispose();
        leftMapInstanceRef.current?.dispose();
        rightMapInstanceRef.current?.dispose();
      };
    }, [compareMode]);

    // Force resize on side-by-side mode
    useEffect(() => {
      if (compareMode) {
        setTimeout(() => {
          leftMapInstanceRef.current?.updateSize();
          rightMapInstanceRef.current?.updateSize();
        }, 100);
      }
    }, [compareMode]);

    // Render based on mode
    if (compareMode) {
      return (
        <div className="relative flex h-full w-full">
          <div className="flex-1 relative h-full border-r-2 border-gray-700">
            <div ref={leftMapRef} className="absolute inset-0" />
            <div className="absolute top-2 left-2 bg-gray-900 bg-opacity-90 px-3 py-1 rounded text-sm text-white shadow-lg z-10">
              Left:{" "}
              {leftFeature?.id
                ? new Date(leftFeature.properties.datetime).toLocaleDateString()
                : "No image"}
            </div>
            {activeSlot === "left" && (
              <div className="absolute top-2 right-2 bg-blue-600 px-2 py-1 rounded text-xs text-white z-10">
                Active
              </div>
            )}
          </div>
          <div className="flex-1 relative h-full">
            <div ref={rightMapRef} className="absolute inset-0" />
            <div className="absolute top-2 left-2 bg-gray-900 bg-opacity-90 px-3 py-1 rounded text-sm text-white shadow-lg z-10">
              Right:{" "}
              {rightFeature?.id
                ? new Date(
                    rightFeature.properties.datetime
                  ).toLocaleDateString()
                : "No image"}
            </div>
            {activeSlot === "right" && (
              <div className="absolute top-2 right-2 bg-blue-600 px-2 py-1 rounded text-xs text-white z-10">
                Active
              </div>
            )}
          </div>

          {mapLoading && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 bg-opacity-90 p-5 rounded-lg shadow-lg z-50">
              <div className="text-gray-100">Loading imagery...</div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="relative w-full h-full">
        <div ref={mapRef} className="w-full h-full" />

        {mapLoading && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 bg-opacity-90 p-5 rounded-lg shadow-lg z-50">
            <div className="text-gray-100">Loading imagery...</div>
          </div>
        )}
      </div>
    );
  }
);

MapView.displayName = "MapView";

export default MapView;
