require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { connectProducer, connectConsumer } = require('./config/kafka');
const KafkaListener = require('./listeners/kafka.listener');
const deliveryRoutes = require('./routes/delivery.routes');

const app = express();
const PORT = process.env.PORT || 3003;

// Connect to MongoDB
connectDB();

// Connect to Kafka
Promise.all([
    connectProducer(),
    connectConsumer()
]).catch(console.error);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    }
});
app.use(limiter);

// CORS middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Service-Key']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Service authentication middleware
const authenticateService = (req, res, next) => {
    const serviceKey = req.headers['x-service-key'];
    const expectedKey = process.env.INTER_SERVICE_KEY || 'shopee-microservice-key';
    
    if (serviceKey !== expectedKey) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized service access'
        });
    }
    next();
};

// Apply service authentication to delivery routes
app.use('/api/deliveries', authenticateService, deliveryRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Delivery Service is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to Delivery Service API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            deliveries: '/api/deliveries',
            drivers: '/api/deliveries/drivers'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Initialize Kafka listener
const initializeKafkaListener = async () => {
    try {
        // Listen to order events from order service
        const topics = ['order-events'];
        await KafkaListener.initialize(topics);
        console.log('🎧 Kafka listener initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing Kafka listener:', error);
    }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    const { disconnect } = require('./config/kafka');
    await disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    const { disconnect } = require('./config/kafka');
    await disconnect();
    process.exit(0);
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚚 Delivery Service is running on port ${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`📦 Delivery API: http://localhost:${PORT}/api/deliveries`);
    console.log(`👨‍💼 Driver API: http://localhost:${PORT}/api/deliveries/drivers`);
    console.log(`📊 Kafka Topics: order-events, delivery-events`);
    
    // Initialize Kafka listener after server starts
    await initializeKafkaListener();
});
