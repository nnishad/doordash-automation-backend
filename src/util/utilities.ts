import {INetworkProxy, IProfile, Profile} from "../model/profile";
import { faker } from "@faker-js/faker";
import UserAgent from "user-agents";

export const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Helper function to generate a random time between 00:00:00 and 23:59:59
export const generateRandomTime = () => {
  const hour = Math.floor(Math.random() * 24)
    .toString()
    .padStart(2, "0");
  const minute = Math.floor(Math.random() * 60)
    .toString()
    .padStart(2, "0");
  const second = Math.floor(Math.random() * 60)
    .toString()
    .padStart(2, "0");
  return `${hour}:${minute}:${second}`;
};

// Helper function to generate a random end time based on the start time
export const generateRandomEndTime = (startTime: string) => {
  const [startHour, startMinute, startSecond] = startTime
    .split(":")
    .map(Number);

  const endHour = (startHour + Math.floor(Math.random() * 6) + 1) % 24; // Generate random hour between 1 and 6 more than the start hour, ensuring it stays within 0-23
  const endMinute = Math.floor(Math.random() * 60); // Generate random minute
  const endSecond = Math.floor(Math.random() * 60); // Generate random second

  return `${endHour.toString().padStart(2, "0")}:${endMinute
    .toString()
    .padStart(2, "0")}:${endSecond.toString().padStart(2, "0")}`;
};

export const generateUserAgent = (osType: string, deviceType: string) => {
  const agent = new UserAgent({
    deviceCategory: deviceType,
    platform: osType,
  });
  return agent.random();
};

export const generateProfile = (port: number): IProfile => {
  const profileId = faker.string.uuid();
  const os = faker.helpers.arrayElement(["win", "lin", "mac"]);
  let userAgent;
  switch (os) {
    case "win":
      userAgent = generateUserAgent("Win32", "desktop");
      break;
    case "lin":
      userAgent = generateUserAgent("Linux x86_64", "desktop");
      break;
    case "mac":
      userAgent = generateUserAgent("MacIntel", "desktop");
      break;
    case "android":
      userAgent = generateUserAgent("iPhone", "mobile");
      break;
  }

  // Replace the following lines with your code to retrieve proxy host, username, and password from environment or configuration
  const proxyHost = process.env.PROXY_HOST;
  const proxyUsername = process.env.PROXY_USERNAME;
  const proxyPassword = process.env.PROXY_PASSWORD;

  // Check if any of the required environment variables are missing or null
  if (!proxyHost || !proxyUsername || !proxyPassword) {
    throw new Error("Missing required environment variables for the proxy.");
  }

  // const os = agent.os.family;
  const newProfile: Partial<IProfile> = {
    name: profileId,
    notes: faker.lorem.sentence(),
    navigator: {
      userAgent: userAgent?.toString() + "",
      resolution:
        userAgent?.data.screenWidth + "x" + userAgent?.data.screenHeight,
      language: "en-US",
      platform: userAgent?.data.platform + "",
      doNotTrack: 0,
      hardwareConcurrency: 4,
    },
        network: {
          proxy: {
            type: "HTTP",
            host: proxyHost,
            port: port.toString(), // Convert the port number to string
            username: proxyUsername,
            password: proxyPassword,
          },
        },
    os: os,
  };

  return new Profile(newProfile);
};


// Function to find an available port
export const findAvailablePort = async (): Promise<number | null> => {
  const usedPorts: Set<number> = new Set();

  try {
    // Fetch all profiles from the database
    const profiles: IProfile[] = await Profile.find({}, "network.proxy");

    // Loop through each profile and add the used ports to the set
    profiles.forEach((profile) => {
      const proxy: INetworkProxy | undefined = profile.network?.proxy;
      if (proxy?.port) {
        usedPorts.add(Number(proxy.port));
      }
    });

    // Find the first available port in the rotation proxy range (10200 to 10300)
    for (let port = 10200; port <= 10300; port++) {
      if (!usedPorts.has(port)) {
        return port;
      }
    }

    // If no available port is found
    return null;
  } catch (error) {
    console.error("Error finding available port:", error);
    return null;
  }
};