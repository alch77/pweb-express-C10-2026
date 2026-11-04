
import { readFileSync } from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";

async function main() {
    console.log("Memulai seed Hero dan Skin...");

    // Membaca dataset JSON
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

    // Menghapus data Skin lama agar tidak duplikat
    await prisma.skin.deleteMany();

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
        skipDuplicates: true,
    });

    console.log(`${heroes.length} data Hero berhasil diproses`);

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

    console.log(`${skins.length} data Skin berhasil dimasukkan`);
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
