import express from "express";
import dotenv from "dotenv";
import ApiClient from "../../util/apiClient";
import logger from "../../util/logger";
import {findAvailablePort, generateProfile} from "../../util/utilities";
import {IProfile, Profile} from "../../model/profile";


dotenv.config();

const apiClientv2 = new ApiClient(process.env.MULTILOGIN_APIv2 ?? "");
const apiClientv1 = new ApiClient(process.env.MULTILOGIN_APIv1 ?? "");

export const profileController = express.Router();

profileController.post("/create",
    async (req, res) => {
    try {
        const availablePort = await findAvailablePort();
        if (availablePort === null) {
            return res.status(500).json({ error: "No available proxy port found" });
        }
        let newProfile:IProfile;
        try {
            newProfile = generateProfile(availablePort);
        } catch (error) {
            return res.status(500).json({ error: (error as Error).message });
        }
        await apiClientv2
            .post("/profile", newProfile)
            .then(async (response: any) => {
                logger.info(response.uuid);
                newProfile.uuid = response.uuid;
            })
            .catch((error) => {
                logger.error(error);
            });

        // Save the new profile to the database
        await newProfile.save();

        res.status(201).json({ message: "Profile created successfully", profile: newProfile });
    } catch (error) {
        console.error("Error creating profile:", error);
        res.status(500).json({ error: "Failed to create profile" });
    }
});

profileController.get("/:uuid", async (req, res) => {
    const { uuid } = req.params;

    try {
        const profile = await  Profile.findOne({ uuid }).exec();
        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        res.json({ profile });
    } catch (error) {
        console.error("Error getting profile by UUID:", error);
        res.status(500).json({ error: "Failed to get profile" });
    }
});