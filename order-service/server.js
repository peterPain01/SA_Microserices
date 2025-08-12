require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { connectProducer, connectConsumer } = require('./config/kafka');
const KafkaListener = require('./listeners/kafka.listener');
const orderRoutes = require('./routes/order.routes');

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize services
const initializeServices = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        
        // Connect to Kafka
        await connectProducer();
        await connectConsumer();
        
        // Initialize Kafka listener for UserCheckout events
        await KafkaListener.initialize(['user-events']);
        
        console.log('✅ All services initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing services:', error);
        process.exit(1);
    }
};

// Initialize services
initializeServices();

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

// Apply order routes (no service authentication needed for Kafka-based flow)
app.use('/api/orders', orderRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Order Service is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to Order Service API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            orders: '/api/orders'
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

app.listen(PORT, () => {
    console.log(`🚀 Order Service is running on port ${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`📦 Order API: http://localhost:${PORT}/api/orders`);
    console.log(`📊 Kafka Topics: user-events (listen), order-events (publish)`);
});
