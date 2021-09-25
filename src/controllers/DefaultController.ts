import {Middleware, MiddlewareRoute, Route} from "../core/squamas/http/HttpDecorations";
import {AbstractController} from "../core/AbstractController";



export class DefaultController extends AbstractController{


    @Route('/hola', 'GET')
    @Middleware('permission', 'hola')
    public homeAction(): string {
        this.onAction();
        return 'Hola Esta es una prueba '+ (new Date()).toJSON();
    }

    @MiddlewareRoute('permission')
    public example($args: Array<any>, $next: Function){
        $next();

    }

    onAction(){
        console.log("Action");
    }


}
