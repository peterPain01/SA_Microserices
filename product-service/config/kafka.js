const { Kafka } = require('kafkajs');

// Kafka configuration
const kafka = new Kafka({
    clientId: 'product-service',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    retry: {
        initialRetryTime: 100,
        retries: 8
    }
});

// Create producer
const producer = kafka.producer();

// Connect to Kafka
const connectKafka = async () => {
    try {
        await producer.connect();
        console.log('✅ Kafka producer connected successfully');
    } catch (error) {
        console.error('❌ Error connecting to Kafka:', error);
        throw error;
    }
};

// Disconnect from Kafka
const disconnectKafka = async () => {
    try {
        await producer.disconnect();
        console.log('✅ Kafka producer disconnected');
    } catch (error) {
        console.error('❌ Error disconnecting from Kafka:', error);
    }
};

// Send message to Kafka topic
const sendMessage = async (topic, message) => {
    try {
        await producer.send({
            topic,
            messages: [
                {
                    key: message.eventType || 'default',
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

module.exports = {
    connectKafka,
    disconnectKafka,
    sendMessage
};
