import { PUBLIC_PROXY_URL } from '$env/static/public';

export type ProxyTransport = 'epoxy' | 'libcurl';

export type ProxyController = {
    createFrame: (
        element: HTMLIFrameElement,
        options?: {
            plugins?: unknown[];
        }
    ) => {
        go: (url: string) => void;
        back: () => void;
        forward: () => void;
        reload: () => void;
    };
    wait: () => Promise<void>;
};

let controller: ProxyController | null = null;

function path(pathname: string) {
    return `${PUBLIC_PROXY_URL}${pathname}`;
}

export async function initProxy(
    transport: ProxyTransport = 'epoxy'
): Promise<ProxyController> {
    if (typeof window === 'undefined') {
        throw new Error('Proxy can only be initialized in the browser.');
    }

    const bootstrapModule = await import(
        '@mercuryworkshop/proxy-bootstrap/dist/bootstrap-client.js'
    );

    const config = {
        transport,

        swPath: path('/sw.js'),
        wispPath: '/wisp/',

        epoxyClientPath: path('/clients/epoxy-client.js'),
        libcurlClientPath: path('/clients/libcurl-client.js'),
        bareClientPath: '',

        bootstrapInitPath: path('/bootstrap-init.js'),

        scramjetControllerApiPath: path(
            '/controller/controller.api.js'
        ),

        scramjetControllerInjectPath: path(
            '/controller/controller.inject.js'
        ),

        scramjetControllerSwPath: path(
            '/controller/controller.sw.js'
        ),

        scramjetBundlePath: path('/scram/scramjet.js'),
        scramjetWasmPath: path('/scram/scramjet.wasm'),
        scramjetUtilsBundlePath: path('/scram/scramjet-utils.js'),

        bootstrapApiPath: '',
    };

    controller = await bootstrapModule.init(config);

    await controller.wait();

    return controller;
}

export function getProxyController() {
    return controller;
}