import GlobalFunction from './GlobalFunctions';
import fs from 'fs';
import path from 'path';


export class Kernel {

    private routers: Array <any> = [];
    private listeners: Array <any> = [];
    private globalConfig: any = undefined;
    private configs: any = {};
    private decorations: any = {};
    private services: any = {};
    private projectDir: string = "";

    private runReady = false;
    private listenerReady: Array<any> = [];

    constructor() {

        console.log("┌----------------------------------┐");
        console.log("├------ Initializer Xirena TS -----┤");
        console.log("└----------------------------------┘");

        GlobalFunction();


    }

    private async prepareDecorations(){
        let $this: Kernel = this;
        let explorer;

        let config = this.globalConfig;
        /**
         * Build Annotations
         */
        console.log(` Loading Decorations`);

        if (explorer = config.decorations) {
            if (!Array.isArray(explorer)) explorer = [explorer];
            function importDecorations(files: any) {

                files.forEach((file: any) => {
                    if (file.relative.endsWith('Decoration.js')) {
                        console.log(` --> ${file.relative}`);
                        let annotations = require(file.absolute);
                        let keys = Object.keys(annotations);
                        keys.forEach(key => $this.addDecoration(key, annotations[key]));
                    }
                });
            }

            explorer.forEach(exp => {
                if (!Array.isArray(exp)) {
                    if (exp['mapping'] === 'auto') {
                        let src = exp['src'];
                        let directoryPath = exp.absolute ? src : path.join(this.projectDir, src);
                        importDecorations($this.getFilesDirectory(directoryPath, undefined, true));
                    }
                } else {
                    importDecorations(exp.map(e => {
                        return {
                            relative: e,
                            absolute: path.join(this.projectDir, e)
                        }
                    }));
                }
            });

        }
    }

    private async prepareControllers(){

        let config = this.globalConfig;
        /**
         * Build Controllers
         */
        let controllerBuilds = [];
        console.log(` Loading Controllers`);
        if (config['controllers'] !== undefined) {
            if (config['controllers']['mapping'] === 'auto') {
                let src = config['controllers']['src'];
                let directoryPath = path.join(this.projectDir, src);
                let files = this.getFilesDirectory(directoryPath, undefined, true);
                files.forEach(function (file: any) {
                    if (file.relative.endsWith('Controller.js')) {
                        let buildFile = function () {
                            console.log(` --> ${file.relative}`);
                            import(file.absolute) ;
                        }
                        controllerBuilds.push(buildFile);
                    }
                });
            }
        }
    }

    public async prepareServices(){
        let config = this.globalConfig;
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
                            $this.addService(key, services[key]);
                            await services[key].build($this);
                        }
                    }
                }
            }
            let exp: any;
            for(exp of explorer){
                if (!Array.isArray(exp)) {
                    if (exp['mapping'] === 'auto') {
                        let src = exp['src'];
                        let directoryPath = exp.absolute ? src : path.join(this.projectDir, src);
                        await importServices(this.getFilesDirectory(directoryPath, undefined, true));
                    }
                } else {
                    await importServices(exp.map(e => {
                        return {
                            relative: e,
                            absolute: path.join(this.projectDir, e)
                        }
                    }));
                }
            }



        }

    }

    async prepare(){
        await this.prepareServices();
        await this.prepareDecorations();
        await this.prepareControllers();

    }


    public startServer(): void{

    }

    public getFilesDirectory(directory: string, origDirectory: string| undefined, findSub: boolean = false):Array<any> {
        directory = directory.replace(/\\\\/, '\\\\');
        while(directory.endsWith("\\"))directory = directory.slice(0,-1);
        origDirectory = origDirectory || directory;
        let result: Array<any> = [];
        let files = fs.readdirSync(directory, {withFileTypes: true});
        let javascriptER = /.*\.js$/;
        let $this: Kernel = this;
        files.forEach(function (file: any) {
            if (file.isDirectory() && findSub) {
                let directoryPath = path.join(directory, file.name + "\\");
                let subResult = $this.getFilesDirectory(directoryPath, origDirectory, true);
                subResult.forEach((sub:any) => result.push(sub))
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
}
