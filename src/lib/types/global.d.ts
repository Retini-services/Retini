export interface GamesStructure {
    title: string;
    rating: string;
    releaseDate: string;
    url: string;
    tags: string[];
    image: string;
}

export interface JsonStructure {
    YoooJsonWorks: boolean;
    games: GamesStructure[];
}