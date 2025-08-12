const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const { sendMessage } = require('../config/kafka');

// Get user's active cart
const getCart = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid user ID is required'
            });
        }

        let cart = await Cart.findActiveCart(userId).populate('items.productId', 'name price images isPublished');
        
        if (!cart) {
            // Create new cart if doesn't exist
            cart = new Cart({ userId });
            await cart.save();
        }

        // Filter out items with unpublished products
        cart.items = cart.items.filter(item => item.productId && item.productId.isPublished);
        await cart.save();

        res.status(200).json({
            success: true,
            data: cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching cart',
            error: error.message
        });
    }
};

// Add item to cart
const addToCart = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { productId, quantity = 1 } = req.body;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid user ID is required'
            });
        }

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be greater than 0'
            });
        }

        // Check if product exists and is published
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (!product.isPublished) {
            return res.status(400).json({
                success: false,
                message: 'Product is not available'
            });
        }

        if (product.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Available: ${product.stock}`
            });
        }

        // Find or create cart
        let cart = await Cart.findActiveCart(userId);
        if (!cart) {
            cart = new Cart({ userId });
        }

        // Add item to cart
        await cart.addItem(product, quantity);

        // Populate product details for response
        await cart.populate('items.productId', 'name price images isPublished');

        res.status(200).json({
            success: true,
            message: 'Item added to cart successfully',
            data: cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding item to cart',
            error: error.message
        });
    }
};

// Update item quantity in cart
const updateCartItem = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { productId } = req.params;
        const { quantity } = req.body;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid user ID is required'
            });
        }

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        if (quantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity cannot be negative'
            });
        }

        const cart = await Cart.findActiveCart(userId);
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // If quantity > 0, check stock availability
        if (quantity > 0) {
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }

            if (product.stock < quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock. Available: ${product.stock}`
                });
            }
        }

        // Update item quantity
        await cart.updateItemQuantity(productId, quantity);

        // Populate product details for response
        await cart.populate('items.productId', 'name price images isPublished');

        res.status(200).json({
            success: true,
            message: quantity === 0 ? 'Item removed from cart' : 'Item quantity updated successfully',
            data: cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating cart item',
            error: error.message
        });
    }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { productId } = req.params;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid user ID is required'
            });
        }

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        const cart = await Cart.findActiveCart(userId);
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Remove item from cart
        await cart.removeItem(productId);

        // Populate product details for response
        await cart.populate('items.productId', 'name price images isPublished');

        res.status(200).json({
            success: true,
            message: 'Item removed from cart successfully',
            data: cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error removing item from cart',
            error: error.message
        });
    }
};

// Clear entire cart
const clearCart = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid user ID is required'
            });
        }

        const cart = await Cart.findActiveCart(userId);
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Clear cart
        await cart.clearCart();

        res.status(200).json({
            success: true,
            message: 'Cart cleared successfully',
            data: cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error clearing cart',
            error: error.message
        });
    }
};

// Get cart summary (item count and total price)
const getCartSummary = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid user ID is required'
            });
        }

        const cart = await Cart.findActiveCart(userId);
        
        const summary = {
            userId,
            totalItems: cart ? cart.totalItems : 0,
            totalPrice: cart ? cart.totalPrice : 0,
            itemCount: cart ? cart.items.length : 0,
            hasItems: cart ? cart.items.length > 0 : false
        };

        res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching cart summary',
            error: error.message
        });
    }
};

// Checkout cart and create order
const checkoutCart = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { shippingAddress, paymentMethod, customerInfo } = req.body;

        if (!userId || isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid user ID is required'
            });
        }

        // Validate required checkout information
        if (!shippingAddress || !paymentMethod || !customerInfo) {
            return res.status(400).json({
                success: false,
                message: 'Shipping address, payment method, and customer info are required'
            });
        }

        // Get user's active cart
        const cart = await Cart.findActiveCart(userId).populate('items.productId', 'name price stock isPublished');
        
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty or not found'
            });
        }

        // Validate all products are still available
        const unavailableProducts = cart.items.filter(item => 
            !item.productId || !item.productId.isPublished || item.productId.stock < item.quantity
        );

        if (unavailableProducts.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Some products are no longer available or out of stock',
                unavailableProducts: unavailableProducts.map(item => ({
                    productId: item.productId._id,
                    name: item.productId.name,
                    requestedQuantity: item.quantity,
                    availableStock: item.productId.stock
                }))
            });
        }

        // Prepare checkout event data
        const checkoutEventData = {
            eventType: 'UserCheckout',
            userId,
            cartId: cart._id,
            items: cart.items.map(item => ({
                productId: item.productId._id,
                quantity: item.quantity,
                price: item.price,
                productSnapshot: item.productSnapshot
            })),
            totalItems: cart.totalItems,
            totalPrice: cart.totalPrice,
            shippingAddress,
            paymentMethod,
            customerInfo,
            timestamp: new Date().toISOString()
        };

        try {
            // Publish UserCheckout event to Kafka
            await sendMessage('user-events', checkoutEventData);
            console.log('📤 UserCheckout event published to Kafka');

            // Update cart status to checkout
            cart.status = 'checkout';
            await cart.save();

            res.status(200).json({
                success: true,
                message: 'Checkout initiated successfully. Order will be processed shortly.',
                data: {
                    cartId: cart._id,
                    totalPrice: cart.totalPrice,
                    totalItems: cart.totalItems,
                    status: 'processing'
                }
            });

        } catch (kafkaError) {
            console.error('❌ Error publishing to Kafka:', kafkaError);
            
            res.status(503).json({
                success: false,
                message: 'Checkout service is temporarily unavailable. Please try again later.',
                error: process.env.NODE_ENV === 'development' ? kafkaError.message : 'Service unavailable'
            });
        }

    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during checkout process',
            error: error.message
        });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartSummary,
    checkoutCart
};
