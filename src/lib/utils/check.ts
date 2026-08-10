import type { GamesStructure } from "../types/global";

/**
 * Type guard to validate an unknown object matches the GamesStructure interface
 */
function isValidGame(game: unknown): game is GamesStructure {
    if (typeof game !== "object" || game === null) return false;

    const g = game as Record<keyof GamesStructure, unknown>;

    return (
        typeof g.title === "string" && g.title.trim() !== "" &&
        typeof g.rating === "string" && g.rating.trim() !== "" &&
        typeof g.releaseDate === "string" && g.releaseDate.trim() !== "" &&
        typeof g.url === "string" && g.url.trim() !== "" &&
        Array.isArray(g.tags) && g.tags.every((tag) => typeof tag === "string") &&
        typeof g.image === "string" && g.image.trim() !== ""
    );
}

export async function CheckJson(jsonUrl: string): Promise<boolean> {
    try {
        const response = await fetch(jsonUrl);

        if (!response.ok) return false;

        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("application/json")) return false;

        const parsedJson = await response.json();

        if (!parsedJson?.YoooJsonWorks || !Array.isArray(parsedJson.games)) {
            return false;
        }

        return parsedJson.games.every(isValidGame);
    } catch {
        return false;
    }
}