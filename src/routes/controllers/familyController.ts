import express from "express";
import {Family, IChildProfile, IParentProfile} from "../../model/family";
import { v4 as uuidv4 } from "uuid"; // Import v4 from the uuid library

export const familyController = express.Router();

familyController.post("/create", async (req, res): Promise<void> => {
    try {
        // Get the family details from the request body
        const { name, email, password, phone, smsPoolOrderId, referralLink, multiLoginProfileId } = req.body;

        // Create a new parent profile with account credentials
        const parentProfile: IParentProfile = new Family({
            name,
            accountCredentials: { email, password, phone },
            smsPoolOrderId,
            referralLink,
            multiLoginProfileId,
            children: [], // Empty array for children, as we are adding a family without any children
        });

        // Save the parent profile to the database
        await parentProfile.save();

        // Send the response with the newly created family
        res.status(201).json({ message: "Family created successfully", family: parentProfile });
    } catch (error) {
        console.error("Error adding family:", error);
        res.status(500).json({ error: "Failed to add family" });
    }
});

familyController.post("/update/:familyId/children",  async (req, res): Promise<void> => {
    try {
        // Get the family UUID from the request params and the child details from the request body
        const familyId: string = req.params.familyId;
        const { name, email, password, phone, multiLoginProfileId } = req.body;

        // Find the parent profile by the family UUID
        const parentProfile: IParentProfile | null = await Family.findById(familyId);

        if (!parentProfile) {
            // If family not found, return an error
            res.status(404).json({ error: "Family not found" });
            return;
        }

        // Create a new child profile with account credentials
        const childProfile: Partial<IChildProfile> = {
            name,
            multiLoginProfileId,
            accountCredentials: { email, password, phone }
        };

        // Add the child profile to the parent's children array
        parentProfile.children.push(childProfile as IChildProfile);

        // Save the updated parent profile to the database
        await parentProfile.save();

        // Send the response with the newly added child
        res.status(201).json({ message: "Child added to family successfully", child: childProfile });
    } catch (error) {
        console.error("Error adding child to family:", error);
        res.status(500).json({ error: "Failed to add child to family" });
    }
});

familyController.get("/:familyId", async (req, res): Promise<void> => {
    try {
        // Get the family UUID from the request params
        const familyId: string = req.params.familyId;

        // Find the parent profile by the family UUID, including its children
        const family: IParentProfile | null = await Family.findById(familyId).populate("children");

        if (!family) {
            // If family not found, return an error
            res.status(404).json({ error: "Family not found" });
            return;
        }

        // Send the response with the retrieved family
        res.status(200).json({ family });
    } catch (error) {
        console.error("Error getting family:", error);
        res.status(500).json({ error: "Failed to get family" });
    }
});
