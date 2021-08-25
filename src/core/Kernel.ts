import GlobalFunction from './GlobalFunctions';
import fs from 'fs';
import path from 'path';
import {AbstractService} from "./AbstractService";
import {AbstractController} from "./AbstractController";

declare global {
    var __kernel: Kernel;
}

export class Kernel {

    private _configDir: string = '';
    private _configs: any = {};
    private _services: any = {};
    private _projectDir: string = "";

    private _runReady = false;
    private _listenerReady: Array<Function> = [];

    private _appScope: any;

    private _isLocal = true;

    get appScope(): any {
        return this._appScope;
    }

    set appScope(value: any) {
        this._appScope = value;
    }

    constructor() {

        console.log("┌-----------------------------------┐");
        console.log("├------ Initializer Xirena TS ------┤");
        console.log("└-----------------------------------┘");

        GlobalFunction();

        global.__kernel = this;

    }

    private async prepareControllers(){

        let config = this.getConfig('initial');
        let $this: Kernel = this;
        /**
         * Build Controllers
         */
        let controllerBuilds = [];
        console.log(` Loading Controllers`);
        if (config['controllers'] !== undefined) {
            if (config['controllers']['mapping'] === 'auto') {
                let src = config['controllers']['src'];
                let directoryPath = path.join(this._projectDir, src);
                let files = this.getFilesDirectory(directoryPath, undefined, true);
                files.forEach( (file: any) => {
                    if (file.relative.endsWith('Controller.js')) {
                        let controllers = require(file.absolute);
                        for(let key in controllers){
                            let ClassController = controllers[key];
                            if(ClassController !== AbstractController)
                                console.log(` --> ${file.relative}: ${key}`);
                        }
                    }
                });
            }
        }
    }

    public async prepareServices(){
        let config = this.getConfig('initial');
        let $this: Kernel = this;
        console.log(` Loading Services`);
        let explorer: any = config.services;
        if ( explorer ) {
            if (!Array.isArray(explorer)) explorer = [explorer];

            async function importServices(files: any) {
                let file: any;
                for(file of files){

                    if(file.relative.endsWith('Service.js')) {
                        let services = require(file.absolute);
                        let keys = Object.keys(services);
                        let key: string;
                        for (key of keys) {
                            if (key && key !== ''){
                                let ClassService = services[key];
                                if(ClassService !== AbstractService) {
                                    console.log(` --> ${file.relative}: ${key}`);

                                    let objectService: AbstractService = new ClassService();

                                    if (objectService instanceof AbstractService) {

                                        let name: string = ClassService.$name;
                                        if (name === undefined) {
                                            name = key.replace(/[S][e][r][v][i][c][e]$/, '');
                                            name = name.charAt(0).toLowerCase() + name.slice(1);
                                        }
                                        await objectService.build($this);
                                        $this.addService(name, objectService);

                                    }
                                }
                            }
                        }

                    }
                }
            }
            let exp: any;
            for(exp of explorer){
                if (!Array.isArray(exp)) {
                    if (exp['mapping'] === 'auto') {
                        let src = exp['src'];
                        let directoryPath = exp.absolute ? src : path.join(this._projectDir, src);
                        if(!this._isLocal){
                            await importServices(this.getFilesDirectory(path.join(__dirname,'../'), undefined, true));
                        }
                        await importServices(this.getFilesDirectory(directoryPath, undefined, true));
                    }
                } else {
                    await importServices(exp.map(e => {
                        return {
                            relative: e,
                            absolute: path.join(this._projectDir, e)
                        }
                    }));
                }
            }
        }

    }

    async prepare(){
        this._isLocal = true;
        await this.prepareServices();
        await this.prepareControllers();
    }

    async prepareServer(){
        this._isLocal = false;
        await this.prepareServices();
        await this.prepareControllers();
    }


    public startApplication(): void{
        this._listenerReady.forEach((fn:Function) => fn());
    }

    public getFilesDirectory(directory: string, origDirectory: string| undefined, findSub: boolean = false):Array<any> {
        directory = directory.replace(/\\\\/, '\\\\');
        while(directory.endsWith("\\")) directory = directory.slice(0,-1);
        origDirectory = origDirectory || directory;
        let result: Array<any> = [];
        let files = fs.readdirSync(directory, {withFileTypes: true});
        let javascriptER = /.*\.js$/;
        let $this: Kernel = this;


        files.forEach(function (file: any) {
            if (file.isDirectory()) {
                if(findSub) {
                    let directoryPath = path.join(directory, file.name + "\\");
                    let subResult = $this.getFilesDirectory(directoryPath, origDirectory, true);
                    subResult.forEach((sub: any) => result.push(sub))
                }
            } else {
                if (javascriptER.test(file.name)) {
                    file.absolute = path.join(directory, file.name);
                    file.relative = file.absolute.replace(origDirectory, '');
                    result.push(file);
                }
            }
        });
        return result;
    }


    public addService(serviceName:string, serviceFunction: Object){
        this.services[serviceName] = serviceFunction;
    }

    public getConfig(name: string): any{
        if(this._configs[name] === undefined) {
            let dir = this._configDir ? path.join(this._configDir, name + ".json") : path.join(this._projectDir, "config/" + name + ".json");
            if (fs.existsSync(dir)) {
                if (this._configs === undefined) this._configs = {};
                if (this._configs[name] === undefined) this._configs[name] = require(dir);
            }
        }
        return this._configs[name];
    }

    public onReady(fn: Function): void{
        this._listenerReady.push(fn);
    }

    get configDir(): string {
        return this._configDir;
    }

    set configDir(value: string) {
        this._configDir = value;
    }

    get services(): any {
        return this._services;
    }

    set services(value: any) {
        this._services = value;
    }

    get projectDir(): string {
        return this._projectDir;
    }

    set projectDir(value: string) {
        this._projectDir = value;
    }

    public async initServices(params: any = {}, required: Array<string> = []): Promise<any>{
        params['$kernel'] = this;
        params['$appScope'] = this.appScope;

        let serviceStored:any = {};

        let services = this.services;
        for (let serviceKey in services){
            let instances = services[serviceKey].instances(params);
            for(let instanceKey in instances){
                if(required.includes(instanceKey) || required.length === 0) {
                    params[instanceKey] = await instances[instanceKey];
                    serviceStored [instanceKey] = services[serviceKey];
                }
            }
        }

        params['$finalize'] = () => {
            for (let serviceKey in serviceStored) {
                serviceStored[serviceKey].finalize(params);
            }
        }

        return params;
    }



}
