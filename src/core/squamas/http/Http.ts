import * as core from "express-serve-static-core";


export interface Http extends core.Express{

}

export interface Request extends core.Request{

}

export interface Response extends core.Response {

}

import {Server} from "socket.io";

export class IoServer extends Server{

}
