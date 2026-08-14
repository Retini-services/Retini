import { z } from 'zod';

export const BrowserPluginManifestSchema = z.object({
	manifestVersion: z.number().int().positive(),

	pluginApiVersion: z.number().int().positive(),

	id: z
		.string()
		.min(1)
		.regex(
			/^[a-zA-Z0-9._-]+$/,
			'Plugin ID may only contain letters, numbers, dots, underscores, and hyphens.'
		),

	name: z.string().min(1),
	version: z.string().min(1),
	author: z.string().optional(),
	description: z.string().optional(),
	entry: z.string().min(1),
	icon: z.string().optional(),
	homepage: z.url().optional(),
	repository: z.url().optional(),
	permissions: z.array(z.string()).default([])
});

export type BrowserPluginManifest = z.infer<
	typeof BrowserPluginManifestSchema
>;