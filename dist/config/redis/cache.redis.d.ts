export type cacheRecordType = {
    shortCode: string;
    longURL: string;
};
export type shortCodeType = string;
export declare function set(cacheRecord: cacheRecordType): void;
export declare function get(shortCode: shortCodeType): Promise<string | null>;
//# sourceMappingURL=cache.redis.d.ts.map