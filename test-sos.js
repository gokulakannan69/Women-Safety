

const API_BASE_URL = 'http://localhost:3001/api';

async function testSOS() {
    try {
        const response = await fetch(`${API_BASE_URL}/send-sos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mobileNumber: '1234567890',
                location: { latitude: 12.9716, longitude: 77.5946 }
            }),
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

testSOS();
