const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3001/api';
const mobileNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
const emergencyContact = '9998887776';

async function runTest() {
    console.log(`Starting SOS Test for Mobile: ${mobileNumber}`);
    try {
        // 1. Register
        console.log('1. Registering...');
        // Need to get OTP first to register properly
        await fetch(`${API_BASE_URL}/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contactNumber: mobileNumber }),
        });

        // Read OTP
        const dbPath = path.join(__dirname, 'backend', 'db.json');
        const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const user = dbData.users.find(u => u.mobileNumber === mobileNumber);
        const otp = user.otp;

        // Verify OTP
        await fetch(`${API_BASE_URL}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobileNumber, otp }),
        });

        // Register
        await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: 'SOS Tester',
                contactNumber: mobileNumber,
                emergencyContact: emergencyContact
            }),
        });

        // 2. Send SOS
        console.log('2. Sending SOS...');
        const sosRes = await fetch(`${API_BASE_URL}/send-sos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mobileNumber,
                location: { latitude: 28.6139, longitude: 77.2090 } // New Delhi
            }),
        });
        const sosData = await sosRes.json();
        console.log('   Response:', sosData);

    } catch (error) {
        console.error('Test failed:', error);
    }
}

runTest();
