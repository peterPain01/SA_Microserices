const mongoose = require('mongoose');

// Delivery Location Schema
const deliveryLocationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['pickup', 'delivery'],
        required: true
    },
    address: {
        type: String,
        required: true
    },
    coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
    },
    contactPerson: {
        name: String,
        phone: String
    },
    instructions: String
}, {
    _id: false
});

// Delivery Status History Schema
const statusHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    location: {
        type: [Number], // [longitude, latitude]
        required: false
    },
    notes: String,
    updatedBy: {
        type: String,
        enum: ['system', 'driver', 'customer', 'admin'],
        default: 'system'
    }
}, {
    _id: false
});

// Main Delivery Schema
const deliverySchema = new mongoose.Schema({
    deliveryNumber: {
        type: String,
        unique: true,
        required: false // Will be auto-generated in pre-save middleware
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    orderNumber: {
        type: String,
        required: true
    },
    userId: {
        type: Number, // Long number from PostgreSQL
        required: true,
        index: true
    },
    driverId: {
        type: Number, // Long number from PostgreSQL
        required: false,
        index: true
    },
    pickupLocation: deliveryLocationSchema,
    deliveryLocation: deliveryLocationSchema,
    status: {
        type: String,
        enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    estimatedPickupTime: {
        type: Date
    },
    estimatedDeliveryTime: {
        type: Date
    },
    actualPickupTime: {
        type: Date
    },
    actualDeliveryTime: {
        type: Date
    },
    distance: {
        type: Number, // in meters
        default: 0
    },
    deliveryFee: {
        type: Number,
        default: 0
    },
    driverEarnings: {
        type: Number,
        default: 0
    },
    statusHistory: [statusHistorySchema],
    notes: {
        type: String,
        maxlength: 500
    },
    customerRating: {
        type: Number,
        min: 1,
        max: 5
    },
    customerFeedback: {
        type: String,
        maxlength: 1000
    },
    isUrgent: {
        type: Boolean,
        default: false
    },
    retryCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
deliverySchema.index({ status: 1, createdAt: -1 });
deliverySchema.index({ driverId: 1, status: 1 });
deliverySchema.index({ userId: 1, createdAt: -1 });
deliverySchema.index({ deliveryNumber: 1 });

// Generate delivery number before saving
deliverySchema.pre('save', async function(next) {
    // Always generate delivery number for new documents if it doesn't exist
    if (this.isNew || !this.deliveryNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        
        // Format: DEL-YYYYMMDD-TIMESTAMP-RANDOM (e.g., DEL-20240115-1705123456789-1234)
        this.deliveryNumber = `DEL-${year}${month}${day}-${timestamp}-${randomSuffix}`;
        console.log('🚚 Generated delivery number:', this.deliveryNumber);
    }
    next();
});

// Add status to history when status changes
deliverySchema.pre('save', function(next) {
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date(),
            updatedBy: 'system'
        });
    }
    next();
});

// Static method to find pending deliveries
deliverySchema.statics.findPendingDeliveries = function() {
    return this.find({ status: 'pending' })
        .sort({ priority: -1, createdAt: 1 });
};

// Static method to find deliveries by driver
deliverySchema.statics.findByDriver = function(driverId, status = null) {
    const query = { driverId };
    if (status) {
        query.status = status;
    }
    return this.find(query).sort({ createdAt: -1 });
};

// Instance method to assign driver
deliverySchema.methods.assignDriver = function(driverId) {
    this.driverId = driverId;
    this.status = 'assigned';
    this.estimatedPickupTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    this.estimatedDeliveryTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
    return this.save();
};

// Instance method to update status
deliverySchema.methods.updateStatus = function(newStatus, location = null, notes = '', updatedBy = 'system') {
    this.status = newStatus;
    
    if (location) {
        this.statusHistory[this.statusHistory.length - 1].location = location;
    }
    
    if (notes) {
        this.statusHistory[this.statusHistory.length - 1].notes = notes;
    }
    
    this.statusHistory[this.statusHistory.length - 1].updatedBy = updatedBy;
    
    // Set actual times based on status
    if (newStatus === 'picked_up') {
        this.actualPickupTime = new Date();
    } else if (newStatus === 'delivered') {
        this.actualDeliveryTime = new Date();
    }
    
    return this.save();
};

// Instance method to calculate distance (simplified)
deliverySchema.methods.calculateDistance = function() {
    if (this.pickupLocation.coordinates && this.deliveryLocation.coordinates) {
        // Simple distance calculation (in production, use proper geospatial calculations)
        const [lon1, lat1] = this.pickupLocation.coordinates;
        const [lon2, lat2] = this.deliveryLocation.coordinates;
        
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        this.distance = R * c;
        return this.distance;
    }
    return 0;
};

module.exports = mongoose.model('Delivery', deliverySchema);
