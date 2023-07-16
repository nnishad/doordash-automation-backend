import express from "express";
import Proxy from "../../model/proxy";
import dotenv from "dotenv";

dotenv.config();

export const proxyController = express.Router();

// Fetch the last inserted proxy to set the port counter
const setPortCounter = async () => {
  let portCounter: number; // Port counter variable
  try {
    const lastProxy = await Proxy.findOne().sort({ _id: -1 }).limit(1);

    if (lastProxy) {
      const lastPort = parseInt(lastProxy.port);
      portCounter = isNaN(lastPort) ? 10200 : lastPort + 1;
    } else {
      portCounter = 10200;
    }
  } catch (error) {
    console.error('Error setting port counter:', error);
    portCounter = 10200; // Set default port counter value
  }
  return portCounter
};

/**
 * @swagger
 * /proxy:
 *   post:
 *     summary: Add a new proxy
 *     tags: [Proxy]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               host:
 *                 type: string
 *               port:
 *                 type: integer
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Proxy added successfully
 *       409:
 *         description: Proxy already exists
 *       500:
 *         description: Internal server error
 */
proxyController.post('/api/proxy/generate', async (req, res) => {
  try {
    const { count } = req.body; // Number of proxies to generate

    const proxies = [];
    let portCounter = await setPortCounter()
    for (let i = 0; i < count; i++) {
      // Increment the port counter
      const port = portCounter.toString();
      portCounter++;

      // Create a new proxy object
      const proxy = new Proxy({
        host: process.env.PROXY_HOST,
        port,
        username: process.env.PROXY_USERNAME,
        password: process.env.PROXY_PASSWORD,
        isUsed: false,
      });

      proxies.push(proxy);
    }

    // Save the proxy details to the database
    const createdProxies = await Proxy.insertMany(proxies);

    res.status(201).json(createdProxies);
  } catch (error) {
    console.error('Error generating proxies:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
/**
 * @swagger
 * /proxy:
 *   get:
 *     summary: Get all proxies
 *     tags: [Proxy]
 *     responses:
 *       200:
 *         description: Proxies retrieved successfully
 *       500:
 *         description: Internal server error
 */
proxyController.get("/", async (req, res) => {
  try {
    const proxies = await Proxy.find();
    return res.status(200).json(proxies);
  } catch (error) {
    console.error("Error getting proxies:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /proxy/{host}/{port}/used:
 *   get:
 *     summary: Check if a proxy is used
 *     tags: [Proxy]
 *     parameters:
 *       - in: path
 *         name: host
 *         required: true
 *         schema:
 *           type: string
 *         description: The proxy host
 *       - in: path
 *         name: port
 *         required: true
 *         schema:
 *           type: integer
 *         description: The proxy port
 *     responses:
 *       200:
 *         description: Proxy usage checked successfully
 *       404:
 *         description: Proxy not found
 *       500:
 *         description: Internal server error
 */
proxyController.get("/:host/:port/used", async (req, res) => {
  const { host, port } = req.params;

  try {
    const proxy = await Proxy.findOne({ host, port });
    if (!proxy) {
      return res.status(404).json({ message: "Proxy not found" });
    }

    const isUsed = proxy.isUsed;

    return res.status(200).json({ isUsed });
  } catch (error) {
    console.error("Error checking proxy usage:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /proxy/unused:
 *   get:
 *     summary: Get an unused proxy
 *     tags: [Proxy]
 *     responses:
 *       200:
 *         description: Proxy retrieved successfully
 *       404:
 *         description: No unused proxy found
 *       500:
 *         description: Internal server error
 */
proxyController.get("/unused", async (req, res) => {
  try {
    const proxy = await Proxy.findOne({ isUsed: false });

    if (proxy) {
      res.status(200).json(proxy);
    } else {
      res.status(404).json({ message: "No unused proxy found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

