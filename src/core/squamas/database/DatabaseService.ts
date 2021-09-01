import {AbstractService, Kernel} from "../../../index";
import {constants} from "os";

export class DatabaseService extends AbstractService{

    private _globalConfig:any = {};

    private _instances:any = { };

    public build(kernel: Kernel): any {
        let $this: DatabaseService = this;
        let configs = kernel.getConfig('database');
        if (!configs) return;
        if (!Array.isArray(configs)) configs = [configs];
        let connCount = 0, connReady = 0;

        this._instances['$db'] = function (name:any): Promise<any>{
            return $this.getConnection(name);
        }

        return new Promise((resolve: Function) => {
            if (!Array.isArray(configs)) configs = [configs];

            function ready() {
                connReady++;
                if (connReady >= connCount) {
                    console.log(" Database Service Ready");
                    resolve();
                }
            }

            for (let key in configs) {
                let config = configs[key];
                if (config && typeof config != 'function') {
                    config.instances = config.instances || config.connections || 30;
                    config.clients = config.clients || 20;
                    config.connectionsList = [];
                    config.clientsList = [];

                    $this._globalConfig[config.id || key + ''] = config;
                    if ($this._globalConfig['default'] === undefined) $this._globalConfig['default'] = config;
                    for (let i = 0; i < config.instances; i++) {
                        connCount += 1;
                        $this.createConnection(config.id || key + '').then(ready);
                    }

                }

            }
        });

    }

    public finalize(instances: any): void {
        if(instances.$db){
            instances.$db.$finalize();
        }
    }

    public instances(a: any):any {
        let $this: DatabaseService = this;
        let localConnections: Array<any> = [];

        function objectConnection(a:any, b:any) {
            let database = 'default', fn:any = undefined;
            if (b !== undefined) {
                database = a;
                fn = b;
            } else {
                if (typeof a === 'string') database = a;
                else fn = a;
            }
            let promise = $this.getConnection(database);
            return new Promise(resolve => {
                promise.then((connection: any) => {
                    localConnections.push(connection);

                    if (typeof fn === 'function')
                        fn(connection);
                    resolve(connection);
                });
            })
        }



        objectConnection.$finalize = function () {
            for (let connection of localConnections) connection.$finalize();
        }
        objectConnection.connect = objectConnection;
        if ($this._globalConfig['default'] && $this._globalConfig['default']['autoConnect'])
            return { $db: objectConnection('default', undefined) };
        else return { $db: objectConnection };

    }


    public createConnection(name: string, save: boolean = true) {
        let $this: DatabaseService = this;
        return new Promise(resolve => {
            let config = this._globalConfig[name] || this._globalConfig['default'];

            function ready(connection: any) {
                if (save) {
                    if (!Array.isArray(config.connectionsList)) config.connectionsList = [connection];
                    else config.connectionsList.push(connection);
                }
                resolve(connection);
            }

            switch (config.connection) {
                case 'postgres':
                    $this.createConnectionPostgres(config).then(ready);
                    break;
                case 'mysql':
                    $this.createConnectionMySql(config).then(ready);
                    break;
                case 'mongodb':
                    $this.createConnectionMongoDB(config).then(ready);
                    break;
            }
        });
    }

    public getConnection(name: string) {
        let config = this._globalConfig[name] || this._globalConfig['default'];

        function prepare(connection:any) {
            if (config.timeLife)
                setTimeout(() => connection.$finalize(), config.timeLife);
            return connection;
        }

        let now = new Date();

        if (Array.isArray(config.connectionsList) && config.connectionsList.length > 0) {
            let connection = config.connectionsList.shift();
            this.createConnection(name);

            return new Promise(resolve => {
                resolve(prepare(connection));
            });
        } else {
            return new Promise(resolve => {
                for (let i = 0; i < config.instances * 0.25; i++) {
                    this.createConnection(name);
                }
                this.createConnection(name, false).then((connection:any) => {
                    resolve(prepare(connection));
                });
            });
        }
    }

