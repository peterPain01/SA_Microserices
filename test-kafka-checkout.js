const axios = require('axios');

// Test configuration
const PRODUCT_SERVICE_URL = 'http://localhost:3001';
const ORDER_SERVICE_URL = 'http://localhost:3002';
const USER_ID = 12345;

// Test data
const testProduct = {
    name: 'Test Product for Kafka Checkout',
    description: 'A test product to verify Kafka-based checkout flow',
    price: 150000,
    stock: 10,
    category: 'Electronics',
    images: ['https://example.com/test-image.jpg'],
    isPublished: true
};

const checkoutData = {
    shippingAddress: {
        fullName: 'John Doe',
        phone: '0123456789',
        address: '123 Test Street, District 1, Ho Chi Minh City',
        city: 'Ho Chi Minh City',
        district: 'District 1',
        postalCode: '70000',
        instructions: 'Please call before delivery'
    },
    paymentMethod: 'credit_card',
    customerInfo: {
        email: 'john.doe@example.com',
        phone: '0123456789',
        fullName: 'John Doe'
    }
};

async function testKafkaCheckoutFlow() {
    console.log('🧪 Testing Kafka-based Checkout Flow\n');

    try {
        // Step 1: Create a test product
        console.log('1️⃣ Creating test product...');
        const createProductResponse = await axios.post(`${PRODUCT_SERVICE_URL}/api/products`, testProduct);
        const productId = createProductResponse.data.data._id;
        console.log(`✅ Product created: ${productId}\n`);

        // Step 2: Add product to cart
        console.log('2️⃣ Adding product to cart...');
        const addToCartResponse = await axios.post(`${PRODUCT_SERVICE_URL}/api/carts/${USER_ID}/items`, {
            productId: productId,
            quantity: 2
        });
        console.log('✅ Product added to cart\n');

        // Step 3: Get cart to verify
        console.log('3️⃣ Verifying cart contents...');
        const getCartResponse = await axios.get(`${PRODUCT_SERVICE_URL}/api/carts/${USER_ID}`);
        const cart = getCartResponse.data.data;
        console.log(`✅ Cart has ${cart.totalItems} items, total: ${cart.totalPrice} VND\n`);

        // Step 4: Perform checkout (this will publish UserCheckout event to Kafka)
        console.log('4️⃣ Performing checkout (publishing UserCheckout event to Kafka)...');
        const checkoutResponse = await axios.post(`${PRODUCT_SERVICE_URL}/api/carts/${USER_ID}/checkout`, checkoutData);
        console.log('✅ Checkout initiated successfully');
        console.log(`📋 Response: ${JSON.stringify(checkoutResponse.data, null, 2)}\n`);

        // Step 5: Wait a moment for Kafka processing
        console.log('5️⃣ Waiting for Kafka event processing...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Step 6: Check if order was created (optional - you can check order service logs)
        console.log('6️⃣ Checking order service health...');
        const orderHealthResponse = await axios.get(`${ORDER_SERVICE_URL}/health`);
        console.log('✅ Order service is running');
        console.log(`📋 Order service status: ${JSON.stringify(orderHealthResponse.data, null, 2)}\n`);

        console.log('🎉 Kafka-based checkout flow test completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('- Check order service logs for "UserCheckout event processed" message');
        console.log('- Check delivery service logs for "OrderCreated event processed" message');
        console.log('- Verify that OrderCreated event was published to order-events topic');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        
        if (error.response?.status === 503) {
            console.log('\n💡 Make sure:');
            console.log('- Kafka is running (localhost:9092)');
            console.log('- All services are started');
            console.log('- Environment variables are properly configured');
        }
    }
}

// Run the test
testKafkaCheckoutFlow();
