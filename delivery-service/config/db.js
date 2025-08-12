const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Use environment variable or default to local MongoDB
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopee_deliveries';
        
        console.log('🔌 Attempting to connect to MongoDB...');
        
        // Check if it's a cloud connection (contains 'mongodb.net' or 'mongodb+srv')
        const isCloudConnection = mongoURI.includes('mongodb.net') || mongoURI.includes('mongodb+srv');
        
        if (isCloudConnection) {
            console.log('🌐 Connecting to MongoDB Cloud...');
            console.log('MongoDB URI:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
        } else {
            console.log('🏠 Connecting to local MongoDB...');
            console.log('MongoDB URI:', mongoURI);
        }
        
        const connectionOptions = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        // Add cloud-specific options only for cloud connections
        if (isCloudConnection) {
            connectionOptions.retryWrites = true;
            connectionOptions.w = 'majority';
            connectionOptions.ssl = true;
        }

        const conn = await mongoose.connect(mongoURI, connectionOptions);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
        console.log(`🔗 Connection State: ${conn.connection.readyState}`);
    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error.message);
        console.error('💡 Please check your MongoDB connection:');
        console.error('   - For local MongoDB: Make sure MongoDB is running on localhost:27017');
        console.error('   - For cloud MongoDB: Set MONGODB_URI environment variable with your Atlas connection string');
        process.exit(1);
    }
};

module.exports = connectDB;
