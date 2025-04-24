import mongoose from "mongoose";

const dbConnection = async (req, res, next) => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Database Connection Successful");
};
export default dbConnection;
