# Phase 7: AC マトリクス — ut-05a-fetchpublic-service-binding-001

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | ut-05a-fetchpublic-service-binding-001 |
| task_id | UT-05A-FETCHPUBLIC-SERVICE-BINDING-001 |
| phase | 7 / 13 |
| wave | Wave 5 |
| mode | serial |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| issue | #387 (CLOSED) |

## 目的

各 AC が evidence path / 検証 Layer / 異常系ハンドリングと 1 対 1 対応していることを
マトリクスで確定する。

## 実行タスク

1. AC-1〜AC-6 を evidence path と対応づける
2. redaction checklist を curl / tail evidence の PASS 条件へ接続する
3. PASS / FAIL 判定ロジックを固定する

## 参照資料

- docs/30-workflows/ut-05a-fetchpublic-service-binding-001/phase-04.md
- docs/30-workflows/ut-05a-fetchpublic-service-binding-001/phase-05.md
- docs/30-workflows/ut-05a-fetchpublic-service-binding-001/phase-06.md

## AC マトリクス

| AC | 内容 | 検証 Layer | 主 evidence path | 異常系参照 |
| --- | --- | --- | --- | --- |
| AC-1 | `apps/web/src/lib/fetch/public.ts` が service-binding 優先 + HTTP fallback で実装 | Layer 1（ユニット） | `outputs/phase-11/code-diff-summary.md` | service-binding 経路系 / local dev 系 |
| AC-2 | `apps/web/wrangler.toml` の `[[env.staging.services]]` / `[[env.production.services]]` に `binding = "API_SERVICE"` 設定 | Layer 3 / Layer 4（deploy 成功で間接検証） | `outputs/phase-11/code-diff-summary.md` | wrangler.toml / deploy 系 |
| AC-3 | staging `/` `/members` が curl 200 | Layer 3 | `outputs/phase-11/staging-curl.log` | service-binding 経路系 / wrangler.toml 系 |
| AC-4 | production `/` `/members` が curl 200 | Layer 4 | `outputs/phase-11/production-curl.log` | service-binding 経路系 / wrangler.toml 系 |
| AC-5 | `wrangler tail` log に `transport: 'service-binding'` | Layer 5 | `outputs/phase-11/wrangler-tail-staging.log` | tail / observability 系 / Secret・PII |
| AC-6 | local `pnpm dev` で fallback regression なし | Layer 2 | `outputs/phase-11/local-dev-fallback.log` | local dev / fallback 系 |

## evidence path 一覧

- `outputs/phase-11/main.md` — Phase 11 集約 placeholder（実測時に PASS / FAIL 集約）
- `outputs/phase-11/staging-curl.log`（AC-3）
- `outputs/phase-11/production-curl.log`（AC-4）
- `outputs/phase-11/wrangler-tail-staging.log`（AC-5）
- `outputs/phase-11/local-dev-fallback.log`（AC-6）
- `outputs/phase-11/code-diff-summary.md`（AC-1, AC-2）
- `outputs/phase-11/redaction-checklist.md`（AC-3〜AC-5 の log 系 PASS 条件）

## redaction checklist 接続

curl / tail log を含む evidence は、`redaction-checklist.md` の以下を全 PASS にした
状態でのみ AC PASS と判定する:

- Bearer / cookie / Authorization 値が log に残っていない
- email / 氏名 / 電話番号 が log に残っていない
- account id / token id が log に残っていない

いずれかが NG の場合、当該 evidence は破棄して再取得し、AC は FAIL のまま維持する。

## 完了判定ルール

- AC-1, AC-2 はコード仕様 PASS（diff summary と実コードが一致）で PASS
- AC-3, AC-4, AC-5 は 200 / 文字列含有 + redaction PASS で PASS
- AC-6 は HTTP fallback 経路で local 200 が確認できれば PASS
- いずれか FAIL の場合、本タスクは **partial completed** とし、Phase 11 集約に FAIL 理由を記述

## 多角的チェック観点

- 「placeholder のまま」を AC PASS と扱わない
- evidence path のファイル存在だけでなく内容妥当性も確認対象に含める
- AC-5 が PASS でも redaction NG なら全体 FAIL

## 統合テスト連携

Phase 11 の必須 outputs は本 AC マトリクスを唯一の evidence contract とする。`artifacts.json` / `outputs/artifacts.json` / `phase-11.md` / `outputs/phase-11/main.md` の path はこの表に揃え、分割 curl ファイル名など別 contract を追加しない。

## サブタスク管理

- [ ] AC-1〜AC-6 と evidence path の対応を確定
- [ ] redaction checklist 連動を確定
- [ ] PASS / FAIL 判定ロジックを記述
- [ ] outputs/phase-07/main.md を作成する

## 成果物

- outputs/phase-07/main.md

## 完了条件

- AC マトリクスが 1 対 1 で完成している
- evidence path の不在が AC FAIL に直結する判定式である
- redaction checklist が PASS 条件に組み込まれている

## タスク100%実行確認

- [ ] partial completed 時のフォローパスが記述されている
- [ ] AC ↔ evidence path に欠落がない

## 次 Phase への引き渡し

Phase 8 へ、AC マトリクスと判定ロジックを渡す。
