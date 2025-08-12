# Kafka-Based Checkout Flow

This document describes the new event-driven checkout flow using Kafka instead of direct REST API calls between services.

## Architecture Overview

### Before (REST API)
```
Product Service → REST API → Order Service → Kafka → Delivery Service
```

### After (Kafka Events)
```
Product Service → Kafka (UserCheckout) → Order Service → Kafka (OrderCreated) → Delivery Service
```

## Flow Description

1. **User Checkout**: User calls checkout API on Product Service
2. **Event Publishing**: Product Service publishes `UserCheckout` event to Kafka
3. **Event Processing**: Order Service listens for `UserCheckout` events and creates orders
4. **Order Created**: Order Service publishes `OrderCreated` event to Kafka
5. **Delivery Assignment**: Delivery Service listens for `OrderCreated` events and assigns drivers

## Kafka Topics

| Topic | Publisher | Consumer | Event Type | Description |
|-------|-----------|----------|------------|-------------|
| `user-events` | Product Service | Order Service | `UserCheckout` | User checkout events |
| `order-events` | Order Service | Delivery Service | `OrderCreated`, `OrderStatusUpdated`, `PaymentStatusUpdated` | Order lifecycle events |

## Environment Variables

### Product Service (.env)
```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shopee_products

# Kafka
KAFKA_BROKERS=localhost:9092

# Server
PORT=3001
NODE_ENV=development
```

### Order Service (.env)
```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shopee_orders

# Kafka
KAFKA_BROKERS=localhost:9092

# Server
PORT=3002
NODE_ENV=development
```

### Delivery Service (.env)
```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shopee_deliveries

# Kafka
KAFKA_BROKERS=localhost:9092

# Server
PORT=3003
NODE_ENV=development
```

## Setup Instructions

### 1. Install Dependencies

```bash
# Product Service
cd ShopeeGoods/product-service
npm install

# Order Service
cd ShopeeGoods/order-service
npm install

# Delivery Service
cd ShopeeGoods/delivery-service
npm install
```

### 2. Start Kafka

Make sure Kafka is running on `localhost:9092`. You can use Docker:

```bash
# Option 1: Using Apache Kafka (recommended)
docker run -d --name kafka -p 9092:9092 apache/kafka:2.13-3.5.1

# Option 2: Using Bitnami Kafka (alternative)
docker run -d --name kafka -p 9092:9092 bitnami/kafka:3.5.1

# Option 3: Using Confluent Kafka (enterprise)
docker run -d --name kafka -p 9092:9092 confluentinc/cp-kafka:7.4.0
```

### 3. Start Services

```bash
# Terminal 1 - Product Service
cd ShopeeGoods/product-service
npm run dev

# Terminal 2 - Order Service
cd ShopeeGoods/order-service
npm run dev

# Terminal 3 - Delivery Service
cd ShopeeGoods/delivery-service
npm run dev
```

## API Endpoints

### Product Service (Port 3001)

#### Cart Checkout
```bash
POST /api/carts/:userId/checkout
```

**Request Body:**
```json
{
  "shippingAddress": {
    "fullName": "John Doe",
    "phone": "0123456789",
    "address": "123 Test Street, District 1, Ho Chi Minh City",
    "city": "Ho Chi Minh City",
    "district": "District 1",
    "postalCode": "70000",
    "instructions": "Please call before delivery"
  },
  "paymentMethod": "credit_card",
  "customerInfo": {
    "email": "john.doe@example.com",
    "phone": "0123456789",
    "fullName": "John Doe"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Checkout initiated successfully. Order will be processed shortly.",
  "data": {
    "cartId": "cart_id_here",
    "totalPrice": 300000,
    "totalItems": 2,
    "status": "processing"
  }
}
```

## Testing the Flow

### 1. Run the Test Script

```bash
cd ShopeeGoods
node test-kafka-checkout.js
```

### 2. Manual Testing with cURL

```bash
# 1. Create a product
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "Test Description",
    "price": 150000,
    "stock": 10,
    "category": "Electronics",
    "images": ["https://example.com/image.jpg"],
    "isPublished": true
  }'

# 2. Add to cart
curl -X POST http://localhost:3001/api/carts/12345/items \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID_FROM_STEP_1",
    "quantity": 2
  }'

# 3. Checkout (publishes UserCheckout event)
curl -X POST http://localhost:3001/api/carts/12345/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {
      "fullName": "John Doe",
      "phone": "0123456789",
      "address": "123 Test Street, District 1, Ho Chi Minh City",
      "city": "Ho Chi Minh City",
      "district": "District 1",
      "postalCode": "70000",
      "instructions": "Please call before delivery"
    },
    "paymentMethod": "credit_card",
    "customerInfo": {
      "email": "john.doe@example.com",
      "phone": "0123456789",
      "fullName": "John Doe"
    }
  }'
```

## Expected Logs

### Product Service Logs
```
✅ Kafka producer connected successfully
📤 UserCheckout event published to Kafka
```

### Order Service Logs
```
✅ Kafka Consumer connected
🎧 Subscribed to topic: user-events
📨 Processing message from topic: user-events
📋 Event type: UserCheckout
🛒 Processing UserCheckout event: cart_id_here
✅ Order created from UserCheckout event: ORD-2024-001
📤 OrderCreated event published to Kafka
```

### Delivery Service Logs
```
📨 Processing message from topic: order-events
📋 Event type: OrderCreated
🚚 Processing new order for delivery: ORD-2024-001
✅ Delivery created: DEL-2024-001
📤 DeliveryCreated event published to Kafka
```

## Benefits of Kafka-Based Flow

1. **Decoupling**: Services are no longer tightly coupled through REST APIs
2. **Scalability**: Better handling of high load with async processing
3. **Reliability**: Events are persisted and can be replayed if needed
4. **Monitoring**: Better observability of the entire checkout flow
5. **Fault Tolerance**: If one service is down, events are queued

## Troubleshooting

### Common Issues

1. **Kafka Connection Failed**
   - Ensure Kafka is running on the correct port
   - Check `KAFKA_BROKERS` environment variable

2. **Events Not Being Processed**
   - Check service logs for connection errors
   - Verify topic names match between publisher and consumer
   - Ensure consumer group IDs are unique

3. **MongoDB Connection Issues**
   - Verify MongoDB connection strings
   - Check network connectivity to MongoDB Atlas

### Debug Commands

```bash
# Check Kafka topics
kafka-topics.sh --list --bootstrap-server localhost:9092

# Check Kafka consumer groups
kafka-consumer-groups.sh --list --bootstrap-server localhost:9092

# Monitor Kafka messages
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic user-events --from-beginning
```

## Migration Notes

- The old REST API endpoint `/api/orders` in Order Service is still available for direct order creation
- Service authentication middleware has been removed from Order Service routes
- Product Service no longer requires `axios` for inter-service communication
- All checkout-related communication now goes through Kafka events
