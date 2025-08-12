const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/delivery.controller');

// Delivery routes
// GET /api/deliveries - Get all deliveries
router.get('/', getAllDeliveries);

// GET /api/deliveries/stats - Get delivery statistics
router.get('/stats', getDeliveryStats);

// GET /api/deliveries/:deliveryId - Get delivery by ID
router.get('/:deliveryId', getDeliveryById);

// GET /api/deliveries/number/:deliveryNumber - Get delivery by delivery number
router.get('/number/:deliveryNumber', getDeliveryByNumber);

// PUT /api/deliveries/:deliveryId/status - Update delivery status
router.put('/:deliveryId/status', updateDeliveryStatus);

// POST /api/deliveries/:deliveryId/assign - Assign driver to delivery
router.post('/:deliveryId/assign', assignDriverToDelivery);

// Driver routes
// GET /api/deliveries/drivers - Get all drivers
router.get('/drivers', getAllDrivers);

// GET /api/deliveries/drivers/:driverId - Get driver by ID
router.get('/drivers/:driverId', getDriverById);

// PUT /api/deliveries/drivers/:driverId/location - Update driver location
router.put('/drivers/:driverId/location', updateDriverLocation);

// PUT /api/deliveries/drivers/:driverId/status - Update driver status
router.put('/drivers/:driverId/status', updateDriverStatus);

// GET /api/deliveries/drivers/:driverId/deliveries - Get driver deliveries
router.get('/drivers/:driverId/deliveries', getDriverDeliveries);

module.exports = router;
