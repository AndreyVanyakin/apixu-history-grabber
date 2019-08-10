const Service = require("node-windows").Service;

// Create a new service object
const svc = new Service({
  name: "Apixu-history-grabber",
  description:
    "Grabs 7 days of history for specified locations and adds to Mongo. Checks mongo before grabbing to avoid requesing already existing data",
  script: "./index.js"
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on("install", function() {
  svc.start();
});

svc.install();
