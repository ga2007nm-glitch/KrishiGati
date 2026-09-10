const express = require("express");
const { PrismaClient } = require("@prisma/client");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();
const io = new Server(server, { cors: { origin: true } });

const CROP_PRICES = {
  Wheat: { category: "Grains", mspPerKg: 22.75, marketPerKg: 24.1, unit: "kg", season: "Rabi 2026" },
  Rice: { category: "Grains", mspPerKg: 23.0, marketPerKg: 25.25, unit: "kg", season: "Kharif 2026" },
  Maize: { category: "Grains", mspPerKg: 20.9, marketPerKg: 22.4, unit: "kg", season: "Kharif 2026" },
  Millets: { category: "Grains", mspPerKg: 31.5, marketPerKg: 34.0, unit: "kg", season: "Kharif 2026" },
  Tomato: { category: "Vegetables", mspPerKg: 18.0, marketPerKg: 24.5, unit: "kg", season: "All year" },
  Potato: { category: "Vegetables", mspPerKg: 16.5, marketPerKg: 21.0, unit: "kg", season: "Rabi 2026" },
  Onion: { category: "Vegetables", mspPerKg: 19.0, marketPerKg: 28.0, unit: "kg", season: "Rabi 2026" },
  Cabbage: { category: "Vegetables", mspPerKg: 14.0, marketPerKg: 20.5, unit: "kg", season: "All year" },
  Carrot: { category: "Vegetables", mspPerKg: 26.0, marketPerKg: 34.0, unit: "kg", season: "Rabi 2026" },
  Okra: { category: "Vegetables", mspPerKg: 32.0, marketPerKg: 42.0, unit: "kg", season: "Kharif 2026" },
  Mango: { category: "Fruits", mspPerKg: 48.0, marketPerKg: 72.0, unit: "kg", season: "Summer 2026" },
  Banana: { category: "Fruits", mspPerKg: 28.0, marketPerKg: 38.0, unit: "kg", season: "All year" },
  Apple: { category: "Fruits", mspPerKg: 85.0, marketPerKg: 112.0, unit: "kg", season: "Autumn 2026" },
  Orange: { category: "Fruits", mspPerKg: 42.0, marketPerKg: 58.0, unit: "kg", season: "Winter 2026" },
  Guava: { category: "Fruits", mspPerKg: 36.0, marketPerKg: 49.0, unit: "kg", season: "All year" },
  Pomegranate: { category: "Fruits", mspPerKg: 92.0, marketPerKg: 128.0, unit: "kg", season: "Autumn 2026" },
  Chickpea: { category: "Pulses", mspPerKg: 56.5, marketPerKg: 63.0, unit: "kg", season: "Rabi 2026" },
  Lentil: { category: "Pulses", mspPerKg: 64.25, marketPerKg: 71.0, unit: "kg", season: "Rabi 2026" },
  Tur: { category: "Pulses", mspPerKg: 75.5, marketPerKg: 84.0, unit: "kg", season: "Kharif 2026" },
  Groundnut: { category: "Oilseeds", mspPerKg: 67.85, marketPerKg: 75.0, unit: "kg", season: "Kharif 2026" },
  Soybean: { category: "Oilseeds", mspPerKg: 48.9, marketPerKg: 55.0, unit: "kg", season: "Kharif 2026" },
  Sunflower: { category: "Oilseeds", mspPerKg: 72.1, marketPerKg: 81.0, unit: "kg", season: "Kharif 2026" },
};

async function sendFarmerSms(phone, message) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    return { channel: "SMS", status: "SIMULATED", recipientLast4: phone.slice(-4), message, simulated: true };
  }

  const body = new URLSearchParams({ To: `+91${phone}`, From: TWILIO_FROM_NUMBER, Body: message });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error("SMS provider rejected the message. Check Twilio settings.");
  const result = await response.json();
  return { channel: "SMS", status: "SENT", recipientLast4: phone.slice(-4), providerMessageId: result.sid, message, simulated: false };
}

app.use(cors({ origin: true }));
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    res.json({ success: true, service: "KrishiGati API", database: "connected" });
  } catch (error) {
    res.status(503).json({ success: false, service: "KrishiGati API", database: "unavailable", error: error.message });
  }
});

