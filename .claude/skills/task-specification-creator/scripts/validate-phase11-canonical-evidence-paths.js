#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..", "..");
const SCHEMA_PATH = path.resolve(
  __dirname,
  "../schemas/phase11-evidence-canonical-paths.schema.json",
);
function parseArgs(argv) {
  const options = {
    files: [],
    workflow: null,
    checkExistence: false,
    json: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--workflow":
        if (!argv[i + 1] || argv[i + 1].startsWith("--")) {
          throw Object.assign(new Error("--workflow requires a workflow directory"), {
            exitCode: 3,
          });
        }
        options.workflow = argv[i + 1];
        i += 1;
        break;
      case "--check-existence":
        options.checkExistence = true;
        break;
      case "--json":
        options.json = true;
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
        break;
      default:
        if (arg.startsWith("--")) {
          throw Object.assign(new Error(`Unknown option: ${arg}`), { exitCode: 3 });
        }
        options.files.push(arg);
    }
  }

  return options;
}

function printUsage() {
  console.log(`Usage:
  node .claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js [files...] [--check-existence] [--json]
  node .claude/skills/task-specification-creator/scripts/validate-phase11-canonical-evidence-paths.js --workflow <workflow-dir> [--check-existence]`);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw Object.assign(new Error(`Invalid JSON: ${filePath}: ${error.message}`), {
      exitCode: 1,
    });
  }
}

function readSchemaContract() {
  const schema = readJson(SCHEMA_PATH);
  const evidenceItem = schema.properties?.evidence?.items;
  const evidenceProperties = evidenceItem?.properties ?? {};

  return {
    rootKeys: new Set(Object.keys(schema.properties ?? {})),
    evidenceKeys: new Set(Object.keys(evidenceProperties)),
    requiredRootKeys: schema.required ?? [],
    requiredEvidenceKeys: evidenceItem?.required ?? [],
    workflowDirPattern: new RegExp(schema.properties?.workflowDir?.pattern ?? "^$"),
    schemaVersionPattern: new RegExp(schema.properties?.schemaVersion?.pattern ?? "^$"),
    idPattern: new RegExp(evidenceProperties.id?.pattern ?? "^$"),
    pathPattern: new RegExp(evidenceProperties.path?.pattern ?? "^$"),
    validKinds: new Set(evidenceProperties.kind?.enum ?? []),
    validAcquiredBy: new Set(evidenceProperties.acquiredBy?.enum ?? []),
  };
}

function walkForCanonicalPaths(dirPath, found = []) {
  if (!fs.existsSync(dirPath)) return found;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkForCanonicalPaths(fullPath, found);
      continue;
    }
    if (entry.isFile() && entry.name === "canonical-paths.json") {
      found.push(fullPath);
    }
  }
  return found;
}

