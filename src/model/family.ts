import mongoose, { Document, Schema } from "mongoose";

// Define the interface for the DoorDash account document
interface IDoorDashAccount extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  phone: string;
  address: string;
  referralLink?: string;
  createdAt: Date;
}

// Define the interface for the Family document
interface IFamily extends Document {
  _id: mongoose.Types.ObjectId;
  parent: IDoorDashAccount;
  children?: IDoorDashAccount[];
}

// Define the DoorDash account schema
const DoorDashAccountSchema = new Schema<IDoorDashAccount>({
  email: { type: String, required: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  referralLink: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Define the Family schema
const FamilySchema = new Schema<IFamily>({
  parent: { type: DoorDashAccountSchema, required: true },
  children: [{ type: DoorDashAccountSchema }],
});

// Create and export the Family model
const Family = mongoose.model<IFamily>("Family", FamilySchema);

export { Family, IFamily, IDoorDashAccount };
