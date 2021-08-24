"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractController = void 0;
class AbstractController {
    constructor(kernel) {
        this._kernel = kernel;
    }
    /**
     * @param kernel {Kernel}
     */
    set kernel(kernel) {
        this._kernel = kernel;
    }
    get kernel() {
        return this._kernel;
    }
    consoleLog(str, color = '', background = '') {
        /*let fgColor = this._fgColor[color] || "\x1b[0m";
        let bgColor = this._bgColor[background] || "\x1b[0m";*/
        console.log(str);
    }
    handleRequest($request, object) {
        let dataRequest = $request.body;
        function recursion(data) {
            if (typeof data === 'object') {
                if (Array.isArray(data))
                    data.forEach((d, i) => data[i] = recursion(d));
                else if (data instanceof Date) {
                }
                else
                    for (let key in data) {
                        //if (key === '$oid') data = new ObjectID(data.$oid);
                        if (key === '$date')
                            data = new Date(data.$date);
                        else
                            data[key] = recursion(data[key]);
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
    get handlesAttrs() {
        return this._handlesAttrs;
    }
    set handlesAttrs(value) {
        this._handlesAttrs = value;
    }
}
exports.AbstractController = AbstractController;
