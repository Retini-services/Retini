import type { BrowserPluginManifest } from '$lib/schemas';

export interface BrowserPlugin {
    id: string;

    name: string;

    version: string;

    manifestUrl: string;

    manifest: BrowserPluginManifest;

    enabled: boolean;

    installedAt: number;
}

export interface BrowserPluginExport {
    formatVersion: 1;

    plugins: Array<{
        id: string;
        manifestUrl: string;
        enabled: boolean;
    }>;
}