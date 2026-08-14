import { BrowserPluginManifestSchema } from '$lib/schemas';
import type { BrowserPluginManifest } from "$lib/schemas"
import type { BrowserPlugin, BrowserPluginExport } from './types';

const STORAGE_KEY = 'retini_browser_plugins';
const EXPORT_FORMAT_VERSION = 1;
const PLUGIN_API_VERSION = 1;

class BrowserPluginManager {
    private plugins: BrowserPlugin[] = [];
    private loaded = false;

    load(): BrowserPlugin[] {
        if (typeof window === 'undefined') {
            return [];
        }

        if (this.loaded) {
            return this.getAll();
        }

        try {
            const stored = localStorage.getItem(STORAGE_KEY);

            if (!stored) {
                this.plugins = [];
                this.loaded = true;
                return [];
            }

            const parsed: unknown = JSON.parse(stored);

            if (!Array.isArray(parsed)) {
                console.error(
                    '[BrowserPlugins] Invalid plugin storage format.'
                );

                this.plugins = [];
                this.loaded = true;

                return [];
            }

            this.plugins = parsed.filter(
                (plugin): plugin is BrowserPlugin =>
                    this.isStoredPlugin(plugin)
            );

            this.loaded = true;

            return this.getAll();
        } catch (error) {
            console.error(
                '[BrowserPlugins] Failed to load plugins:',
                error
            );

            this.plugins = [];
            this.loaded = true;

            return [];
        }
    }

