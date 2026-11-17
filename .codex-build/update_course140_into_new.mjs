import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { FileBlob, PresentationFile } from "file:///C:/Program%20Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1110-973-0_26.1110.973.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const workspaceDir = "C:/Users/victo/PycharmProjects/PY-Course-Victor-Nikoriak-22-09-2026";
const SKILL_DIR = "C:/Users/victo/.codex/plugins/cache/openai-primary-runtime/presentations/26.1110.11613/skills/presentations";
const RUNTIME_PYTHON = "C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1110-973-0_26.1110.973.0_x64__3k8sg7r9htsxt/dependencies/python/python.exe";
const RUNTIME_NODE = "C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1110-973-0_26.1110.973.0_x64__3k8sg7r9htsxt/dependencies/node/bin/node.exe";
const RUNTIME_NODE_MODULES = "C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1110-973-0_26.1110.973.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules";
process.env.RUNTIME_NODE = RUNTIME_NODE;
process.env.RUNTIME_NODE_MODULES = RUNTIME_NODE_MODULES;
process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES = RUNTIME_NODE_MODULES;
const sourcePath = "C:/Users/victo/OneDrive/BEETROOT/11_11_2026/Знайомство PYTHON РОЗРОБКА.pptx";
const photoPath = path.join(workspaceDir, ".codex-build/unzipped/course140/ppt/media/image2.png");
const qrPath = path.join(workspaceDir, ".codex-build/unzipped/course140/ppt/media/image3.png");
const buildDir = path.join(workspaceDir, ".codex-build/updated-course140");
const previewDir = path.join(buildDir, "previews");
const FINAL_PPTX = path.join(workspaceDir, "output/Знайомство PYTHON BACKEND + AI_оновлено_v2.pptx");

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