app.get("/api/mandis/recommend", async (req, res) => {
  try {
    const userLat = parseNumber(req.query.lat, "Latitude");
    const userLng = parseNumber(req.query.lng, "Longitude");
    const quantity = Math.max(1, parseNumber(req.query.quantityKg || 500, "Quantity"));
    const mandis = await prisma.mandiCenter.findMany({ include: { tokens: { where: { createdAt: { gte: getStartOfDay() } } } } });

    const recommendations = mandis.map((mandi) => {
      const distanceKm = calculateHaversineDistance(userLat, userLng, mandi.latitude, mandi.longitude);
      const bookedKg = mandi.tokens.reduce((sum, token) => sum + token.quantityKg, 0);
      const freeKg = Math.max(0, mandi.dailyCapacityKg - bookedKg);
      const utilization = Math.min(100, Math.round((bookedKg / mandi.dailyCapacityKg) * 100));
      const queueWaitMinutes = mandi.tokens.length * 15;
      const unloadingMinutes = Math.ceil(quantity / 250);
      const predictedWaitMinutes = Math.round(distanceKm * 3 + queueWaitMinutes + unloadingMinutes);
      const score = Math.max(0, Math.round(100 - distanceKm * 4 - utilization * 0.65 - queueWaitMinutes * 0.2));
      return {
        id: mandi.id,
        name: mandi.name,
        district: mandi.district,
        distanceKm: Number(distanceKm.toFixed(1)),
        utilizationPercentage: utilization,
        freeCapacityKg: freeKg,
        freeCapacityPercentage: Math.round((freeKg / mandi.dailyCapacityKg) * 100),
        queueLength: mandi.tokens.length,
        predictedWaitMinutes,
        recommendedArrival: new Date(Date.now() + predictedWaitMinutes * 60 * 1000).toISOString(),
        score,
        reason: utilization >= 90 ? "High demand. This alternative center has more room." : queueWaitMinutes === 0 ? "Lowest current queue pressure." : "Best balance of distance and queue time.",
      };
    }).sort((a, b) => b.score - a.score);

    res.json({ success: true, quantityKg: quantity, recommendation: recommendations[0], alternatives: recommendations.slice(1) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
// Helper function: Calculate distance using Haversine Formula
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function getStartOfDay() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}

function parseNumber(value, field) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid number.`);
  return parsed;
}

async function getQueue(mandiId) {
  const tokens = await prisma.token.findMany({
    where: { mandiId, createdAt: { gte: getStartOfDay() }, status: { not: "CANCELLED" } },
    orderBy: { createdAt: "asc" },
  });
  return tokens.map((token, index) => ({
    tokenNumber: token.tokenNumber,
    status: token.status,
    assignedCounter: token.assignedCounter,
    estimatedWaitMinutes: index * 15,
    tokenId: token.id,
  }));
}

// -------------------------------------------------------------------
// API 1: Get Nearest Mandis with Real-Time Capacity & Distance
// -------------------------------------------------------------------
app.get("/api/mandis/nearest", async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: "Latitude and Longitude are required." });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    const mandis = await prisma.mandiCenter.findMany({
      include: {
        tokens: {
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)), // Tokens booked today
            },
          },
        },
      },
    });

    const formattedMandis = mandis.map((mandi) => {
      const distance = calculateHaversineDistance(
        userLat,
        userLng,
        mandi.latitude,
        mandi.longitude
      );

      const bookedKgToday = mandi.tokens.reduce((acc, t) => acc + t.quantityKg, 0);
      const remainingCapacity = mandi.dailyCapacityKg - bookedKgToday;
      const capacityPercentage = Math.max(0, (remainingCapacity / mandi.dailyCapacityKg) * 100);
      const utilizationPercentage = Math.min(100, Math.round(100 - capacityPercentage));

      let congestionStatus = "LOW WAIT";
      if (capacityPercentage < 20) congestionStatus = "HIGH WAIT";
      else if (capacityPercentage < 50) congestionStatus = "MED WAIT";

      return {
        id: mandi.id,
        name: mandi.name,
        city: mandi.city,
        state: mandi.state,
        district: mandi.district,
        distanceKm: parseFloat(distance.toFixed(1)),
        congestionStatus,
        freeCapacityPercentage: Math.round(capacityPercentage),
        utilizationPercentage,
        smartRedirect: utilizationPercentage >= 90,
        estimatedWaitMinutes: Math.round((utilizationPercentage / 100) * 120),
        latitude: mandi.latitude,
        longitude: mandi.longitude,
      };
    });

    // Sort by nearest distance
    formattedMandis.sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({ success: true, mandis: formattedMandis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------------
// API 2: Book Procurement Slot (Dynamic Capacity Check)
// -------------------------------------------------------------------
app.post("/api/tokens/book", async (req, res) => {
  try {
    const { farmerId, mandiId, cropType, quantityKg, slotTime } = req.body;
    const quantity = parseNumber(quantityKg, "Quantity");
    if (quantity <= 0 || !cropType || !slotTime) {
      return res.status(400).json({ error: "Crop, quantity, and slot time are required." });
    }

    const farmer = await prisma.user.findUnique({ where: { id: farmerId } });
    if (!farmer) return res.status(404).json({ error: "Farmer not found." });

    const farmerBookingsToday = await prisma.token.count({ where: { farmerId, createdAt: { gte: getStartOfDay() }, status: { not: "CANCELLED" } } });
    if (farmerBookingsToday >= 3) return res.status(429).json({ error: "Daily booking limit reached. This keeps the queue fair for all farmers." });
    const mandi = await prisma.mandiCenter.findUnique({
      where: { id: mandiId },
      include: {
        tokens: {
          where: {
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        },
      },
    });

    if (!mandi) return res.status(404).json({ error: "Mandi not found." });

    const currentBookedKg = mandi.tokens.reduce((sum, t) => sum + t.quantityKg, 0);

    // Validate Daily Storage Capacity Limit
    if (currentBookedKg + quantity > mandi.dailyCapacityKg) {
      return res.status(400).json({
        error: "Capacity full for this Mandi today. Please select another center.",
      });
    }

    // Generate Unique Token Code (e.g., #A-108)
    const tokenCount = await prisma.token.count();
    const tokenNumber = `#A-${100 + tokenCount + 1}`;

    const token = await prisma.token.create({
      data: {
        tokenNumber,
        farmerId,
        mandiId,
        cropType,
        quantityKg: quantity,
        slotTime: new Date(slotTime),
        assignedCounter: Math.floor(Math.random() * 4) + 1, // Assigns counter 1-4
      },
    });

    io.to(`mandi:${mandiId}`).emit("queue:updated", { mandiId, queue: await getQueue(mandiId) });
    res.status(201).json({ success: true, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/low-tech/sms", async (req, res) => {
  const phone = String(req.body.phone || "").replace(/\D/g, "");
  if (!/^\d{10}$/.test(phone)) return res.status(400).json({ error: "Enter a valid 10-digit phone number." });
  res.json({ success: true, channel: "SMS", phoneLast4: phone.slice(-4), message: "KrishiGati SMS demo: Reply BOOK <mandi-code> <quantity> to reserve a procurement slot.", simulated: true });
});

app.post("/api/low-tech/ivr", async (req, res) => {
  const phone = String(req.body.phone || "").replace(/\D/g, "");
  if (!/^\d{10}$/.test(phone)) return res.status(400).json({ error: "Enter a valid 10-digit phone number." });
  res.json({ success: true, channel: "IVR", phoneLast4: phone.slice(-4), menu: ["Press 1 to hear nearby mandis", "Press 2 to book a slot", "Press 3 to hear your token status"], simulated: true });
});
app.post("/api/tokens/:tokenId/activate", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const token = await prisma.token.findUnique({ where: { id: req.params.tokenId }, include: { mandi: true } });
    if (!token) return res.status(404).json({ error: "Token not found." });
    const distanceKm = calculateHaversineDistance(parseNumber(lat, "Latitude"), parseNumber(lng, "Longitude"), token.mandi.latitude, token.mandi.longitude);
    if (distanceKm > 2) return res.status(400).json({ error: "Token activates within 2 km of the mandi.", distanceKm: Number(distanceKm.toFixed(2)) });
    const updatedToken = await prisma.token.update({ where: { id: token.id }, data: { status: "GATE_ENTRY" } });
    io.to(`mandi:${token.mandiId}`).emit("queue:updated", { mandiId: token.mandiId, queue: await getQueue(token.mandiId) });
    res.json({ success: true, distanceKm: Number(distanceKm.toFixed(2)), token: updatedToken });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/procurement/grade", async (req, res) => {
  try {
    const { tokenId, grade, moisturePercent, notes } = req.body;
    if (!tokenId || !grade) return res.status(400).json({ error: "Token and grade are required." });
    const cropGrade = await prisma.cropGrade.upsert({
      where: { tokenId },
      update: { grade, moisturePercent, notes },
      create: { tokenId, grade, moisturePercent, notes },
    });
    const token = await prisma.token.update({ where: { id: tokenId }, data: { status: "QUALITY_VERIFIED" } });
    res.json({ success: true, cropGrade, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// -------------------------------------------------------------------
// API 3: IoT Weighbridge & DBT Payout Update
// -------------------------------------------------------------------
app.post("/api/procurement/weigh", async (req, res) => {
  try {
    const { tokenId, netWeightKg, mspPerKg } = req.body;
    const weight = parseNumber(netWeightKg, "Net weight");
    const rate = parseNumber(mspPerKg, "MSP rate");
    const totalPayoutAmount = weight * rate;

    const updatedToken = await prisma.token.update({
      where: { id: tokenId },
      data: {
        netWeightKg: weight,
        totalPayoutAmount,
        status: "WEIGHED",
      },
    });

    res.json({
      success: true,
      message: "Weight recorded successfully via IoT payload.",
      token: updatedToken,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/procurement/payout", async (req, res) => {
  try {
    const { tokenId, amount, transactionReference } = req.body;
    const tokenRecord = await prisma.token.findUnique({ where: { id: tokenId }, include: { farmer: true } });
    if (!tokenRecord) return res.status(404).json({ error: "Token not found." });
    const payoutAmount = parseNumber(amount, "Amount");
    const payout = await prisma.payoutTransaction.upsert({
      where: { tokenId },
      update: { amount: payoutAmount, status: "DISPATCHED", transactionReference },
      create: { tokenId, amount: payoutAmount, status: "DISPATCHED", transactionReference },
    });
    const token = await prisma.token.update({ where: { id: tokenId }, data: { status: "PAYMENT_DISPATCHED" } });
    const sms = await sendFarmerSms(tokenRecord.farmer.phone, `KrishiGati: DBT payment of Rs.${payoutAmount.toFixed(2)} for ${tokenRecord.cropType} token ${tokenRecord.tokenNumber} has been dispatched. Ref: ${transactionReference || payout.id.slice(-8)}.`);
    res.json({ success: true, payout, token, sms });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

io.on("connection", (socket) => {
  socket.on("mandi:join", (mandiId) => socket.join(`mandi:${mandiId}`));
});

// Start Express Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`KrishiGati Engine active on port ${PORT}`);
});

app.get("/api/stats", async (_req, res) => {
  try {
    const [mandiCount, tokens] = await Promise.all([
      prisma.mandiCenter.count(),
      prisma.token.findMany({ where: { createdAt: { gte: getStartOfDay() } } }),
    ]);
    const grainsProcured = tokens.reduce((sum, token) => sum + (token.netWeightKg || 0), 0);
    res.json({ success: true, stats: { grainsProcuredKg: grainsProcured, averageWaitMinutes: 25, activeMandis: mandiCount } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/mandis/:mandiId/queue", async (req, res) => {
  try {
    res.json({ success: true, queue: await getQueue(req.params.mandiId) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/farmers/demo", async (_req, res) => {
  try {
    const farmer = await prisma.user.findUnique({ where: { phone: "9999999999" }, select: { id: true, name: true } });
    if (!farmer) return res.status(404).json({ error: "Demo farmer is not seeded." });
    res.json({ success: true, farmer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/farmers/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const phone = String(req.body.phone || "").replace(/\D/g, "");
    const role = req.body.role === "OFFICIAL" ? "OFFICIAL" : "FARMER";
    const officialId = String(req.body.officialId || "").trim().toUpperCase();
    const aadhaarNo = String(req.body.aadhaarNo || "").replace(/\s/g, "");
    const panNo = String(req.body.panNo || "").trim().toUpperCase();

    if (name.length < 2) return res.status(400).json({ error: "Please enter your full name." });
    if (!/^\d{10}$/.test(phone)) return res.status(400).json({ error: "Enter a valid 10-digit phone number." });
    if (role === "FARMER" && !/^\d{12}$/.test(aadhaarNo)) return res.status(400).json({ error: "Enter a valid 12-digit Aadhaar number." });
    if (role === "FARMER" && !/^[A-Z]{5}\d{4}[A-Z]$/.test(panNo)) return res.status(400).json({ error: "Enter a valid PAN number." });
    if (role === "OFFICIAL" && officialId.length < 4) return res.status(400).json({ error: "Enter your procurement employee ID." });

    let farmer = await prisma.user.findUnique({ where: { phone } });
    if (farmer) {
      farmer = await prisma.user.update({ where: { id: farmer.id }, data: { name, role, aadhaarNo: role === "FARMER" ? aadhaarNo : null, panNo: role === "FARMER" ? panNo : null, officialId: role === "OFFICIAL" ? officialId : null } });
    } else {
      farmer = await prisma.user.create({ data: { name, phone, role, aadhaarNo: role === "FARMER" ? aadhaarNo : undefined, panNo: role === "FARMER" ? panNo : undefined, officialId: role === "OFFICIAL" ? officialId : undefined } });
    }

    const sms = await sendFarmerSms(phone, `KrishiGati: Welcome ${name}. Your farmer profile is ready. You can now discover a mandi and book a smart procurement slot.`);
    res.status(200).json({ success: true, farmer: { id: farmer.id, name: farmer.name, phone: farmer.phone, role: farmer.role }, sms });
  } catch (error) {
    if (error.code === "P2002") return res.status(409).json({ error: "These identity details are already registered." });
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/mandis/:mandiId/operations", async (req, res) => {
  try {
    const queue = await getQueue(req.params.mandiId);
    const counters = [1, 2, 3, 4].map((counter) => ({ counter, activeToken: queue.find((item) => item.assignedCounter === counter)?.tokenNumber || null, status: queue.some((item) => item.assignedCounter === counter) ? "ACTIVE" : "READY" }));
    res.json({ success: true, queue, counters, fairness: { dailyLimit: 3, auditReady: true }, offlineSync: { pendingActions: 0, lastSync: new Date().toISOString() } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/crops/prices", (_req, res) => {
  res.json({ success: true, source: "KrishiGati procurement rate board", updatedAt: new Date().toISOString(), crops: CROP_PRICES });
});

app.get("/api/tokens/:tokenId", async (req, res) => {
  try {
    const token = await prisma.token.findUnique({ where: { id: req.params.tokenId }, include: { cropGrade: true, payout: true, mandi: true } });
    if (!token) return res.status(404).json({ error: "Token not found." });
    const price = CROP_PRICES[token.cropType] || null;
    res.json({ success: true, token, pricing: price, estimatedPayout: price ? token.quantityKg * price.mspPerKg : null });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/mandis/all", async (req, res) => {
  try {
    const userLat = Number(req.query.lat || 20.5937);
    const userLng = Number(req.query.lng || 78.9629);
    const state = req.query.state ? String(req.query.state) : undefined;
    const city = req.query.city ? String(req.query.city) : undefined;
    const mandis = await prisma.mandiCenter.findMany({ where: { ...(state ? { state } : {}), ...(city ? { city } : {}) }, include: { tokens: { where: { createdAt: { gte: getStartOfDay() } } } } });
    const results = mandis.map((mandi) => {
      const bookedKg = mandi.tokens.reduce((sum, token) => sum + token.quantityKg, 0);
      const freeCapacityPercentage = Math.max(0, Math.round(((mandi.dailyCapacityKg - bookedKg) / mandi.dailyCapacityKg) * 100));
      const utilizationPercentage = Math.min(100, 100 - freeCapacityPercentage);
      const distanceKm = calculateHaversineDistance(userLat, userLng, mandi.latitude, mandi.longitude);
      return { id: mandi.id, name: mandi.name, city: mandi.city, state: mandi.state, district: mandi.district, latitude: mandi.latitude, longitude: mandi.longitude, distanceKm: Number(distanceKm.toFixed(1)), freeCapacityPercentage, utilizationPercentage, smartRedirect: utilizationPercentage >= 90, estimatedWaitMinutes: mandi.tokens.length * 15, congestionStatus: freeCapacityPercentage < 20 ? "HIGH WAIT" : freeCapacityPercentage < 50 ? "MED WAIT" : "LOW WAIT" };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
    res.json({ success: true, mandis: results, states: [...new Set(mandis.map((mandi) => mandi.state))].sort(), cities: [...new Set(mandis.map((mandi) => mandi.city))].sort() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});