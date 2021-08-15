// Generated file
export type Service = {
    id: string;
    port: number;
    sourceUrl: string;
    desiredVersion?: string;
    package: {
        sourceType: (("file" | "git") & string);
        installedVersion?: string;
        title?: string;
    };
    manifest?: {
        name?: string;
        description?: string;
        author?: string;
        license?: string;
    };
    system: {
        appPort: number;
    };
    installedBy: string;
};
