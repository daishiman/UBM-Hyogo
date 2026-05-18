# Phase 2 — 設計

## 1. モジュール構成

```
scripts/lib/phase12-compliance/
├── collect-changed-roots.ts        # 既存・無変更
├── load-canonical-headings.ts      # 既存・無変更
├── types.ts                        # 編集: reason に "missing-evidence" 追加
├── verify-compliance-file.ts       # 編集: evidence existence チェックを直列追加
├── parse-phase11-evidence.ts       # 新規
└── verify-phase11-evidence-existence.ts  # 新規
```

## 2. 型定義（`types.ts`）

```ts
export type ComplianceCheckResult =
  | { ok: true; rootPath: string }
  | {
      ok: false;
      rootPath: string;
      reason:
        | "missing-file"
        | "parse-error"
        | "missing-heading"
        | "missing-evidence"; // 新規
      details: string;
    };

export interface Phase11EvidenceRow {
  classification: string;
  evidencePath: string;
  status: "present" | "pending" | "n/a" | "unknown";
  rawStatus: string;
}
```

## 3. `parse-phase11-evidence.ts`

### シグネチャ

```ts
export function parsePhase11EvidenceClaims(markdown: string): Phase11EvidenceRow[];
```

### アルゴリズム

1. markdown を `\n` で split
2. heading 検索: `/^##\s+(?:4\.\s+)?Phase 11 evidence file inventory\s*$/`
3. heading 検出後の最初の `|` 区切り行群（連続する `|` 行）を block として抽出
4. 区切り行（`| --- | --- | --- |`）と header 行（最初の `|` 行）を除外
5. 各 data 行を `|` で split し、左から 3 列を `[classification, evidencePath, status]` に割当（trim）
6. `status` は trim のみ行い、`present` / `pending` / `n/a` の小文字完全一致だけを正規値として扱う。`Present` などの表記揺れは invalid status として fail し、実在 PASS に使わない
7. heading 不在 / table 不在 / data 行 0 の場合は空配列を返す（呼び出し側で fail 判定）

### エッジケース

| ケース | 振る舞い |
| --- | --- |
| heading が見つからない | `[]` を返す |
| heading 直下に table が無い | `[]` を返す |
| 列数 < 3 | 当該行 skip |
| evidencePath 列に backtick 装飾（`` `path` ``） | backtick を除去 |
| status が `Present` / `PRESENT` | `present` として扱わない（小文字完全一致のみ） |
| heading 重複 | 最初の 1 件のみ採用 |

## 4. `verify-phase11-evidence-existence.ts`

### シグネチャ

```ts
export interface EvidenceExistenceCheckOptions {
  rows: Phase11EvidenceRow[];
  workflowRootAbsPath: string; // 例: /repo/docs/30-workflows/<task>
}

export interface EvidenceExistenceCheckResult {
  ok: boolean;
  missing: string[];      // workflowRoot 相対の path
  invalidStatuses: string[];      // status が unknown だった path
}

export function verifyPhase11EvidenceExistence(
  opts: EvidenceExistenceCheckOptions,
): EvidenceExistenceCheckResult;
```

### アルゴリズム

1. `rows.length === 0` の場合は `{ ok: false, missing: [], invalidStatuses: [] }` を返し、呼び出し側で `details = "phase-11 evidence inventory empty or missing"` を組み立てる
2. `rows` を反復:
   - `status === "unknown"` → `invalidStatuses[]` に append（fail 対象）
   - `status === "present"` → `fs.existsSync(resolve(workflowRootAbsPath, row.evidencePath))` が false なら `missing[]` に append
   - `status === "pending"` / `"n/a"` → スキップ
3. `ok = missing.length === 0 && unknown.length === 0`
4. evidencePath の正規化: 先頭の `./` を除去。絶対パスは禁止。`resolve(root, path)` 後に `relative(root, resolved)` が `..` で始まる、または absolute になる path traversal も禁止し、`missing[]` に append する

## 5. `verify-compliance-file.ts` 拡張

既存 heading 検査の後段に以下を直列追加:

```ts
// （heading 検査 PASS 後）
const rows = parsePhase11EvidenceClaims(markdown);
const evidenceResult = verifyPhase11EvidenceExistence({
  rows,
  workflowRootAbsPath: resolve(opts.repoRoot, opts.root.rootPath),
});

if (!evidenceResult.ok) {
  const detailsParts: string[] = [];
  if (rows.length === 0) {
    detailsParts.push("phase-11 evidence inventory empty or missing");
  }
  if (evidenceResult.missing.length > 0) {
    detailsParts.push(`missing evidence: ${evidenceResult.missing.join(", ")}`);
  }
  if (evidenceResult.invalidStatuses.length > 0) {
    detailsParts.push(`invalid status: ${evidenceResult.invalidStatuses.join(", ")}`);
  }
  return {
    ok: false,
    rootPath: opts.root.rootPath,
    reason: "missing-evidence",
    details: detailsParts.join("; "),
  };
}

return { ok: true, rootPath: opts.root.rootPath };
```

## 6. CI gate 結線

`.github/workflows/verify-phase12-compliance.yml` は既に `pnpm verify:phase12-compliance` を呼び出しているため、`verify-compliance-file.ts` の拡張のみで新ロジックが流れる。workflow 側の編集は non-PR event 用の `origin/dev` fallback に限定し、`pull_request` トリガー復活は本タスク外。

## 7. fixture 構成

```
scripts/__tests__/fixtures/phase12-compliance/
├── pass/                              # 既存 → 改修: phase-11 evidence section + 実体ファイル追加
│   ├── artifacts.json
│   └── outputs/
│       ├── phase-11/
│       │   ├── main.md                # 新規（dummy 1 行）
│       │   ├── manual-test-result.md  # 新規（dummy 1 行）
│       │   ├── manual-smoke-log.md    # 新規（dummy 1 行）
│       │   └── link-checklist.md      # 新規（dummy 1 行）
│       └── phase-12/
│           └── phase12-task-spec-compliance-check.md   # 既存 → evidence section 追記
├── fail-missing-evidence/             # 新規
│   ├── artifacts.json
│   └── outputs/
│       └── phase-12/
│           └── phase12-task-spec-compliance-check.md   # present 宣言したが phase-11/ に実体無し
├── fail-missing-heading/              # 既存・無変更
└── fail-missing-file/                 # 既存・無変更
```

追加テストとして、`Present` が `present` 扱いにならないこと、`../outside.md` が workflow root 外参照として `missing-evidence` になることを固定する。

## 8. 依存・互換性

- Node 24 標準 API のみ（`node:fs`, `node:path`）
- 既存 `pnpm verify:phase12-compliance` / `pnpm test:phase12-compliance` script から呼び出される経路を保持
- `validate-phase11-canonical-evidence-paths.js`（JSON manifest 検証）とは独立。本タスク validator が markdown 側を担当することで、責務が明確に分離される
