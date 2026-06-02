import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRYFALL_ORACLE_BULK_URI = "https://api.scryfall.com/bulk-data/oracle-cards";
const USER_AGENT = "CardMagic/1.0";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const outputPath = path.join(
  projectRoot,
  "assets",
  "card-data",
  "scryfall-oracle-cards.compact.json",
);
const searchIndexOutputPath = path.join(
  projectRoot,
  "assets",
  "card-data",
  "scryfall-oracle-card-search-index.compact.json",
);
const BASE_CARD_EXCLUDED_LAYOUTS = new Set(["art_series", "token"]);

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function cleanString(value) {
  return typeof value === "string" ? value : "";
}

function cleanStringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

function compactFace(face) {
  return {
    name: cleanString(face.name),
    manaCost: cleanString(face.mana_cost),
    typeLine: cleanString(face.type_line),
    oracleText: cleanString(face.oracle_text),
    power: cleanString(face.power),
    toughness: cleanString(face.toughness),
    loyalty: cleanString(face.loyalty),
    defense: cleanString(face.defense),
  };
}

function compactCard(card) {
  const faces = Array.isArray(card.card_faces) ? card.card_faces.map(compactFace) : [];

  return {
    id: cleanString(card.oracle_id) || cleanString(card.id),
    name: cleanString(card.name),
    layout: cleanString(card.layout),
    manaCost: cleanString(card.mana_cost),
    typeLine: cleanString(card.type_line),
    oracleText: cleanString(card.oracle_text),
    power: cleanString(card.power),
    toughness: cleanString(card.toughness),
    loyalty: cleanString(card.loyalty),
    defense: cleanString(card.defense),
    colors: cleanStringArray(card.colors),
    colorIdentity: cleanStringArray(card.color_identity),
    faces,
  };
}

function compactSearchCard(card) {
  const labels = [
    normalizeSearchText(card.name),
    ...card.faces.map((face) => normalizeSearchText(face.name)).filter((label) => label && label !== normalizeSearchText(card.name)),
  ].filter(Boolean);
  const primaryFace = card.faces[0];

  return [
    card.id,
    card.name,
    card.layout,
    primaryFace?.typeLine || card.typeLine || "Card",
    labels,
  ];
}

function normalizeSearchText(value) {
  return cleanString(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

async function main() {
  const bulkObject = await fetchJson(SCRYFALL_ORACLE_BULK_URI);

  if (!bulkObject.download_uri) {
    throw new Error("Scryfall Oracle Cards bulk object did not include download_uri.");
  }

  const cards = await fetchJson(bulkObject.download_uri);
  const compactCards = cards
    .filter((card) => card && card.object === "card" && typeof card.name === "string")
    .map(compactCard)
    .sort((left, right) => left.name.localeCompare(right.name));

  const output = {
    source: "Scryfall Oracle Cards",
    sourceUri: bulkObject.uri,
    downloadUri: bulkObject.download_uri,
    updatedAt: bulkObject.updated_at,
    generatedAt: new Date().toISOString(),
    cards: compactCards,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output)}\n`, "utf8");

  const searchCards = compactCards
    .filter((card) => !BASE_CARD_EXCLUDED_LAYOUTS.has(card.layout))
    .map(compactSearchCard);
  const searchIndexOutput = {
    source: output.source,
    sourceUri: output.sourceUri,
    downloadUri: output.downloadUri,
    updatedAt: output.updatedAt,
    generatedAt: output.generatedAt,
    cardCount: searchCards.length,
    cards: searchCards,
  };

  await writeFile(searchIndexOutputPath, `${JSON.stringify(searchIndexOutput)}\n`, "utf8");

  console.log(
    `Wrote ${compactCards.length.toLocaleString("en-US")} cards from ${bulkObject.updated_at} to ${path.relative(
      projectRoot,
      outputPath,
    )}`,
  );
  console.log(
    `Wrote ${searchCards.length.toLocaleString("en-US")} searchable cards to ${path.relative(
      projectRoot,
      searchIndexOutputPath,
    )}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
