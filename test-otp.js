fetch('http://localhost:3001/api/send-otp', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ contactNumber: '1234567890' }),
})
    .then((res) => res.json())
    .then((data) => console.log('Response:', data))
    .catch((err) => console.error('Error:', err));
