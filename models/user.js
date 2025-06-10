import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const Schema = mongoose.Schema;

// Address schema
const addressSchema = new Schema({
  fullName: { type: String, default: null },
  city: { type: String, default: null },
  pinCode: { type: String, default: null }, // changed from `pincode`
  district: { type: String, default: null },
  state: { type: String, default: null },
  addressLine1: { type: String, default: null },
  addressLine2: { type: String, default: null },
  landmark: { type: String, default: null },
  addressType: { type: String, enum: ['Home', 'Office', 'Other'], default: 'Home' },
  mobileNumber: { type: String, default: null },
});


const userSchema = new Schema({
  name: { type: String, required: false, default: null },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: String, required: false, default: null },
  isAdmin: { type: String, required: false, default: false },
  addresses: { type: [addressSchema] },
});

// Encrypt password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to check if passwords match
userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
