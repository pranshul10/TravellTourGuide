require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const placeholderRoutes = require('./routes/placeholderRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const itineraryRoutes = require('./routes/itineraryRoutes');
const mapRoutes = require('./routes/mapRoutes'); // <--- ADD THIS

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define API Routes
app.use('/api/auth', authRoutes);
app.use('/api/placeholder', placeholderRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/itinerary', itineraryRoutes);
app.use('/api/map', mapRoutes); // <--- ADD THIS

// Serve static files from the parent directory (project root)
const projectRoot = path.join(__dirname, '..');
app.use(express.static(projectRoot));

app.get('/', (req, res) => {
  res.sendFile(path.join(projectRoot, 'index.html'));
});

app.use((req, res, next) => {
    res.status(404).sendFile(path.join(projectRoot, '404.html'), (err) => {
        if (err) {
            console.error("Error sending 404.html:", err);
            res.status(404).send('The page you are looking for cannot be found, and our custom 404 page is also missing!');
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));