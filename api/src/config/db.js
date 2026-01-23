import mongoose from "mongoose";

const connectDB = async () => {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        throw new Error("MONGO_URI is missing in .env");
    }

    mongoose.set("strictQuery", true);

    await mongoose.connect(uri, {
        dbName: "5cards",
    });

    console.log(`✅ Connected to MongoDB Database: "${mongoose.connection.name}"`);
};

export default connectDB;
