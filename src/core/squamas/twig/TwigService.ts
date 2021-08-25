import {AbstractService, Kernel} from "../../../index";
import path from "path";
import fs from "fs";
import {twig, extendFunction} from "twig";

export class TwigService extends AbstractService {
    private _config: any;

    build(kernel: Kernel): any {
        this._config = kernel.getConfig('twig');
        if (!this._config) return;
        this._config.srcDir = path.join(kernel.projectDir, this._config.src);
    }

    finalize(instances: any): void {
    }

    instances(services: any): any {
        let $this: TwigService = this;
        return {
            render: (twigFile:string, data:any) => {
                (({$response, $request, $kernel}) => {
                    let template = fs.readFileSync(path.join($this._config.srcDir, twigFile), 'utf8');
                    let httpConfig = __kernel.getConfig('http');
                    let initialConfig = __kernel.getConfig('initial');

                    extendFunction("asset", value => {
                        if (initialConfig.prod && httpConfig.domain)
                            return httpConfig.domain + '/' + value;
                        return $request.protocol + '://' + $request.get('host') + '/' + value;
                    });

                    let compiled: string;

                    compiled = twig({
                        data: template,
                        // @ts-ignore
                        "allowInlineIncludes": true,
                        namespaces: {
                            'views': $this._config.srcDir
                        },
                        path: $this._config.srcDir,
                        engineOptions: (info: any) => {
                            return {"path": info.filename}
                        },
                        engine: 'twig',
                        strictVariables: true,
                    }).render(data);
                    $response.send(compiled);
                })(services);

            }
        }
    }

}