const mongoose = require('mongoose');

// Order Item Schema
const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    // Snapshot of product info at the time of order
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
    _id: false
});

// Shipping Address Schema
const shippingAddressSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    zipCode: {
        type: String,
        required: true
    },
    country: {
        type: String,
        default: 'Vietnam'
    }
}, {
    _id: false
});

// Customer Info Schema
const customerInfoSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    }
}, {
    _id: false
});

// Main Order Schema
const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: false // Will be auto-generated in pre-save middleware
    },
    userId: {
        type: Number, // Long number from PostgreSQL
        required: true,
        index: true
    },
    cartId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    items: [orderItemSchema],
    totalItems: {
        type: Number,
        required: true,
        min: 0
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    shippingFee: {
        type: Number,
        default: 0,
        min: 0
    },
    tax: {
        type: Number,
        default: 0,
        min: 0
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    shippingAddress: shippingAddressSchema,
    customerInfo: customerInfoSchema,
    paymentMethod: {
        type: String,
        required: true,
        enum: ['cod', 'bank_transfer', 'credit_card', 'e_wallet']
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    notes: {
        type: String,
        maxlength: 500
    },
    estimatedDelivery: {
        type: Date
    },
    actualDelivery: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });

// Generate order number before saving
orderSchema.pre('save', async function(next) {
    // Always generate order number for new documents if it doesn't exist
    if (this.isNew || !this.orderNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        
        // Format: ORD-YYYYMMDD-TIMESTAMP-RANDOM (e.g., ORD-20240115-1705123456789-1234)
        this.orderNumber = `ORD-${year}${month}${day}-${timestamp}-${randomSuffix}`;
        console.log('🔢 Generated order number:', this.orderNumber);
    }
    next();
});

// Static method to find orders by user ID
orderSchema.statics.findByUserId = function(userId, limit = 10, skip = 0) {
    return this.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
};

// Instance method to update order status
orderSchema.methods.updateStatus = function(newStatus) {
    this.orderStatus = newStatus;
    
    // Set estimated delivery for confirmed orders
    if (newStatus === 'confirmed') {
        this.estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    }
    
    // Set actual delivery for delivered orders
    if (newStatus === 'delivered') {
        this.actualDelivery = new Date();
    }
    
    return this.save();
};

// Instance method to update payment status
orderSchema.methods.updatePaymentStatus = function(newPaymentStatus) {
    this.paymentStatus = newPaymentStatus;
    return this.save();
};

module.exports = mongoose.model('Order', orderSchema);
