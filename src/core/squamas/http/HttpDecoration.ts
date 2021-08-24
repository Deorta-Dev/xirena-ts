export const Route = (route: string, method: ('GET'|'POST'|'PUSH'|'DELETE') = 'GET', ...args:any) => {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        descriptor.value.route = route;

    };
};

export const Middleware = (name: string, ...args:any) => {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {

    };
};
