import {AbstractService, Kernel} from "../../../index";
let queryable = require('queryable');
let collections: any = {};
function getCollection(name:string){
    if(collections[name]) return collections[name];
    else{
        return collections[name] =  queryable.open(name);
    }
}
export class QueryableService extends AbstractService{

    build(kernel: Kernel): any {
    }

    finalize(instances: any): void {
    }

    instances(services: any): any {
        return {
            $queryable:  (dbName = 'default') =>{
                return getCollection(dbName);
            }
        }
    }

}