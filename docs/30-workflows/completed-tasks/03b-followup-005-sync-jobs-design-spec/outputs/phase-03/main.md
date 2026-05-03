# Phase 3: 実装計画（変更ファイル一覧 + 差し替え順序）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 03b-followup-005-sync-jobs-design-spec |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 実装計画（変更ファイル一覧 + 差し替え順序） |
| Wave | 3 |
| Mode | parallel（implementation / NON_VISUAL） |
| 作成日 | 2026-05-02 |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (verify suite 設計) |
| 状態 | verified |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| user_approval | NOT_REQUIRED |

## 目的

Phase 6〜9 で実施する docs 変更の対象ファイル一覧、差し替え順序、indexes 再生成タイミング、ロールバック手順を確定する。コード変更は含まない。本 Phase 終了時点で「どのファイルをどの順番で何に書き換えるか」が完全に表で確定していること。

## 実行タスク

1. 変更対象ファイル一覧の確定（新規 / 更新の区分）
2. 差し替え順序の確定（参照先を先に作成 → 参照元を後で書き換え）
3. indexes 再生成タイミングの固定
4. ロールバック手順（git revert 単位）の整理
5. PR スコープ確認（implementation / コード差分あり）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/03b-followup-005-sync-jobs-design-spec/phase-02.md | 章立て / schema 設計 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | 参照差し替え対象 |
| 必須 | docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-005-sync-jobs-design-spec.md | 起票元 followup（参照リンク追加対象） |
| 必須 | .github/workflows/verify-indexes.yml | indexes drift 検証 CI gate |
| 推奨 | docs/00-getting-started-manual/lefthook-operations.md | indexes 再生成運用 |

## 変更対象ファイル一覧

| # | パス | 区分 | 変更内容 | 担当 Phase |
| --- | --- | --- | --- | --- |
| 1 | docs/30-workflows/_design/sync-jobs-spec.md | 新規 | 9 章構成の正本仕様初版 | 6 |
| 2 | 03a 関連 task spec（取り込み済の場合） | 更新 | 重複定義削除 + `_design/` への参照リンク追加 | 7 |
| 3 | docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/ 配下の関連 spec | 更新 | 重複定義削除 + `_design/` への参照リンク追加 | 7 |
| 4 | .claude/skills/aiworkflow-requirements/references/database-schema.md | 更新 | `sync_jobs` 節を `_design/sync-jobs-spec.md` 参照に変更 | 8 |
| 5 | .claude/skills/aiworkflow-requirements/indexes/ 配下 | 自動生成 | `pnpm indexes:rebuild` による再生成 | 9 |

## 差し替え順序

1. **Phase 6**: `_design/sync-jobs-spec.md` 新規作成（参照先確立）
2. **Phase 7**: 03a / 03b 関連 task spec を `_design/` 参照に置き換え（参照元書き換え）
3. **Phase 8**: `database-schema.md` の `sync_jobs` 節を `_design/` 参照に更新
4. **Phase 9**: `mise exec -- pnpm indexes:rebuild` 実行 → drift 解消 → evidence 保存

> 順序の根拠: 参照先（`_design/`）が存在する状態で参照元を書き換えないとリンク切れが発生する。indexes 再生成は全 docs 変更が完了した最後に 1 回だけ行い、CI gate `verify-indexes-up-to-date` で検証する。

## indexes 再生成タイミング

- **1 回のみ**: Phase 9 で `mise exec -- pnpm indexes:rebuild` を実行
- post-merge での自動再生成は廃止済み（CLAUDE.md 参照）。明示実行が正規経路
- evidence: コマンド標準出力を `outputs/phase-09/indexes-rebuild.log` に保存

## ロールバック手順

- 単位: Phase 6 / 7 / 8 / 9 ごとに 1 commit を原則とし、各 Phase は独立 revert 可能
- 失敗パターン: `verify-indexes-up-to-date` 落ち → Phase 9 を revert + 再実行
- リンク切れ: Phase 7 を revert（`_design/` は残す）

## PR スコープ確認（implementation）

- 変更対象は `docs/**` と `.claude/skills/aiworkflow-requirements/references/database-schema.md` および `indexes/` のみ
- `apps/api/**` / `apps/web/**` には差分が入らない（grep evidence で 0 件確認）
- `pnpm typecheck` / `pnpm lint` は関連（implementation）。必要な場合のみ任意 evidence として扱い、required gate は indexes / cross-reference / schema coverage に限定する

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | 変更ファイル一覧 / 順序 / indexes 再生成 / rollback |
| メタ | artifacts.json | Phase 3 を completed に更新 |

## 統合テスト連携

- 本タスクは implementation / NON_VISUAL の仕様書作成であり、D1 DDL・API 挙動は変更しない。TS ランタイム正本と既存 consumer の参照化は本 wave で実施済み。
- 統合テストの実行は Phase 11 の NON_VISUAL evidence（cross-reference / job_type coverage / indexes drift）で代替する。
- 実装や schema drift が見つかった場合は、本タスク内で吸収せず別 follow-up に分離する。

## 完了条件

- [ ] 変更対象ファイル一覧が表で確定（5 件以上）
- [ ] 差し替え順序が「参照先 → 参照元 → indexes」の順で固定
- [ ] indexes 再生成タイミングが Phase 9 1 回のみと明記
- [ ] ロールバック単位が Phase ごとに独立可能と確認
- [ ] PR スコープに `apps/**` 差分が入らないことが grep 計画で示されている
- [ ] DoD: ファイル存在 / リンク有効 / grep 参照確認 / indexes drift なし（Phase 9 で実測）

## 次 Phase

- 次: 4（verify suite 設計）
- 引き継ぎ事項: 変更ファイル 5 件 / 差し替え 4 ステップ / indexes 1 回再生成 / Phase 単位 revert
- ブロック条件: `apps/**` 差分が必要になった場合（その場合 implementation 区分から外れるため別タスク化）
