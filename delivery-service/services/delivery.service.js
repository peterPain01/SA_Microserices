const Delivery = require('../models/delivery.model');
const Driver = require('../models/driver.model');
const { sendMessage } = require('../config/kafka');

class DeliveryService {
    // Handle OrderCreated event from Kafka
    static async handleOrderCreated(orderData) {
        try {
            console.log('🚚 Processing new order for delivery:', orderData.orderNumber);

            // Create delivery record
            const delivery = new Delivery({
                orderId: orderData.orderId,
                orderNumber: orderData.orderNumber,
                userId: orderData.userId,
                pickupLocation: {
                    type: 'pickup',
                    address: 'Warehouse Location', // In real app, get from order data
                    coordinates: [106.6297, 10.8231], // Ho Chi Minh City coordinates
                    contactPerson: {
                        name: 'Warehouse Manager',
                        phone: '0123456789'
                    },
                    instructions: 'Pick up from main warehouse'
                },
                deliveryLocation: {
                    type: 'delivery',
                    address: orderData.shippingAddress.address,
                    coordinates: [106.6297, 10.8231], // In real app, geocode the address
                    contactPerson: {
                        name: orderData.shippingAddress.fullName,
                        phone: orderData.shippingAddress.phone
                    },
                    instructions: orderData.shippingAddress.instructions || 'Please call before delivery'
                },
                priority: this.calculatePriority(orderData),
                deliveryFee: this.calculateDeliveryFee(orderData),
                driverEarnings: this.calculateDriverEarnings(orderData)
            });

            // Calculate distance
            delivery.calculateDistance();

            const savedDelivery = await delivery.save();
            console.log('✅ Delivery created:', savedDelivery.deliveryNumber);

            // Try to assign driver immediately
            await this.assignDriverToDelivery(savedDelivery);

            // Publish DeliveryCreated event
            await this.publishDeliveryCreatedEvent(savedDelivery, orderData);

            return savedDelivery;

        } catch (error) {
            console.error('❌ Error creating delivery:', error);
            throw error;
        }
    }

    // Assign driver to delivery
    static async assignDriverToDelivery(delivery) {
        try {
            console.log('🔍 Looking for available driver for delivery:', delivery.deliveryNumber);

            // Find available drivers near pickup location
            const availableDrivers = await Driver.findAvailableNearby(
                delivery.pickupLocation.coordinates,
                10000 // 10km radius
            );

            if (availableDrivers.length === 0) {
                console.log('⚠️ No available drivers found nearby');
                return null;
            }

            // Select best driver (highest rating, most experience)
            const selectedDriver = availableDrivers[0];
            console.log('👨‍💼 Selected driver:', selectedDriver.name, 'ID:', selectedDriver.driverId);

            // Assign delivery to driver
            await delivery.assignDriver(selectedDriver.driverId);
            await selectedDriver.assignDelivery(delivery._id, delivery.orderId);

            // Publish DriverAssigned event
            await this.publishDriverAssignedEvent(delivery, selectedDriver);

            console.log('✅ Driver assigned successfully');
            return selectedDriver;

        } catch (error) {
            console.error('❌ Error assigning driver:', error);
            throw error;
        }
    }

    // Calculate delivery priority
    static calculatePriority(orderData) {
        // Simple priority calculation based on order value
        const totalPrice = orderData.totalPrice;
        
        if (totalPrice >= 1000000) return 'urgent'; // 1M+ VND
        if (totalPrice >= 500000) return 'high';    // 500k+ VND
        if (totalPrice >= 200000) return 'normal';  // 200k+ VND
        return 'low';
    }

    // Calculate delivery fee
    static calculateDeliveryFee(orderData) {
        const baseFee = 30000; // 30k VND base fee
        const distanceMultiplier = 0.001; // 1 VND per meter
        
        // Simple calculation (in real app, use actual distance)
        const estimatedDistance = 5000; // 5km default
        const distanceFee = estimatedDistance * distanceMultiplier;
        
        return Math.round(baseFee + distanceFee);
    }

    // Calculate driver earnings
    static calculateDriverEarnings(orderData) {
        const deliveryFee = this.calculateDeliveryFee(orderData);
        const commissionRate = 0.7; // 70% commission for driver
        
        return Math.round(deliveryFee * commissionRate);
    }

