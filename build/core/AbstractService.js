"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractService = void 0;
class AbstractService {
    constructor() {
        this._kernel = __kernel;
    }
    get kernel() {
        return this._kernel;
    }
    set kernel(value) {
        this._kernel = value;
    }
}
exports.AbstractService = AbstractService;
