"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultController = void 0;
const HttpDecoration_1 = require("../core/squamas/http/HttpDecoration");
const AbstractController_1 = require("../core/AbstractController");
class DefaultController extends AbstractController_1.AbstractController {
    homeAction($send) {
        $send('Hola Esta es una prueba');
    }
    prueba($next, $args) {
        console.log("Prueba", $args);
        $next();
    }
}
__decorate([
    HttpDecoration_1.Route('/', 'GET'),
    HttpDecoration_1.Middleware('permission', 'routes.middleware'),
    HttpDecoration_1.Middleware('permission', 'routes.middleware2'),
    HttpDecoration_1.Middleware('permission', 'routes.middleware3')
], DefaultController.prototype, "homeAction", null);
__decorate([
    HttpDecoration_1.MiddlewareHandle('permission')
], DefaultController.prototype, "prueba", null);
exports.DefaultController = DefaultController;
