const Delivery = require('../models/delivery.model');
const Driver = require('../models/driver.model');
const DeliveryService = require('../services/delivery.service');

// Get all deliveries
const getAllDeliveries = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, driverId } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        if (status) query.status = status;
        if (driverId) query.driverId = parseInt(driverId);

        const deliveries = await Delivery.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const totalDeliveries = await Delivery.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                deliveries,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalDeliveries / limit),
                    totalDeliveries,
                    hasNext: skip + deliveries.length < totalDeliveries,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching deliveries',
            error: error.message
        });
    }
};

// Get delivery by ID
const getDeliveryById = async (req, res) => {
    try {
        const { deliveryId } = req.params;

        const delivery = await Delivery.findById(deliveryId);
        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }

        res.status(200).json({
            success: true,
            data: delivery
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching delivery',
            error: error.message
        });
    }
};

// Get delivery by delivery number
const getDeliveryByNumber = async (req, res) => {
    try {
        const { deliveryNumber } = req.params;

        const delivery = await Delivery.findOne({ deliveryNumber });
        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }

        res.status(200).json({
            success: true,
            data: delivery
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching delivery',
            error: error.message
        });
    }
};

// Update delivery status
const updateDeliveryStatus = async (req, res) => {
    try {
        const { deliveryId } = req.params;
        const { status, location, notes, updatedBy = 'admin' } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const delivery = await DeliveryService.updateDeliveryStatus(
            deliveryId, 
            status, 
            location, 
            notes, 
            updatedBy
        );

        res.status(200).json({
            success: true,
            message: 'Delivery status updated successfully',
            data: {
                _id: delivery._id,
                deliveryNumber: delivery.deliveryNumber,
                status: delivery.status,
                updatedAt: delivery.updatedAt
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating delivery status',
            error: error.message
        });
    }
};

// Assign driver to delivery
const assignDriverToDelivery = async (req, res) => {
    try {
        const { deliveryId } = req.params;
        const { driverId } = req.body;

        if (!driverId) {
            return res.status(400).json({
                success: false,
                message: 'Driver ID is required'
            });
        }

        const delivery = await Delivery.findById(deliveryId);
        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }

        const driver = await Driver.findOne({ driverId: parseInt(driverId) });
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        if (driver.status !== 'available') {
            return res.status(400).json({
                success: false,
                message: 'Driver is not available'
            });
        }

        // Assign delivery to driver
        await delivery.assignDriver(driver.driverId);
        await driver.assignDelivery(delivery._id, delivery.orderId);

        res.status(200).json({
            success: true,
            message: 'Driver assigned successfully',
            data: {
                deliveryId: delivery._id,
                deliveryNumber: delivery.deliveryNumber,
                driverId: driver.driverId,
                driverName: driver.name,
                estimatedPickupTime: delivery.estimatedPickupTime,
                estimatedDeliveryTime: delivery.estimatedDeliveryTime
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error assigning driver',
            error: error.message
        });
    }
};

// Get delivery statistics
const getDeliveryStats = async (req, res) => {
    try {
        const stats = await DeliveryService.getDeliveryStats();

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching delivery statistics',
            error: error.message
        });
    }
};

// Get all drivers
const getAllDrivers = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const skip = (page - 1) * limit;

        let query = { isActive: true };
        if (status) query.status = status;

        const drivers = await Driver.find(query)
            .sort({ rating: -1, totalDeliveries: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const totalDrivers = await Driver.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                drivers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalDrivers / limit),
                    totalDrivers,
                    hasNext: skip + drivers.length < totalDrivers,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching drivers',
            error: error.message
        });
    }
};

// Get driver by ID
const getDriverById = async (req, res) => {
    try {
        const { driverId } = req.params;

        const driver = await Driver.findOne({ driverId: parseInt(driverId) });
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        res.status(200).json({
            success: true,
            data: driver
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching driver',
            error: error.message
        });
    }
};

// Update driver location
const updateDriverLocation = async (req, res) => {
    try {
        const { driverId } = req.params;
        const { longitude, latitude } = req.body;

        if (!longitude || !latitude) {
            return res.status(400).json({
                success: false,
                message: 'Longitude and latitude are required'
            });
        }

        const driver = await Driver.findOne({ driverId: parseInt(driverId) });
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        await driver.updateLocation(longitude, latitude);

        res.status(200).json({
            success: true,
            message: 'Driver location updated successfully',
            data: {
                driverId: driver.driverId,
                name: driver.name,
                location: driver.location,
                lastActive: driver.lastActive
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating driver location',
            error: error.message
        });
    }
};

// Update driver status
const updateDriverStatus = async (req, res) => {
    try {
        const { driverId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const driver = await Driver.findOne({ driverId: parseInt(driverId) });
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        await driver.updateStatus(status);

        res.status(200).json({
            success: true,
            message: 'Driver status updated successfully',
            data: {
                driverId: driver.driverId,
                name: driver.name,
                status: driver.status,
                lastActive: driver.lastActive
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating driver status',
            error: error.message
        });
    }
};

// Get driver deliveries
const getDriverDeliveries = async (req, res) => {
    try {
        const { driverId } = req.params;
        const { page = 1, limit = 10, status } = req.query;
        const skip = (page - 1) * limit;

        let query = { driverId: parseInt(driverId) };
        if (status) query.status = status;

        const deliveries = await Delivery.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const totalDeliveries = await Delivery.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                deliveries,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalDeliveries / limit),
                    totalDeliveries,
                    hasNext: skip + deliveries.length < totalDeliveries,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching driver deliveries',
            error: error.message
        });
    }
};

module.exports = {
    getAllDeliveries,
    getDeliveryById,
    getDeliveryByNumber,
    updateDeliveryStatus,
    assignDriverToDelivery,
    getDeliveryStats,
    getAllDrivers,
    getDriverById,
    updateDriverLocation,
    updateDriverStatus,
    getDriverDeliveries
};