    // Publish DeliveryCreated event
    static async publishDeliveryCreatedEvent(delivery, orderData) {
        try {
            const event = {
                eventType: 'DeliveryCreated',
                deliveryId: delivery._id.toString(), // Convert ObjectId to string
                deliveryNumber: delivery.deliveryNumber,
                orderId: delivery.orderId.toString(), // Convert ObjectId to string
                orderNumber: delivery.orderNumber,
                userId: delivery.userId,
                pickupLocation: delivery.pickupLocation,
                deliveryLocation: delivery.deliveryLocation,
                priority: delivery.priority,
                deliveryFee: delivery.deliveryFee,
                estimatedPickupTime: delivery.estimatedPickupTime,
                estimatedDeliveryTime: delivery.estimatedDeliveryTime,
                timestamp: new Date().toISOString()
            };

            await sendMessage('delivery-events', event);
            console.log('📤 DeliveryCreated event published');

        } catch (error) {
            console.error('❌ Error publishing DeliveryCreated event:', error);
        }
    }

    // Publish DriverAssigned event
    static async publishDriverAssignedEvent(delivery, driver) {
        try {
            const event = {
                eventType: 'DriverAssigned',
                deliveryId: delivery._id.toString(), // Convert ObjectId to string
                deliveryNumber: delivery.deliveryNumber,
                orderId: delivery.orderId.toString(), // Convert ObjectId to string
                orderNumber: delivery.orderNumber,
                driverId: driver.driverId,
                driverName: driver.name,
                driverPhone: driver.phone,
                estimatedPickupTime: delivery.estimatedPickupTime,
                estimatedDeliveryTime: delivery.estimatedDeliveryTime,
                timestamp: new Date().toISOString()
            };

            await sendMessage('delivery-events', event);
            console.log('📤 DriverAssigned event published');

        } catch (error) {
            console.error('❌ Error publishing DriverAssigned event:', error);
        }
    }

    // Update delivery status
    static async updateDeliveryStatus(deliveryId, newStatus, location = null, notes = '', updatedBy = 'system') {
        try {
            const delivery = await Delivery.findById(deliveryId);
            if (!delivery) {
                throw new Error('Delivery not found');
            }

            await delivery.updateStatus(newStatus, location, notes, updatedBy);

            // If delivery is completed, update driver stats
            if (newStatus === 'delivered' && delivery.driverId) {
                const driver = await Driver.findOne({ driverId: delivery.driverId });
                if (driver) {
                    await driver.completeDelivery();
                    driver.totalEarnings += delivery.driverEarnings;
                    await driver.save();
                }
            }

            // Publish DeliveryStatusUpdated event
            await this.publishDeliveryStatusUpdatedEvent(delivery, newStatus);

            return delivery;

        } catch (error) {
            console.error('❌ Error updating delivery status:', error);
            throw error;
        }
    }

    // Publish DeliveryStatusUpdated event
    static async publishDeliveryStatusUpdatedEvent(delivery, newStatus) {
        try {
            const event = {
                eventType: 'DeliveryStatusUpdated',
                deliveryId: delivery._id.toString(), // Convert ObjectId to string
                deliveryNumber: delivery.deliveryNumber,
                orderId: delivery.orderId.toString(), // Convert ObjectId to string
                orderNumber: delivery.orderNumber,
                driverId: delivery.driverId,
                oldStatus: delivery.status,
                newStatus: newStatus,
                timestamp: new Date().toISOString()
            };

            await sendMessage('delivery-events', event);
            console.log('📤 DeliveryStatusUpdated event published');

        } catch (error) {
            console.error('❌ Error publishing DeliveryStatusUpdated event:', error);
        }
    }

    // Get delivery statistics
    static async getDeliveryStats() {
        try {
            const stats = await Delivery.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalDeliveryFee: { $sum: '$deliveryFee' },
                        totalDriverEarnings: { $sum: '$driverEarnings' }
                    }
                }
            ]);

            const totalDeliveries = await Delivery.countDocuments();
            const totalRevenue = await Delivery.aggregate([
                { $group: { _id: null, total: { $sum: '$deliveryFee' } } }
            ]);

            return {
                byStatus: stats,
                totalDeliveries,
                totalRevenue: totalRevenue[0]?.total || 0
            };

        } catch (error) {
            console.error('❌ Error getting delivery stats:', error);
            throw error;
        }
    }
}

module.exports = DeliveryService;
