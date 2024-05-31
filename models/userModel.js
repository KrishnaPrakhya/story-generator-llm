import mongoose from 'mongoose';

const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({
  userName: {
    type: String,
    required: [true, "Must provide a UserName"],
    unique: [true, "Must be Unique"]
  },
  email: {
    type: String,
    required: [true, "Must provide an email"],
    unique: [true, "Must be Unique"]
  },
  password: {
    type: String,
    required: [true, "Must provide a password"]
  }
}, {
  timestamps: true
}));


export default User;
