const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'delivery-service',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    retry: {
        initialRetryTime: 100,
        retries: 8
    }
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'delivery-service-group' });

// Connect producer
const connectProducer = async () => {
    try {
        await producer.connect();
        console.log('✅ Kafka Producer connected');
    } catch (error) {
        console.error('❌ Kafka Producer connection error:', error);
        throw error;
    }
};

// Connect consumer
const connectConsumer = async () => {
    try {
        await consumer.connect();
        console.log('✅ Kafka Consumer connected');
    } catch (error) {
        console.error('❌ Kafka Consumer connection error:', error);
        throw error;
    }
};

// Disconnect both producer and consumer
const disconnect = async () => {
    try {
        await producer.disconnect();
        await consumer.disconnect();
        console.log('✅ Kafka connections closed');
    } catch (error) {
        console.error('❌ Kafka disconnect error:', error);
    }
};

// Send message to Kafka topic
const sendMessage = async (topic, message) => {
    try {
        await producer.send({
            topic,
            messages: [
                {
                    key: message.deliveryId || Date.now().toString(),
                    value: JSON.stringify(message),
                    timestamp: Date.now()
                }
            ]
        });
        console.log(`📤 Message sent to topic: ${topic}`);
        return true;
    } catch (error) {
        console.error(`❌ Error sending message to topic ${topic}:`, error);
        throw error;
    }
};

// Subscribe to topics
const subscribeToTopics = async (topics, messageHandler) => {
    try {
        for (const topic of topics) {
            await consumer.subscribe({ topic, fromBeginning: false });
            console.log(`📡 Subscribed to topic: ${topic}`);
        }

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const value = JSON.parse(message.value.toString());
                    console.log(`📨 Received message from topic ${topic}:`, value.eventType);
                    await messageHandler(topic, value);
                } catch (error) {
                    console.error('❌ Error processing message:', error);
                }
            }
        });

        console.log('🎧 Kafka consumer is running and listening for messages');
    } catch (error) {
        console.error('❌ Error subscribing to topics:', error);
        throw error;
    }
};

module.exports = {
    kafka,
    producer,
    consumer,
    connectProducer,
    connectConsumer,
    disconnect,
    sendMessage,
    subscribeToTopics
};
