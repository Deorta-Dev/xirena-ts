
declare global {
    var getParamNamesFunctions: Function;

    interface String {
        normalize(): string;
        /**
         * Replace all instances of a substring in a string, using a regular expression or search string.
         * @param searchValue A string to search for.
         * @param replaceValue A string containing the text to replace for every successful match of searchValue in this string.
         */
        replaceAll(searchValue: string | RegExp, replaceValue: string): string;

        replaceIgAll(searchValue: string | RegExp, replaceValue: string): string;

        isLetter(): boolean;

        toUnicode(): string;

        toProperCase(): string;

        cleanAccents(): string;

        htmlEncode(): string;

        htmlDecode(): string;

        firstWord(): string

        hasIgnoreFormat( string: string ): boolean;

    }

    interface Array<T> {
        clone(): Array<T>;
        find( parameters: any ): Array<T>;
        replace( parameters: Array<any>, object: any ): Array<T>;
        exists( parameters: Array<any> ): boolean;
        count( parameters: Array<any> ): number;
        getIndexFind( parameters: Array<any> ): number;
        remove( index: number ): boolean;
        removeObject( object: any ): boolean;
    }
}

export default function globalFunctions(){

    global.getParamNamesFunctions = (func: Function) => {
        let STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
        let ARGUMENT_NAMES = /([^\s,]+)/g;
        let fnStr = func.toString().replace(STRIP_COMMENTS, '');
        let result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
        if(result === null)
            result = [];
        return result;
    }
    /**
     * Global Functions
     */

    /**
     * Metodo para desencriptar de Base64
     * @param string
     */


    /**
     * String Functions
     */

    String.prototype.replaceAll = function (searchValue: string | RegExp, replaceValue: string): string {
        if(typeof searchValue === 'string'){
            searchValue = new RegExp(searchValue);
        }
        return this.replace(searchValue, replaceValue);
    };

    String.prototype.normalize = function (): string {
        return this
            .replaceAll("??", 'a')
            .replaceAll("??", 'e')
            .replaceAll("??", 'i')
            .replaceAll("??", 'o')
            .replaceAll("??", 'u')
            .replaceAll("??", 'u')
            .replaceAll("??", 'n')
            .replaceAll("??", 'A')
            .replaceAll("??", 'E')
            .replaceAll("??", 'I')
            .replaceAll("??", 'O')
            .replaceAll("??", 'U')
            .replaceAll("??", 'U')
            .replaceAll("??", 'N');
    };

    String.prototype.isLetter = function () {
        if (this.length === 1 && this.match(/[a-z]/i))
            return true;
        else return false
    };
    String.prototype.toProperCase = function ():string {
        return this.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    };
    String.prototype.toUnicode = function () {
        return this
            .replaceAll("??", '\u00E1')
            .replaceAll("??", '\u00E9')
            .replaceAll("??", '\u00ED')
            .replaceAll("??", '\u00F3')
            .replaceAll("??", '\u00FA')
            .replaceAll("??", '\u00FC')
            .replaceAll("??", '\u00F1')
            .replaceAll("??", '\u00C1')
            .replaceAll("??", '\u00C9')
            .replaceAll("??", '\u00CD')
            .replaceAll("??", '\u00D3')
            .replaceAll("??", '\u00DA')
            .replaceAll("??", '\u00DC')
            .replaceAll("??", '\u00D1');
    };


    String.prototype.replaceAll = function (search, replacement) {
        let target = this;
        return target.replace(new RegExp(search), replacement);
    };

    String.prototype.hasIgnoreFormat = function (string: string): boolean {
        string = string.toLowerCase().normalize();
        let find: string = this.toLowerCase().normalize();
        return (new RegExp(string)).test(find);
    };


    String.prototype.cleanAccents = function () {
        let rp = this;
        return rp.replaceAll("??", 'a')
            .replaceAll("??", 'e')
            .replaceAll("??", 'i')
            .replaceAll("??", 'o')
            .replaceAll("??", 'u')
            .replaceAll("??", 'u')
            .replaceAll("??", 'n')
            .replaceAll("??", 'A')
            .replaceAll("??", 'E')
            .replaceAll("??", 'I')
            .replaceAll("??", 'O')
            .replaceAll("??", 'U')
            .replaceAll("??", 'U')
            .replaceAll("??", 'N');
    };

    String.prototype.htmlEncode = function ():string {
        let rp: string = this + '';
        rp = rp.replaceAll("??", '&aacute;');
        rp = rp.replaceAll("??", '&eacute;');
        rp = rp.replaceAll("??", '&iacute;');
        rp = rp.replaceAll("??", '&oacute;');
        rp = rp.replaceAll("??", '&uacute;');
        rp = rp.replaceAll("??", '&ntilde;');
        rp = rp.replaceAll("??", '&uuml;');
        rp = rp.replaceAll("??", '&Aacute;');
        rp = rp.replaceAll("E", '&Eacute;');
        rp = rp.replaceAll("??", '&Iacute;');
        rp = rp.replaceAll("??", '&Oacute;');
        rp = rp.replaceAll("??", '&Uacute;');
        rp = rp.replaceAll("??", '&Ntilde;');
        rp = rp.replaceAll("??", '&Uuml;');
        return rp;
    };

    String.prototype.htmlDecode = function () {
        let rp:string = this + '';
        rp = rp.replaceAll("&aacute;", '??');
        rp = rp.replaceAll("&eacute;", '??');
        rp = rp.replaceAll("&iacute;", '??');
        rp = rp.replaceAll("&oacute;", '??');
        rp = rp.replaceAll("&uacute;", '??');
        rp = rp.replaceAll("&ntilde;", '??');
        rp = rp.replaceAll("&uuml;", '??');
        rp = rp.replaceAll("&Aacute;", '??');
        rp = rp.replaceAll("&Eacute;", '??');
        rp = rp.replaceAll("&Iacute;", '??');
        rp = rp.replaceAll("&Oacute;", '??');
        rp = rp.replaceAll("&Uacute;", '??');
        rp = rp.replaceAll("&Ntilde;", '??');
        rp = rp.replaceAll("&Uuml;", '??');
        return rp;
    };

    String.prototype.firstWord = function () {
        return this.split(' ')[0];
    };


    /**
     * Array Functions
     */


    Array.prototype.clone = function () {
        return this.slice(0);
    };

    Array.prototype.find = function (parameters: any): Array<any> {
        let is = true;
        let objects: Array<any> = [];
        for (let i = 0; i < this.length; i++) {
            is = true;
            for (let key in parameters) {
                if (this[i][key] !== parameters[key]) {
                    is = false;
                    break;
                }
            }
            if (is) {
                objects.push(this[i]);
            }
        }
        return objects;
    };

    Array.prototype.replace = function (parameters, object) {
        let is = true;
        for (let i = 0; i < this.length; i++) {
            is = true;
            for (let key in parameters) {
                if (this[i][key] !== parameters[key]) {
                    is = false;
                    break;
                }
            }
            if (is) {
                this[i] = object;
            }
        }
        return this;
    };

    Array.prototype.exists = function (parameters) {
        for (let i = 0; i < this.length; i++) {
            let is = true;
            for (let key in parameters) {
                if (this[i][key] !== parameters[key]) {
                    is = false;
                    break;
                }
            }
            if (is) return true;
        }
        return false;
    };

    Array.prototype.count = function (parameters) {
        let objects = [];
        for (let i = 0; i < this.length; i++) {
            let is = true;
            for (let key in parameters) {
                if (this[i][key] !== parameters[key]) {
                    is = false;
                    break;
                }
            }
            if (is) {
                objects.push(this[i]);
            }
        }
        return objects.length;
    };

    Array.prototype.getIndexFind = function (parameters) {
        for (let i = 0; i < this.length; i++) {
            let is = true;
            for (let key in parameters) {
                if (this[i][key] !== parameters[key]) {
                    is = false;
                    break;
                }
            }
            if (is) return i;
        }
        return -1;
    };

    Array.prototype.remove = function (x): boolean {
        this.splice(x, 1);
        return true;
    };

    Array.prototype.removeObject = function (object) {
        for (let i = 0; i < this.length; i++) {
            if (this[i] === object) {
                this.remove(i);
                return true;
            }
        }
        return false;
    };


    console.log("> Created -> global functions");

}
