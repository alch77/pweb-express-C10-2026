import { Request, Response } from "express";

// Dipasang paling akhir: menangkap URL yang tidak terdaftar.
export const notFound = (req: Request, res: Response) => {
    res.status(404).json({
        status: false,
        message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`,
    });
};
