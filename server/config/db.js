const mongoose = require("mongoose");
const dns = require("dns");

// Configure DNS resolver dynamically to bypass virtual network adapters (WSL/Hyper-V)
// which often cause querySrv ECONNREFUSED/timeouts on Windows hosts.
const configureDNS = () => {
  try {
    const currentServers = dns.getServers();
    
    // Filter out private virtual subnet DNS servers (WSL/Hyper-V typically use 172.16.x.x to 172.31.x.x)
    const filteredServers = currentServers.filter(server => {
      if (server.startsWith("172.")) {
        const parts = server.split(".");
        const secondOctet = parseInt(parts[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31) {
          return false;
        }
      }
      return true;
    });

    // Append public DNS resolvers as fallback
    const robustServers = [
      ...filteredServers,
      "1.1.1.1",
      "8.8.8.8",
      "2606:4700:4700::1111",
      "2001:4860:4860::8888"
    ];

    // Set unique elements to avoid duplicates
    const uniqueServers = Array.from(new Set(robustServers));
    dns.setServers(uniqueServers);
  } catch (error) {
    console.warn("⚠️ Failed to configure DNS overrides:", error.message);
  }
};

const connectDB = async () => {
  configureDNS();
  
  const maxRetries = 5;
  let attempt = 1;

  while (attempt <= maxRetries) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${attempt}/${maxRetries} failed:`, error.message);
      if (attempt === maxRetries) {
        console.error("❌ Critical: Max connection attempts reached. Exiting...");
        process.exit(1);
      }
      attempt++;
      console.log("🔄 Retrying in 5 seconds...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

module.exports = connectDB;
