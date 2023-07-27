import mongoose, { Schema, Document } from "mongoose";
import { v4 as uuidv4 } from "uuid"; // Import v4 from the uuid library

interface IAccountCredentials {
  email: string;
  password: string;
  phone: string;
}

interface IChildProfile extends Document {
  // uuid: string;
  name: string;
  multiLoginProfileId: string;
  accountCredentials: IAccountCredentials;
}

interface IParentProfile extends Document {
  // uuid: string;
  name: string;
  accountCredentials: IAccountCredentials;
  smsPoolOrderId: string;
  referralLink: string;
  multiLoginProfileId: string;
  children: IChildProfile[];
}

const accountCredentialsSchema = new Schema<IAccountCredentials>({
  email: { type: String, required: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
});

const childProfileSchema = new Schema<IChildProfile>({
  // uuid: { type: String, default: uuidv4, unique: true },
  name: { type: String, required: true },
  accountCredentials: { type: accountCredentialsSchema, required: true },
  multiLoginProfileId: { type: String , required: true},
});

const parentProfileSchema = new Schema<IParentProfile>({
  // uuid: { type: String, default: uuidv4, unique: true },
  name: { type: String, required: true },
  accountCredentials: { type: accountCredentialsSchema, required: true },
  smsPoolOrderId: { type: String, required: true },
  referralLink: { type: String, required: true },
  multiLoginProfileId: { type: String , required: true},
  children: { type: [childProfileSchema], default: [] },
});

const Family = mongoose.model<IParentProfile>("Family", parentProfileSchema);

export { Family, IParentProfile, IChildProfile };