function resolveInputFiles(options) {
  if (options.files.length > 0) {
    return options.files.map((file) => path.resolve(file));
  }

  if (options.workflow) {
    return [
      path.resolve(options.workflow, "outputs/phase-11/canonical-paths.json"),
    ];
  }

  return walkForCanonicalPaths(path.resolve(REPO_ROOT, "docs/30-workflows"));
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasParentSegment(value) {
  return value.split(/[\\/]/).includes("..");
}

function validateManifest(manifest, manifestPath, checkExistence, contract) {
  const errors = [];
  const existenceErrors = [];
  const ids = new Set();

  if (!isPlainObject(manifest)) {
    errors.push("root must be an object");
    return { errors, existenceErrors };
  }

  for (const key of contract.requiredRootKeys) {
    if (manifest[key] === undefined) errors.push(`missing required key: ${key}`);
  }

  for (const key of Object.keys(manifest)) {
    if (!contract.rootKeys.has(key)) errors.push(`unexpected root key: ${key}`);
  }

  if (typeof manifest.taskId !== "string" || manifest.taskId.trim() === "") {
    errors.push("taskId must be a non-empty string");
  }

  if (
    typeof manifest.workflowDir !== "string" ||
    path.isAbsolute(manifest.workflowDir) ||
    hasParentSegment(manifest.workflowDir) ||
    manifest.workflowDir.includes("//") ||
    !contract.workflowDirPattern.test(manifest.workflowDir)
  ) {
    errors.push("workflowDir must be a safe docs/30-workflows relative path");
  }

  if (
    manifest.schemaVersion !== undefined &&
    (typeof manifest.schemaVersion !== "string" ||
      !contract.schemaVersionPattern.test(manifest.schemaVersion))
  ) {
    errors.push("schemaVersion must be 1.0.0 when present");
  }

  if (!Array.isArray(manifest.evidence) || manifest.evidence.length === 0) {
    errors.push("evidence must be a non-empty array");
    return { errors, existenceErrors };
  }

  manifest.evidence.forEach((item, index) => {
    const prefix = `evidence[${index}]`;
    if (!isPlainObject(item)) {
      errors.push(`${prefix} must be an object`);
      return;
    }

    for (const key of contract.requiredEvidenceKeys) {
      if (item[key] === undefined) errors.push(`${prefix}.${key} is required`);
    }

    for (const key of Object.keys(item)) {
      if (!contract.evidenceKeys.has(key)) errors.push(`${prefix}.${key} is not allowed`);
    }

    if (typeof item.id !== "string" || !contract.idPattern.test(item.id)) {
      errors.push(`${prefix}.id must match ^[a-z0-9][a-z0-9._-]*$`);
    } else if (ids.has(item.id)) {
      errors.push(`duplicate evidence id: ${item.id}`);
    } else {
      ids.add(item.id);
    }

    if (!contract.validKinds.has(item.kind)) {
      errors.push(`${prefix}.kind must be one of ${[...contract.validKinds].join(", ")}`);
    }

    if (
      typeof item.path !== "string" ||
      path.isAbsolute(item.path) ||
      hasParentSegment(item.path) ||
      !contract.pathPattern.test(item.path)
    ) {
      errors.push(`${prefix}.path must be a safe workflow-relative Phase 11 evidence path`);
    }

    if (typeof item.command !== "string" || item.command.trim() === "") {
      errors.push(`${prefix}.command must be a non-empty string`);
    }

    if (!contract.validAcquiredBy.has(item.acquiredBy)) {
      errors.push(
        `${prefix}.acquiredBy must be one of ${[...contract.validAcquiredBy].join(", ")}`,
      );
    }

    if (
      item.requiredForCloseout !== undefined &&
      typeof item.requiredForCloseout !== "boolean"
    ) {
      errors.push(`${prefix}.requiredForCloseout must be a boolean`);
    }

    if (item.notes !== undefined && typeof item.notes !== "string") {
      errors.push(`${prefix}.notes must be a string`);
    }

    if (checkExistence && manifest.workflowDir && item.path) {
      const evidencePath = path.resolve(REPO_ROOT, manifest.workflowDir, item.path);
      if (!evidencePath.startsWith(path.resolve(REPO_ROOT, manifest.workflowDir) + path.sep)) {
        existenceErrors.push(`${prefix}.path escapes workflowDir: ${item.path}`);
      } else if (!fs.existsSync(evidencePath)) {
        existenceErrors.push(`${prefix}.path does not exist: ${item.path}`);
      }
    }
  });

  return { errors, existenceErrors };
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv);
  } catch (error) {
    console.error(error.message);
    printUsage();
    process.exit(error.exitCode ?? 3);
  }

  if (!fs.existsSync(SCHEMA_PATH)) {
    console.error(`Schema file not found: ${SCHEMA_PATH}`);
    process.exit(3);
  }
  const schemaContract = readSchemaContract();

  const files = resolveInputFiles(options);
  if (files.length === 0) {
    console.error("No canonical-paths.json files found");
    process.exit(3);
  }

  const report = {
    schema: path.relative(REPO_ROOT, SCHEMA_PATH),
    checkedFiles: [],
    errors: [],
    existenceErrors: [],
  };

  for (const filePath of files) {
    if (!fs.existsSync(filePath)) {
      report.errors.push(`${path.relative(REPO_ROOT, filePath)}: file not found`);
      continue;
    }

    const manifest = readJson(filePath);
    const result = validateManifest(manifest, filePath, options.checkExistence, schemaContract);
    const relativePath = path.relative(REPO_ROOT, filePath);
    report.checkedFiles.push(relativePath);
    result.errors.forEach((error) => report.errors.push(`${relativePath}: ${error}`));
    result.existenceErrors.forEach((error) =>
      report.existenceErrors.push(`${relativePath}: ${error}`),
    );
  }

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log("Phase 11 canonical evidence path validation");
    console.log(`schema: ${report.schema}`);
    report.checkedFiles.forEach((file) => console.log(`checked: ${file}`));
    [...report.errors, ...report.existenceErrors].forEach((error) =>
      console.error(`ERROR: ${error}`),
    );
    if (report.errors.length === 0 && report.existenceErrors.length === 0) {
      console.log("OK");
    }
  }

  if (report.errors.length > 0) process.exit(1);
  if (report.existenceErrors.length > 0) process.exit(2);
  process.exit(0);
}

main();
