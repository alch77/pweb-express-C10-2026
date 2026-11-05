import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { HttpError } from "../middlewares/httpError";

const ROLES = ["TANK", "FIGHTER", "ASSASSIN", "MAGE", "MARKSMAN", "SUPPORT"];
const LANES = ["EXP", "GOLD", "MID", "JUNGLE", "ROAM"];

// GET /api/heroes
export const getHeroes = async (req: Request, res: Response) => {
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

    if (role) {
        const selectedRole = role.toUpperCase();

        if (!ROLES.includes(selectedRole)) {
            throw new HttpError(400, "Role tidak valid");
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
};

// GET /api/heroes/:hero_id
export const getHeroById = async (req: Request, res: Response) => {
    const heroId = Number(req.params.hero_id);

    if (!Number.isInteger(heroId) || heroId <= 0) {
        throw new HttpError(404, "Hero tidak ditemukan");
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
        throw new HttpError(404, "Hero tidak ditemukan");
    }

    res.json({
        status: true,
        message: "Berhasil mengambil detail Hero",
        data: hero,
    });
};

// POST /api/heroes
export const createHero = async (req: Request, res: Response) => {
    const { name, role, lane, releaseYear, priceBP, priceDiamond } =
        req.body ?? {};

    const heroName = typeof name === "string" ? name.trim() : "";
    const heroRole = String(role ?? "").toUpperCase();
    const heroLane = String(lane ?? "").toUpperCase();

    if (
        !heroName ||
        !heroRole ||
        !heroLane ||
        releaseYear === undefined ||
        releaseYear === null ||
        releaseYear === ""
    ) {
        throw new HttpError(
            400,
            "Name, role, lane, dan releaseYear wajib diisi"
        );
    }

    if (!ROLES.includes(heroRole)) {
        throw new HttpError(400, "Role tidak valid");
    }

    if (!LANES.includes(heroLane)) {
        throw new HttpError(400, "Lane tidak valid");
    }

    const existingHero = await prisma.hero.findUnique({
        where: {
            name: heroName,
        },
    });

    if (existingHero) {
        throw new HttpError(409, "Nama Hero sudah digunakan");
    }

    let hero;

    try {
        hero = await prisma.hero.create({
            data: {
                name: heroName,
                role: heroRole as any,
                lane: heroLane as any,
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
    } catch (error: any) {
        // Nama bentrok saat dua request masuk bersamaan
        if (error.code === "P2002") {
            throw new HttpError(409, "Nama Hero sudah digunakan");
        }

        throw error;
    }

    res.status(201).json({
        status: true,
        message: "Hero berhasil ditambahkan",
        data: hero,
    });
};
