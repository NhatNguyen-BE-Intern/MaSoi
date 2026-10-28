const fs = require("fs");
const path = require("path");

const backendEnv = path.resolve(__dirname, "../../.env");
const rootEnv = path.resolve(__dirname, "../../../.env");

if (fs.existsSync(backendEnv)) {
  require("dotenv").config({ path: backendEnv });
} else if (fs.existsSync(rootEnv)) {
  require("dotenv").config({ path: rootEnv });
} else {
  require("dotenv").config();
}

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
};
