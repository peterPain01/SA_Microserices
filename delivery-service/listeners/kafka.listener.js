const DeliveryService = require('../services/delivery.service');

class KafkaListener {
    // Handle incoming Kafka messages
    static async handleMessage(topic, message) {
        try {
            console.log(`📨 Processing message from topic: ${topic}`);
            console.log(`📋 Event type: ${message.eventType}`);

            switch (message.eventType) {
                case 'OrderCreated':
                    await KafkaListener.handleOrderCreated(message);
                    break;
                    
                case 'OrderStatusUpdated':
                    await KafkaListener.handleOrderStatusUpdated(message);
                    break;
                    
                case 'PaymentStatusUpdated':
                    await KafkaListener.handlePaymentStatusUpdated(message);
                    break;
                    
                default:
                    console.log(`⚠️ Unknown event type: ${message.eventType}`);
            }

        } catch (error) {
            console.error('❌ Error processing Kafka message:', error);
            // In production, implement retry logic or dead letter queue
        }
    }

    // Handle OrderCreated event
    static async handleOrderCreated(orderData) {
        try {
            console.log('🛒 Order created, creating delivery:', orderData.orderNumber);
            
            // Create delivery for the new order
            const delivery = await DeliveryService.handleOrderCreated(orderData);
            
            console.log('✅ Delivery created successfully:', delivery.deliveryNumber);
            
        } catch (error) {
            console.error('❌ Error handling OrderCreated event:', error);
            throw error;
        }
    }

    // Handle OrderStatusUpdated event
    static async handleOrderStatusUpdated(orderData) {
        try {
            console.log('📦 Order status updated:', orderData.orderNumber, 'Status:', orderData.newStatus);
            
            // Find delivery for this order
            const Delivery = require('../models/delivery.model');
            const delivery = await Delivery.findOne({ orderId: orderData.orderId });
            
            if (!delivery) {
                console.log('⚠️ No delivery found for order:', orderData.orderNumber);
                return;
            }

            // Update delivery status based on order status
            let newDeliveryStatus = delivery.status;
            
            switch (orderData.newStatus) {
                case 'confirmed':
                    // Order confirmed, delivery can proceed
                    if (delivery.status === 'pending' && !delivery.driverId) {
                        // Try to assign driver again
                        await DeliveryService.assignDriverToDelivery(delivery);
                    }
                    break;
                    
                case 'cancelled':
                    newDeliveryStatus = 'cancelled';
                    break;
                    
                case 'processing':
                    // Order is being processed, delivery should be ready
                    break;
                    
                case 'shipped':
                    // Order shipped, delivery should be in progress
                    if (delivery.status === 'assigned') {
                        newDeliveryStatus = 'picked_up';
                    }
                    break;
                    
                case 'delivered':
                    // Order delivered, mark delivery as completed
                    newDeliveryStatus = 'delivered';
                    break;
            }

            if (newDeliveryStatus !== delivery.status) {
                await DeliveryService.updateDeliveryStatus(
                    delivery._id, 
                    newDeliveryStatus, 
                    null, 
                    `Order status changed to: ${orderData.newStatus}`,
                    'system'
                );
            }
            
        } catch (error) {
            console.error('❌ Error handling OrderStatusUpdated event:', error);
            throw error;
        }
    }

    // Handle PaymentStatusUpdated event
    static async handlePaymentStatusUpdated(paymentData) {
        try {
            console.log('💳 Payment status updated:', paymentData.orderNumber, 'Status:', paymentData.newStatus);
            
            // Find delivery for this order
            const Delivery = require('../models/delivery.model');
            const delivery = await Delivery.findOne({ orderId: paymentData.orderId });
            
            if (!delivery) {
                console.log('⚠️ No delivery found for order:', paymentData.orderNumber);
                return;
            }

            // Handle payment status changes
            switch (paymentData.newStatus) {
                case 'paid':
                    // Payment successful, ensure delivery can proceed
                    if (delivery.status === 'pending' && !delivery.driverId) {
                        await DeliveryService.assignDriverToDelivery(delivery);
                    }
                    break;
                    
                case 'failed':
                    // Payment failed, might need to pause delivery
                    console.log('⚠️ Payment failed for delivery:', delivery.deliveryNumber);
                    break;
                    
                case 'refunded':
                    // Payment refunded, might need to cancel delivery
                    if (delivery.status !== 'delivered') {
                        await DeliveryService.updateDeliveryStatus(
                            delivery._id,
                            'cancelled',
                            null,
                            'Payment refunded',
                            'system'
                        );
                    }
                    break;
            }
            
        } catch (error) {
            console.error('❌ Error handling PaymentStatusUpdated event:', error);
            throw error;
        }
    }

    // Initialize Kafka listener
    static async initialize(topics) {
        try {
            const { subscribeToTopics } = require('../config/kafka');
            
            // Subscribe to order events
            await subscribeToTopics(topics, KafkaListener.handleMessage);
            
            console.log('🎧 Delivery service Kafka listener initialized successfully');
            console.log('📡 Listening to topics:', topics.join(', '));
            
        } catch (error) {
            console.error('❌ Error initializing Kafka listener:', error);
            throw error;
        }
    }
}

module.exports = KafkaListener;
