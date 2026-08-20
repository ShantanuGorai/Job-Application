const mongoose = require('mongoose')

const connectDB = async() => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('databasse connected successfully . . .');
    } catch (error) {
        console.log('database connection failed', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;