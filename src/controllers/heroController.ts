import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// GET /api/heroes
export const getHeroes = async (req: Request, res: Response) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Number(req.query.limit) || 10);
        const search = String(req.query.search || "");
        const role = String(req.query.role || "");

        const where: any = {};

        if (search) {
            where.name = {
                contains: search,
                mode: "insensitive",
            };
        }

        const validRoles = [
            "TANK",
            "FIGHTER",
            "ASSASSIN",
            "MAGE",
            "MARKSMAN",
            "SUPPORT",
        ];

        if (role) {
            const selectedRole = role.toUpperCase();

            if (!validRoles.includes(selectedRole)) {
                return res.status(400).json({
                    status: false,
                    message: "Role tidak valid",
                });
            }

            where.role = selectedRole;
        }

        const totalItems = await prisma.hero.count({ where });

        const heroes = await prisma.hero.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                id: "asc",
            },
        });

        res.json({
            status: true,
            message: "Berhasil mengambil data Hero",
            data: heroes,
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
            message: "Gagal mengambil data Hero",
        });
    }
};

// GET /api/heroes/:hero_id
export const getHeroById = async (req: Request, res: Response) => {
    try {
        const heroId = Number(req.params.hero_id);

        if (!Number.isInteger(heroId) || heroId <= 0) {
            return res.status(404).json({
                status: false,
                message: "Hero tidak ditemukan",
            });
        }

        const hero = await prisma.hero.findUnique({
            where: {
                id: heroId,
            },
            include: {
                skins: true,
            },
        });

        if (!hero) {
            return res.status(404).json({
                status: false,
                message: "Hero tidak ditemukan",
            });
        }

        res.json({
            status: true,
            message: "Berhasil mengambil detail Hero",
            data: hero,
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: "Gagal mengambil detail Hero",
        });
    }
};

// POST /api/heroes
export const createHero = async (req: Request, res: Response) => {
    try {
        const {
            name,
            role,
            lane,
            releaseYear,
            priceBP,
            priceDiamond,
        } = req.body;

        if (
            !name ||
            !role ||
            !lane ||
            releaseYear === undefined ||
            releaseYear === null ||
            releaseYear === ""
        ) {
            return res.status(400).json({
                status: false,
                message: "Name, role, lane, dan releaseYear wajib diisi",
            });
        }

        const existingHero = await prisma.hero.findUnique({
            where: {
                name: String(name),
            },
        });

        if (existingHero) {
            return res.status(409).json({
                status: false,
                message: "Nama Hero sudah digunakan",
            });
        }

        const hero = await prisma.hero.create({
            data: {
                name: String(name),
                role: String(role).toUpperCase() as any,
                lane: String(lane).toUpperCase() as any,
                releaseYear: Number(releaseYear),
                priceBP:
                    priceBP === "" || priceBP == null
                        ? null
                        : Number(priceBP),
                priceDiamond:
                    priceDiamond === "" || priceDiamond == null
                        ? null
                        : Number(priceDiamond),
            },
        });

        res.status(201).json({
            status: true,
            message: "Hero berhasil ditambahkan",
            data: hero,
        });
    } catch (error: any) {
        if (error.code === "P2002") {
            return res.status(409).json({
                status: false,
                message: "Nama Hero sudah digunakan",
            });
        }

        res.status(500).json({
            status: false,
            message: "Gagal menambahkan Hero",
        });
    }
};