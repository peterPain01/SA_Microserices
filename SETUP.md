# ShopeeGoods Microservices Setup Guide

## Current Issues Fixed

### 1. MongoDB Connection Issues
All services now support both local and cloud MongoDB connections:

- **Local MongoDB** (default): `mongodb://localhost:27017/`
  - Product Service: `shopee_products`
  - Order Service: `shopee_orders` 
  - Delivery Service: `shopee_deliveries`

- **Cloud MongoDB**: Set `MONGODB_URI` environment variable

### 2. ObjectId Serialization Issues
Fixed Kafka message serialization by converting MongoDB ObjectIds to strings before sending to Kafka.

### 3. Order Number Generation
Fixed automatic order number generation in the Order model.

## Environment Variables

Create a `.env` file in each service directory or set these environment variables:

```bash
# MongoDB Configuration
# For local MongoDB (default - no need to set)
# MONGODB_URI=mongodb://localhost:27017/shopee_products

# For MongoDB Atlas (cloud)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shopee_products?retryWrites=true&w=majority

# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=shopee-goods

# KafkaJS Warning Suppression
KAFKAJS_NO_PARTITIONER_WARNING=1

# Service Ports
PRODUCT_SERVICE_PORT=3001
ORDER_SERVICE_PORT=3002
DELIVERY_SERVICE_PORT=3003

# Node Environment
NODE_ENV=development
```

## Prerequisites

1. **MongoDB**: Install and start MongoDB locally
   ```bash
   # On Windows
   # Start MongoDB service or run mongod.exe
   
   # On macOS/Linux
   brew install mongodb-community
   brew services start mongodb-community
   ```

2. **Kafka**: Start Kafka and Zookeeper
   ```bash
   # Using Docker
   docker-compose up -d
   
   # Or manually start Kafka and Zookeeper
   ```

3. **Node.js**: Ensure Node.js 16+ is installed

## Starting the Services

### Option 1: Start Services Individually

```bash
# Terminal 1 - Product Service
cd ShopeeGoods/product-service
npm install
npm start

# Terminal 2 - Order Service  
cd ShopeeGoods/order-service
npm install
npm start

# Terminal 3 - Delivery Service
cd ShopeeGoods/delivery-service
npm install
npm start
```

### Option 2: Using Docker Compose

```bash
cd ShopeeGoods
docker-compose up
```

## Testing the Setup

1. **Test MongoDB Connection**:
   ```bash
   # Check if MongoDB is running
   mongo --eval "db.runCommand('ping')"
   ```

2. **Test Kafka Connection**:
   ```bash
   # Check if Kafka is accessible
   kafka-topics --list --bootstrap-server localhost:9092
   ```

3. **Test the Full Flow**:
   ```bash
   cd ShopeeGoods
   node test-kafka-checkout.js
   ```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running on `localhost:27017`
- Check MongoDB logs for errors
- Verify database permissions

### Kafka Connection Issues
- Ensure Kafka and Zookeeper are running
- Check Kafka broker configuration
- Verify topic creation

### Service Startup Issues
- Check all environment variables are set correctly
- Ensure all dependencies are installed
- Check service logs for specific error messages

## Database Initialization

The services will automatically create the necessary databases and collections. If you need to initialize manually:

```bash
# Run MongoDB initialization script
mongo < scripts/mongo-init.js
```

## Next Steps

1. Start all services
2. Run the test script to verify the complete flow
3. Monitor logs for successful order creation and delivery assignment
4. Test individual service endpoints as needed
