import {CronJob} from 'cron';
export const Initializer = () => {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor){
        __kernel.onReady(async function (){
            let params = await __kernel.initServices({}, []);
            let args = getParamNamesFunctions(descriptor.value);
            let dataParams:Array<any> = [];
            args.forEach((arg:any)=>  dataParams.push(params[arg] || undefined));
            Reflect.apply(descriptor.value, undefined, dataParams);
        });
    }
}

export const Cron = (interval: string = '* * * * * *') => {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor){
        let job = new CronJob(interval, async function() {
            let params = await __kernel.initServices({}, []);
            let args = getParamNamesFunctions(descriptor.value);
            let dataParams:Array<any> = [];
            args.forEach((arg:any)=>  dataParams.push(params[arg] || undefined));
            Reflect.apply(descriptor.value, undefined, dataParams);
        });
        __kernel.onReady( ()=> job.start());
    }
}