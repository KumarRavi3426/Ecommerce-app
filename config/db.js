import mongoose from "mongoose";
import colors from "colors";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log(`connected to db ${conn.connection.host}`.bgMagenta.red);
  } catch (error) {
    console.log(`error: ${error}`.bgRed.black);
  }
};

export default connectDB;
