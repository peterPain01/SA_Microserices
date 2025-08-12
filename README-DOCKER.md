# Docker Setup for ShopeeGoods Microservices

This document explains how to run the entire ShopeeGoods microservices architecture using Docker Compose.

## 🐳 What's Included

The Docker Compose setup includes:

- **Zookeeper** - Required for Kafka coordination
- **Kafka** - Message broker for event-driven communication
- **MongoDB** - Database for all services
- **Product Service** - Product and cart management
- **Order Service** - Order processing and management
- **Delivery Service** - Delivery and driver management
- **Kafka UI** - Web interface for monitoring Kafka
- **MongoDB Express** - Web interface for MongoDB management

## 🚀 Quick Start

### 1. Prerequisites

- Docker and Docker Compose installed
- At least 4GB of available RAM
- Ports 3001-3003, 8080-8081, 9092, 2181, 27017 available

### 2. Start All Services

```bash
# Navigate to the ShopeeGoods directory
cd ShopeeGoods

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Check Service Status

```bash
# Check all running containers
docker-compose ps

# Check specific service logs
docker-compose logs product-service
docker-compose logs order-service
docker-compose logs delivery-service
```

## 🌐 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Product Service | http://localhost:3001 | Product and cart APIs |
| Order Service | http://localhost:3002 | Order management APIs |
| Delivery Service | http://localhost:3003 | Delivery and driver APIs |
| Kafka UI | http://localhost:8080 | Kafka monitoring interface |
| MongoDB Express | http://localhost:8081 | MongoDB management interface |

## 📊 Monitoring

### Kafka UI
- **URL**: http://localhost:8080
- **Features**: 
  - View topics and messages
  - Monitor consumer groups
  - Browse message content
  - Real-time message streaming

### MongoDB Express
- **URL**: http://localhost:8081
- **Username**: admin
- **Password**: password123
- **Features**:
  - Browse databases and collections
  - View and edit documents
  - Execute queries
  - Monitor database performance

## 🔧 Configuration

### Environment Variables

The services are configured with the following environment variables:

```env
# MongoDB
MONGODB_URI=mongodb://admin:password123@mongodb:27017/shopee_products?authSource=admin

# Kafka
KAFKA_BROKERS=kafka:9092

# Server
PORT=3001
NODE_ENV=development
```

### Database Credentials

- **Username**: admin
- **Password**: password123
- **Databases**:
  - `shopee_products` - Product service data
  - `shopee_orders` - Order service data
  - `shopee_deliveries` - Delivery service data

## 🧪 Testing the Setup

### 1. Health Checks

```bash
# Check if all services are healthy
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

### 2. Test Kafka Flow

```bash
# Run the test script
node test-kafka-checkout.js
```

### 3. Manual API Testing

```bash
# Create a product
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

# Add to cart
curl -X POST http://localhost:3001/api/carts/12345/items \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID_FROM_STEP_1",
    "quantity": 2
  }'

# Checkout (triggers Kafka events)
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

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3001
   
   # Stop conflicting services
   docker-compose down
   ```

2. **Kafka Connection Issues**
   ```bash
   # Check Kafka logs
   docker-compose logs kafka
   
   # Restart Kafka
   docker-compose restart kafka
   ```

3. **MongoDB Connection Issues**
   ```bash
   # Check MongoDB logs
   docker-compose logs mongodb
   
   # Restart MongoDB
   docker-compose restart mongodb
   ```

4. **Service Health Check Failures**
   ```bash
   # Check service logs
   docker-compose logs product-service
   docker-compose logs order-service
   docker-compose logs delivery-service
   ```

### Debug Commands

```bash
# View all container logs
docker-compose logs

# View specific service logs
docker-compose logs -f [service-name]

# Execute commands in running containers
docker-compose exec product-service sh
docker-compose exec mongodb mongosh

# Check resource usage
docker stats

# View network configuration
docker network ls
docker network inspect shopeegoods_shopee-network
```

## 🛑 Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This will delete all data)
docker-compose down -v

# Stop and remove images
docker-compose down --rmi all
```

## 🔄 Development Workflow

### Hot Reload (Development)

The services are configured with volume mounts for hot reloading:

```bash
# Start services in development mode
docker-compose up -d

# Make changes to your code
# Services will automatically reload
```

### Rebuilding Services

```bash
# Rebuild a specific service
docker-compose build product-service

# Rebuild all services
docker-compose build

# Rebuild and restart
docker-compose up -d --build
```

## 📈 Production Considerations

For production deployment:

1. **Security**:
   - Change default passwords
   - Use environment-specific configuration
   - Enable SSL/TLS
   - Configure proper firewall rules

2. **Scaling**:
   - Use external MongoDB cluster
   - Configure Kafka cluster
   - Implement load balancing
   - Set up monitoring and alerting

3. **Data Persistence**:
   - Configure proper volume mounts
   - Set up backup strategies
   - Implement data retention policies

## 📝 Useful Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart specific service
docker-compose restart product-service

# Check service status
docker-compose ps

# Execute commands in containers
docker-compose exec product-service npm test

# View resource usage
docker stats

# Clean up
docker-compose down -v --rmi all
```

## 🎯 Next Steps

1. **Start the services**: `docker-compose up -d`
2. **Check health**: Visit the health endpoints
3. **Test the flow**: Run the test script
4. **Monitor**: Use Kafka UI and MongoDB Express
5. **Develop**: Make changes and see hot reload in action

Happy coding! 🚀
