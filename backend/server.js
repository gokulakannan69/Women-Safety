const jsonServer = require('json-server');
const twilio = require('twilio');
const path = require('path');
const fs = require('fs');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const multer = require('multer');

// Configure Multer for video uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename: video-TIMESTAMP-RANDOM.webm (or whatever extension)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '+15550000000'; // Default for mock

let client;

if (!accountSid || !authToken || !process.env.TWILIO_PHONE_NUMBER) {
  console.log('Twilio credentials not found. Running in MOCK MODE. OTPs will be logged to console.');
  client = {
    messages: {
      create: ({ body, to }) => {
        const logMessage = `\n=== MOCK SMS ===\nTo: ${to}\nMessage: ${body}\n================\n`;
        console.log(logMessage);
        try {
          fs.appendFileSync(path.join(__dirname, '..', 'sms_logs.txt'), logMessage);
        } catch (err) {
          console.error('Error writing to sms_logs.txt', err);
        }
        return Promise.resolve({ sid: 'mock-sid-' + Date.now() });
      }
    }
  };
} else {
  client = twilio(accountSid, authToken);
}

server.use(middlewares);
server.use(jsonServer.bodyParser);

server.post('/api/login', (req, res) => {
  const { mobileNumber } = req.body;
  const otp = Math.floor(1000 + Math.random() * 9000).toString(); // Generate 4-digit OTP

  const db = router.db;
  // Find user or create if not exists (for login, user should ideally exist)
  let user = db.get('users').find({ mobileNumber }).value();

  if (user && user.isRegistered) {
    db.get('users').find({ mobileNumber }).assign({ otp }).write();
  } else {
    // If user is not found or not registered, return error
    return res.status(400).jsonp({ success: false, message: 'Mobile number not registered. Please sign up first.' });
  }

  client.messages
    .create({
      body: `Your login OTP is: ${otp}`,
      from: twilioPhoneNumber,
      to: mobileNumber,
    })
    .then((message) => {
      console.log(`Login OTP sent: ${message.sid}`);
      res.status(200).jsonp({ success: true, message: 'OTP sent successfully for login' });
    })
    .catch((error) => {
      console.error(`Error sending login OTP: ${error}`);
      res.status(500).jsonp({ success: false, message: 'Failed to send OTP for login' });
    });
});

server.post('/api/send-otp', (req, res) => {
  const { contactNumber: mobileNumber } = req.body;
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  const db = router.db;
  const user = db.get('users').find({ mobileNumber }).value();

  if (user) {
    db.get('users').find({ mobileNumber }).assign({ otp }).write();
  } else {
    // If user doesn't exist, create a temporary entry for OTP verification during registration
    db.get('users').push({ mobileNumber, otp, isRegistered: false }).write();
  }

  client.messages
    .create({
      body: `Your registration OTP is: ${otp}`,
      from: twilioPhoneNumber,
      to: mobileNumber,
    })
    .then((message) => {
      console.log(message.sid);
      res.status(200).jsonp({ success: true, message: 'OTP sent successfully for registration' });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).jsonp({ success: false, message: 'Failed to send OTP for registration' });
    });
});

server.post('/api/verify-otp', (req, res) => {
  const { mobileNumber, otp } = req.body;

  const db = router.db;
  const user = db.get('users').find({ mobileNumber }).value();

  if (user && user.otp === otp) {
    db.get('users').find({ mobileNumber }).assign({ otp: null }).write(); // Invalidate OTP
    res.status(200).jsonp({ success: true, message: 'OTP verified successfully' });
  } else {
    res.status(400).jsonp({ success: false, message: 'Invalid OTP' });
  }
});

