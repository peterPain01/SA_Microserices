const Order = require('../models/order.model');
const { sendMessage } = require('../config/kafka');

// Create new order from cart
const createOrder = async (req, res) => {
    try {
        const {
            userId,
            cartId,
            items,
            totalItems,
            totalPrice,
            shippingAddress,
            paymentMethod,
            customerInfo,
            notes
        } = req.body;

        // Validate required fields
        if (!userId || !cartId || !items || !shippingAddress || !paymentMethod || !customerInfo) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userId, cartId, items, shippingAddress, paymentMethod, customerInfo'
            });
        }

        // Validate items array
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Items array cannot be empty'
            });
        }

        // Calculate shipping fee and tax
        const shippingFee = totalPrice >= 500000 ? 0 : 30000; // Free shipping for orders >= 500k VND
        const tax = totalPrice * 0.1; // 10% VAT
        const finalTotal = totalPrice + shippingFee + tax;

        // Create order
        const order = new Order({
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
            notes,
            orderStatus: 'pending',
            paymentStatus: 'pending'
        });

        const savedOrder = await order.save();

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
            console.error('❌ Error publishing to Kafka:', kafkaError);
            // Don't fail the order creation if Kafka fails
            // In production, you might want to implement retry logic or dead letter queue
        }

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                _id: savedOrder._id,
                orderNumber: savedOrder.orderNumber,
                userId: savedOrder.userId,
                totalPrice: savedOrder.totalPrice,
                orderStatus: savedOrder.orderStatus,
                paymentStatus: savedOrder.paymentStatus,
                estimatedDelivery: savedOrder.estimatedDelivery,
                createdAt: savedOrder.createdAt
            }
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: error.message
        });
    }
};

// Get order by ID
const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching order',
            error: error.message
        });
    }
};

// Get orders by user ID
const getOrdersByUserId = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { page = 1, limit = 10 } = req.query;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid user ID is required'
            });
        }

        const skip = (page - 1) * limit;
        const orders = await Order.findByUserId(userId, parseInt(limit), skip);
        const totalOrders = await Order.countDocuments({ userId });

        res.status(200).json({
            success: true,
            data: {
                orders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalOrders / limit),
                    totalOrders,
                    hasNext: skip + orders.length < totalOrders,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching orders',
            error: error.message
        });
    }
};

// Update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { orderStatus } = req.body;

        if (!orderStatus) {
            return res.status(400).json({
                success: false,
                message: 'Order status is required'
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        await order.updateStatus(orderStatus);

        // Publish OrderStatusUpdated event to Kafka
        try {
            const statusEvent = {
                eventType: 'OrderStatusUpdated',
                orderId: order._id.toString(), // Convert ObjectId to string
                orderNumber: order.orderNumber,
                userId: order.userId,
                oldStatus: order.orderStatus,
                newStatus: orderStatus,
                timestamp: new Date().toISOString()
            };

            await sendMessage('order-events', statusEvent);
            console.log('📤 OrderStatusUpdated event published to Kafka');

        } catch (kafkaError) {
            console.error('❌ Error publishing status update to Kafka:', kafkaError);
        }

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            data: {
                _id: order._id,
                orderNumber: order.orderNumber,
                orderStatus: order.orderStatus,
                estimatedDelivery: order.estimatedDelivery
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating order status',
            error: error.message
        });
    }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { paymentStatus } = req.body;

        if (!paymentStatus) {
            return res.status(400).json({
                success: false,
                message: 'Payment status is required'
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        await order.updatePaymentStatus(paymentStatus);

        // Publish PaymentStatusUpdated event to Kafka
        try {
            const paymentEvent = {
                eventType: 'PaymentStatusUpdated',
                orderId: order._id.toString(), // Convert ObjectId to string
                orderNumber: order.orderNumber,
                userId: order.userId,
                oldStatus: order.paymentStatus,
                newStatus: paymentStatus,
                totalPrice: order.totalPrice,
                timestamp: new Date().toISOString()
            };

            await sendMessage('order-events', paymentEvent);
            console.log('📤 PaymentStatusUpdated event published to Kafka');

        } catch (kafkaError) {
            console.error('❌ Error publishing payment update to Kafka:', kafkaError);
        }

        res.status(200).json({
            success: true,
            message: 'Payment status updated successfully',
            data: {
                _id: order._id,
                orderNumber: order.orderNumber,
                paymentStatus: order.paymentStatus
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating payment status',
            error: error.message
        });
    }
};

// Get order by order number
const getOrderByNumber = async (req, res) => {
    try {
        const { orderNumber } = req.params;

        const order = await Order.findOne({ orderNumber });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching order',
            error: error.message
        });
    }
};

module.exports = {
    createOrder,
    getOrderById,
    getOrdersByUserId,
    updateOrderStatus,
    updatePaymentStatus,
    getOrderByNumber
};
