import {Middleware, MiddlewareRoute, Route} from "../core/squamas/http/HttpDecorations";
import {AbstractController} from "../core/AbstractController";



export class DefaultController extends AbstractController{


    @Route('/hola', 'GET')
    public homeAction($send: Function): void {
        $send('Hola Esta es una prueba');
    }

    @MiddlewareRoute('permission')
    public example($next: Function, $args: Array<any>){
        console.log("example", $args);
        $next();
    }


}
