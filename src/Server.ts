import {Kernel} from "./core/Kernel";

let kernel: Kernel = new Kernel();

kernel.projectDir = __dirname;
kernel.prepare()
    .then(e => kernel.startServer())
    .catch(e => {
        console.error("Error of initiation in the Server");
        console.error(e);
    });
