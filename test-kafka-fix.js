const mongoose = require('mongoose');

// Test function to verify ObjectId to string conversion
function testObjectIdConversion() {
    console.log('🧪 Testing ObjectId to string conversion for Kafka messages\n');

    // Create a mock ObjectId
    const mockObjectId = new mongoose.Types.ObjectId();
    const mockCartId = new mongoose.Types.ObjectId();
    const mockProductId = new mongoose.Types.ObjectId();

    console.log('📋 Original ObjectIds:');
    console.log('  - orderId:', mockObjectId, '(type:', typeof mockObjectId, ')');
    console.log('  - cartId:', mockCartId, '(type:', typeof mockCartId, ')');
    console.log('  - productId:', mockProductId, '(type:', typeof mockProductId, ')');

    // Test conversion to string
    const convertedOrderId = mockObjectId.toString();
    const convertedCartId = mockCartId.toString();
    const convertedProductId = mockProductId.toString();

    console.log('\n🔄 After .toString() conversion:');
    console.log('  - orderId:', convertedOrderId, '(type:', typeof convertedOrderId, ')');
    console.log('  - cartId:', convertedCartId, '(type:', typeof convertedCartId, ')');
    console.log('  - productId:', convertedProductId, '(type:', typeof convertedProductId, ')');

    // Test creating a Kafka event object
    const kafkaEvent = {
        eventType: 'OrderCreated',
        orderId: convertedOrderId,
        orderNumber: 'ORD-20240115-1705123456789-1234',
        userId: 12345,
        cartId: convertedCartId,
        totalPrice: 360000,
        items: [{
            productId: convertedProductId,
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

    console.log('\n📤 Kafka Event Object:');
    console.log(JSON.stringify(kafkaEvent, null, 2));

    // Test JSON serialization (what Kafka would do)
    try {
        const serializedEvent = JSON.stringify(kafkaEvent);
        console.log('\n✅ JSON serialization successful!');
        console.log('📏 Serialized length:', serializedEvent.length, 'characters');
        
        // Test deserialization
        const deserializedEvent = JSON.parse(serializedEvent);
        console.log('✅ JSON deserialization successful!');
        console.log('🔄 Deserialized orderId:', deserializedEvent.orderId);
        
        console.log('\n🎉 All tests passed! ObjectId to string conversion is working correctly.');
        
    } catch (error) {
        console.error('❌ JSON serialization failed:', error.message);
    }
}

// Run the test
testObjectIdConversion();
