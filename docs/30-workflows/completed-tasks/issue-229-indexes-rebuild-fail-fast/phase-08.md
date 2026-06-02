# Phase 8: DRY 化・リファクタリング

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `pnpm indexes:rebuild` の fail-fast / atomic write / decisive log 保証 (issue-229-indexes-rebuild-fail-fast) |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化・リファクタリング |
| 作成日 | 2026-05-31 |
| 前 Phase | 7 (AC / カバレッジマトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | completed |
| 実装区分 | 実装仕様書（CONST_004 デフォルト・コード変更を伴う） |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |

## 目的

Phase 2〜7 で固定した atomic write helper（`writeFileAtomic` / `writeAllIndexesAtomic`）・decisive log フォーマット・silent catch 分離の実装方針について、同じ判定ロジックや文字列組み立てが複数箇所へ散らばらないよう DRY 化の方針を確定する。本 Phase は仕様書であり実コードは今回サイクルで実装済み。「対象 / Before / After / 理由」テーブルで重複除去の意図を記録し、今回の実装サイクルが最小差分で着手できる状態にする。

## 真の論点（DRY 化の境界）

- **byte-identical 不変条件（AC-4）が DRY 化の上限**。出力文字列の組み立て（`generateTopicMap` / `generateKeywordIndex` 本体、`JSON.stringify(..., null, 2)`）は drift を生むため一切共通化・整形変更しない。DRY 化対象は「書き込み経路」「エラーログ生成」「CLI ガード判定」に限る。
- **過剰共通化の回避**: tmp パス算出（`${targetPath}.tmp`）や `[generate-index]` 接頭辞を 1 箇所に集約しつつ、helper を増やしすぎて読解コストを上げない。helper は `writeFileAtomic`（単一ファイル）/ `writeAllIndexesAtomic`（all-or-nothing オーケストレーション）の 2 段のみとする。

## DRY 化対象テーブル（対象 / Before / After / 理由）

| # | 対象 | Before（Phase 1 時点の現状コード） | After（Phase 2 設計の集約先） | 理由 |
| --- | --- | --- | --- | --- |
| DRY-1 | index 書き込み経路 | `:338` topic-map.md / `:344` keywords.json を個別に `await writeFile(...)` で逐次・非 atomic に書く（同一パターンが 2 箇所に重複） | `writeFileAtomic(targetPath, data)` 1 関数に集約。各 index は entry 化して `writeAllIndexesAtomic(entries)` が一括処理 | tmp→rename パターンを 2 箇所に書き写すと片方だけ atomic 化される drift を生む。単一 helper に集約して atomic 境界を 1 箇所に閉じる（AC-2） |
| DRY-2 | tmp パス算出 | （現状は tmp 概念がなく重複なし。新規導入時に `${path}.tmp` を helper 内外で二重に書くリスク） | tmp パス文字列の生成は `writeFileAtomic` 内のみで行い、呼び出し側は最終パスのみ渡す | tmp サフィックス（`.tmp`）を複数箇所に散らすと EXDEV 回避（同一 dir 制約）が崩れる |
| DRY-3 | tmp 掃除（失敗時の unlink） | （現状なし。新規導入時に各 entry ごとに try/catch で unlink を書くと重複） | `writeAllIndexesAtomic` の `finally` 1 箇所で残存 tmp を一括 unlink | 掃除ロジックを entry ごとに重複させると掃除漏れの穴が生まれる。all-or-nothing 境界の所有者に集約 |
| DRY-4 | decisive エラーログ接頭辞 | `:356` の `console.error("エラー:", err.message)` に固有文字列。接頭辞が他箇所と不統一 | `[generate-index] <skill> / <index-file> (<step>) 失敗: <message>` の組み立てを `writeAllIndexesAtomic` の throw 時に集約し、top-level catch は既に接頭辞付きかを判定して二重付与しない | grep 可能な単一接頭辞 `[generate-index]` に統一しないと AC-3 のログ特定性が崩れる。接頭辞の二重付与を防ぐ判定も 1 箇所に閉じる |
| DRY-5 | extractHeadings の catch | `:175-177` の `catch { return []; }`（silent。1 箇所だが分岐意図が暗黙） | ENOENT 判定（空継続）/ その他 throw を明示分岐に書き換え。判定基準（`err?.code === "ENOENT"`）を当該 catch 内に限定 | silent catch を他の read 箇所へコピーすると AC-5 の穴が再発する。分岐は extractHeadings 内に閉じ、他へ波及させない |
| DRY-6 | CLI 実行ガード判定 | top-level で `main().catch(...)` が即実行（import 副作用）。ガード判定が存在しない | `import.meta.url === pathToFileURL(process.argv[1]).href` の判定を 1 箇所のみに置き、`main()` 呼び出しをその内側に閉じる | ガード判定を複数箇所に書くとテスト時の import 副作用排除（TC-06）が不安定になる |

## 命名整理

| 観点 | 方針 |
| --- | --- |
| helper 命名 | `writeFileAtomic`（単一ファイル）/ `writeAllIndexesAtomic`（複数 index の all-or-nothing）。camelCase・既存命名規則に整合 |
| entry 構造 | `{ step, path, data }` で統一（step= 失敗ログ用の識別子、path= 最終出力、data= 書き込み文字列） |
| ログ接頭辞 | `[generate-index]` で grep 可能に統一（AC-3） |
| export 範囲 | `writeFileAtomic` / `writeAllIndexesAtomic` / `generateTopicMap` / `generateKeywordIndex` を named export。`main` はテスト不要のため export しない |

## 残す重複（共通化しない判断）

| 対象 | 残す理由 |
| --- | --- |
| `generateTopicMap` / `generateKeywordIndex` の出力文字列組み立て | byte-identical 不変条件（AC-4）の正本。共通化・整形すると drift。意図的に現状維持 |
| `--quiet` フラグ判定 | 既存挙動（hook が `>/dev/null 2>&1` で呼ぶ）を変えない。本タスク scope 外 |

## 実行タスク

1. 重複・散逸候補（DRY-1〜DRY-6）を行番号付きで列挙する（完了条件: 対象テーブルが本 Phase に存在）。
2. atomic write helper を 2 段（`writeFileAtomic` / `writeAllIndexesAtomic`）に集約する方針を確定する（完了条件: DRY-1〜DRY-3 が helper に閉じる）。
3. decisive ログ接頭辞・CLI ガード判定の単一箇所集約を確定する（完了条件: DRY-4 / DRY-6 が 1 箇所）。
4. byte-identical を破る共通化を「残す重複」として明示除外する（完了条件: AC-4 のトレースが失われていないことを確認）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | （本ワークフロー）phase-02.md | 関数シグネチャ / 設計方針 D-1〜D-5 |
| 必須 | （本ワークフロー）phase-07.md | AC / カバレッジマトリクス（DRY 化後もトレース維持） |
| 必須 | scripts/cf-audit-log/feature-export.ts | atomic write 先例（tmp→rename） |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 8 境界 |

## スコープ

### 含む

- DRY 化対象（DRY-1〜DRY-6）の「対象 / Before / After / 理由」記録
- helper 2 段集約・ログ接頭辞単一化・CLI ガード単一化の方針確定
- 残す重複（byte-identical 正本）の明示除外

### 含まない

- 実 `generate-index.js` の編集（今回の実装サイクル）
- 出力文字列・JSON シリアライズの整形変更（drift を生むため禁止）
- `--quiet` フラグ挙動の変更

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化後の helper 構造と AC トレースを品質保証で検証 |
| Phase 11 | byte-identical（drift 0）を CLI 回帰 smoke で確認 |

## 多角的チェック観点

- DRY 化で AC-1（非ゼロ exit）/ AC-2（atomic）/ AC-3（decisive log）/ AC-5（silent catch 分離）のトレースが曖昧化していないか。
- byte-identical を破る共通化（出力文字列の整形）が紛れ込んでいないか。
- helper を増やしすぎて読解コストが上がっていないか（2 段に限定）。

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | 重複・散逸候補 DRY-1〜DRY-6 列挙 | completed | Phase 2 設計後に実装サイクルで確定 |
| 2 | helper 2 段集約方針 | completed | DRY-1〜DRY-3 |
| 3 | ログ接頭辞・CLI ガード単一化 | completed | DRY-4 / DRY-6 |
| 4 | 残す重複の明示除外 | completed | AC-4 byte-identical |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| DRY 化記録 | outputs/phase-08/main.md | 重複除去対象・After 集約先・残した重複の理由 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] DRY 化対象（DRY-1〜DRY-6）が「対象 / Before / After / 理由」テーブルで記録されている
- [ ] atomic write helper が 2 段（`writeFileAtomic` / `writeAllIndexesAtomic`）に集約される方針が明記されている
- [ ] decisive ログ接頭辞・CLI ガード判定の単一箇所集約が記録されている
- [ ] byte-identical を破る共通化が「残す重複」として明示除外されている
- [ ] AC-1〜AC-8 のトレースが DRY 化後も失われていない

## タスク100%実行確認【必須】

- [ ] 全実行タスク（4 件）が記録されている
- [ ] 成果物が `outputs/phase-08/main.md` に配置済み
- [ ] artifacts.json の Phase 8 状態が `completed`

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証)
- 引き継ぎ事項: DRY 化後の helper 2 段構造 / ログ接頭辞単一化 / 残す重複（byte-identical 正本）
- ブロック条件: DRY 化で AC トレースが失われる場合
