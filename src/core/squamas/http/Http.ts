import * as core from "express-serve-static-core";
import * as Socket from "socket.io";

export interface Http extends core.Express{}

export interface Request extends core.Request{}

export interface Response extends core.Response {}

export interface IoServer extends Socket.Server{}
