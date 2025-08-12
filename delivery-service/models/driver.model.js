const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    driverId: {
        type: Number, // Long number from PostgreSQL
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    vehicleInfo: {
        type: {
            type: String,
            enum: ['motorcycle', 'car', 'truck'],
            default: 'motorcycle'
        },
        licensePlate: {
            type: String,
            required: true,
            unique: true
        },
        model: String,
        color: String
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    status: {
        type: String,
        enum: ['available', 'busy', 'offline', 'on_delivery'],
        default: 'available'
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    totalDeliveries: {
        type: Number,
        default: 0
    },
    totalEarnings: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    currentDelivery: {
        deliveryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Delivery'
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId
        }
    }
}, {
    timestamps: true
});

// Index for geospatial queries
driverSchema.index({ location: '2dsphere' });
driverSchema.index({ status: 1, isActive: 1 });

// Static method to find available drivers near a location
driverSchema.statics.findAvailableNearby = function(coordinates, maxDistance = 10000) {
    return this.find({
        status: 'available',
        isActive: true,
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: coordinates
                },
                $maxDistance: maxDistance // in meters
            }
        }
    }).sort({ rating: -1, totalDeliveries: -1 });
};

// Instance method to update driver status
driverSchema.methods.updateStatus = function(newStatus) {
    this.status = newStatus;
    this.lastActive = new Date();
    return this.save();
};

// Instance method to update location
driverSchema.methods.updateLocation = function(longitude, latitude) {
    this.location.coordinates = [longitude, latitude];
    this.lastActive = new Date();
    return this.save();
};

// Instance method to assign delivery
driverSchema.methods.assignDelivery = function(deliveryId, orderId) {
    this.status = 'on_delivery';
    this.currentDelivery = {
        deliveryId,
        orderId
    };
    this.lastActive = new Date();
    return this.save();
};

// Instance method to complete delivery
driverSchema.methods.completeDelivery = function() {
    this.status = 'available';
    this.currentDelivery = null;
    this.totalDeliveries += 1;
    this.lastActive = new Date();
    return this.save();
};

module.exports = mongoose.model('Driver', driverSchema);
