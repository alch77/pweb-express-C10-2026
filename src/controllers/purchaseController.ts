import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { HttpError } from "../middlewares/httpError";

// POST /api/players/:player_id/heroes
export const buyHero = async (req: Request, res: Response) => {
    const playerId = Number(req.params.player_id);
    const { heroId, currency } = req.body ?? {};

    // 1. Body tidak valid
    if (
        !Number.isInteger(heroId) ||
        (currency !== "BP" && currency !== "DIAMOND")
    ) {
        throw new HttpError(
            400,
            "heroId wajib berupa bilangan bulat dan currency harus BP atau DIAMOND"
        );
    }

    // 2. Player tidak ditemukan
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) {
        throw new HttpError(404, "Player tidak ditemukan");
    }

    // 3. Hero tidak ditemukan
    const hero = await prisma.hero.findUnique({ where: { id: heroId } });
    if (!hero) {
        throw new HttpError(404, "Hero tidak ditemukan");
    }

    // 4. Harga kosong untuk mata uang yang dipilih
    const price = currency === "BP" ? hero.priceBP : hero.priceDiamond;
    if (price === null) {
        throw new HttpError(
            400,
            `Hero ${hero.name} tidak memiliki harga ${currency}`
        );
    }

    // 5. Hero sudah dimiliki
    const owned = await prisma.playerHero.findUnique({
        where: { playerId_heroId: { playerId: player.id, heroId: hero.id } },
    });
    if (owned) {
        throw new HttpError(409, `Player sudah memiliki hero ${hero.name}`);
    }

    // 6. Saldo kurang
    const balance = currency === "BP" ? player.bp : player.diamond;
    if (balance < price) {
        throw new HttpError(
            400,
            `Saldo ${currency} tidak cukup (butuh ${price}, tersedia ${balance})`
        );
    }

    // Saldo berkurang dan PlayerHero dibuat dalam satu transaksi.
    const [updatedPlayer] = await prisma.$transaction([
        prisma.player.update({
            where: { id: player.id },
            data:
                currency === "BP"
                    ? { bp: { decrement: price } }
                    : { diamond: { decrement: price } },
        }),
        prisma.playerHero.create({
            data: {
                playerId: player.id,
                heroId: hero.id,
                currency,
                pricePaid: price,
            },
        }),
    ]);

    res.status(201).json({
        status: true,
        message: `Berhasil membeli hero ${hero.name}`,
        data: {
            hero,
            currency,
            pricePaid: price,
            bp: updatedPlayer.bp,
            diamond: updatedPlayer.diamond,
        },
    });
};
