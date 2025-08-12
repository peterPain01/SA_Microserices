const Order = require('../models/order.model');
const { sendMessage } = require('../config/kafka');

class KafkaListener {
    // Handle incoming Kafka messages
    static async handleMessage(topic, message) {
        try {
            console.log(`📨 Processing message from topic: ${topic}`);
            console.log(`📋 Event type: ${message.eventType}`);

            switch (message.eventType) {
                case 'UserCheckout':
                    await KafkaListener.handleUserCheckout(message);
                    break;
                    
                default:
                    console.log(`⚠️ Unknown event type: ${message.eventType}`);
            }

        } catch (error) {
            console.error('❌ Error processing Kafka message:', error);
            // In production, implement retry logic or dead letter queue
        }
    }

    // Handle UserCheckout event from product service
    static async handleUserCheckout(checkoutData) {
        try {
            console.log('🛒 Processing UserCheckout event:', checkoutData.cartId);
            console.log('📋 Checkout data received:', JSON.stringify(checkoutData, null, 2));

            const {
                userId,
                cartId,
                items,
                totalItems,
                totalPrice,
                shippingAddress,
                paymentMethod,
                customerInfo
            } = checkoutData;

            // Validate required fields
            if (!userId || !cartId || !items || !totalItems || !totalPrice || !shippingAddress || !paymentMethod || !customerInfo) {
                throw new Error(`Missing required fields: userId=${!!userId}, cartId=${!!cartId}, items=${!!items}, totalItems=${!!totalItems}, totalPrice=${!!totalPrice}, shippingAddress=${!!shippingAddress}, paymentMethod=${!!paymentMethod}, customerInfo=${!!customerInfo}`);
            }

            // Calculate shipping fee and tax
            const shippingFee = totalPrice >= 500000 ? 0 : 30000; // Free shipping for orders >= 500k VND
            const tax = totalPrice * 0.1; // 10% VAT
            const finalTotal = totalPrice + shippingFee + tax;

            // Create order
            const orderData = {
                userId,
                cartId,
                items,
                totalItems,
                subtotal: totalPrice,
                shippingFee,
                tax,
                totalPrice: finalTotal,
                shippingAddress,
                customerInfo,
                paymentMethod,
                orderStatus: 'pending',
                paymentStatus: 'pending'
            };
            
            console.log('📝 Creating order with data:', JSON.stringify(orderData, null, 2));
            
            const order = new Order(orderData);
            console.log('🔢 Order object created, orderNumber before save:', order.orderNumber);

            const savedOrder = await order.save();
            console.log('✅ Order created from UserCheckout event:', savedOrder.orderNumber);

            // Publish OrderCreated event to Kafka
            try {
                const orderEvent = {
                    eventType: 'OrderCreated',
                    orderId: savedOrder._id.toString(), // Convert ObjectId to string
                    orderNumber: savedOrder.orderNumber,
                    userId: savedOrder.userId,
                    cartId: savedOrder.cartId.toString(), // Convert ObjectId to string
                    totalPrice: savedOrder.totalPrice,
                    items: savedOrder.items.map(item => ({
                        productId: item.productId.toString(), // Convert ObjectId to string
                        quantity: item.quantity,
                        price: item.price
                    })),
                    customerInfo: savedOrder.customerInfo,
                    shippingAddress: savedOrder.shippingAddress,
                    paymentMethod: savedOrder.paymentMethod,
                    createdAt: savedOrder.createdAt,
                    timestamp: new Date().toISOString()
                };

                await sendMessage('order-events', orderEvent);
                console.log('📤 OrderCreated event published to Kafka');

            } catch (kafkaError) {
                console.error('❌ Error publishing OrderCreated event to Kafka:', kafkaError);
                // Don't fail the order creation if Kafka fails
                // In production, you might want to implement retry logic or dead letter queue
            }

        } catch (error) {
            console.error('❌ Error processing UserCheckout event:', error);
            throw error;
        }
    }

    // Initialize Kafka listener
    static async initialize(topics) {
        try {
            const { subscribeToTopics } = require('../config/kafka');
            
            // Subscribe to user events
            await subscribeToTopics(topics, KafkaListener.handleMessage);
            
            console.log('🎧 Order service Kafka listener initialized successfully');
            console.log('📡 Listening to topics:', topics.join(', '));
            
        } catch (error) {
            console.error('❌ Error initializing Kafka listener:', error);
            throw error;
        }
    }
}

module.exports = KafkaListener;
