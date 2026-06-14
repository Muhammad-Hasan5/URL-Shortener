import type { Request } from "express";

export function getClientIp(req: Request){
    const forwarded = req.headers["x-forwarded-for"]
    if(forwarded){
        return forwarded[0]?.trim()
    }
    return req.socket.remoteAddress
}