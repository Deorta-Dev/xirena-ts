import {Kernel} from "./Kernel";

export abstract class AbstractService{

    private _kernel: Kernel = __kernel;


    abstract build(kernel: Kernel): any;

    abstract instances(services: any): any;

    abstract finalize(instances: any):void;

    get kernel(): Kernel {
        return this._kernel;
    }

    set kernel(value: Kernel) {
        this._kernel = value;
    }
}
