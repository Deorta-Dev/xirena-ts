import {Route} from "../core/decorations/Route";

export class DefaultController{

    @Route('/', 'GET')
    public homeAction(){

    }
}
