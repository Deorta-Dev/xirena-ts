import {ObjectId} from "mongodb";

export abstract class MongoModel {
    get created() {
        return this.#_created;
    }

    set created(value) {
        this.#_created = value;
    }

    get updated() {
        return this.#_updated;
    }

    set updated(value) {
        this.#_updated = value;
    }


    #_id: any;


    #_created = new Date();
    #_updated = new Date();

    get id() {
        return this.#_id;
    }

    set id(value) {
        this.#_id = value;
    }

    toJson() {
        let object: any = this, methods: Array<any> = [], result: any = {};
        while (object = Reflect.getPrototypeOf(object)) {
            let keys = Reflect.ownKeys(object);
            keys.forEach((k) => methods.push(k));
        }
        for (let fn of methods) {
            // @ts-ignore
            let value: any = this[fn];
            if (value !== undefined && value !== null && typeof value !== 'function')
                result[fn] = value
        }
        return result;
    }

    toString() {
        return JSON.stringify(this.toJson());
    }

    fromJson(data: any) {
        let object: any = this, methods: Array<any> = [];
        while (object = Reflect.getPrototypeOf(object)) {
            let keys = Reflect.ownKeys(object);
            keys.forEach((k) => methods.push(k));
        }

        for (let key in data) {
            if (methods.includes(key)) {
                // @ts-ignore
                this[key] = data[key];
            }
            if (key === '_id') this.id = data['_id'];
        }
        return this;
    }

    async $save() {
        if (this.id) return await this.$update();
        else return await this.$insert();
    }

    async $insert() {
        let connection = await this.getConnectionDatabase();
        let result = await connection.collection(this.collectionName()).insertOne(this.modeling());
        connection.$finalize();
        this.id = result.insertedId;
        return (result.insertedId);
    }

    $clone(){
        let cloned = this.toJson();
        cloned.id = undefined;
        let Class = this.class();
        return new Class().fromJson(cloned);
    }

    async $update() {
        this.updated = new Date();
        let connection = await this.getConnectionDatabase();
        let result = await connection.collection(this.collectionName())
            .updateOne({_id: new ObjectId(this.id)},{$set: this.modeling()});
        connection.$finalize();
        return result;
    }

    async $find(match:any) {
        let connection = await this.getConnectionDatabase();
        let result = await connection.collection(this.connectionName()).find(match).toArray();
        connection.$finalize();
        let objects = [];
        let Class = this.class();
        for (let data of result) {
            let object = new Class();
            object.fromJson(data);
            objects.push(object);
        }
        return objects;
    }

    async $obtain(match:any, projection:any = {}, sort: any = {}) {
        let hidden: Array<string> = this.hiddenAttributes();
        for(let attr of hidden){ projection[attr] = 0 }
        const options = {sort, projection};
        if (this.connectionName() === undefined) throw  'CollectionName attribute is not defined Obtain';
        let connection = await this.getConnectionDatabase();
        let result = await connection.collection(this.collectionName()).findOne(match, options);
        connection.$finalize();
        this.fromJson(result);
        return this;
    }



    modeling() {
        return this.toJson();
    }

    async getConnectionDatabase() {
        let $database = await __kernel.services['database'].instance({}).$db;
        return await $database(this.connectionName() || 'default');
    }

    async getCollection() {
        if (this.connectionName() === undefined) throw 'CollectionName attribute is not defined in getCollection: '+this.connectionName();
        let connection = await this.getConnectionDatabase();
        return connection.collection(this.connectionName());
    }

    abstract class(): any;

    abstract collectionName(): string;

    public connectionName(): string{
        return 'default'
    };

    public hiddenAttributes(): Array<string>{
        return [];
    };
}