    public createConnectionPostgres(config: any) {
        let $this: DatabaseService = this;
        return new Promise((resolve, reject) => {
            if (config && config['connection'] === 'postgres') {
                let {user, host, database, password, port} = config;
                const {Pool} = require("pg");
                if (config.clientsList.length < config.clients) {
                    while (config.clientsList.length < config.clients) {
                        let c = new Pool({
                            user: user,
                            host: host,
                            database: database,
                            password: password,
                            port: port | 5432,
                            max: config.max || 5
                        });
                        c.name = 'client-' + config.clientsList.length;
                        config.clientsList.push(c);
                    }
                }
                let client = config.clientsList.shift();

                client.connect(function (err:any, connection: any) {
                    if (err) {
                        function retry(resolveRetry:any) {
                            setTimeout(() => {
                                $this.createConnectionPostgres(config).then(resolveRetry).catch(() => retry(resolveRetry));
                            }, 500);
                        }

                        retry(resolve);

                    } else {

                        if (!config.firstConnect) {
                            console.log('\x1b[34m', 'Connect Database: ' + config['database'] + ' | PostgreSQL', '\x1b[0m');
                        }

                        config.firstConnect = true;
                        connection.$finalize = function () {
                            try {
                                connection.release();
                                if (Array.isArray(config.connectionsList))
                                    for (let [i, con] of config.connectionsList.entries()) {
                                        if (connection === con) {
                                            config.connectionsList.splice(i, 1);
                                            break;
                                        }
                                    }
                            } catch (e) {
                            }
                        };
                        resolve(connection);
                    }
                });
                config.clientsList.push(client);
            }
        });
    }

    public createConnectionMySql(config: any) {
        return new Promise((resolve, reject) => {
            if (config && config['connection'] === 'mysql') {
                let {user, host, database, password, port} = config;
                if (user && host && database && password) {
                    let mysql = require('mysql');
                    if (config.client === undefined) {
                        config.client = mysql.createConnection({
                            host: host,
                            user: user,
                            password: password,
                            database: database,
                            port: port || 3306
                        });
                    }
                    config.client.connect(function (err:any, connection:any) {
                        if (err) {
                            reject(err);
                            throw err;
                        }
                        if (!config.firstConnect) {
                            console.log('\x1b[34m', 'Connect Database: ' + config['database'] + ' | Mysql', '\x1b[0m');
                        }
                        config.firstConnect = true

                        connection.$finalize = function () {
                            connection.close();
                            if (Array.isArray(config.connectionsList))
                                config.connectionsList.forEach((con:any, i:number) => {
                                    if (connection === con) {
                                        config.connectionsList.splice(i, 1);
                                    }
                                });
                        };
                        resolve(connection);
                    });
                }
            }
        });
    }

    public createConnectionMongoDB(config: any) {
        let $this: DatabaseService = this;
        return new Promise((resolve, reject) => {
            if (config && config['connection'] === 'mongodb') {
                if (config['dns'] !== undefined) {
                    if (config.clientsList.length < config.clients) {
                        while (config.clientsList.length < config.clients) {
                            const { MongoClient } = require('mongodb');
                            let c = new MongoClient(config['dns'], {useUnifiedTopology: true});
                            c.name = 'client-' + config.clientsList.length;
                            config.clientsList.push(c);
                        }
                    }
                    let client = config.clientsList.shift();
                    client.connect(function (err: any, connection: any) {
                        if (err) {
                            function retry(resolveRetry:any) {
                                setTimeout(() => {
                                    $this.createConnectionMongoDB(config).then(resolveRetry).catch(() => retry(resolveRetry));
                                }, 500);
                            }
                        } else {
                            if (!config.firstConnect) {
                                console.log('\x1b[34m', 'Connect Database: ' + config['database'] + ' | Mongodb', '\x1b[0m');
                            }
                            config.firstConnect = true;
                            let db = connection.db(config['database']);
                            db.$finalize = function () {
                                connection.close();
                                if (Array.isArray(config.connectionsList))
                                    config.connectionsList.forEach((con: any, i: number) => {
                                        if (connection === con) {
                                            config.connectionsList.splice(i, 1);
                                        }
                                    })
                            };
                            resolve(db);
                        }
                    });
                }
            }
        });
    }

}
