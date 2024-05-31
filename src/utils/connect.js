import mongoose from "mongoose"

export async function connectDB(){
  try{
      await mongoose.connect(process.env.MONGO_URL);
      console.log("mongoDB connected");
  }catch(err){
    console.log(err);
  }
}