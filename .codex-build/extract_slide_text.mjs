import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "file:///C:/Program%20Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1110-973-0_26.1110.973.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const source = "C:/Users/victo/OneDrive/BEETROOT/22_09_2026/PY_UKR_Introductory lesson presentation template PY_140.pptx";
const output = path.resolve(".codex-build/inspect/course140/by-slide");
await fs.mkdir(output, { recursive: true });
const presentation = await PresentationFile.importPptx(await FileBlob.load(source));
for (const [index, slide] of presentation.slides.items.entries()) {
  const inspection = await presentation.inspect({
    target: { id: slide.id },
    kind: "slide,textbox,shape,image,table,chart,notes,layout",
    maxChars: 120000,
  });
  await fs.writeFile(path.join(output, `slide-${String(index + 1).padStart(2, "0")}.ndjson`), inspection.ndjson, "utf8");
}
