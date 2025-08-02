export const searchSatelliteData = async ({
  bbox,
  collection,
  startDate,
  endDate,
  cloudCover,
  limit = 10,
  page = 1
}) => {
  const searchBody = {
    bbox: bbox,
    datetime: `${startDate}T00:00:00Z/${endDate}T23:59:59Z`,
    collections: [collection],
    limit: parseInt(limit),
    query: {}
  };

  // Calculate offset for pagination
  if (page > 1) {
    searchBody.offset = (page - 1) * limit;
  }

  if (collection === 'sentinel-2-l2a' || collection === 'landsat-c2-l2') {
    searchBody.query["eo:cloud_cover"] = {
      lt: parseInt(cloudCover)
    };
  }

  const response = await fetch('https://earth-search.aws.element84.com/v1/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(searchBody)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};