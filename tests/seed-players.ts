import { prisma } from "../src/lib/prisma";

// Helper uji integrasi: mengisi 3 player + PlayerHero sesuai tabel di modul.
// Hapus file ini setelah prisma/seed.ts ikut membuat data player.
async function main() {
    await prisma.playerHero.deleteMany();
    await prisma.player.deleteMany();

    await prisma.player.createMany({
        data: [
            { id: 1, nickname: "ArekITS", bp: 1500, diamond: 75 },
            { id: 2, nickname: "SangPushRank", bp: 13000, diamond: 2892 },
            { id: 3, nickname: "MageSurabaya", bp: 10000, diamond: 0 },
        ],
    });

    await prisma.playerHero.createMany({
        data: [
            { playerId: 1, heroId: 18, currency: "BP", pricePaid: 2000 },
            { playerId: 1, heroId: 1, currency: "BP", pricePaid: 10800 },
            { playerId: 2, heroId: 84, currency: "DIAMOND", pricePaid: 599 },
            { playerId: 2, heroId: 56, currency: "BP", pricePaid: 32000 },
        ],
    });

    await prisma.$executeRawUnsafe(
        'SELECT setval(pg_get_serial_sequence(\'"Player"\', \'id\'), (SELECT MAX(id) FROM "Player"))'
    );

    console.log("3 player + 4 PlayerHero siap");
}

main()
    .catch((e) => {
        console.error(e);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
