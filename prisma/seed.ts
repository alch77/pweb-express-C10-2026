import { readFileSync } from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";

async function main() {
    console.log("Memulai seed Hero, Skin, dan Player...");

    const heroes = JSON.parse(
        readFileSync(
            path.join(process.cwd(), "data/heroes.json"),
            "utf-8"
        ).replace(/^\uFEFF/, "")
    );

    const skins = JSON.parse(
        readFileSync(
            path.join(process.cwd(), "data/skins.json"),
            "utf-8"
        ).replace(/^\uFEFF/, "")
    );

    // Mengosongkan semua tabel dan mereset ID
    await prisma.$executeRawUnsafe(`
        TRUNCATE TABLE "PlayerHero", "Player", "Skin", "Hero"
        RESTART IDENTITY CASCADE;
    `);

    console.log("Data lama berhasil dihapus");

    // Memasukkan data Hero
    await prisma.hero.createMany({
        data: heroes.map((hero: any) => ({
            name: hero.name,
            role: hero.primaryRole,
            lane: hero.primaryLane,
            releaseYear: Number(hero.releaseYear),
            priceBP:
                hero.priceBP === "" || hero.priceBP == null
                    ? null
                    : Number(hero.priceBP),
            priceDiamond:
                hero.priceDiamond === "" || hero.priceDiamond == null
                    ? null
                    : Number(hero.priceDiamond),
        })),
    });

    console.log(`${heroes.length} Hero berhasil dimasukkan`);

    // Memasukkan data Skin
    await prisma.skin.createMany({
        data: skins.map((skin: any) => ({
            name: skin.name,
            heroId: Number(skin.heroId),
            rarity: skin.rarity,
            priceDiamond:
                skin.priceDiamond === "" || skin.priceDiamond == null
                    ? null
                    : Number(skin.priceDiamond),
        })),
    });

    console.log(`${skins.length} Skin berhasil dimasukkan`);

    // Memasukkan 3 Player
    await prisma.player.createMany({
        data: [
            {
                nickname: "ArekITS",
                bp: 1500,
                diamond: 75,
            },
            {
                nickname: "SangPushRank",
                bp: 13000,
                diamond: 2892,
            },
            {
                nickname: "MageSurabaya",
                bp: 10000,
                diamond: 0,
            },
        ],
    });

    console.log("3 Player berhasil dimasukkan");

    // Memasukkan 4 PlayerHero
    await prisma.playerHero.createMany({
        data: [
            {
                playerId: 1,
                heroId: 18,
                currency: "BP",
                pricePaid: 2000,
            },
            {
                playerId: 1,
                heroId: 1,
                currency: "BP",
                pricePaid: 10800,
            },
            {
                playerId: 2,
                heroId: 84,
                currency: "DIAMOND",
                pricePaid: 599,
            },
            {
                playerId: 2,
                heroId: 56,
                currency: "BP",
                pricePaid: 32000,
            },
        ],
    });

    console.log("4 PlayerHero berhasil dimasukkan");
    console.log("Seed berhasil!");
}

main()
    .catch((error) => {
        console.error("Seed gagal:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });