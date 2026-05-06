type cacheRecordType = {
    shortCode: string;
    longURL: string;
};
type shortCodeType = string;
export declare function setToCache(cacheRecord: cacheRecordType): void;
export declare function getFromCache(shortCode: shortCodeType): Promise<string | null>;
export {};
//# sourceMappingURL=cache.service.d.ts.map