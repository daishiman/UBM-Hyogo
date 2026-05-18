# Phase 2: 候補解比較・採択

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| 名称 | 候補解比較・採択 |
| 作成日 | 2026-05-17 |
| 担当 | delivery |
| 状態 | completed |
| 前 Phase | 1 (現状把握) |
| 次 Phase | 3 (全体設計) |

## 目的

Phase 1 で確定した依存マップを基に、3 つの候補解を比較し、第一候補と代替案を採択する。
意思決定は本 Phase 内で確定させ、Phase 3 以降は採択案に基づいて進める。

## 候補解の比較

### 候補 A: `pnpm.overrides.esbuild` を `"0.27.3"` 以上に bump（**第一候補**）

- **変更範囲**: `package.json` 1 行 + `pnpm-lock.yaml` 再生成。
- **メリット**:
  - 最小差分。
  - wrangler 4.85.0 の同梱 esbuild と完全一致でき、`supported: { import-source: ... }` を正しく解釈。
  - OpenNext が要求する esbuild メジャー範囲が 0.27.x を含む場合は host/binary mismatch も再発しない。
- **デメリット**:
  - OpenNext が 0.27.x 未満を強制する場合は build エラーが別の形で発生（Phase 5 で検出）。
- **採択ゲート**: Phase 5 のローカル `apps/web` build が成功すれば確定。

### 候補 B: `wrangler` 自身を `4.92.0` 以降に bump

- **変更範囲**: `package.json` の `devDependencies.wrangler`、`.github/workflows/web-cd.yml` / `backend-ci.yml` の `wranglerVersion:` 4 箇所、`pnpm-lock.yaml` 再生成。
- **メリット**:
  - CI 実行ログにも `update available 4.92.0` が出ており、上流推奨方向。
  - 4.92.0 系の同梱 esbuild が override 0.25.4 と整合する可能性があれば overrides に触れずに済む（要検証）。
- **デメリット**:
  - 変更箇所が増える（workflow 4 箇所のピン更新）。
  - wrangler 4.85.0 → 4.92.0 の挙動差分（cron / observability / bundle path）を別途検証する必要。
  - 同梱 esbuild がさらに新しい場合、結局 overrides も bump 必要になり差分が二重化。
- **採択条件**: 候補 A が OpenNext と不整合だった場合の代替。

### 候補 C: 候補 A + 候補 B の併用

- **変更範囲**: 候補 A + 候補 B。
- **メリット**:
  - wrangler を最新化しつつ依存解決の決定性も担保。
- **デメリット**:
  - 変更が最も大きく、原因分離が困難（どちらの bump が効いたか不明瞭）。
- **採択条件**: 候補 A / B 単独で解消しない場合の最後の手段。

### 候補 D: overrides 自体を削除

- **変更範囲**: `package.json` の `pnpm.overrides.esbuild` を削除。
- **メリット**: 各依存が自身の要求 version を resolve できる。
- **デメリット**:
  - `scripts/cf.sh` コメントで明示された OpenNext host/binary mismatch が再発する可能性。
  - hoisted esbuild が複数 version になり `ESBUILD_BINARY_PATH` 解決が壊れる。
- **結論**: **不採用**（override の存在意義を消す案）。

## 採択結果

| 採用 | 候補 | 条件 |
| --- | --- | --- |
| 第一 | A（override を 0.27.3に bump） | デフォルト採用 |
| 代替 | B（wrangler を 4.92.0 以降に bump） | Phase 5 で候補 A の build が OpenNext 不整合で失敗した場合に切替 |
| 最終 | C（A + B） | 候補 A / B 単独で解消しない場合 |

## 採択ゲート（Phase 5 で評価）

```
Phase 5 ローカル apps/web build (OpenNext) PASS?
  ├─ YES → 候補 A 確定 → Phase 6 へ
  └─ NO → 候補 B へ切替（package.json wrangler + workflow 4 箇所更新）→ Phase 5 再実行
         └─ NO → 候補 C 併用 → Phase 5 再実行
              └─ NO → Phase 1 へ差し戻し（依存マップ再調査）
```

## 不変条件確認

- 候補 A 採用時: `wranglerVersion: 4.85.0` ピンは変更しない（CLAUDE.md「ピン更新の最小化」に整合）。
- 候補 B/C 採用時のみ workflow 4 箇所を 4.92.0 に一括更新。

## 実行タスク

- [ ] Phase 1 の `outputs/phase-01/dependency-map.md` を参照
- [ ] OpenNext の esbuild 要求メジャー範囲を npm registry または `pnpm why esbuild` で確認
- [ ] 第一候補の最小 override 値を確定（`"0.27.3"` または wrangler 4.85.0 同梱の正確な版）
- [ ] 採択ゲートのフローチャートを成果物に転記
- [ ] `outputs/phase-02/option-comparison.md` を作成

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-02/option-comparison.md | 候補 A/B/C/D の比較と採択結果・採択ゲート |

## 完了条件

- [ ] 4 候補すべてのメリット/デメリットが記載されている
- [ ] 第一候補と代替案が明示されている
- [ ] 採択ゲートのフローチャートが記載されている

## 次 Phase

- 次: 3 (全体設計)
- 引き継ぎ事項: 第一候補 A を前提に Phase 3 の change-plan を作成。代替案 B/C への切替は Phase 5 のゲート評価結果に従う
- ブロック条件: OpenNext esbuild 要求範囲が未確認の場合 Phase 3 に進まない

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| workflow root | `docs/30-workflows/fix-cf-deploy-esbuild-import-source-staging-failure/` | 本 Phase の正本 |
| task-specification-creator | `.claude/skills/task-specification-creator/references/phase-12-spec.md` | Phase outputs / 状態語彙 / strict 7 |
| aiworkflow-requirements | `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` | Cloudflare wrapper / esbuild SSOT |

## 統合テスト連携

| 連携先 | 扱い |
| --- | --- |
| local dependency convergence | `pnpm exec esbuild --version` / `pnpm why esbuild` で確認 |
| local static gates | typecheck / lint は Phase 11 evidence 境界で扱う |
| GitHub Actions | commit / push / PR が user-gated のため runtime_pending |
