const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        
        if (!mongoURI) {
            throw new Error('MONGODB_URI environment variable is required for cloud MongoDB connection');
        }
        
        console.log('🌐 Attempting to connect to MongoDB Cloud...');
        console.log('MongoDB URI:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
        
        const conn = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            retryWrites: true,
            w: 'majority',
            ssl: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log(`✅ MongoDB Cloud Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
        console.log(`🔗 Connection State: ${conn.connection.readyState}`);
    } catch (error) {
        console.error('❌ Error connecting to MongoDB Cloud:', error.message);
        console.error('💡 Please check your MongoDB Atlas connection string and credentials');
        console.error('🔑 Make sure to set MONGODB_URI environment variable with your Atlas connection string');
        process.exit(1);
    }
};

module.exports = connectDB;
