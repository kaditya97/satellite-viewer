import React, { useState, useEffect } from "react";

const AdvancedBandSelector = ({
  currentCombination,
  onCombinationChange,
  satelliteType,
  onCustomBandChange,
}) => {
  const [showCustom, setShowCustom] = useState(false);
  const [customBands, setCustomBands] = useState({ r: 1, g: 2, b: 3 });
  const [selectedChannel, setSelectedChannel] = useState(null);

  const bandInfo = {
    "sentinel-2-l2a": {
      bands: [
        {
          id: 1,
          name: "Red",
          fullName: "Red",
          wavelength: "665nm",
          color: "#FF0000",
        },
        {
          id: 2,
          name: "Green",
          fullName: "Green",
          wavelength: "560nm",
          color: "#00FF00",
        },
        {
          id: 3,
          name: "Blue",
          fullName: "Blue",
          wavelength: "490nm",
          color: "#0000FF",
        },
        {
          id: 4,
          name: "NIR",
          fullName: "Near Infrared",
          wavelength: "842nm",
          color: "#DC143C",
        },
        // {
        //   id: 11,
        //   name: "SWIR1",
        //   fullName: "Short Wave Infrared 1",
        //   wavelength: "1610nm",
        //   color: "#8B4513",
        // },
        // {
        //   id: 12,
        //   name: "SWIR2",
        //   fullName: "Short Wave Infrared 2",
        //   wavelength: "2190nm",
        //   color: "#654321",
        // },
      ],
      presets: [
        {
          value: "trueColor",
          label: "True Color (1-2-3)",
          bands: { r: 1, g: 2, b: 3 },
        },
        {
          value: "falseColor",
          label: "False Color (4-1-2)",
          bands: { r: 4, g: 1, b: 2 },
        },
        { value: "ndvi", label: "NDVI", bands: null },
        { value: "ndwi", label: "NDWI", bands: null },
        { value: "evi", label: "EVI", bands: null },
        { value: "savi", label: "SAVI", bands: null },
        // { value: "ndbi", label: "NDBI", bands: null },
        // { value: "ndsi", label: "NDSI", bands: null },
      ],
    },
  };

  const info = bandInfo[satelliteType];
  if (!info) return null;

  const generateBandStyle = (combination, bands = null) => {
    if (combination === "custom" && bands) {
      return {
        color: [
          "array",
          ["/", ["band", bands.r], 3000],
          ["/", ["band", bands.g], 3000],
          ["/", ["band", bands.b], 3000],
          1,
        ],
        gamma: 1.1,
      };
    }

    const preset = info.presets.find((p) => p.value === combination);

    // NDVI: (NIR - Red) / (NIR + Red)
    if (combination === "ndvi") {
      return {
        color: [
          "interpolate",
          ["linear"],
          [
            "/",
            ["-", ["/", ["band", 4], 3000], ["/", ["band", 1], 3000]],
            ["+", ["/", ["band", 4], 3000], ["/", ["band", 1], 3000]],
          ],
          -0.2,
          [191, 191, 191],
          0,
          [255, 255, 224],
          0.1,
          [204, 199, 130],
          0.2,
          [145, 191, 82],
          0.3,
          [112, 163, 64],
          0.4,
          [79, 138, 46],
          0.5,
          [48, 110, 28],
          0.6,
          [15, 84, 10],
          0.65,
          [0, 69, 0],
        ],
      };
    }

    // NDWI: (Green - NIR) / (Green + NIR)
    if (combination === "ndwi") {
      return {
        color: [
          "interpolate",
          ["linear"],
          [
            "/",
            ["-", ["/", ["band", 2], 3000], ["/", ["band", 4], 3000]],
            ["+", ["/", ["band", 2], 3000], ["/", ["band", 4], 3000]],
          ],
          -0.3,
          [255, 255, 255],
          -0.2,
          [254, 217, 118],
          -0.1,
          [254, 178, 76],
          0,
          [253, 141, 60],
          0.1,
          [252, 78, 42],
          0.2,
          [227, 26, 28],
          0.3,
          [177, 0, 38],
          0.4,
          [128, 0, 38],
          0.5,
          [89, 0, 38],
        ],
      };
    }

    // EVI: 2.5 * ((NIR - Red) / (NIR + 6 * Red - 7.5 * Blue + 1))
    if (combination === "evi") {
      return {
        color: [
          "interpolate",
          ["linear"],
          [
            "*",
            2.5,
            [
              "/",
              ["-", ["/", ["band", 4], 3000], ["/", ["band", 1], 3000]],
              [
                "+",
                ["/", ["band", 4], 3000],
                [
                  "-",
                  ["*", 6, ["/", ["band", 1], 3000]],
                  ["+", ["*", 7.5, ["/", ["band", 3], 3000]], 1],
                ],
              ],
            ],
          ],
          -0.2,
          [191, 191, 191],
          0,
          [255, 255, 224],
          0.1,
          [204, 199, 130],
          0.2,
          [145, 191, 82],
          0.3,
          [112, 163, 64],
          0.4,
          [79, 138, 46],
          0.5,
          [48, 110, 28],
          0.6,
          [15, 84, 10],
          0.65,
          [0, 69, 0],
        ],
      };
    }

    // SAVI: ((NIR - Red) / (NIR + Red + L)) * (1 + L) where L = 0.5
    if (combination === "savi") {
      const L = 0.5;
      return {
        color: [
          "interpolate",
          ["linear"],
          [
            "*",
            [
              "/",
              ["-", ["/", ["band", 4], 3000], ["/", ["band", 1], 3000]],
              [
                "+",
                ["/", ["band", 4], 3000],
                ["+", ["/", ["band", 1], 3000], L],
              ],
            ],
            1 + L,
          ],
          -0.2,
          [191, 191, 191],
          0,
          [255, 255, 224],
          0.1,
          [204, 199, 130],
          0.2,
          [145, 191, 82],
          0.3,
          [112, 163, 64],
          0.4,
          [79, 138, 46],
          0.5,
          [48, 110, 28],
          0.6,
          [15, 84, 10],
          0.65,
          [0, 69, 0],
        ],
      };
    }

    // NDBI: (SWIR - NIR) / (SWIR + NIR)
    if (combination === "ndbi") {
      return {
        color: [
          "interpolate",
          ["linear"],
          [
            "/",
            ["-", ["/", ["band", 11], 3000], ["/", ["band", 4], 3000]],
            ["+", ["/", ["band", 11], 3000], ["/", ["band", 4], 3000]],
          ],
          -0.3,
          [0, 0, 255],
          -0.2,
          [0, 128, 255],
          -0.1,
          [0, 255, 255],
          0,
          [255, 255, 0],
          0.1,
          [255, 200, 0],
          0.2,
          [255, 128, 0],
          0.3,
          [255, 0, 0],
          0.4,
          [200, 0, 0],
          0.5,
          [128, 0, 0],
        ],
      };
    }

    // NDSI: (Green - SWIR) / (Green + SWIR)
    if (combination === "ndsi") {
      return {
        color: [
          "interpolate",
          ["linear"],
          [
            "/",
            ["-", ["/", ["band", 2], 3000], ["/", ["band", 11], 3000]],
            ["+", ["/", ["band", 2], 3000], ["/", ["band", 11], 3000]],
          ],
          -0.3,
          [128, 128, 128],
          -0.2,
          [150, 150, 150],
          -0.1,
          [180, 180, 180],
          0,
          [200, 200, 200],
          0.1,
          [220, 220, 220],
          0.2,
          [240, 240, 240],
          0.3,
          [255, 255, 255],
          0.4,
          [200, 255, 255],
          0.5,
          [150, 255, 255],
        ],
      };
    }

    if (!preset || !preset.bands) return null;

    return {
      color: [
        "array",
        ["/", ["band", preset.bands.r], 3000],
        ["/", ["band", preset.bands.g], 3000],
        ["/", ["band", preset.bands.b], 3000],
        1,
      ],
      gamma: 1.1,
    };
  };

  useEffect(() => {
    const firstPreset = info.presets.find((p) => p.bands);
    if (firstPreset) setCustomBands(firstPreset.bands);
  }, [satelliteType]);

  useEffect(() => {
    if (currentCombination) {
      const preset = info.presets.find((p) => p.value === currentCombination);
      if (preset) {
        const style = generateBandStyle(currentCombination, preset.bands);
        if (onCustomBandChange && style) {
          onCustomBandChange(preset.bands || customBands, style);
        }
      }
    }
  }, [currentCombination, satelliteType]);

  const handlePresetClick = (preset) => {
    setShowCustom(false);
    onCombinationChange(preset.value);
    if (preset.bands) setCustomBands(preset.bands);
    const style = generateBandStyle(preset.value, preset.bands);
    if (onCustomBandChange && style) {
      onCustomBandChange(preset.bands || customBands, style);
    }
  };

  const handleBandClick = (bandId) => {
    if (!selectedChannel) {
      const currentChannel = Object.entries(customBands).find(
        ([_, id]) => id === bandId
      )?.[0];
      if (currentChannel) setSelectedChannel(currentChannel);
    } else {
      const newBands = { ...customBands, [selectedChannel]: bandId };
      setCustomBands(newBands);
      setSelectedChannel(null);
      onCombinationChange("custom");
      const style = generateBandStyle("custom", newBands);
      if (onCustomBandChange && style) {
        onCustomBandChange(newBands, style);
      }
    }
  };

  const getChannelForBand = (bandId) => {
    return Object.entries(customBands).find(([_, id]) => id === bandId)?.[0];
  };

  const channelColors = {
    r: "border-red-500 bg-red-500/20",
    g: "border-green-500 bg-green-500/20",
    b: "border-blue-500 bg-blue-500/20",
  };

  return (
    <div className="bg-gray-900">
      {/* Presets */}
      <div className="space-y-2 mb-6">
        <h4 className="text-sm font-medium text-gray-400 mb-2">Presets</h4>
        <div className="grid grid-cols-1 gap-2">
          {info.presets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetClick(preset)}
              className={`text-left p-3 rounded-md transition-all ${
                currentCombination === preset.value && !showCustom
                  ? "bg-blue-900 border-2 border-blue-500 shadow-lg"
                  : "bg-gray-800 hover:bg-gray-700 border-2 border-transparent"
              }`}
            >
              <div className="font-medium text-gray-100">{preset.label}</div>
              {preset.bands && (
                <div className="text-xs text-gray-400 mt-1">
                  RGB: {preset.bands.r}-{preset.bands.g}-{preset.bands.b}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Selector */}
      <div className="border-t border-gray-700 pt-4">
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`w-full text-left p-3 rounded-md transition-all ${
            showCustom ? "bg-gray-700" : "bg-gray-800 hover:bg-gray-700"
          }`}
        >
          <div className="font-medium flex justify-between items-center text-gray-100">
            <span>Custom Combination</span>
            <span className="text-gray-400">{showCustom ? "−" : "+"}</span>
          </div>
        </button>

        {showCustom && (
          <div className="mt-4 space-y-4">
            {/* Current Assignment */}
            <div className="bg-gray-800 p-3 rounded-md">
              <div className="text-sm text-gray-400 mb-2">
                Current Assignment:
              </div>
              <div className="flex justify-around">
                {["r", "g", "b"].map((channel) => (
                  <div key={channel} className="text-center">
                    <div
                      className={`text-lg font-bold ${
                        channel === "r"
                          ? "text-red-500"
                          : channel === "g"
                          ? "text-green-500"
                          : "text-blue-500"
                      }`}
                    >
                      {channel.toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-300">
                      Band {customBands[channel]}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Band Cubes */}
            <div className="grid grid-cols-2 gap-3">
              {info.bands.map((band) => {
                const channel = getChannelForBand(band.id);
                const isSelected = channel === selectedChannel;

                return (
                  <button
                    key={band.id}
                    onClick={() => handleBandClick(band.id)}
                    className={`relative group transition-all ${
                      isSelected ? "scale-110" : ""
                    }`}
                  >
                    <div
                      className={`w-full aspect-square rounded-lg border-2 transition-all ${
                        channel
                          ? channelColors[channel]
                          : "border-gray-600 bg-gray-800"
                      } ${
                        isSelected ? "ring-2 ring-white animate-pulse" : ""
                      } hover:border-white`}
                      style={{
                        background: channel
                          ? undefined
                          : `linear-gradient(135deg, ${band.color}40 0%, ${band.color}20 100%)`,
                      }}
                    >
                      <div className="flex flex-col items-center justify-center h-full p-2">
                        <div className="text-lg font-bold text-gray-100">
                          {band.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {band.wavelength}
                        </div>
                        {channel && (
                          <div
                            className={`text-xs font-bold mt-1 ${
                              channel === "r"
                                ? "text-red-400"
                                : channel === "g"
                                ? "text-green-400"
                                : "text-blue-400"
                            }`}
                          >
                            {channel.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Apply Button */}
            <button
              onClick={() => {
                onCombinationChange("custom");
                const style = generateBandStyle("custom", customBands);
                if (onCustomBandChange && style) {
                  onCustomBandChange(customBands, style);
                }
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors font-medium"
            >
              Apply Custom Combination
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedBandSelector;
