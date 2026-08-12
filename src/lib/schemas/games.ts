import { z } from "zod";

export const GamesStructureSchema = z.object({
	title: z.string().trim().min(1),
	rating: z.string().trim().min(1),
	releaseDate: z.string().trim().min(1),
	url: z.string().trim().min(1),
	tags: z.array(z.string()),
	image: z.string().trim().min(1)
});

export const JsonStructureSchema = z.object({
	YoooJsonWorks: z.literal(true),
	games: z.array(GamesStructureSchema)
});