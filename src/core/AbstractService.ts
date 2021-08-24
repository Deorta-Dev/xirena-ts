import {Kernel} from "./Kernel";

export abstract class AbstractService{

    abstract build(kernel: Kernel): void;

    abstract instance(services: any): any;

    abstract finalize():void;

}