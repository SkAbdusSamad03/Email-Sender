require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
    res.render('home');
});

app.post('/send-email', upload.single('attachment'), async (req, res) => {
    const { recipient, subject, message } = req.body;
    const file = req.file;

    const recipientsList = Array.isArray(recipient)
        ? recipient
        : recipient.split(',').map(email => email.trim());

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: recipientsList,
        subject,
        text: message,
        attachments: file ? [{ path: file.path }] : []
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);

        // Delete uploaded file after sending
        if (file) fs.unlinkSync(file.path);

        res.send('✅ Email sent successfully to all recipients!');
    } catch (error) {
        console.error('SendMail Error:', error);
        res.status(500).send('❌ Failed to send email.');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
