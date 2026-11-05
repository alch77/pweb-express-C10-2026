import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { HttpError } from "../middlewares/httpError";

const RARITIES = [
    "COMMON",
    "EXCEPTIONAL",
    "DELUXE",
    "EXQUISITE",
    "GRAND",
    "SUPREME",
];

// GET /api/skins
export const getSkins = async (req: Request, res: Response) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 10);

    const heroId = req.query.heroId ? Number(req.query.heroId) : undefined;

    const rarity = req.query.rarity
        ? String(req.query.rarity).toUpperCase()
        : undefined;

    const where: any = {};

    if (heroId !== undefined) {
        if (!Number.isInteger(heroId) || heroId <= 0) {
            throw new HttpError(400, "Hero ID tidak valid");
        }

        where.heroId = heroId;
    }

    if (rarity) {
        if (!RARITIES.includes(rarity)) {
            throw new HttpError(400, "Rarity tidak valid");
        }

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
            hero: { select: { name: true } },
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
};

// GET /api/skins/:skin_id
export const getSkinById = async (req: Request, res: Response) => {
    const skinId = Number(req.params.skin_id);

    if (!Number.isInteger(skinId) || skinId <= 0) {
        throw new HttpError(404, "Skin tidak ditemukan");
    }

    const skin = await prisma.skin.findUnique({
        where: {
            id: skinId,
        },
        include: {
            hero: { select: { name: true } },
        },
    });

    if (!skin) {
        throw new HttpError(404, "Skin tidak ditemukan");
    }

    res.json({
        status: true,
        message: "Berhasil mengambil detail Skin",
        data: skin,
    });
};
