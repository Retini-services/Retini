export async function CheckJson(jsonUrl: string): Promise<boolean> {
    try {
        const response = await fetch(jsonUrl);

        if (!response.ok) return false;

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            return false;
        }

        const parsedJson = await response.json();

        return Boolean(parsedJson?.YoooJsonWorks);
    } catch {
        return false;
    }
}