import GlobalFunction from './GlobalFunctions';
import fs from 'fs';
import path from 'path';
import {AbstractService} from "./AbstractService";

declare global {
    var __kernel: Kernel;
}

export class Kernel {

    private _configDir: string = '';
    private _configs: any = {};
    private _services: any = {};
    private _projectDir: string = "";

    private _runReady = false;
    private _listenerReady: Array<any> = [];

    constructor() {

        console.log("┌----------------------------------┐");
        console.log("├------ Initializer Xirena TS -----┤");
        console.log("└----------------------------------┘");

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
                        console.log(` --> ${file.relative}`);
                        let ClassController = require(file.absolute) ;
                        /*if (typeof ClassController === 'function') {
                            let controller = new ClassController($this);
                            controller.kernel = $this;
                        }*/
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
                            if(key !== 'AbstractService') {
                                let ClassService = services[key];
                                let objectService: AbstractService = new ClassService();
                                if (objectService) {
                                    await objectService.build($this);
                                    let name:string = ClassService.$name;
                                    if(name === undefined){
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
            let exp: any;
            for(exp of explorer){
                if (!Array.isArray(exp)) {
                    if (exp['mapping'] === 'auto') {
                        let src = exp['src'];
                        let directoryPath = exp.absolute ? src : path.join(this._projectDir, src);
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
        await this.prepareServices();
        await this.prepareControllers();
    }


    public startServer(): void{

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


    public addDecoration(decorationName:string, decorationFunction: any){

    }

    public addService(serviceName:string, serviceFunction: any){

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
}
