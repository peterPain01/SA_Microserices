const mongoose = require('mongoose');

// Cart Item Schema
const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    // Snapshot of product info at the time of adding to cart
    productSnapshot: {
        name: {
            type: String,
            required: true
        },
        description: String,
        images: [String],
        category: String
    }
}, {
    _id: false // Don't create separate _id for cart items
});

// Main Cart Schema
const cartSchema = new mongoose.Schema({
    userId: {
        type: Number, // Long number from PostgreSQL
        required: true,
        index: true
    },
    items: [cartItemSchema],
    totalItems: {
        type: Number,
        default: 0
    },
    totalPrice: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ['active', 'checkout', 'abandoned'],
        default: 'active'
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient queries
cartSchema.index({ userId: 1, status: 1 });

// Middleware to calculate totals before saving
cartSchema.pre('save', function(next) {
    this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
    this.totalPrice = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    this.lastUpdated = new Date();
    next();
});

// Static method to find active cart by user ID
cartSchema.statics.findActiveCart = function(userId) {
    return this.findOne({ userId, status: 'active' });
};

// Instance method to add item to cart
cartSchema.methods.addItem = function(productInfo, quantity = 1) {
    const existingItemIndex = this.items.findIndex(
        item => item.productId.toString() === productInfo._id.toString()
    );

    if (existingItemIndex >= 0) {
        // Update existing item
        this.items[existingItemIndex].quantity += quantity;
        this.items[existingItemIndex].price = productInfo.price; // Update with current price
    } else {
        // Add new item
        this.items.push({
            productId: productInfo._id,
            quantity,
            price: productInfo.price,
            productSnapshot: {
                name: productInfo.name,
                description: productInfo.description,
                images: productInfo.images,
                category: productInfo.category
            }
        });
    }
    
    return this.save();
};

// Instance method to update item quantity
cartSchema.methods.updateItemQuantity = function(productId, quantity) {
    const item = this.items.find(item => item.productId.toString() === productId.toString());
    
    if (!item) {
        throw new Error('Item not found in cart');
    }
    
    if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        this.items = this.items.filter(item => item.productId.toString() !== productId.toString());
    } else {
        item.quantity = quantity;
    }
    
    return this.save();
};

// Instance method to remove item from cart
cartSchema.methods.removeItem = function(productId) {
    this.items = this.items.filter(item => item.productId.toString() !== productId.toString());
    return this.save();
};

// Instance method to clear cart
cartSchema.methods.clearCart = function() {
    this.items = [];
    return this.save();
};

module.exports = mongoose.model('Cart', cartSchema);
