// Smoke test semua endpoint. Jalankan seed dulu: npx tsx prisma/seed.ts
// Lalu: npx tsx tests/smoke.ts
import app from "../src/app";

const PORT = 3999;
const base = `http://localhost:${PORT}`;

let failed = 0;
const check = (name: string, ok: boolean, detail?: unknown) => {
    if (!ok) failed++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok || detail === undefined ? "" : `  -> ${JSON.stringify(detail).slice(0, 200)}`}`);
};

const req = async (method: string, path: string, body?: unknown) => {
    const res = await fetch(base + path, {
        method,
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json: any = await res.json().catch(() => null);
    return { status: res.status, json };
};

const main = async () => {
    let r = await req("GET", "/health");
    check("health 200", r.status === 200 && r.json.status === true, r);

    r = await req("GET", "/api/heroes");
    check("heroes default limit 10, totalItems 133", r.status === 200 && r.json.data.length === 10 && r.json.metadata.totalItems === 133 && r.json.metadata.totalPages === 14, r.json?.metadata);

    r = await req("GET", "/api/heroes?page=2&limit=5");
    check("heroes pagination", r.status === 200 && r.json.metadata.currentPage === 2 && r.json.data.length === 5, r.json?.metadata);

    r = await req("GET", "/api/heroes?search=la&limit=100");
    check("heroes search=la", r.status === 200 && r.json.data.every((h: any) => h.name.toLowerCase().includes("la")), r.json?.metadata);

    r = await req("GET", "/api/heroes?role=MARKSMAN");
    check("heroes role=MARKSMAN total 20", r.status === 200 && r.json.metadata.totalItems === 20, r.json?.metadata);

    r = await req("GET", "/api/heroes?role=WIZARD");
    check("heroes role invalid 400", r.status === 400, r);

    r = await req("GET", "/api/heroes/18");
    check("hero 18 include skins", r.status === 200 && Array.isArray(r.json.data.skins) && r.json.data.skins.length > 0 && r.json.data.name === "Layla", r.json?.data?.name);

    r = await req("GET", "/api/heroes/999");
    check("hero 999 404", r.status === 404, r);

    r = await req("POST", "/api/heroes", { name: "Tanpa Role" });
    check("create hero tanpa field 400", r.status === 400, r);

    r = await req("POST", "/api/heroes", { name: "Miya", role: "MARKSMAN", lane: "GOLD", releaseYear: 2016 });
    check("create hero duplikat 409", r.status === 409, r);

    r = await req("POST", "/api/heroes", { name: "Hero Percobaan", role: "MAGE", lane: "MID", releaseYear: 2026 });
    check("create hero 201", r.status === 201 && r.json.data.priceBP === null, r);

    r = await req("GET", "/api/skins");
    check("skins totalItems 892", r.status === 200 && r.json.metadata.totalItems === 892 && r.json.data.length === 10, r.json?.metadata);

    r = await req("GET", "/api/skins?heroId=18&limit=50");
    check("skins heroId=18", r.status === 200 && r.json.data.every((s: any) => s.heroId === 18), r.json?.metadata);

    r = await req("GET", "/api/skins?rarity=GRAND&limit=50");
    check("skins rarity=GRAND", r.status === 200 && r.json.data.every((s: any) => s.rarity === "GRAND"), r.json?.metadata);

    r = await req("GET", "/api/skins?heroId=abc");
    check("skins heroId invalid 400", r.status === 400, r);

    r = await req("GET", "/api/skins?rarity=LEGEND");
    check("skins rarity invalid 400", r.status === 400, r);

    r = await req("GET", "/api/skins/1");
    check("skin 1 include hero", r.status === 200 && r.json.data.hero?.name !== undefined, r.json?.data?.hero?.name);

    r = await req("GET", "/api/skins/9999");
    check("skin 9999 404", r.status === 404, r);

    r = await req("POST", "/api/players", { nickname: "  " });
    check("create player nickname kosong 400", r.status === 400, r);

    r = await req("POST", "/api/players", { nickname: "ArekITS" });
    check("create player duplikat 409", r.status === 409, r);

    r = await req("POST", "/api/players", { nickname: "JunglerMalam" });
    check("create player 201 default 10000/0", r.status === 201 && r.json.data.bp === 10000 && r.json.data.diamond === 0, r.json?.data);

    r = await req("GET", "/api/players/1");
    check("player 1 detail 2 hero", r.status === 200 && r.json.data.heroes.length === 2 && r.json.data.heroes[0].name, r.json?.data?.heroes);

    r = await req("GET", "/api/players/999");
    check("player 999 404", r.status === 404, r);

    r = await req("PATCH", "/api/players/3", { nickname: "" });
    check("patch nickname kosong 400", r.status === 400, r);

    r = await req("PATCH", "/api/players/3", { nickname: "ArekITS" });
    check("patch nickname duplikat 409", r.status === 409, r);

    r = await req("PATCH", "/api/players/3", { nickname: "MageITS" });
    check("patch nickname 200", r.status === 200 && r.json.data.nickname === "MageITS", r.json?.data);

    r = await req("PATCH", "/api/players/999", { nickname: "Hantu" });
    check("patch player 999 404", r.status === 404, r);

    r = await req("POST", "/api/players/3/topup", { amount: 1.5 });
    check("topup 1.5 400", r.status === 400, r);

    r = await req("POST", "/api/players/3/topup", { amount: 0 });
    check("topup 0 400", r.status === 400, r);

    r = await req("POST", "/api/players/999/topup", { amount: 100 });
    check("topup player 999 404", r.status === 404, r);

    r = await req("POST", "/api/players/3/topup", { amount: 1000 });
    check("topup 1000 -> diamond 1000", r.status === 200 && r.json.data.diamond === 1000, r.json?.data);

    r = await req("POST", "/api/players/3/matches", { result: "DRAW" });
    check("match DRAW 400", r.status === 400, r);

    r = await req("POST", "/api/players/999/matches", { result: "WIN" });
    check("match player 999 404", r.status === 404, r);

    r = await req("POST", "/api/players/3/matches", { result: "WIN" });
    check("match WIN -> bp 10300", r.status === 200 && r.json.data.bp === 10300 && r.json.data.bpEarned === 300, r.json?.data);

    r = await req("POST", "/api/players/3/matches", { result: "LOSE" });
    check("match LOSE -> bp 10400", r.status === 200 && r.json.data.bp === 10400 && r.json.data.bpEarned === 100, r.json?.data);

    r = await req("POST", "/api/players/3/heroes", { heroId: 18, currency: "BP" });
    check("beli Layla BP -> bp 8400", r.status === 201 && r.json.data.balance.bp === 8400 && r.json.data.pricePaid === 2000, r.json?.data);

    r = await req("POST", "/api/players/3/heroes", { heroId: 18, currency: "BP" });
    check("beli ulang 409", r.status === 409, r);

    r = await req("POST", "/api/players/3/heroes", { heroId: 22, currency: "BP" });
    check("Freya BP 400", r.status === 400, r);

    r = await req("POST", "/api/players/2/heroes", { heroId: 22, currency: "DIAMOND" });
    check("beli Freya DIAMOND -> 2293", r.status === 201 && r.json.data.balance.diamond === 2293, r.json?.data);

    r = await req("POST", "/api/players/3/heroes", { heroId: 84, currency: "BP" });
    check("saldo kurang 400", r.status === 400, r);

    r = await req("POST", "/api/players/999/heroes", { heroId: 18, currency: "BP" });
    check("beli player 999 404", r.status === 404, r);

    r = await req("POST", "/api/players/3/heroes", { heroId: 999, currency: "BP" });
    check("beli hero 999 404", r.status === 404, r);

    r = await req("POST", "/api/players/3/heroes", { heroId: 18, currency: "GOLD" });
    check("currency salah 400", r.status === 400, r);

    r = await req("DELETE", "/api/players/3");
    check("delete player 3 200", r.status === 200, r.json?.message);

    r = await req("DELETE", "/api/players/3");
    check("delete player 3 lagi 404", r.status === 404, r);

    r = await req("GET", "/api/statistics");
    const st = r.json?.data;
    check("statistik totalPlayers 3", r.status === 200 && st.totalPlayers === 3, st);
    check("statistik totalHeroesOwned 5 (cascade)", st?.totalHeroesOwned === 5, st);
    check("statistik totalDiamond 2368", st?.totalDiamond === 2368, st);
    check("statistik mostOwnedHero ada", st?.mostOwnedHero?.name !== undefined && st?.mostOwnedHero?.totalOwners >= 1, st?.mostOwnedHero);
    check("statistik heroesPerRole 6 role", Array.isArray(st?.heroesPerRole) && st.heroesPerRole.length === 6, st?.heroesPerRole);

    r = await req("GET", "/api/tidak-ada");
    check("endpoint tidak ada 404", r.status === 404 && r.json.status === false, r);

    console.log(failed === 0 ? "\nSEMUA PASS" : `\n${failed} GAGAL`);
};

const server = app.listen(PORT, () => {
    main()
        .catch((e) => {
            console.error(e);
            failed++;
        })
        .finally(() => {
            server.close();
            process.exit(failed === 0 ? 0 : 1);
        });
});
