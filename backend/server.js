require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const notificationTemplatesRoute = require('./routes/notificationTemplates');
const { startNotificationDispatcher } = require('./services/notificationDispatcher');
const { seedNotificationTemplates } = require('./services/notificationTemplateService');

// Connect to MongoDB and seed startup defaults
const startup = (async () => {
  await connectDB();

  try {
    await seedNotificationTemplates();
    console.log('Notification templates ensured at startup');
  } catch (error) {
    console.error('Notification template startup seed error:', error.message);
  }
})();

const app = express();
app.set('etag', false);

// Middleware
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : [];
app.use(cors({
  origin: allowedOrigins.length > 0
    ? (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    : (origin, callback) => {
        // Allow any origin with credentials in development
        callback(null, true);
      },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/workout-plans', require('./routes/workoutPlans'));
app.use('/api/pain-logs', require('./routes/painLogs'));
app.use('/api/users', require('./routes/users'));
app.use('/api/ai-prompts', require('./routes/aiPrompts'));
app.use('/api/knowledge', require('./routes/knowledge'));
app.use('/api/postures', require('./routes/postures'));
app.use('/api/products', require('./routes/products'));
app.use('/api/product-reviews', require('./routes/productReviews'));
app.use('/api/product-instances', require('./routes/productInstances'));
app.use('/api/product-assessments', require('./routes/productAssessments'));
app.use('/api/codes', require('./routes/codes'));
app.use('/api/water', require('./routes/water'));
app.use('/api/motivations', require('./routes/motivations'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/personalized-plan-videos', require('./routes/personalizedPlanVideos'));
app.use('/api/library', require('./routes/library'));
app.use('/api/notification-templates', notificationTemplatesRoute);
app.use('/api', require('./routes/misc'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Lỗi server' });
});

const PORT = process.env.PORT || 5001;
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  startup.then(() => {
    startNotificationDispatcher();
    app.listen(PORT, () => {
      console.log(`TheraHome Backend running on port ${PORT}`);
    });
  });
}

// Export for Vercel Serverless Function
module.exports = app;
