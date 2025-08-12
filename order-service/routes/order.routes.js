const express = require('express');
const router = express.Router();
const {
    createOrder,
    getOrderById,
    getOrdersByUserId,
    updateOrderStatus,
    updatePaymentStatus,
    getOrderByNumber
} = require('../controllers/order.controller');

// POST /api/orders - Create new order
router.post('/', createOrder);

// GET /api/orders/:orderId - Get order by ID
router.get('/:orderId', getOrderById);

// GET /api/orders/number/:orderNumber - Get order by order number
router.get('/number/:orderNumber', getOrderByNumber);

// GET /api/orders/user/:userId - Get orders by user ID
router.get('/user/:userId', getOrdersByUserId);

// PUT /api/orders/:orderId/status - Update order status
router.put('/:orderId/status', updateOrderStatus);

// PUT /api/orders/:orderId/payment - Update payment status
router.put('/:orderId/payment', updatePaymentStatus);

module.exports = router;
