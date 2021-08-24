import {Middleware, MiddlewareHandle, Route} from "../core/squamas/http/HttpDecoration";
import {AbstractController} from "../core/AbstractController";



export class DefaultController extends AbstractController{


    @Route('/', 'GET')
    @Middleware('permission', 'routes.middleware')
    @Middleware('permission', 'routes.middleware2')
    @Middleware('permission', 'routes.middleware3')
    public homeAction($send: Function): void {
        $send('Hola Esta es una prueba');
    }


    @MiddlewareHandle('permission')
    public prueba($next: Function, $args: Array<any>){
        console.log("Prueba", $args);
        $next();
    }


}
