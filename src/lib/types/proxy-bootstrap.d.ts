declare module '@mercuryworkshop/proxy-bootstrap/dist/bootstrap-client.js' {
    export interface BootstrapOptions {
        swPath: string;
        scramjetBundlePath: string;
        scramjetControllerApiPath: string;
        scramjetUtilsBundlePath: string;
        scramjetControllerInjectPath: string;
        scramjetWasmPath: string;
        epoxyClientPath: string;
        libcurlClientPath: string;
        wispPath: string;
        transport: 'epoxy' | 'libcurl' | 'bare';
    }

    export function init(config: BootstrapOptions): Promise<any>;

    export function loadRest(
        sw: ServiceWorker,
        config: BootstrapOptions
    ): Promise<any>;
}