#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { startServer } from "./server.js";
import { getConfigPath } from "./config.js";
import { unlinkSync, existsSync } from "fs";

// Parse arguments and run async command handlers
yargs(hideBin(process.argv))
  .option("reset-password", {
    type: "boolean",
    description: "Reset the server password and regenerate config",
    default: false,
  })
  .command(
    "backend",
    "Start the backend server only",
    (yargs) => {
      return yargs.option("port", {
        alias: "p",
        type: "number",
        description: "Port to run the backend server on",
        default: 0,
      });
    },
    async (argv) => {
      console.log("Starting backend server...");
      const port = await startServer(argv.port);
      console.log(`\nBackend server running on http://localhost:${port}`);
      console.log("Press Ctrl+C to stop\n");
    }
  )
  .command(
    "web",
    "Start backend + web UI",
    (yargs) => {
      return yargs.option("port", {
        alias: "p",
        type: "number",
        description: "Port to run the server on",
        default: 0,
      });
    },
    async (argv) => {
      console.log("Starting backend + web UI...");
      const port = await startServer(argv.port, true);
      console.log(`\nServer running on http://localhost:${port}`);
      console.log("Press Ctrl+C to stop\n");
    }
  )
  .command(
    "desktop",
    "Start the desktop application",
    () => {},
    () => {
      console.log("Desktop application - use the Tauri desktop package instead");
      console.log("Run: cd packages/desktop && bun run dev");
    }
  )
  .command(
    "dev",
    "Start backend + web with HMR",
    (yargs) => {
      return yargs.option("port", {
        alias: "p",
        type: "number",
        description: "Port to run the backend on",
        default: 3000,
      });
    },
    async (argv) => {
      console.log("Starting backend in dev mode...");
      console.log("Web UI with HMR: Start separately with 'cd packages/web && bun run dev'");
      console.log("The web dev server will proxy API requests to this backend.\n");
      const port = await startServer(argv.port, false);
      console.log(`\nBackend API running on http://localhost:${port}`);
      console.log("Press Ctrl+C to stop\n");
    }
  )
  .demandCommand(1, "You must specify a command")
  .help()
  .alias("help", "h")
  .middleware((argv) => {
    // Handle --reset-password flag
    if (argv["reset-password"]) {
      const configPath = getConfigPath();
      if (existsSync(configPath)) {
        unlinkSync(configPath);
        console.log("\n✓ Config file deleted. A new password will be generated on next start.\n");
      } else {
        console.log("\nℹ No config file found. A new password will be generated on start.\n");
      }
    }
  })
  .parse();
