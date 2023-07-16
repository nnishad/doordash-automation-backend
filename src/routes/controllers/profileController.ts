import express from "express";
import dotenv from "dotenv";
import ApiClient from "../../util/apiClient";
import logger from "../../util/logger";
import Profile, {IProfile} from "../../model/profile";
import Proxy, {IProxyDetails} from "../../model/proxy";
import {generateProfile} from "../../util/utilities";
import {IDoorDashAccount, IFamily} from "../../model/family";
import profile from "../../model/profile";

dotenv.config();

const apiClientv2 = new ApiClient(process.env.MULTILOGIN_APIv2 ?? "");
const apiClientv1 = new ApiClient(process.env.MULTILOGIN_APIv1 ?? "");

export const profileController = express.Router();


profileController.get("/getAll",async (req, res)=>{
    try {
        // Fetch all profiles from the database
        const profiles: IProfile[] = await Profile.find();

        res.status(200).json(profiles);
    } catch (error) {
        console.error("Error retrieving profiles", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

profileController.post("/generate/:count", async (req, res) => {
    try {
        const count = req.params.count;

        if (parseInt(count) <= 0) {
            return res.status(400).json({ message: "Invalid count value" });
        }

        const profiles: IProfile[] = [];

        for (let i = 0; i < parseInt(count); i++) {
            const proxyDocument = await Proxy.findOne({ isUsed: false });
            if (proxyDocument !== null) {
                const proxy = proxyDocument.toObject() as IProxyDetails;
                const newProfile = generateProfile(proxy);
                await apiClientv2
                    .post("/profile", newProfile)
                    .then(async (response: any) => {
                        logger.info(response.uuid);
                        newProfile.uuid = response.uuid;
                        profiles.push(newProfile);
                        proxyDocument.isUsed = true;
                        await proxyDocument.save();
                    })
                    .catch((error) => {
                        logger.error(error);
                    });
            } else {
                // Save the generated profiles to the database
                await Profile.insertMany(profiles);
                return res.status(200).json({
                    message: `Profiles created: ${profiles.length}`,
                    error: "No new proxy found to create profile",
                });
            }
        }

        // Save the generated profiles to the database
        await Profile.insertMany(profiles);

        res.json({ message: `${count} profiles generated successfully` });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

profileController.get("/:uuid", async (req, res) => {
    const profileId = req.params.uuid;

    try {
        const profile = await Profile.findOne({ uuid: profileId });

        if (!profile) {
            return res.status(404).json({ error: "Profile not found." });
        }

        res.json(profile);
    } catch (error) {
        console.error("An error occurred while fetching the profile:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

profileController.post("/:uuid/family/parent", async (req,res): Promise<void> => {
    try {
        const { uuid } = req.params;
        const { parentEmail, parentPassword, parentPhone, parentAddress } = req.body;

        // Find the profile document by UUID
        const profile: IProfile | null = await Profile.findOne({ uuid });

        if (!profile) {
            res.status(404).json({ error: "Profile not found" });
            return;
        }

        if (profile.family) {
            res.status(400).json({ error: "Family already exists for this profile" });
            return;
        }

        const existingParent = (profile.family as IFamily | undefined | null)?.parent;
        if (existingParent) {
            res.status(400).json({ error: "Parent already exists in the family" });
            return;
        }

        // Create the parent DoorDash account
        const parent: Partial<IDoorDashAccount> = {
            email: parentEmail,
            password: parentPassword,
            phone: parentPhone,
            address: parentAddress,
        };

        // Create the family object with only the parent
        const family: Partial<IFamily> = {
            parent: parent as IDoorDashAccount,
            children: [],
        };

        // Update the profile document with the new family
        profile.family = (family as IFamily);
        await profile.save();

        res.status(200).json(profile);
    } catch (error) {
        console.error("Error adding family with parent", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

profileController.post("/:uuid/family/:parentId/children", async (req, res): Promise<void> => {
    try {
        const { uuid, parentId } = req.params;
        const child = req.body;

        // Find the profile document by UUID
        const profile: IProfile | null = await Profile.findOne({ uuid });

        if (!profile) {
            res.status(404).json({ error: "Profile not found" });
            return;
        }

        if (!profile.family) {
            res.status(400).json({ error: "Family does not exist for this profile" });
            return;
        }

        // if (profile.family.parent?._id.toString() !== parentId) {
        //     res.status(404).json({ error: "Parent not found in the family" });
        //     return;
        // }

        // Initialize the children array if it's undefined
        if (!profile.family.children) {
            profile.family.children = [];
        }

        // Add the new child to the existing children array
        profile.family.children.push(child);

        // Update the profile document with the modified family
        await profile.save();

        res.status(200).json(profile);
    } catch (error) {
        console.error("Error adding child to profile", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

profileController.get("/family/no-family", async (req, res) => {
    try {
        // Fetch all profiles from the database where the family property is null or does not exist
        const profiles: IProfile[] = await Profile.find({ $or: [{ family: null }, { family: { $exists: false } }] });

        res.status(200).json(profiles);
    } catch (error) {
        console.error("Error retrieving profiles with no family", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

profileController.get("/family/parent-no-child", async (req, res) =>{
    try {
        const profiles: IProfile[] = await Profile.find({
            $and: [
                { family: { $exists: true, $ne: null } },
                { "family.parent": { $exists: true } },
                { "family.children": { $size: 0 } },
            ],
        });

        res.status(200).json(profiles);
    } catch (error) {
        console.error("Error retrieving profiles with parent and no child", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})
