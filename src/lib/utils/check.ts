import { JsonStructureSchema } from "$lib/schemas";

export async function CheckJson(jsonUrl: string): Promise<boolean> {
    try {
        const response = await fetch(jsonUrl);

        if (!response.ok) return false;

        const contentType = response.headers.get("content-type");

        if (!contentType?.includes("application/json")) {
            return false;
        }

        const parsedJson: unknown = await response.json();

        return JsonStructureSchema.safeParse(parsedJson).success;
    } catch {
        return false;
    }
}