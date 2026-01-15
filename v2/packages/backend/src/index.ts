#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { startServer } from "./server.js";

const argv = await yargs(hideBin(process.argv))
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
      console.log(`Backend server running on http://localhost:${port}`);
    }
  )
  .command(
    "web",
    "Start the web frontend only",
    () => {},
    () => {
      console.log("Web frontend - not yet implemented");
    }
  )
  .command(
    "desktop",
    "Start the desktop application",
    () => {},
    () => {
      console.log("Desktop application - not yet implemented");
    }
  )
  .command(
    "dev",
    "Start all services in development mode",
    () => {},
    async () => {
      console.log("Starting all services in dev mode...");
      const port = await startServer(0);
      console.log(`Backend server running on http://localhost:${port}`);
      console.log("Web and desktop dev mode - not yet implemented");
    }
  )
  .demandCommand(1, "You must specify a command")
  .help()
  .alias("help", "h")
  .parse();
