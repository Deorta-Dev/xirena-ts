import {Kernel} from "./core/Kernel";

let kernel: Kernel = new Kernel();

kernel.projectDir = __dirname;
kernel.prepare()
    .then(e => kernel.startApplication())
    .catch(e => {
        console.error("Error of initiation in the Server");
        console.error(e);
    });