    private save(): void {
        if (typeof window === 'undefined') {
            return;
        }

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(this.plugins)
        );
    }

    private ensureLoaded(): void {
        if (!this.loaded) {
            this.load();
        }
    }

    async register(
        manifestUrl: string
    ): Promise<BrowserPlugin> {
        this.ensureLoaded();

        const normalizedUrl = manifestUrl.trim();

        if (!normalizedUrl) {
            throw new Error(
                'Plugin manifest URL cannot be empty.'
            );
        }

        let url: URL;

        try {
            url = new URL(normalizedUrl);
        } catch {
            throw new Error(
                'Plugin manifest URL is not valid.'
            );
        }

        if (
            url.protocol !== 'https:' &&
            url.protocol !== 'http:'
        ) {
            throw new Error(
                'Plugin manifest URL must use HTTP or HTTPS.'
            );
        }

        const manifest =
            await this.fetchManifest(url.href);

        const existing = this.plugins.find(
            (plugin) => plugin.id === manifest.id
        );

        if (existing) {
            throw new Error(
                `Plugin "${manifest.id}" is already registered.`
            );
        }

        const plugin: BrowserPlugin = {
            id: manifest.id,
            name: manifest.name,
            version: manifest.version,
            manifestUrl: url.href,
            manifest,
            enabled: true,
            installedAt: Date.now()
        };

        this.plugins.push(plugin);
        this.save();

        console.log(
            `[BrowserPlugins] Installed "${plugin.name}" (${plugin.id}).`
        );

        return { ...plugin };
    }

    remove(id: string): boolean {
        this.ensureLoaded();

        const index = this.plugins.findIndex(
            (plugin) => plugin.id === id
        );

        if (index === -1) {
            return false;
        }

        this.plugins.splice(index, 1);
        this.save();

        console.log(
            `[BrowserPlugins] Removed "${id}".`
        );

        return true;
    }

    enable(id: string): boolean {
        this.ensureLoaded();

        const plugin = this.plugins.find(
            (plugin) => plugin.id === id
        );

        if (!plugin) {
            return false;
        }

        plugin.enabled = true;
        this.save();

        return true;
    }

    disable(id: string): boolean {
        this.ensureLoaded();

        const plugin = this.plugins.find(
            (plugin) => plugin.id === id
        );

        if (!plugin) {
            return false;
        }

        plugin.enabled = false;
        this.save();

        return true;
    }

    setEnabled(
        id: string,
        enabled: boolean
    ): boolean {
        return enabled
            ? this.enable(id)
            : this.disable(id);
    }

    toggle(id: string): boolean | null {
        this.ensureLoaded();

        const plugin = this.plugins.find(
            (plugin) => plugin.id === id
        );

        if (!plugin) {
            return null;
        }

        plugin.enabled = !plugin.enabled;

        this.save();

        return plugin.enabled;
    }

    get(
        id: string
    ): BrowserPlugin | undefined {
        this.ensureLoaded();

        const plugin = this.plugins.find(
            (plugin) => plugin.id === id
        );

        return plugin
            ? this.clonePlugin(plugin)
            : undefined;
    }

    getAll(): BrowserPlugin[] {
        this.ensureLoaded();

        return this.plugins.map(
            (plugin) => this.clonePlugin(plugin)
        );
    }

    getEnabled(): BrowserPlugin[] {
        return this.plugins
            .filter((plugin) => plugin.enabled)
            .map((plugin) => this.clonePlugin(plugin));
    }

    has(id: string): boolean {
        return Boolean(this.get(id));
    }

    async refresh(
        id: string
    ): Promise<BrowserPlugin> {
        this.ensureLoaded();

        const existing = this.plugins.find(
            (plugin) => plugin.id === id
        );

        if (!existing) {
            throw new Error(
                `Plugin "${id}" is not registered.`
            );
        }

        const refreshed =
            await this.fetchManifest(
                existing.manifestUrl
            );

        if (refreshed.id !== existing.id) {
            throw new Error(
                `The refreshed manifest changed its plugin ID from "${existing.id}" to "${refreshed.id}".`
            );
        }

        const updated: BrowserPlugin = {
            ...existing,
            name: refreshed.name,
            version: refreshed.version,
            manifest: refreshed,
            enabled: existing.enabled
        };

        const index = this.plugins.findIndex(
            (plugin) => plugin.id === id
        );

        this.plugins[index] = updated;
        this.save();

        return this.clonePlugin(updated);
    }

    export(): BrowserPluginExport {
        this.ensureLoaded();

        return {
            formatVersion: EXPORT_FORMAT_VERSION,
            plugins: this.plugins.map(
                (plugin) => ({
                    id: plugin.id,
                    manifestUrl: plugin.manifestUrl,
                    enabled: plugin.enabled
                })
            )
        };
    }

    exportBlob(): Blob {
        return new Blob(
            [
                JSON.stringify(
                    this.export(),
                    null,
                    2
                )
            ],
            {
                type: 'application/json'
            }
        );
    }

    async import(
        input: string | unknown
    ): Promise<BrowserPlugin[]> {
        this.ensureLoaded();

        let parsed: unknown;

        if (typeof input === 'string') {
            try {
                parsed = JSON.parse(input);
            } catch {
                throw new Error(
                    'Plugin import file contains invalid JSON.'
                );
            }
        } else {
            parsed = input;
        }

        if (
            typeof parsed !== 'object' ||
            parsed === null
        ) {
            throw new Error(
                'Invalid plugin import file.'
            );
        }

        const data =
            parsed as Record<string, unknown>;

        if (
            data.formatVersion !==
            EXPORT_FORMAT_VERSION
        ) {
            throw new Error(
                `Unsupported plugin export format. Expected version ${EXPORT_FORMAT_VERSION}.`
            );
        }

        if (!Array.isArray(data.plugins)) {
            throw new Error(
                'Plugin export does not contain a valid plugins array.'
            );
        }

        const imported: BrowserPlugin[] = [];

        for (const item of data.plugins) {
            if (
                typeof item !== 'object' ||
                item === null
            ) {
                continue;
            }

            const pluginData =
                item as Record<string, unknown>;

            if (
                typeof pluginData.manifestUrl !==
                'string'
            ) {
                continue;
            }

            try {
                const plugin =
                    await this.register(
                        pluginData.manifestUrl
                    );

                if (
                    pluginData.enabled === false
                ) {
                    this.disable(plugin.id);
                    plugin.enabled = false;
                }

                imported.push(plugin);
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.message.includes(
                        'is already registered'
                    )
                ) {
                    continue;
                }

                console.error(
                    '[BrowserPlugins] Failed to import plugin:',
                    error
                );
            }
        }

        return imported;
    }

    private async fetchManifest(
        manifestUrl: string
    ): Promise<BrowserPluginManifest> {
        let url: URL;

        try {
            url = new URL(manifestUrl);
        } catch {
            throw new Error(
                'Plugin manifest URL is not valid.'
            );
        }

        if (
            url.protocol !== 'https:' &&
            url.protocol !== 'http:'
        ) {
            throw new Error(
                'Plugin manifest URL must use HTTP or HTTPS.'
            );
        }

        let response: Response;

        try {
            response = await fetch(url.href);
        } catch (error) {
            throw new Error(
                `Failed to fetch plugin manifest: ${error instanceof Error
                    ? error.message
                    : 'Network error'
                }`
            );
        }

        if (!response.ok) {
            throw new Error(
                `Failed to fetch plugin manifest: HTTP ${response.status}`
            );
        }

        let rawManifest: unknown;

        try {
            rawManifest = await response.json();
        } catch {
            throw new Error(
                'Plugin manifest is not valid JSON.'
            );
        }

        const result =
            BrowserPluginManifestSchema.safeParse(
                rawManifest
            );

        if (!result.success) {
            const issues =
                result.error.issues
                    .map((issue) => {
                        const path =
                            issue.path.length > 0
                                ? issue.path.join('.')
                                : 'manifest';

                        return `${path}: ${issue.message}`;
                    })
                    .join('\n');

            throw new Error(
                `Invalid plugin manifest:\n${issues}`
            );
        }

        const manifest =
            result.data;

        if (
            manifest.pluginApiVersion !==
            PLUGIN_API_VERSION
        ) {
            throw new Error(
                `Plugin "${manifest.name}" requires plugin API version ${manifest.pluginApiVersion}, but this app supports version ${PLUGIN_API_VERSION}.`
            );
        }

        try {
            new URL(
                manifest.entry,
                url.href
            );
        } catch {
            throw new Error(
                `Plugin "${manifest.id}" has an invalid entry URL.`
            );
        }

        return manifest;
    }

    private isStoredPlugin(
        value: unknown
    ): value is BrowserPlugin {
        if (
            typeof value !== 'object' ||
            value === null
        ) {
            return false;
        }

        const plugin =
            value as Record<string, unknown>;

        if (
            typeof plugin.id !== 'string' ||
            typeof plugin.name !== 'string' ||
            typeof plugin.version !== 'string' ||
            typeof plugin.manifestUrl !== 'string' ||
            typeof plugin.enabled !== 'boolean' ||
            typeof plugin.installedAt !== 'number'
        ) {
            return false;
        }

        const manifestResult =
            BrowserPluginManifestSchema.safeParse(
                plugin.manifest
            );

        return manifestResult.success;
    }

    private clonePlugin(
        plugin: BrowserPlugin
    ): BrowserPlugin {
        return {
            ...plugin,
            manifest: {
                ...plugin.manifest,
                permissions: [
                    ...plugin.manifest.permissions
                ]
            }
        };
    }
}

export const browserPluginManager =
    new BrowserPluginManager();