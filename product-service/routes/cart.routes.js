const express = require('express');
const router = express.Router();
const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartSummary,
    checkoutCart
} = require('../controllers/cart.controller');

// GET /api/carts/:userId - Get user's active cart
router.get('/:userId', getCart);

// GET /api/carts/:userId/summary - Get cart summary (count and total)
router.get('/:userId/summary', getCartSummary);

// POST /api/carts/:userId/items - Add item to cart
router.post('/:userId/items', addToCart);

// PUT /api/carts/:userId/items/:productId - Update item quantity in cart
router.put('/:userId/items/:productId', updateCartItem);

// DELETE /api/carts/:userId/items/:productId - Remove item from cart
router.delete('/:userId/items/:productId', removeFromCart);

// DELETE /api/carts/:userId - Clear entire cart
router.delete('/:userId', clearCart);

// POST /api/carts/:userId/checkout - Checkout cart and create order
router.post('/:userId/checkout', checkoutCart);

module.exports = router;
