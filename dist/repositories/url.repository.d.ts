export declare const saveToDB: (result: {
    id: number;
    shortCode: string;
    longURL: string;
}) => Promise<import("pg").QueryResult<any> | undefined>;
export declare const getFromDB: (shortCode: string) => Promise<import("pg").QueryResult<any> | undefined>;
//# sourceMappingURL=url.repository.d.ts.map