import {Kernel} from "./Kernel";

export class AbstractController{


    private _kernel: Kernel;
    private _handlesAttrs: any;

    constructor(kernel: Kernel) {
        this._kernel = kernel;
    }

    /**
     * @param kernel {Kernel}
     */
    set kernel(kernel: Kernel) {
        this._kernel = kernel;
    }

    get kernel() {
        return this._kernel;
    }

    consoleLog(str: string, color: string = '', background: string = '') {
        /*let fgColor = this._fgColor[color] || "\x1b[0m";
        let bgColor = this._bgColor[background] || "\x1b[0m";*/
        console.log(str);
    }

    handleRequest($request: any, object: any) {
        let dataRequest = $request.body;
        function recursion(data: any) {
            if (typeof data === 'object') {
                if (Array.isArray(data))
                    data.forEach((d, i) => data[i] = recursion(d));
                else if (data instanceof Date) {
                } else
                    for (let key in data) {
                        //if (key === '$oid') data = new ObjectID(data.$oid);
                        if (key === '$date') data = new Date(data.$date);
                        else data[key] = recursion(data[key]);
                    }
            }
            return data;
        }

        if (Array.isArray(this.handlesAttrs))
            for (let key in dataRequest) {
                if (this.handlesAttrs.includes(key))
                    object[key] = recursion(dataRequest[key]);
            }
        return object;
    }


    get handlesAttrs(): any {
        return this._handlesAttrs;
    }

    set handlesAttrs(value: any) {
        this._handlesAttrs = value;
    }
}