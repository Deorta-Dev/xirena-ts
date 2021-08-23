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

        function getFilesDirectory(directory: string, origDirectory: string) {
            directory = directory.replace(/\\\\/, '\\\\');
            while(directory.endsWith("\\"))directory = directory.slice(0,-1);
            origDirectory = origDirectory || directory;
            let result: Array<any> = [];
            let files = fs.readdirSync(directory, {withFileTypes: true});
            let javascriptER = /.*\.js$/;
            files.forEach(function (file: any) {
                if (file.isDirectory()) {
                    let directoryPath = path.join(directory, file.name + "\\");
                    let subResult = getFilesDirectory(directoryPath, origDirectory);
                    subResult.forEach(sub => result.push(sub))
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

    }

    public startServer(): void{

    }
}