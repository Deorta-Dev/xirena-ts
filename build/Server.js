"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Kernel_1 = require("./core/Kernel");
let kernel = new Kernel_1.Kernel();
kernel.projectDir = __dirname;
kernel.prepare()
    .then(e => kernel.startApplication())
    .catch(e => {
    console.error("Error of initiation in the Server");
    console.error(e);
});
