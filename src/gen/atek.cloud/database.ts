// Generated file
export type Database = {
    dbId: string;
    cachedMeta?: {
        displayName?: string;
        writable?: boolean;
    };
    network?: {
        access?: (("private" | "public") & string);
    };
    services?: ({
        serviceId?: string;
        alias?: string;
        persist?: boolean;
        presync?: boolean;
    })[];
    createdBy?: {
        accountId?: string;
        serviceId?: string;
    };
    createdAt?: string;
};
