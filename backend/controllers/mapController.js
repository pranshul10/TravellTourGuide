const fetch = require('node-fetch'); // Assuming node-fetch@2 is installed

// --- Geocoding Function (using Nominatim) ---
async function geocodeLocation(locationName) {
    if (!locationName) {
        throw new Error("Location name is required for geocoding.");
    }
    // IMPORTANT: For production use, adhere to Nominatim's Usage Policy:
    // https://operations.osmfoundation.org/policies/nominatim/
    // Especially: Valid HTTP User-Agent, no heavy usage without discussion.
    const encodedLocation = encodeURIComponent(locationName);
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodedLocation}&format=json&limit=1&addressdetails=1`;
    
    console.log(`[MapController-Geocode] Fetching URL: ${geocodeUrl}`);

    try {
        const response = await fetch(geocodeUrl, {
            headers: {
                'User-Agent': 'TravelGuideApp/1.0 (randomx626@gmail.com)' // REPLACE with your app name and contact
            }
        });
        const data = await response.json();

        if (data && data.length > 0) {
            const firstResult = data[0];
            console.log(`[MapController-Geocode] Geocoded "${locationName}" to: Lat ${firstResult.lat}, Lon ${firstResult.lon}`);
            return {
                lat: parseFloat(firstResult.lat),
                lon: parseFloat(firstResult.lon),
                display_name: firstResult.display_name
            };
        } else {
            console.warn(`[MapController-Geocode] No results found for "${locationName}"`);
            throw new Error(`Could not find coordinates for "${locationName}".`);
        }
    } catch (error) {
        console.error(`[MapController-Geocode] Error geocoding "${locationName}":`, error);
        throw new Error(`Geocoding failed for "${locationName}". ${error.message}`);
    }
}

async function getRoute(fromLat, fromLon, toLat, toLon) {
    const osrmRouteUrl = `http://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson`;
    // Note: OSRM expects {longitude},{latitude}

    console.log(`[MapController-Route] Fetching OSRM URL: ${osrmRouteUrl}`);

    try {
        const response = await fetch(osrmRouteUrl);
        const data = await response.json();

        if (data.code === "Ok" && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            console.log(`[MapController-Route] Route found. Distance: ${route.distance}, Duration: ${route.duration}`);
            return {
                distance: route.distance, // in meters
                duration: route.duration, // in seconds
                geometry: route.geometry // GeoJSON LineString
            };
        } else {
            console.warn(`[MapController-Route] OSRM could not find a route or returned an error: ${data.code} - ${data.message}`);
            throw new Error(`Could not calculate route. OSRM error: ${data.message || data.code || 'Unknown error'}`);
        }
    } catch (error) {
        console.error("[MapController-Route] Error fetching route from OSRM:", error);
        throw new Error(`Route calculation failed. ${error.message}`);
    }
}


// --- Controller Exports ---
exports.geocode = async (req, res) => {
    const { location } = req.query;
    if (!location) {
        return res.status(400).json({ message: "Location query parameter is required." });
    }
    try {
        const coordinates = await geocodeLocation(location);
        res.json(coordinates);
    } catch (error) {
        res.status(500).json({ message: error.message || "Error geocoding location." });
    }
};

exports.calculateRoute = async (req, res) => {
    const { from_lat, from_lon, to_lat, to_lon } = req.query;

    if (!from_lat || !from_lon || !to_lat || !to_lon) {
        return res.status(400).json({ message: "All four coordinates (from_lat, from_lon, to_lat, to_lon) are required." });
    }

    try {
        const routeDetails = await getRoute(
            parseFloat(from_lat),
            parseFloat(from_lon),
            parseFloat(to_lat),
            parseFloat(to_lon)
        );
        res.json(routeDetails);
    } catch (error) {
        res.status(500).json({ message: error.message || "Error calculating route." });
    }
};