function parseNdjson(ndjson) {
  return ndjson.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

async function resolveByText(presentation, search, exactText = search) {
  const result = await presentation.inspect({
    kind: "textbox,shape",
    search,
    maxChars: 12000,
  });
  const match = parseNdjson(result.ndjson).find((item) =>
    typeof item.text === "string" && item.text.includes(exactText)
  );
  if (!match) throw new Error(`Could not find text: ${exactText}`);
  return presentation.resolve(match.id);
}

async function replaceText(presentation, oldText, newText) {
  const target = await resolveByText(presentation, oldText, oldText);
  target.text.replace(oldText, newText);
  return target;
}

async function replaceTextFoundBy(presentation, search, oldText, newText) {
  const target = await resolveByText(presentation, search, search);
  target.text.replace(oldText, newText);
  return target;
}

async function main() {
  await fs.mkdir(buildDir, { recursive: true });
  await fs.mkdir(previewDir, { recursive: true });
  const presentation = await PresentationFile.importPptx(await FileBlob.load(sourcePath));

  await replaceText(presentation, "Ім’я та прізвище", "Віктор Нікоряк");
  const linkedInText = await replaceText(
    presentation,
    "Мій профіль в LinkedIn: … додай посилання сюди",
    "Мій профіль у LinkedIn"
  );
  linkedInText.position.width = 430;
  const role1 = await replaceText(
    presentation,
    "Я працюю в … на позиції …",
    "Працюю в Українському гідрометеорологічному інституті. Використовую Python та GeoAI."
  );
  const role2 = await replaceText(
    presentation,
    "Мій попередній досвід роботи і мій шлях",
    "Мій шлях: польові вимірювання та гідрологія, Beetroot Academy, Python, Data Science й AI."
  );
  const role3 = await replaceText(
    presentation,
    "Мої цікаві проєкти та кейси",
    "Мій проєкт GeoHydroAI: геодані, моделювання та штучний інтелект."
  );
  const role4 = await replaceTextFoundBy(
    presentation,
    "надихає",
    "Що я люблю у своїй роботі? Що мене надихає?",
    "Мене надихають власний науковий проєкт, медитація та нові ідеї."
  );
  const roleRows = [role1, role2, role3, role4];
  const rowTops = [558, 669, 779.5, 890];
  roleRows.forEach((shape, index) => {
    shape.position.left = 798;
    shape.position.top = rowTops[index];
    shape.position.width = 1000;
    shape.position.height = 82;
    shape.text.style = {
      fontSize: 30,
      color: "#FFFFFF",
      typeface: "Nunito Sans",
    };
  });

  const photoBytes = await fs.readFile(photoPath);
  presentation.slides.items[1].images.add({
    blob: photoBytes.buffer.slice(photoBytes.byteOffset, photoBytes.byteOffset + photoBytes.byteLength),
    contentType: "image/png",
    alt: "Портрет Віктора Нікоряка",
    fit: "cover",
    position: { left: 100, top: 247.61, width: 560, height: 560 },
    geometry: "roundRect",
    borderRadius: "rounded-xl",
  });

  const qrBytes = await fs.readFile(qrPath);
  presentation.slides.items[1].images.add({
    blob: qrBytes.buffer.slice(qrBytes.byteOffset, qrBytes.byteOffset + qrBytes.byteLength),
    contentType: "image/png",
    alt: "QR-код профілю Віктора Нікоряка в LinkedIn",
    fit: "contain",
    position: { left: 570, top: 898, width: 92, height: 92 },
  });

  await replaceText(presentation, "PYTHON РОЗРОБКА", "PYTHON BACKEND + AI");
  await replaceText(
    presentation,
    "(радимо користуватися Deepl для перекладу)",
    "(радимо користуватися DeepL або Google для перекладу)"
  );

  const finalSlide = presentation.slides.items[11];
  const subtitle = finalSlide.shapes.add({
    geometry: "textbox",
    position: { left: 103, top: 825, width: 720, height: 60 },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  subtitle.text = "Разом ми все зможемо!";
  subtitle.text.style = {
    fontSize: 35,
    bold: true,
    color: "#FFA44C",
    typeface: "Nunito Sans",
  };

  for (const [index, slide] of presentation.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    await writeBlob(path.join(previewDir, `${stem}.png`), await presentation.export({ slide, format: "png", scale: 1 }));
  }
  await writeBlob(path.join(previewDir, "montage.webp"), await presentation.export({ format: "webp", montage: true }));

  const requirements = {
    explicitTotalSlideCount: 12,
    requiredNativeTableOwnerSlides: [],
    requiredNativeChartOwnerSlides: [],
    sourceTemplatePath: sourcePath,
    requiredTemplateReferenceSlides: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    minimumTemplateCoverageRatio: 1,
  };
  const fontPolicy = {
    basis: "reference",
    families: ["Nunito Sans"],
    referencePath: sourcePath,
    referenceSha256: "14749b5dcc6b9b150c6c1e2b205bb8b39e420b59c43786ab354422849594661b",
  };
  const expectedSlideSizeEmu = "18288000,10287000";
  const { finalizePresentation } = await import(pathToFileURL(
    path.join(SKILL_DIR, "container_tools/artifact_tool_utils.mjs")
  ).href);
  const stagingDir = path.join(buildDir, "finalizer");
  await fs.mkdir(stagingDir, { recursive: true });
  await fs.mkdir(path.dirname(FINAL_PPTX), { recursive: true });
  const candidatePath = path.join(stagingDir, "candidate.pptx");
  await (await PresentationFile.exportPptx(presentation)).save(candidatePath);
  const result = await finalizePresentation({
    ...requirements,
    workspaceDir,
    candidatePath,
    finalPath: FINAL_PPTX,
    pythonExecutable: RUNTIME_PYTHON,
    integrityValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_package_integrity.py"),
    layoutValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_layout_geometry.py"),
    layoutArgs: [
      "--expected-slide-size-emu", expectedSlideSizeEmu,
      "--validate-bullet-geometry",
      "--validate-heading-fit",
    ],
    requiredNativeTableOwnerSlides: [],
    fontPolicy,
    verifyArtifactToolImport: true,
    receiptPath: path.join(stagingDir, "validation-v2.json"),
  });
  console.log(JSON.stringify({ finalPath: FINAL_PPTX, result }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
