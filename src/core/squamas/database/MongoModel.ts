import {ObjectId} from "mongodb";
import {DatabaseService} from "./DatabaseService";

export abstract class MongoModel {
    get created() {
        return this._created;
    }

    set created(value) {
        this._created = new Date(value);
    }

    get updated() {
        return this._updated;
    }

    set updated(value) {
        this._updated = new Date(value);
    }


    private _mongoId: string | ObjectId | undefined;

    private _created = new Date();
    private _updated = new Date();


    public get _id(): string | ObjectId | undefined {
        return this._mongoId;
    }

    public set _id(value: string | ObjectId | undefined) {
        this._mongoId = new ObjectId(value);
    }

    public toJson(): any {
        let object: any = this, methods: Array<any> = [], result: any = {};
        while (object = Reflect.getPrototypeOf(object)) {
            let keys = Reflect.ownKeys(object);
            keys.forEach((k) => methods.push(k));
        }
        for (let fn of methods) {
            if (fn !== '_mongoId') {
                // @ts-ignore
                let value = this[fn];
                if (value !== undefined && value !== null && typeof value !== 'function')
                    result[fn] = value
            }
        }
        let json: any = {};
        for (let key in result) {
            json[key] = result[key]
        }
        return json;
    }

    toString() {
        return JSON.stringify(this.toJson());
    }

    fromJson(data: any) {
        let object: any = this, methods: Array<any> = [];
        while (object = Reflect.getPrototypeOf(object)) {
            let keys = Reflect.ownKeys(object);
            keys.forEach(k => methods.push(k));
        }

        for (let key in data) {
            if (methods.includes(key)) {
                // @ts-ignore
                this[key] = data[key];
            }
            if (key === '_id') this._id = data['_id'];
        }
        return this;
    }

    async $save() {
        if (this._id) return await this.$update();
        else return await this.$insert();
    }

    async $insert() {
        let connection = await this.getConnectionDatabase();
        let insertData = this.modeling();
        delete insertData._id;
        delete insertData._mongoId;
        let obj: any = {};
        for (let key in insertData) {
            obj[key] = insertData[key]
        }
        let result = await connection.collection(this.collectionName()).insertOne(obj);
        connection.$finalize();
        this._id = result.insertedId;
        return (result.insertedId);
    }

    $clone() {
        let cloned = this.toJson();
        cloned._id = undefined;
        let Class = this.class();
        return new Class().fromJson(cloned);
    }

    async $update() {
        this.updated = new Date();
        let connection = await this.getConnectionDatabase();
        let updateData = this.modeling();
        delete updateData._id;
        delete updateData._mongoId;
        let obj: any = {};
        for (let key in updateData) {
            if (updateData[key] !== undefined )
                obj[key] = updateData[key];
        }
        let result = await connection.collection(this.collectionName())
            .updateOne({_id: new ObjectId(this._id)}, {$set: updateData});
        connection.$finalize();
        return result;
    }

    async $find(match: any, projection: any = {}, sort: any = {}) {
        let hidden: Array<string> = this.hiddenAttributes();
        for (let attr of hidden) {
            if (projection[attr] === undefined)
                delete projection[attr];
        }
        const options = {sort, projection};
        if (this.connectionName() === undefined) throw  'CollectionName attribute is not defined Obtain';
        let connection = await this.getConnectionDatabase();
        let result = await connection.collection(this.collectionName()).find(match, options).toArray();
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

    async $obtain(match: any, projection: any = {}, sort: any = {}) {
        let hidden: Array<string> = this.hiddenAttributes();
        for (let attr of hidden) {
            if (projection[attr] === undefined)
                delete projection[attr];
        }
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
        let databaseService: DatabaseService = __kernel.services.database;
        let {$db: $database} = await databaseService.instances({});
        return await $database(this.connectionName() || 'default');
    }

    async getCollection() {
        if (this.collectionName() === undefined) throw 'CollectionName attribute is not defined in getCollection: ' + this.collectionName();
        let connection = await this.getConnectionDatabase();
        return connection.collection(this.collectionName());
    }

    abstract class(): any;

    abstract collectionName(): string;

    public connectionName(): string {
        return 'default'
    };

    public hiddenAttributes(): Array<string> {
        return [];
    };

    public projectAttributes(): Array<string> {
        let project = [];
        let object: any = this, methods: Array<any> = [];
        while (object = Reflect.getPrototypeOf(object)) {
            let keys = Reflect.ownKeys(object);
            keys.forEach((k) => methods.push(k));
        }
        for (let fn of methods) {
            // @ts-ignore
            let value: any = this[fn];
            if (fn !== '__proto__' && typeof value !== 'function')
                project.push(fn);
        }
        return project;
    };

    public projectionAttributes(): any {
        let result: any = {};
        let project = this.projectAttributes();
        let hidden = this.hiddenAttributes();
        for (let attr of project) {
            if (!hidden.includes(attr)) result[attr] = 1;
        }
        return result;
    }

    public static toJson(object: MongoModel): any {
        return object.toJson();
    }

    public static toArrayJson(objects: Array<MongoModel>): Array<any> {
        return objects.map(MongoModel.toJson);
    }
}
