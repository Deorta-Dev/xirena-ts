"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketOn = exports.MiddlewareHandle = exports.Middleware = exports.Route = void 0;
let middlewareHandles = [];
function getExecutions(func) {
    let handlesBefore = [], handlesAfter = [], handlesAsync = [];
    function findHandle(name, args) {
        middlewareHandles.forEach(item => {
            if (item.name === name) {
                switch (item.type) {
                    case 'ASYNC':
                        handlesAsync.push({ fn: item.fn, args: args, isMiddle: true });
                        break;
                    case 'AFTER':
                        handlesAfter.push({ fn: item.fn, args: args, isMiddle: true });
                        break;
                    case 'BEFORE':
                        handlesBefore.push({ fn: item.fn, args: args, isMiddle: true });
                        break;
                }
            }
        });
    }
    findHandle("$all", []);
    func.middlewaresAssigned.forEach((mid) => findHandle(mid.name, mid.args));
    findHandle("$finally", []);
    return handlesBefore
        .concat([{ fn: func, isAction: true }])
        .concat(handlesAfter)
        .concat(handlesAsync);
}
const Route = (route, method = 'ANY', ...args) => {
    return function (target, propertyKey, descriptor) {
        descriptor.value.isAction = true;
        function apply() {
            return __awaiter(this, void 0, void 0, function* () {
                let httpService = __kernel.services['http'];
                httpService.addRoute(route, method, function ($request, $response) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (descriptor.value.executions === undefined) {
                            descriptor.value.executions = getExecutions(descriptor.value);
                        }
                        let params = $request.params;
                        if (Array.isArray(descriptor.value.executions)) {
                            let executions = descriptor.value.executions.clone(), currentExecution, dataResponse;
                            function sendFn(data) {
                                dataResponse = data;
                                if (currentExecution)
                                    if (!currentExecution.isAction) {
                                        sendFinalizeFn();
                                    }
                                    else
                                        nextFn();
                            }
                            function nextFn() {
                                if (executions.length > 0) {
                                    currentExecution = executions.shift();
                                    let args = getParamNamesFunctions(currentExecution.fn);
                                    let dataParams = [];
                                    args.forEach((arg) => {
                                        if (currentExecution.isMiddle && arg === '$args')
                                            dataParams.push(currentExecution.args);
                                        else
                                            dataParams.push(params[arg] || undefined);
                                    });
                                    Reflect.apply(currentExecution.fn, undefined, dataParams);
                                }
                                else
                                    sendFinalizeFn();
                            }
                            let isSend = false;
                            function sendFinalizeFn() {
                                if (!isSend) {
                                    isSend = true;
                                    if (typeof dataResponse === 'function')
                                        dataResponse($response);
                                    else
                                        $response.send(dataResponse);
                                    params['$finalize']();
                                }
                            }
                            params = yield __kernel.initServices(params, []);
                            params['$request'] = $request;
                            params['$response'] = $response;
                            params['$next'] = nextFn;
                            params['$send'] = sendFn;
                            params['$scope'] = {};
                            if ($request.body === undefined) {
                                let body = '';
                                $request.on('data', chunk => body += chunk);
                                $request.on('end', () => {
                                    try {
                                        body = JSON.parse(body);
                                    }
                                    catch (e) {
                                    }
                                    $request.body = body;
                                    nextFn();
                                });
                            }
                            else
                                nextFn();
                        }
                    });
                });
            });
        }
        apply();
    };
};
exports.Route = Route;
const Middleware = (name, ...args) => {
    return function (target, propertyKey, descriptor) {
        if (!Array.isArray(descriptor.value.middlewaresAssigned))
            descriptor.value.middlewaresAssigned = [];
        descriptor.value.middlewaresAssigned.unshift({ name, args });
    };
};
exports.Middleware = Middleware;
const MiddlewareHandle = (name, type = 'BEFORE') => {
    return function (target, propertyKey, descriptor) {
        if (name === '$finally')
            type = 'AFTER';
        descriptor.value.isMiddle = true;
        middlewareHandles.push({ name, fn: descriptor.value, type });
    };
};
exports.MiddlewareHandle = MiddlewareHandle;
const SocketOn = (name) => {
    return function (target, propertyKey, descriptor) {
        let httpService = __kernel.services['http'];
        httpService.addSocketOn(name, function (socket, data, connScope, callback) {
            return __awaiter(this, void 0, void 0, function* () {
                let params = yield __kernel.initServices({}, []);
                params['$scope'] = connScope;
                params['$socket'] = socket;
                params['$send'] = callback;
                let args = getParamNamesFunctions(descriptor.value);
                let dataParams = [];
                args.forEach((arg) => dataParams.push(params[arg] || data));
                Reflect.apply(descriptor.value, undefined, dataParams);
            });
        });
    };
};
exports.SocketOn = SocketOn;
