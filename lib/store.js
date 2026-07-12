import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dataPath = path.join(process.cwd(), "work", "data.json");

export async function loadData() {
  try { return JSON.parse(await readFile(dataPath, "utf8")); }
  catch { return { listings: [], lastSync: null }; }
}

export async function saveData(data) {
  await mkdir(path.dirname(dataPath), { recursive: true });
  await writeFile(dataPath, JSON.stringify(data, null, 2), "utf8");
}
