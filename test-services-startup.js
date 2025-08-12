const axios = require('axios');

// Test configuration
const SERVICES = {
    product: { port: 3001, name: 'Product Service' },
    order: { port: 3002, name: 'Order Service' },
    delivery: { port: 3003, name: 'Delivery Service' }
};

async function testServiceHealth(service, port) {
    try {
        console.log(`🏥 Testing ${service.name} health...`);
        const response = await axios.get(`http://localhost:${port}/health`, {
            timeout: 5000
        });
        
        if (response.status === 200) {
            console.log(`✅ ${service.name} is healthy`);
            return true;
        } else {
            console.log(`❌ ${service.name} returned status: ${response.status}`);
            return false;
        }
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log(`❌ ${service.name} is not running on port ${port}`);
        } else if (error.code === 'ETIMEDOUT') {
            console.log(`⏰ ${service.name} health check timed out`);
        } else {
            console.log(`❌ ${service.name} health check failed: ${error.message}`);
        }
        return false;
    }
}

async function testMongoDBConnection() {
    try {
        console.log('🔌 Testing MongoDB connection...');
        
        // Try to connect to MongoDB using mongoose
        const mongoose = require('mongoose');
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
        
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 3000
        });
        
        console.log('✅ MongoDB connection successful');
        await mongoose.disconnect();
        return true;
    } catch (error) {
        console.log('❌ MongoDB connection failed:', error.message);
        return false;
    }
}

async function testKafkaConnection() {
    try {
        console.log('📡 Testing Kafka connection...');
        
        // This is a simple test - in a real scenario you'd use the Kafka client
        // For now, we'll just check if we can import the KafkaJS library
        const { Kafka } = require('kafkajs');
        
        const kafka = new Kafka({
            clientId: 'test-client',
            brokers: ['localhost:9092']
        });
        
        const producer = kafka.producer();
        await producer.connect();
        await producer.disconnect();
        
        console.log('✅ Kafka connection successful');
        return true;
    } catch (error) {
        console.log('❌ Kafka connection failed:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🧪 Running Service Startup Tests\n');
    
    const results = {
        mongodb: false,
        kafka: false,
        services: {}
    };
    
    // Test MongoDB
    results.mongodb = await testMongoDBConnection();
    console.log('');
    
    // Test Kafka
    results.kafka = await testKafkaConnection();
    console.log('');
    
    // Test each service
    for (const [key, service] of Object.entries(SERVICES)) {
        results.services[key] = await testServiceHealth(service, service.port);
        console.log('');
    }
    
    // Summary
    console.log('📊 Test Results Summary:');
    console.log('========================');
    console.log(`MongoDB: ${results.mongodb ? '✅ Connected' : '❌ Failed'}`);
    console.log(`Kafka: ${results.kafka ? '✅ Connected' : '❌ Failed'}`);
    
    for (const [key, service] of Object.entries(SERVICES)) {
        console.log(`${service.name}: ${results.services[key] ? '✅ Running' : '❌ Not Running'}`);
    }
    
    console.log('\n💡 Next Steps:');
    
    if (!results.mongodb) {
        console.log('- Start MongoDB: mongod or docker-compose up mongodb');
    }
    
    if (!results.kafka) {
        console.log('- Start Kafka: docker-compose up kafka zookeeper');
    }
    
    const runningServices = Object.values(results.services).filter(Boolean).length;
    if (runningServices < Object.keys(SERVICES).length) {
        console.log('- Start services: npm start in each service directory');
    }
    
    if (results.mongodb && results.kafka && runningServices === Object.keys(SERVICES).length) {
        console.log('🎉 All services are running! You can now test the full flow.');
        console.log('Run: node test-kafka-checkout.js');
    }
}

// Run the tests
runTests().catch(console.error);
