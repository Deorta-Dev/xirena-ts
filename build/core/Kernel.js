"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Kernel = void 0;
const GlobalFunctions_1 = __importDefault(require("./GlobalFunctions"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const AbstractService_1 = require("./AbstractService");
const AbstractController_1 = require("./AbstractController");
class Kernel {
    constructor() {
        this._configDir = '';
        this._configs = {};
        this._services = {};
        this._projectDir = "";
        this._runReady = false;
        this._listenerReady = [];
        this._isLocal = true;
        console.log("┌-----------------------------------┐");
        console.log("├------ Initializer Xirena TS ------┤");
        console.log("└-----------------------------------┘");
        GlobalFunctions_1.default();
        global.__kernel = this;
    }
    get appScope() {
        return this._appScope;
    }
    set appScope(value) {
        this._appScope = value;
    }
    prepareControllers() {
        return __awaiter(this, void 0, void 0, function* () {
            let config = this.getConfig('initial');
            let $this = this;
            /**
             * Build Controllers
             */
            let controllerBuilds = [];
            console.log(` Loading Controllers`);
            if (config['controllers'] !== undefined) {
                if (config['controllers']['mapping'] === 'auto') {
                    let src = config['controllers']['src'];
                    let directoryPath = path_1.default.join(this._projectDir, src);
                    let files = this.getFilesDirectory(directoryPath, undefined, true);
                    files.forEach((file) => {
                        if (file.relative.endsWith('Controller.js')) {
                            let controllers = require(file.absolute);
                            for (let key in controllers) {
                                let ClassController = controllers[key];
                                if (ClassController !== AbstractController_1.AbstractController)
                                    console.log(` --> ${file.relative}: ${key}`);
                            }
                        }
                    });
                }
            }
        });
    }
    prepareServices() {
        return __awaiter(this, void 0, void 0, function* () {
            let config = this.getConfig('initial');
            let $this = this;
            console.log(` Loading Services`);
            let explorer = config.services;
            if (explorer) {
                if (!Array.isArray(explorer))
                    explorer = [explorer];
                function importServices(files) {
                    return __awaiter(this, void 0, void 0, function* () {
                        let file;
                        for (file of files) {
                            if (file.relative.endsWith('Service.js')) {
                                let services = require(file.absolute);
                                let keys = Object.keys(services);
                                let key;
                                for (key of keys) {
                                    if (key && key !== '') {
                                        let ClassService = services[key];
                                        if (ClassService !== AbstractService_1.AbstractService) {
                                            console.log(` --> ${file.relative}: ${key}`);
                                            let objectService = new ClassService();
                                            if (objectService instanceof AbstractService_1.AbstractService) {
                                                let name = ClassService.$name;
                                                if (name === undefined) {
                                                    name = key.replace(/[S][e][r][v][i][c][e]$/, '');
                                                    name = name.charAt(0).toLowerCase() + name.slice(1);
                                                }
                                                yield objectService.build($this);
                                                $this.addService(name, objectService);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
                let exp;
                for (exp of explorer) {
                    if (!Array.isArray(exp)) {
                        if (exp['mapping'] === 'auto') {
                            let src = exp['src'];
                            let directoryPath = exp.absolute ? src : path_1.default.join(this._projectDir, src);
                            if (!this._isLocal) {
                                yield importServices(this.getFilesDirectory(path_1.default.join(__dirname, '../'), undefined, true));
                            }
                            yield importServices(this.getFilesDirectory(directoryPath, undefined, true));
                        }
                    }
                    else {
                        yield importServices(exp.map(e => {
                            return {
                                relative: e,
                                absolute: path_1.default.join(this._projectDir, e)
                            };
                        }));
                    }
                }
            }
        });
    }
    prepare() {
        return __awaiter(this, void 0, void 0, function* () {
            this._isLocal = true;
            yield this.prepareServices();
            yield this.prepareControllers();
        });
    }
    prepareServer() {
        return __awaiter(this, void 0, void 0, function* () {
            this._isLocal = false;
            yield this.prepareServices();
            yield this.prepareControllers();
        });
    }
    startApplication() {
        this._listenerReady.forEach((fn) => fn());
    }
    getFilesDirectory(directory, origDirectory, findSub = false) {
        directory = directory.replace(/\\\\/, '\\\\');
        while (directory.endsWith("\\"))
            directory = directory.slice(0, -1);
        origDirectory = origDirectory || directory;
        let result = [];
        let files = fs_1.default.readdirSync(directory, { withFileTypes: true });
        let javascriptER = /.*\.js$/;
        let $this = this;
        files.forEach(function (file) {
            if (file.isDirectory()) {
                if (findSub) {
                    let directoryPath = path_1.default.join(directory, file.name + "\\");
                    let subResult = $this.getFilesDirectory(directoryPath, origDirectory, true);
                    subResult.forEach((sub) => result.push(sub));
                }
            }
            else {
                if (javascriptER.test(file.name)) {
                    file.absolute = path_1.default.join(directory, file.name);
                    file.relative = file.absolute.replace(origDirectory, '');
                    result.push(file);
                }
            }
        });
        return result;
    }
    addService(serviceName, serviceFunction) {
        this.services[serviceName] = serviceFunction;
    }
    getConfig(name) {
        if (this._configs[name] === undefined) {
            let dir = this._configDir ? path_1.default.join(this._configDir, name + ".json") : path_1.default.join(this._projectDir, "config/" + name + ".json");
            if (fs_1.default.existsSync(dir)) {
                if (this._configs === undefined)
                    this._configs = {};
                if (this._configs[name] === undefined)
                    this._configs[name] = require(dir);
            }
        }
        return this._configs[name];
    }
    onReady(fn) {
        this._listenerReady.push(fn);
    }
    get configDir() {
        return this._configDir;
    }
    set configDir(value) {
        this._configDir = value;
    }
    get services() {
        return this._services;
    }
    set services(value) {
        this._services = value;
    }
    get projectDir() {
        return this._projectDir;
    }
    set projectDir(value) {
        this._projectDir = value;
    }
    initServices(params = {}, required = []) {
        return __awaiter(this, void 0, void 0, function* () {
            params['$kernel'] = this;
            params['$appScope'] = this.appScope;
            let serviceStored = {};
            let services = this.services;
            for (let serviceKey in services) {
                let instances = services[serviceKey].instances(params);
                for (let instanceKey in instances) {
                    if (required.includes(instanceKey)) {
                        params[instanceKey] = yield instances[instanceKey];
                        serviceStored[instanceKey] = services[serviceKey];
                    }
                }
            }
            params['$finalize'] = () => {
                for (let serviceKey in serviceStored) {
                    serviceStored[serviceKey].finalize(params);
                }
            };
            return params;
        });
    }
}
exports.Kernel = Kernel;
