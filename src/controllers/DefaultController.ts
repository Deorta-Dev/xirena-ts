import {Middleware, Route} from "../core/squamas/http/HttpDecoration";

export class DefaultController {

    @Route('/', 'GET')
    @Middleware('permission', 'routes.middleware')
    public homeAction(): void {
        console.log("Prueba");
    }


}
