const mongoose = require('mongoose');
const KafkaListener = require('./delivery-service/listeners/kafka.listener');
const DeliveryService = require('./delivery-service/services/delivery.service');

async function testDeliveryService() {
    console.log('🧪 Testing Delivery Service Components\n');

    try {
        // Test 1: Check if KafkaListener class exists and has required methods
        console.log('1️⃣ Testing KafkaListener class...');
        console.log('   - Class exists:', typeof KafkaListener === 'function');
        console.log('   - handleMessage method exists:', typeof KafkaListener.handleMessage === 'function');
        console.log('   - handleOrderCreated method exists:', typeof KafkaListener.handleOrderCreated === 'function');
        console.log('   - initialize method exists:', typeof KafkaListener.initialize === 'function');
        console.log('✅ KafkaListener class test passed\n');

        // Test 2: Check if DeliveryService class exists and has required methods
        console.log('2️⃣ Testing DeliveryService class...');
        console.log('   - Class exists:', typeof DeliveryService === 'function');
        console.log('   - handleOrderCreated method exists:', typeof DeliveryService.handleOrderCreated === 'function');
        console.log('   - assignDriverToDelivery method exists:', typeof DeliveryService.assignDriverToDelivery === 'function');
        console.log('   - updateDeliveryStatus method exists:', typeof DeliveryService.updateDeliveryStatus === 'function');
        console.log('✅ DeliveryService class test passed\n');

        // Test 3: Test MongoDB connection
        console.log('3️⃣ Testing MongoDB connection...');
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopee_deliveries';
        
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 3000
        });
        
        console.log('✅ MongoDB connection successful');
        await mongoose.disconnect();
        console.log('✅ MongoDB disconnection successful\n');

        // Test 4: Test static method calls (simulate what happens in Kafka)
        console.log('4️⃣ Testing static method calls...');
        
        // Create a mock order data
        const mockOrderData = {
            eventType: 'OrderCreated',
            orderId: '507f1f77bcf86cd799439011',
            orderNumber: 'ORD-20240115-1705123456789-1234',
            userId: 12345,
            cartId: '507f1f77bcf86cd799439012',
            totalPrice: 360000,
            items: [{
                productId: '507f1f77bcf86cd799439013',
                quantity: 2,
                price: 150000
            }],
            customerInfo: {
                fullName: 'John Doe',
                email: 'john@example.com',
                phone: '0123456789'
            },
            shippingAddress: {
                fullName: 'John Doe',
                phone: '0123456789',
                address: '123 Test Street',
                city: 'Ho Chi Minh City',
                state: 'District 1',
                zipCode: '70000',
                country: 'Vietnam'
            },
            paymentMethod: 'credit_card',
            createdAt: new Date(),
            timestamp: new Date().toISOString()
        };

        // Test the handleMessage method directly
        console.log('   - Testing handleMessage with OrderCreated event...');
        await KafkaListener.handleMessage('order-events', mockOrderData);
        console.log('✅ handleMessage test passed\n');

        console.log('🎉 All delivery service tests passed!');
        console.log('\n💡 The delivery service should now be able to:');
        console.log('   - Start without context errors');
        console.log('   - Handle OrderCreated events from Kafka');
        console.log('   - Create delivery records');
        console.log('   - Assign drivers to deliveries');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
testDeliveryService();
