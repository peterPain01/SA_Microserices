require('dotenv').config();
const mongoose = require('mongoose');
const Driver = require('../models/driver.model');

const sampleDrivers = [
    {
        driverId: 1001,
        name: 'Nguyen Van A',
        phone: '0123456789',
        email: 'driver1@example.com',
        vehicleInfo: {
            type: 'motorcycle',
            licensePlate: '51A-12345',
            model: 'Honda Wave Alpha',
            color: 'Đen'
        },
        location: {
            type: 'Point',
            coordinates: [106.6297, 10.8231] // Ho Chi Minh City
        },
        status: 'available',
        rating: 4.5,
        totalDeliveries: 150,
        totalEarnings: 4500000,
        isActive: true
    },
    {
        driverId: 1002,
        name: 'Tran Thi B',
        phone: '0123456790',
        email: 'driver2@example.com',
        vehicleInfo: {
            type: 'motorcycle',
            licensePlate: '51B-67890',
            model: 'Yamaha Exciter',
            color: 'Trắng'
        },
        location: {
            type: 'Point',
            coordinates: [106.6300, 10.8235]
        },
        status: 'available',
        rating: 4.8,
        totalDeliveries: 200,
        totalEarnings: 6000000,
        isActive: true
    },
    {
        driverId: 1003,
        name: 'Le Van C',
        phone: '0123456791',
        email: 'driver3@example.com',
        vehicleInfo: {
            type: 'motorcycle',
            licensePlate: '51C-11111',
            model: 'Honda Vision',
            color: 'Xanh'
        },
        location: {
            type: 'Point',
            coordinates: [106.6290, 10.8225]
        },
        status: 'available',
        rating: 4.2,
        totalDeliveries: 80,
        totalEarnings: 2400000,
        isActive: true
    },
    {
        driverId: 1004,
        name: 'Pham Thi D',
        phone: '0123456792',
        email: 'driver4@example.com',
        vehicleInfo: {
            type: 'motorcycle',
            licensePlate: '51D-22222',
            model: 'Honda Air Blade',
            color: 'Đỏ'
        },
        location: {
            type: 'Point',
            coordinates: [106.6305, 10.8240]
        },
        status: 'available',
        rating: 4.7,
        totalDeliveries: 120,
        totalEarnings: 3600000,
        isActive: true
    },
    {
        driverId: 1005,
        name: 'Hoang Van E',
        phone: '0123456793',
        email: 'driver5@example.com',
        vehicleInfo: {
            type: 'motorcycle',
            licensePlate: '51E-33333',
            model: 'Yamaha Grande',
            color: 'Vàng'
        },
        location: {
            type: 'Point',
            coordinates: [106.6295, 10.8238]
        },
        status: 'available',
        rating: 4.0,
        totalDeliveries: 60,
        totalEarnings: 1800000,
        isActive: true
    }
];

const seedDrivers = async () => {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI environment variable is required');
        }

        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ Connected to MongoDB');

        // Clear existing drivers
        await Driver.deleteMany({});
        console.log('🗑️ Cleared existing drivers');

        // Insert sample drivers
        const insertedDrivers = await Driver.insertMany(sampleDrivers);
        console.log(`✅ Inserted ${insertedDrivers.length} drivers`);

        // Display created drivers
        console.log('\n📋 Created Drivers:');
        insertedDrivers.forEach(driver => {
            console.log(`- ${driver.name} (ID: ${driver.driverId}) - ${driver.vehicleInfo.licensePlate}`);
        });

        console.log('\n🎉 Driver seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding drivers:', error);
        process.exit(1);
    }
};

// Run the seeding
seedDrivers();
