const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3001/api';
const mobileNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
// Distinct coordinates (e.g., Eiffel Tower) to verify dynamic location
const currentLocation = { latitude: 48.8584, longitude: 2.2945 };

async function runTest() {
    console.log(`Starting Current Location SOS Test for Mobile: ${mobileNumber}`);
    try {
        // 1. Register (Prerequisite)
        await fetch(`${API_BASE_URL}/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contactNumber: mobileNumber }),
        });

        const dbPath = path.join(__dirname, 'backend', 'db.json');
        const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const user = dbData.users.find(u => u.mobileNumber === mobileNumber);
        const otp = user.otp;

        await fetch(`${API_BASE_URL}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobileNumber, otp }),
        });

        await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: 'Location Tester',
                contactNumber: mobileNumber,
                emergencyContact: '9876543210'
            }),
        });

        // 2. Send SOS with "Current Location"
        console.log(`Sending SOS with location: ${JSON.stringify(currentLocation)}`);
        const sosRes = await fetch(`${API_BASE_URL}/send-sos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mobileNumber,
                location: currentLocation
            }),
        });
        const sosData = await sosRes.json();
        console.log('Response:', sosData);

    } catch (error) {
        console.error('Test failed:', error);
    }
}

runTest();
