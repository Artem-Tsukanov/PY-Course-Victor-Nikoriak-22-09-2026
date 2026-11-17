import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "file:///C:/Program%20Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1110-973-0_26.1110.973.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const decks = [
  {
    key: "new",
    source: "C:/Users/victo/OneDrive/BEETROOT/11_11_2026/Знайомство PYTHON РОЗРОБКА.pptx",
  },
  {
    key: "course140",
    source: "C:/Users/victo/OneDrive/BEETROOT/22_09_2026/PY_UKR_Introductory lesson presentation template PY_140.pptx",
  },
];

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

for (const deck of decks) {
  const outDir = path.resolve(`.codex-build/inspect/${deck.key}`);
  await fs.mkdir(outDir, { recursive: true });
  const presentation = await PresentationFile.importPptx(await FileBlob.load(deck.source));
  const inspection = await presentation.inspect({
    kind: "presentation,slide,textbox,shape,image,table,chart,notes,layout",
    maxChars: 200000,
  });
  await fs.writeFile(path.join(outDir, "inspect.ndjson"), inspection.ndjson, "utf8");
  await fs.writeFile(path.join(outDir, "summary.json"), JSON.stringify({
    slideCount: presentation.slides.items.length,
    masters: presentation.masters?.items?.map((master) => ({ id: master.id, name: master.name })) ?? [],
  }, null, 2));
  await writeBlob(path.join(outDir, "montage.webp"), await presentation.export({ format: "webp", montage: true }));
  for (const [index, slide] of presentation.slides.items.entries()) {
    const name = `slide-${String(index + 1).padStart(2, "0")}.png`;
    await writeBlob(path.join(outDir, name), await presentation.export({ slide, format: "png", scale: 1 }));
  }
}
