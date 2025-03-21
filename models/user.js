import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const Schema = mongoose.Schema;

// Address schema
const addressSchema = new Schema({
  city: { type: String, required: true, default: null },
  pincode: { type: String, required: true, default: null },
  district: { type: String, required: true, default: null },
  state: { type: String, required: true, default: null },
  nearbyLocation: { type: String, required: true, default: null },
  buildingName: { type: String, required: true, default: null },
  houseNumber: { type: String, required: true, default: null },
  isOffice: { type: Boolean, default: false, default: null },
  isHome: { type: Boolean, default: false, default: null },
  mobileNumber: { type: String, required: true, default: null },
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
