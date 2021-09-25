import {Kernel} from "./core/Kernel";
import path from "path";

let kernel: Kernel = new Kernel();

kernel.projectDir = __dirname;
kernel.configDir = path.join(__dirname, '../', 'config');
kernel.prepare()
    .then(e => kernel.startApplication())
    .catch(e => {
        console.error("Error of initiation in the Server");
        console.error(e);
    });
