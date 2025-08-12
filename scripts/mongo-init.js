// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Create databases for each service
db = db.getSiblingDB('shopee_products');
db.createCollection('products');
db.createCollection('carts');

// Create indexes for products collection
db.products.createIndex({ "name": 1 });
db.products.createIndex({ "category": 1 });
db.products.createIndex({ "isPublished": 1 });
db.products.createIndex({ "price": 1 });

// Create indexes for carts collection
db.carts.createIndex({ "userId": 1 }, { unique: true });
db.carts.createIndex({ "status": 1 });

// Create database for order service
db = db.getSiblingDB('shopee_orders');
db.createCollection('orders');

// Create indexes for orders collection
db.orders.createIndex({ "orderNumber": 1 }, { unique: true });
db.orders.createIndex({ "userId": 1 });
db.orders.createIndex({ "orderStatus": 1 });
db.orders.createIndex({ "paymentStatus": 1 });
db.orders.createIndex({ "createdAt": 1 });

// Create database for delivery service
db = db.getSiblingDB('shopee_deliveries');
db.createCollection('drivers');
db.createCollection('deliveries');

// Create indexes for drivers collection
db.drivers.createIndex({ "driverId": 1 }, { unique: true });
db.drivers.createIndex({ "status": 1 });
db.drivers.createIndex({ "location": "2dsphere" });

// Create indexes for deliveries collection
db.deliveries.createIndex({ "deliveryNumber": 1 }, { unique: true });
db.deliveries.createIndex({ "orderId": 1 });
db.drivers.createIndex({ "userId": 1 });
db.deliveries.createIndex({ "driverId": 1 });
db.deliveries.createIndex({ "status": 1 });
db.deliveries.createIndex({ "createdAt": 1 });

print('✅ MongoDB databases and collections initialized successfully!');
