import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { HttpError } from "../middlewares/httpError";

// Ubah "5" jadi angka 5; kalau bukan bilangan bulat positif, kembalikan null
const parseId = (value: string): number | null => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// nickname harus string dan tidak kosong
const isValidNickname = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

// Cari player, kalau tidak ada langsung lempar 404
const findPlayerOr404 = async (rawId: string) => {
  const id = parseId(rawId);
  const player = id ? await prisma.player.findUnique({ where: { id } }) : null;
  if (!player) throw new HttpError(404, "Player tidak ditemukan");
  return player;
};

// POST /api/players
export const createPlayer = async (req: Request, res: Response) => {
  const { nickname } = req.body ?? {};
  if (!isValidNickname(nickname))
    throw new HttpError(400, "nickname wajib diisi");

  const exists = await prisma.player.findUnique({
    where: { nickname: nickname.trim() },
  });
  if (exists) throw new HttpError(409, "nickname sudah dipakai");

  const player = await prisma.player.create({
    data: { nickname: nickname.trim() },
  });
  res
    .status(201)
    .json({ status: true, message: "Player berhasil dibuat", data: player });
};

// GET /api/players/:player_id
export const getPlayer = async (req: Request, res: Response) => {
  const found = await findPlayerOr404(req.params.player_id as string);

  const player = await prisma.player.findUnique({
    where: { id: found.id },
    include: { heroes: { include: { hero: { select: { name: true } } } } },
  });

  res.json({
    status: true,
    message: "Berhasil mengambil data player",
    data: {
      id: player!.id,
      nickname: player!.nickname,
      bp: player!.bp,
      diamond: player!.diamond,
      createdAt: player!.createdAt,
      heroes: player!.heroes.map((ph) => ({
        heroId: ph.heroId,
        name: ph.hero.name,
        currency: ph.currency,
        pricePaid: ph.pricePaid,
      })),
    },
  });
};

// PATCH /api/players/:player_id
export const updatePlayer = async (req: Request, res: Response) => {
  const player = await findPlayerOr404(req.params.player_id as string);

  const { nickname } = req.body ?? {};
  if (!isValidNickname(nickname))
    throw new HttpError(400, "nickname wajib diisi");

  const used = await prisma.player.findUnique({
    where: { nickname: nickname.trim() },
  });
  if (used && used.id !== player.id)
    throw new HttpError(409, "nickname sudah dipakai");

  const updated = await prisma.player.update({
    where: { id: player.id },
    data: { nickname: nickname.trim() },
  });
  res.json({
    status: true,
    message: "Player berhasil diperbarui",
    data: updated,
  });
};

// DELETE /api/players/:player_id
export const deletePlayer = async (req: Request, res: Response) => {
  const player = await findPlayerOr404(req.params.player_id as string);
  await prisma.player.delete({ where: { id: player.id } }); // PlayerHero ikut terhapus (Cascade)
  res.json({ status: true, message: "Player berhasil dihapus", data: player });
};

// POST /api/players/:player_id/topup
export const topUp = async (req: Request, res: Response) => {
  const { amount } = req.body ?? {};
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) {
    throw new HttpError(400, "amount harus bilangan bulat lebih dari 0");
  }
  const player = await findPlayerOr404(req.params.player_id as string);

  const updated = await prisma.player.update({
    where: { id: player.id },
    data: { diamond: { increment: amount } },
  });
  res.json({
    status: true,
    message: "Top up berhasil",
    data: { playerId: player.id, amount, diamond: updated.diamond },
  });
};

// POST /api/players/:player_id/matches
export const playMatch = async (req: Request, res: Response) => {
  const { result } = req.body ?? {};
  if (result !== "WIN" && result !== "LOSE") {
    throw new HttpError(400, "result harus WIN atau LOSE");
  }
  const player = await findPlayerOr404(req.params.player_id as string);

  const bpEarned = result === "WIN" ? 300 : 100;
  const updated = await prisma.player.update({
    where: { id: player.id },
    data: { bp: { increment: bpEarned } },
  });
  res.json({
    status: true,
    message: "Hadiah match berhasil ditambahkan",
    data: { playerId: player.id, result, bpEarned, bp: updated.bp },
  });
};
