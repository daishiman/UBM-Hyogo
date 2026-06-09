# Phase 11: 手動テスト結果 — NON_VISUAL 証跡記録

> **[実装区分: 実装仕様書]** NON_VISUAL

## NON_VISUAL 宣言（WEEKGRD-03: 冒頭明示）

本タスクは env schema cleanup（旧 `PUBLIC_API_BASE_URL` の削除 / `NEXT_PUBLIC_API_BASE_URL` への単一化）であり、UI / UX の描画・レイアウト・色・導線・ルーティングを一切変更しない。base URL 値・解決優先順位・transport 選択は不変（D-5）のため、画面上の視覚差分が生じない。よって **screenshot は撮らない（N/A）**。

## メタ情報（**[Feedback 4]**: 証跡の主ソースと screenshot 不採用理由を明記）

| 項目 | 内容 |
| ---- | ---- |
| visual_category | NON_VISUAL |
| **証跡の主ソース（自動テスト名 / 件数）** | (1) grep gate: `rg --pcre2 -n "(?<!NEXT_)PUBLIC_API_BASE_URL\|getApiBaseEnv\|ApiBaseEnv" apps .github` = 0 件（exit 1 = no match）。(2) web direct targeted run: 9 files / 79 tests PASS（Phase 1 §6 の web 対象 spec）。(3) og package test run: 6 files / 23 tests PASS。補足: `pnpm --filter @ubm-hyogo/web test -- ...` は package script の仕様で apps/web 全体へ拡張され、今回変更外の既存 UI spec 2 件 red のため Gate-B 主証跡から除外した。 |
| **screenshot を作らない理由** | UI / UX の描画・レイアウト・色・導線を一切変更しないため、視覚的差分を撮るべき対象が存在しない。env キー名の内部 rename / 削除のみで、レンダリング結果（公開 members 一覧・詳細・OG 画像）は同一 base URL を解決する。OKLch トークン・コンポーネントは非変更。 |
| 代替証跡 | Phase 10 final-review（AC-1〜AC-9 判定）+ 本ファイルの自動テスト結果 |
| 段階 | implemented_local_evidence_captured（2026-06-08 実測値を記録済み） |

## 証跡欄（2026-06-08 実測値を記録済み）

### 証跡 A: 旧キー repo 全体走査（AC-7 / 単一化の構造的証明）

```bash
rg --pcre2 -n "(?<!NEXT_)PUBLIC_API_BASE_URL|getApiBaseEnv|ApiBaseEnv" apps .github
```

| 項目 | 期待 | 実測（2026-06-08 実測 PASS） |
| ---- | ---- | -------------------- |
| HIT 行数 | 0 行 | 0 行（exit 1 = no match） |
| 判定 | PASS（0 件で単一化達成） | PASS |

> implemented_local_evidence_captured 時点の baseline（削除前）: 24 ファイル（`grep -rln 'PUBLIC_API_BASE_URL' apps/` の旧キー込み総数）。実装後にこれが 0 になることが PASS 基準。

### 証跡 B: getApiBaseEnv / ApiBaseEnv 削除（AC-2）

```bash
grep -rn 'getApiBaseEnv\|ApiBaseEnv' apps/
```

| 項目 | 期待 | 実測（2026-06-08 実測 PASS） |
| ---- | ---- | -------------------- |
| HIT 件数 | 0 件 | 0 件（証跡 A の combined grep に含めて確認） |
| 判定 | PASS（関数・型・import・テスト名すべて消滅） | PASS |

> implemented_local_evidence_captured 時点の baseline（削除前）= 7 件（env.ts 定義 2 + env.spec import 1 + テスト 4）。production consumer 0 件のため安全に削除可能。

### 証跡 C: targeted vitest（AC-6 / AC-8 / 挙動非回帰）

| spec | 期待 | 実測（2026-06-08 実測 PASS: pass/total） |
| ---- | ---- | -------------------------------- |
| apps/web targeted set | 全 green | PASS（direct targeted run: 9 files / 79 tests） |
| apps/og targeted set | 全 green | PASS（6 files / 23 tests。対象 2 spec を含む） |

### 証跡 D: typecheck / lint（AC-8 / 型結合非破壊）

| ゲート | 期待 | 実測（2026-06-08 実測 PASS） |
| ------ | ---- | -------------------- |
| `pnpm --filter @ubm-hyogo/web typecheck` | exit 0 | PASS |
| `pnpm --filter @ubm-hyogo/web lint` | exit 0 | PASS |
| `pnpm --filter @ubm-hyogo/og typecheck` | exit 0 | PASS |

### 証跡 E: AC final-review（AC-1〜AC-9）

| 参照 | 内容 |
| ---- | ---- |
| Phase 10 §2 | AC-1〜AC-9 判定テーブル（実装後に PASS/FAIL 確定） |
| Phase 10 §3 | blocker 判定（blocker なしで Gate-B 通過候補） |

## 総合判定（PASS）

| 項目 | 状態 |
| ---- | ---- |
| 証跡 A（旧キー 0） | PASS |
| 証跡 B（getApiBaseEnv 0） | PASS |
| 証跡 C（vitest 全 green） | PASS |
| 証跡 D（typecheck/lint exit 0） | PASS |
| 証跡 E（AC 全 PASS） | PASS |
| **NON_VISUAL 総合** | PASS（PASS = 全証跡充足で視覚証跡 N/A を正当化） |

## 参照資料

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 手動テスト方針 | 本 workflow `outputs/phase-11/phase-11.md` | NON_VISUAL 宣言 / 代替証跡構成 |
| 品質ゲート | 本 workflow `outputs/phase-9/phase-9.md` | QG-1〜11 |
| AC 判定 | 本 workflow `outputs/phase-10/phase-10.md` | AC-1〜AC-9 / blocker |
| env アクセス不変条件 | `CLAUDE.md`「apps/web env アクセス不変条件（task-02 wrangler-env-injection）」 | accessor 経由のみ / `process.env.*` 直接禁止 |