server.post('/api/register', (req, res) => {
  const { fullName, contactNumber: mobileNumber, emergencyContact } = req.body;
  const db = router.db;

  let user = db.get('users').find({ mobileNumber }).value();

  // Check if user is already registered
  if (user && user.isRegistered) {
    return res.status(409).jsonp({ success: false, message: 'Mobile number is already registered.' });
  }

  if (user && user.otp === null) { // OTP was verified for an existing, but not fully registered user
    db.get('users').find({ mobileNumber }).assign({ fullName, emergencyContact, isRegistered: true }).write();

    // Save to separate file
    const userData = db.get('users').find({ mobileNumber }).value();
    const filePath = path.join(__dirname, 'registrations', `${mobileNumber}.json`);
    try {
      fs.writeFileSync(filePath, JSON.stringify(userData, null, 2));
      console.log(`User data saved to ${filePath}`);
    } catch (err) {
      console.error('Error saving user data to file:', err);
    }

    res.status(200).jsonp({ success: true, message: 'Registration successful' });
  } else {
    res.status(400).jsonp({ success: false, message: 'OTP not verified or invalid request' });
  }
});

server.patch('/api/users/:mobileNumber', (req, res) => {
  const { mobileNumber } = req.params;
  const { emergencyContact } = req.body;

  const db = router.db;
  const user = db.get('users').find({ mobileNumber }).value();

  if (user) {
    db.get('users').find({ mobileNumber }).assign({ emergencyContact }).write();
    res.status(200).jsonp(db.get('users').find({ mobileNumber }).value());
  } else {
    res.status(404).jsonp({ success: false, message: 'User not found' });
  }
});

server.post('/api/send-sos', (req, res) => {
  const { mobileNumber, location } = req.body;
  const db = router.db;

  console.log('SOS Request Body:', req.body);
  const user = db.get('users').find({ mobileNumber, isRegistered: true }).value(); // Only find registered users
  console.log('SOS User Lookup (Registered Only):', user);

  if (!user) {
    return res.status(404).jsonp({ success: false, message: 'Registered user not found or not registered' });
  }

  // Ensure emergencyContact is set for a registered user
  if (!user.emergencyContact) {
    return res.status(400).jsonp({ success: false, message: 'Emergency contact not set for this user.' });
  }

  const emergencyContact = user.emergencyContact; // No fallback to '911' anymore
  const mapLink = `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=16/${location.latitude}/${location.longitude}`;
  console.log('Generated OpenStreetMap Link:', mapLink);

  const address = req.body.address;
  if (address) {
    messageBody += `\nAddress: ${address}`;
  }
  if (req.body.videoLink) {
    messageBody += `\nVideo Evidence: ${req.body.videoLink}`;
  }

  client.messages
    .create({
      body: messageBody,
      from: twilioPhoneNumber,
      to: emergencyContact,
    })
    .then((message) => {
      console.log(`SOS SMS sent to ${emergencyContact}: ${message.sid}`);
      res.status(200).jsonp({ success: true, message: 'SOS sent successfully' });
    })
    .catch((error) => {
      console.error(`Error sending SOS SMS: ${error}`);
      res.status(500).jsonp({ success: false, message: 'Failed to send SOS' });
    });
});


server.post('/api/upload-video', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).jsonp({ success: false, message: 'No video file uploaded.' });
  }

  console.log(`Video uploaded successfully to: ${req.file.path}`);
  res.status(200).jsonp({
    success: true,
    message: 'Video uploaded successfully',
    filePath: req.file.path,
    url: `http://localhost:3001/uploads/${req.file.filename}`
  });
});

server.use('/api', router);

const PORT = process.env.PORT || 3001;
const MAX_PORT_ATTEMPTS = 5;

function startServer(port, attempt = 0) {
  server.listen(port, () => {
    console.log(`JSON Server is running on port ${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempt < MAX_PORT_ATTEMPTS) {
      console.warn(`Port ${port} is in use, trying next port...`);
      startServer(port + 1, attempt + 1);
    } else {
      console.error(`Failed to start server after multiple attempts or for an unrecoverable reason: ${err.message}`);
      process.exit(1);
    }
  });
}

startServer(PORT);
