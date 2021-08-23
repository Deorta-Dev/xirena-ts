import { performance } from "perf_hooks";
const measure = (
    target: Object,
    propertyKey: string,
    descriptor: PropertyDescriptor
) => {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: Array<any>) {
        const start = performance.now();
        const result = originalMethod.apply(this, args);
        const finish = performance.now();
        console.log(`Execution time: ${finish - start} milliseconds`);
        return result;
    };

    return descriptor;
};

import {Kernel} from "./core/Kernel";

let kernel: Kernel = new Kernel();

kernel.startServer();
