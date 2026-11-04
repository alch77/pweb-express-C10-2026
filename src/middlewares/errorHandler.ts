import { NextFunction, Request, Response } from "express";
import { HttpError } from "./httpError";

// Wajib 4 parameter agar Express mengenalinya sebagai error handler.
export const errorHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    const status = err instanceof HttpError ? err.status : 500;
    const message =
        err instanceof HttpError
            ? err.message
            : "Terjadi kesalahan pada server";

    if (!(err instanceof HttpError)) {
        console.error(err);
    }

    res.status(status).json({ status: false, message });
};
