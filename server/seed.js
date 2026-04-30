const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Ticket = require("./models/Ticket");
const SystemHealth = require("./models/SystemHealth");

dotenv.config();

const tickets = [
  { code: "IT-1048", requester: "Sarah Khan", category: "Laptop setup", priority: "High", status: "In Progress" },
  { code: "IT-1047", requester: "David Miller", category: "VPN access", priority: "Normal", status: "Open" },
  { code: "IT-1046", requester: "Priya Shah", category: "Email issue", priority: "Critical", status: "In Progress", slaBreached: true },
  { code: "IT-1045", requester: "Marcus Lee", category: "Password reset", priority: "Low", status: "Resolved" },
  { code: "IT-1044", requester: "Emma Wright", category: "Printer support", priority: "Normal", status: "Open" },
  { code: "IT-1043", requester: "Noah Patel", category: "Software install", priority: "High", status: "Resolved" },
  { code: "IT-1042", requester: "Olivia Stone", category: "Account lockout", priority: "Normal", status: "Resolved" },
  { code: "IT-1041", requester: "Liam Davis", category: "Network outage", priority: "Critical", status: "Open", slaBreached: true }
];

const systems = [
  { name: "Network", score: 92, status: "Healthy" },
  { name: "Servers", score: 98, status: "Healthy" },
  { name: "Backups", score: 76, status: "Warning" },
  { name: "Security", score: 88, status: "Healthy" }
];

async function seed() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/acolyte_dashboard";
  await mongoose.connect(mongoUri);
  await Ticket.deleteMany({});
  await SystemHealth.deleteMany({});
  await Ticket.insertMany(tickets);
  await SystemHealth.insertMany(systems);
  await mongoose.disconnect();
  console.log("Seed data inserted");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
