import {AbstractService} from "../../AbstractService";
import {Kernel} from "../../Kernel";
import express from "express";
import path from "path";
import {Http, IoServer, Response} from "./Http";
import fs from "fs";
import ip from "ip";
import * as Socket from "socket.io";
let $http: Http;
let $ioServer: IoServer;

export class HttpService extends AbstractService {


    public build(kernel: Kernel): any {
        $http = express();
        let config: any = kernel.getConfig('http');
        let publicDir = kernel.projectDir + '/public';
        if (config.publicDir) {
            publicDir = path.join(kernel.projectDir, config.publicDir);
        }
        $http.use(express.static(publicDir));
        console.log(" Using for public directory ->", publicDir);

        let onReady: Function;
        let port: number;
        if (Array.isArray(config['port'])) {
            port = config['port'][0];
        } else port = config['port'];

        let ssl: any = config['ssl'];

        const normalListener: Function = () => {
            console.log("\x1b[32m", '');
            console.log(' +----------------------------------------------------------+');
            let string = ' | Listening on ' + ip.address() + ':' + port;
            while (string.length < 60) string += ' ';
            string += '|';
            console.log(string);
            console.log(' +----------------------------------------------------------+\n');
            console.log("\x1b[0m", '');
        }
        if (ssl) {
            let options = {key: fs.readFileSync(ssl.key), cert: fs.readFileSync(ssl.cert)};
            let server = require('https').createServer(options, $http);
            $ioServer = require("socket.io")(server);
            onReady = () => {
                server.listen(port, () => {
                    console.log("\x1b[32m", '');
                    console.log(' +----------------------------------------------------------+');
                    let string = ' | Listening on ' + ip.address() + ':' + port + ' with SSL';
                    while (string.length < 60) string += ' ';
                    string += '|';
                    console.log(string);
                    console.log(' +----------------------------------------------------------+\n');
                    console.log("\x1b[0m", '');

                    if (config['port']) {
                        let port: number;
                        if (Array.isArray(config['port'])) {
                            port = config['port'][1];
                        } else port = config['port'] + 1;
                        let options = {};
                        let server = require('http').createServer(options, $http);
                        server.listen(port, normalListener);
                    }
                });
            }
        } else {
            let options = {};
            let server = require('http').createServer(options, $http);
            $ioServer = require("socket.io")(server);
            onReady = () => {

                server.listen(port, normalListener);
            }

        }

        let $this = this;
        $ioServer.on('connection', ($socket: Socket.Socket) => {

            let $connScope = {};

            $this._socketOnFunction.forEach((listener: any) => {
                if (listener.name === '$connection') {
                    listener.fn($socket, {}, $connScope);
                }
            });

            $this._socketOnFunction.forEach((listener: any) => {
                if (listener.name !== '$disconnect' && listener.name !== '$connection') {
                    console.log(new Date(), 'Create listener', listener.name);
                    $socket.on(listener.name, function (data: any, callback: Function) {
                        if (data !== '' && data !== undefined && data !== null && typeof data === 'string') data = JSON.parse(decodeURIComponent(escape(atob(data))));
                        listener.fn($socket, data, $connScope, callback);
                    });
                }
            });

            $socket.on('disconnect', function () {
                $this._socketOnFunction.forEach((listener) => {
                    if (listener.name === '$disconnect') listener.fn($socket, {}, $connScope);
                });
            });
        });

        kernel.onReady(onReady);
    }

    public finalize(instances: any): void {
    }

    public instances(services: any): any {
        return {
            $http, $ioServer, $cookies: (name: string) => {
                let {$request} = services;
                let cookiesMap: any = {};
                if (typeof $request.headers.cookie === 'string')
                    $request.headers.cookie.split(';').forEach((stringCookie: string) => {
                        let [c, v] = stringCookie.split('=');
                        while (c.startsWith(' ')) c = c.slice(1);
                        while (c.endsWith(' ')) c = c.slice(0, -1);
                        cookiesMap[c] = v;
                    });
                return decodeURIComponent(cookiesMap[name]);
            }, $redirect: (url: string) => {
                let {$send, $request} = services;
                if (!/(http:\\\\)|(https:\\\\)/.test(url)) {
                    url = $request.protocol + '://' + $request.get('host') + '/' + url;
                }
                $send((response: Response) => {
                    response.writeHead(307,
                        {Location: url}
                    );
                    response.end();
                });
            }
        };
    }


    public addRoute(route: string, method: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'ANY') = 'ANY', fn: any) {
        switch (method) {
            case "GET" :
                $http.get(route, fn);
                break;
            case "POST" :
                $http.post(route, fn);
                break;
            case "PUT" :
                $http.put(route, fn);
                break;
            case "DELETE" :
                $http.delete(route, fn);
                break;
            case "ANY":
                $http.all(route, fn);
                break;
        }
    }

    private _socketOnFunction: Array<any> = []

    public addSocketOn(name: string, fn: Function) {
        this._socketOnFunction.push({name, fn});
    }


}
