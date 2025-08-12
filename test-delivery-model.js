const mongoose = require('mongoose');
const Delivery = require('./delivery-service/models/delivery.model');

// Test MongoDB connection (you'll need to set MONGODB_URI environment variable)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopee_deliveries';

async function testDeliveryModel() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Test data
        const testDeliveryData = {
            orderId: new mongoose.Types.ObjectId(),
            orderNumber: 'ORD-20240115-1705123456789-1234',
            userId: 12345,
            pickupLocation: {
                type: 'pickup',
                address: 'Warehouse Location',
                coordinates: [106.6297, 10.8231],
                contactPerson: {
                    name: 'Warehouse Manager',
                    phone: '0123456789'
                },
                instructions: 'Pick up from main warehouse'
            },
            deliveryLocation: {
                type: 'delivery',
                address: '123 Test Street, District 1, Ho Chi Minh City',
                coordinates: [106.6297, 10.8231],
                contactPerson: {
                    name: 'John Doe',
                    phone: '0123456789'
                },
                instructions: 'Please call before delivery'
            },
            priority: 'normal',
            deliveryFee: 30000,
            driverEarnings: 21000
        };

        console.log('📝 Testing delivery creation...');
        console.log('🚚 DeliveryNumber before creation:', testDeliveryData.deliveryNumber);

        const delivery = new Delivery(testDeliveryData);
        console.log('🚚 DeliveryNumber after new Delivery():', delivery.deliveryNumber);

        const savedDelivery = await delivery.save();
        console.log('✅ Delivery saved successfully!');
        console.log('🚚 Generated deliveryNumber:', savedDelivery.deliveryNumber);
        console.log('📋 Full saved delivery:', JSON.stringify(savedDelivery.toObject(), null, 2));

        // Test finding the delivery
        const foundDelivery = await Delivery.findOne({ deliveryNumber: savedDelivery.deliveryNumber });
        console.log('🔍 Found delivery by deliveryNumber:', foundDelivery ? 'Yes' : 'No');

        // Test updating delivery status
        console.log('🔄 Testing status update...');
        await savedDelivery.updateStatus('assigned', null, 'Driver assigned', 'system');
        console.log('✅ Status updated to:', savedDelivery.status);

        // Clean up
        await Delivery.deleteOne({ _id: savedDelivery._id });
        console.log('🧹 Test delivery cleaned up');

        console.log('🎉 Delivery model test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the test
testDeliveryModel();
