// const fetch = require('node-fetch'); // Built-in in Node 18+

const findNearestPoliceStation = async (lat, lon) => {
    const radius = 5000; // 5km radius
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node(around:${radius},${lat},${lon})[amenity=police];out;`;

    console.log(`Querying: ${overpassUrl}`);

    try {
        const response = await fetch(overpassUrl);
        const text = await response.text();

        try {
            const data = JSON.parse(text);
            console.log(`Found ${data.elements.length} stations.`);

            if (data.elements.length > 0) {
                data.elements.slice(0, 5).forEach((station, index) => {
                    const tags = station.tags;
                    const name = tags.name || "Unknown Station";
                    const phone = tags.phone || tags['contact:phone'] || "No phone";
                    console.log(`${index + 1}. ${name} - Phone: ${phone}`);
                });
            } else {
                console.log("No police stations found in this area.");
            }
        } catch (e) {
            console.error("Failed to parse JSON.");
            console.error("Response status:", response.status);
            console.error("Response text preview:", text.substring(0, 500));
        }

    } catch (error) {
        console.error("Error fetching nearest police station:", error);
    }
};

// Test with a location that likely has police stations (e.g., Central London)
// Latitude: 51.5074, Longitude: -0.1278
console.log("Testing London...");
findNearestPoliceStation(51.5074, -0.1278);

// Test with a location in India (e.g., Connaught Place, New Delhi)
// Latitude: 28.6304, Longitude: 77.2177
setTimeout(() => {
    console.log("\nTesting New Delhi...");
    findNearestPoliceStation(28.6304, 77.2177);
}, 3000);
