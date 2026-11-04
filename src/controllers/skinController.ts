import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// GET /api/skins
export const getSkins = async (req: Request, res: Response) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Number(req.query.limit) || 10);
        const heroId = req.query.heroId ? Number(req.query.heroId) : undefined;
        const rarity = req.query.rarity
            ? String(req.query.rarity).toUpperCase()
            : undefined;

        const where: any = {};

        if (heroId !== undefined) {
            where.heroId = heroId;
        }

        if (rarity) {
            where.rarity = rarity;
        }

        const totalItems = await prisma.skin.count({ where });

        const skins = await prisma.skin.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                id: "asc",
            },
            include: {
                hero: true,
            },
        });

        res.json({
            status: true,
            message: "Berhasil mengambil data Skin",
            data: skins,
            metadata: {
                currentPage: page,
                limit,
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
            },
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: "Gagal mengambil data Skin",
        });
    }
};

// GET /api/skins/:skin_id
export const getSkinById = async (req: Request, res: Response) => {
    try {
        const skinId = Number(req.params.skin_id);

        if (!Number.isInteger(skinId) || skinId <= 0) {
            return res.status(400).json({
                status: false,
                message: "ID Skin tidak valid",
            });
        }

        const skin = await prisma.skin.findUnique({
            where: {
                id: skinId,
            },
            include: {
                hero: true,
            },
        });

        if (!skin) {
            return res.status(404).json({
                status: false,
                message: "Skin tidak ditemukan",
            });
        }

        res.json({
            status: true,
            message: "Berhasil mengambil detail Skin",
            data: skin,
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: "Gagal mengambil detail Skin",
        });
    }
};
