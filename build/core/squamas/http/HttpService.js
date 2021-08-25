"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpService = void 0;
const AbstractService_1 = require("../../AbstractService");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ip_1 = __importDefault(require("ip"));
const Socket = __importStar(require("socket.io"));
let $http;
let $ioServer;
class HttpService extends AbstractService_1.AbstractService {
    constructor() {
        super(...arguments);
        this._socketOnFunction = [];
    }
    build(kernel) {
        $http = express_1.default();
        let config = kernel.getConfig('http');
        let publicDir = kernel.projectDir + '/public';
        if (config.publicDir) {
            publicDir = path_1.default.join(kernel.projectDir, config.publicDir);
        }
        let onReady;
        $http.use(express_1.default.static(publicDir));
        let port = config['port'];
        let ssl = config['ssl'];
        if (ssl) {
            let options = { key: fs_1.default.readFileSync(ssl.key), cert: fs_1.default.readFileSync(ssl.cert) };
            let server = require('https').createServer(options, $http);
            $ioServer = new Socket.Server(server);
            onReady = () => {
                server.listen(port, () => {
                    console.log("\x1b[32m", '');
                    console.log(' +----------------------------------------------------------+');
                    let string = ' | Listening on ' + ip_1.default.address() + ':' + port + ' with SSL';
                    while (string.length < 60)
                        string += ' ';
                    string += '|';
                    console.log(string);
                    console.log(' +----------------------------------------------------------+\n');
                    console.log("\x1b[0m", '');
                });
            };
        }
        else {
            let options = {};
            let server = require('http').createServer(options, $http);
            $ioServer = new Socket.Server(server);
            onReady = () => {
                server.listen(port, () => {
                    console.log("\x1b[32m", '');
                    console.log(' +------------------------------------------------+');
                    let string = ' | Listening on ' + ip_1.default.address() + ':' + port;
                    while (string.length < 50)
                        string += ' ';
                    string += '|';
                    console.log(string);
                    console.log(' +------------------------------------------------+\n');
                    console.log("\x1b[0m", '');
                });
            };
        }
        let $this = this;
        $ioServer.on('connection', ($socket) => {
            let $connScope = {};
            $this._socketOnFunction.forEach((listener) => {
                if (listener.name === '$connection') {
                    listener.fn($socket, {}, $connScope);
                }
            });
            $this._socketOnFunction.forEach((listener) => {
                if (listener.name !== '$disconnect' && listener.name !== '$connection')
                    $socket.on(listener.name, function (data, callback) {
                        if (data !== '' && data !== undefined && data !== null && typeof data === 'string')
                            data = JSON.parse(decodeURIComponent(escape(atob(data))));
                        listener.fn($socket, data, $connScope, callback);
                    });
            });
            $socket.on('disconnect', function () {
                $this._socketOnFunction.forEach((listener) => {
                    if (listener.name === '$disconnect')
                        listener.fn($socket, {}, $connScope);
                });
            });
        });
        kernel.onReady(onReady);
    }
    finalize(instances) {
    }
    instances(services) {
        return { $http, $ioServer, $cookies: (name) => {
                let { $request } = services;
                let cookiesMap = {};
                if (typeof $request.headers.cookie === 'string')
                    $request.headers.cookie.split(';').forEach((stringCookie) => {
                        let [c, v] = stringCookie.split('=');
                        while (c.startsWith(' '))
                            c = c.slice(1);
                        while (c.endsWith(' '))
                            c = c.slice(0, -1);
                        cookiesMap[c] = v;
                    });
                return decodeURIComponent(cookiesMap[name]);
            }, $redirect: (url) => {
                let { $send, $request } = services;
                if (!/(http:\\\\)|(https:\\\\)/.test(url)) {
                    url = $request.protocol + '://' + $request.get('host') + '/' + url;
                }
                $send((response) => {
                    response.writeHead(307, { Location: url });
                    response.end();
                });
            } };
    }
    addRoute(route, method = 'ANY', fn) {
        switch (method) {
            case "GET":
                $http.get(route, fn);
                break;
            case "POST":
                $http.post(route, fn);
                break;
            case "PUT":
                $http.put(route, fn);
                break;
            case "DELETE":
                $http.delete(route, fn);
                break;
            case "ANY":
                $http.all(route, fn);
                break;
        }
    }
    addSocketOn(name, fn) {
        this._socketOnFunction.push({ name, fn });
    }
}
exports.HttpService = HttpService;
