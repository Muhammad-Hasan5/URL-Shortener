import type { QueryResult } from "pg";
type newRecordType = {
    id: string;
    shortCode: string;
    longURL: string;
};
type shortCodeType = string;
export declare const saveToDB: (newRecord: newRecordType) => Promise<QueryResult<any> | undefined>;
export declare const getFromDB: (shortCode: shortCodeType) => Promise<QueryResult<any> | undefined>;
export {};
//# sourceMappingURL=url.repository.d.ts.map