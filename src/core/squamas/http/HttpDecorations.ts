import {Http, Response, Request, IoServer} from "./Http";
import {HttpService} from "./HttpService";
import {Socket} from "socket.io";

let middlewareHandles: Array<any> = [];

function getExecutions(func: any): Array<any> {
    let handlesBefore: Array<any> = [], handlesAfter: Array<any> = [], handlesAsync: Array<any> = [];

    function findHandle(name: string, args: Array<any>) {
        middlewareHandles.forEach(item => {
            if (item.name === name) {
                switch (item.type) {
                    case 'ASYNC':
                        handlesAsync.push({fn: item.fn, args: args, isMiddle: true});
                        break;
                    case 'AFTER':
                        handlesAfter.push({fn: item.fn, args: args, isMiddle: true});
                        break;
                    case 'BEFORE':
                        handlesBefore.push({fn: item.fn, args: args, isMiddle: true});
                        break;
                }
            }
        });
    }

    findHandle("$all", []);
    func.middlewaresAssigned.forEach((mid: any) => findHandle(mid.name, mid.args));
    findHandle("$finally", []);
    return handlesBefore
        .concat([{fn:func, isAction: true}])
        .concat(handlesAfter)
        .concat(handlesAsync);

}

export const Route = (route: string, method: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'ANY') = 'ANY', ...args: any) => {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.value.isAction = true;

        async function apply() {
            let httpService: HttpService = __kernel.services['http'];
            httpService.addRoute(route, method, async function ($request: Request, $response: Response) {
                if(descriptor.value.executions === undefined){
                    descriptor.value.executions = getExecutions(descriptor.value);
                }
                let params: any = $request.params;

                if (Array.isArray(descriptor.value.executions)) {
                    let executions = descriptor.value.executions.clone(), currentExecution:any, dataResponse: any;

                    function sendFn(data:any) {
                        dataResponse = data;
                        if (currentExecution)
                            if (!currentExecution.isAction) {
                                sendFinalizeFn();
                            } else nextFn();
                    }

                    function nextFn() {
                        if (executions.length > 0) {
                            currentExecution = executions.shift();

                            let args = getParamNamesFunctions(currentExecution.fn);
                            let dataParams: Array<any> = [];
                            args.forEach((arg: any) =>{
                                if(currentExecution.isMiddle && arg === '$args')
                                    dataParams.push(currentExecution.args);
                                else dataParams.push(params[arg] || undefined);
                            });
                            Reflect.apply(currentExecution.fn, undefined, dataParams);
                        } else sendFinalizeFn();
                    }

                    let isSend = false;

                    function sendFinalizeFn() {
                        if (!isSend) {
                            isSend = true;
                            if (typeof dataResponse === 'function') dataResponse($response);
                            else $response.send(dataResponse);
                            params['$finalize']();
                        }
                    }

                    params = await __kernel.initServices(params, []);
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
                            } catch (e) {
                            }
                            $request.body = body;
                            nextFn();
                        });
                    } else nextFn();

                }


            });
        }

        apply();
    };
};

export const Middleware = (name: string, ...args: any) => {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (!Array.isArray(descriptor.value.middlewaresAssigned))
            descriptor.value.middlewaresAssigned = [];
        descriptor.value.middlewaresAssigned.unshift({name, args});
    };
};

export const MiddlewareRoute = (name: string, type: ('BEFORE' | 'AFTER' | 'ASYNC') = 'BEFORE') => {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        if (name === '$finally') type = 'AFTER';
        descriptor.value.isMiddle = true;
        middlewareHandles.push({name, fn: descriptor.value, type});
    };
};

export const SocketOn = (name: string) => {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        let httpService: HttpService = __kernel.services['http'];
        httpService.addSocketOn(name, async function (socket: Socket, data:any, connScope:any, callback: Function) {
            let params = await __kernel.initServices({}, []);
            params['$scope'] = connScope;
            params['$socket'] = socket;
            params['$send'] = callback;
            let args = getParamNamesFunctions(descriptor.value);
            let dataParams:Array<any> = [];
            args.forEach((arg:any)=>  dataParams.push(params[arg] || data));
            Reflect.apply(descriptor.value, undefined, dataParams);
        })
    };
};

export const MiddlewareSocket = (name: string) => {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        let httpService: HttpService = __kernel.services['http'];
        (async function apply (){
            let params = await __kernel.initServices({}, []);
            let $ioServer:IoServer = await httpService.instances(params).$ioServer;
            $ioServer.use(async function(socket, next){
                let params = await __kernel.initServices({}, []);
                params['$socket'] = socket;
                params['$handshake'] = socket.handshake;
                params['$request'] = socket.handshake;
                params['$next'] = next;
                let args = getParamNamesFunctions(descriptor.value);
                let dataParams:Array<any> = [];
                args.forEach((arg:any)=>  dataParams.push(params[arg] || undefined));
                Reflect.apply(descriptor.value, undefined, dataParams);
            });
        })();

    };
};

