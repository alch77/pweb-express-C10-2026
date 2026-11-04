import { NextFunction, Request, Response } from "express";

// Catat setiap request setelah response selesai.
export const logger = (req: Request, res: Response, next: NextFunction) => {
    res.on("finish", () => {
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode}`);
    });

    next();
};
