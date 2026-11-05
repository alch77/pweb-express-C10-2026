import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// GET /api/statistics
export const getStatistics = async (_req: Request, res: Response) => {
    const [
        totalPlayers,
        totalHeroesOwned,
        diamondSum,
        topOwned,
        heroesPerRoleRaw,
    ] = await Promise.all([
        prisma.player.count(),
        prisma.playerHero.count(),
        prisma.player.aggregate({ _sum: { diamond: true } }),
        prisma.playerHero.groupBy({
            by: ["heroId"],
            _count: { heroId: true },
            // Seri dipecah oleh heroId terkecil agar hasilnya tetap sama
            orderBy: [{ _count: { heroId: "desc" } }, { heroId: "asc" }],
            take: 1,
        }),
        prisma.hero.groupBy({
            by: ["role"],
            _count: { _all: true },
            orderBy: [{ _count: { role: "desc" } }, { role: "asc" }],
        }),
    ]);

    const top = topOwned[0];
    const topHero = top
        ? await prisma.hero.findUnique({ where: { id: top.heroId } })
        : null;

    res.json({
        status: true,
        message: "Berhasil mengambil statistik",
        data: {
            totalPlayers,
            totalHeroesOwned,
            totalDiamond: diamondSum._sum.diamond ?? 0,
            mostOwnedHero:
                top && topHero
                    ? {
                          heroId: topHero.id,
                          name: topHero.name,
                          totalOwners: top._count.heroId,
                      }
                    : null,
            heroesPerRole: heroesPerRoleRaw.map((row) => ({
                role: row.role,
                total: row._count._all,
            })),
        },
    });
};
