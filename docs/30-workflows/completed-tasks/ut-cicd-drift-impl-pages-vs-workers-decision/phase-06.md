# Phase 6: 異常系（cutover 失敗 / drift 再発シナリオ）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Pages vs Workers deploy target decision (UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系（cutover 失敗 / drift 再発シナリオ） |
| 作成日 | 2026-05-01 |
| 前 Phase | 5（仕様 runbook 作成） |
| 次 Phase | 7（AC マトリクス） |
| 状態 | spec_created |
| タスク分類 | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

ADR 起票後に発生しうる失敗シナリオ・落とし穴を 5 件以上識別し、各シナリオに対する Phase 5 / Phase 12 での予防策を定義する。本 Phase の出力は Phase 5 ADR Consequences と Phase 12 unassigned-task-detection.md の追補入力として利用される。シナリオは「decision drift」「cutover 実装エラー」「ガバナンス重複」「不変条件抵触」「保留風化」の 5 系統で網羅する。

## 異常系シナリオと予防策

### シナリオ 1: cutover 後の `@opennextjs/cloudflare` メジャーアップデート互換性破綻

| 項目 | 内容 |
| --- | --- |
| 発生条件 | cutover 採択後、`@opennextjs/cloudflare` のメジャーバージョンアップで `[assets]` binding 仕様や `.open-next/worker.js` 出力構造が破壊的変更 |
| 影響 | apps/web deploy が失敗。production の Web UI が更新不能 |
| 検出経路 | `web-cd.yml` の deploy step エラー / staging smoke test 失敗 |
| 予防策 (Phase 5) | ADR Consequences に「`@opennextjs/cloudflare` バージョン更新時は migration-001 連動タスクで再評価」を明記 |
| 予防策 (Phase 12) | unassigned-task-detection.md に「@opennextjs/cloudflare バージョン監視タスク」を未タスク候補として記録 |

### シナリオ 2: deployment-cloudflare.md 判定表更新漏れによる drift 再発

| 項目 | 内容 |
| --- | --- |
| 発生条件 | ADR を起票したが判定表「現状 / 将来」列を更新せず、下流タスクが古い判定表を参照 |
| 影響 | UT-04 / UT-09 等の下流タスクが誤った deploy target を前提に着手 |
| 検出経路 | Phase 4 検証コマンド #2（ADR ⇔ 判定表照合）で記述不一致を検出 |
| 予防策 (Phase 5) | doc-update-procedure.md で判定表更新を必須 4 Step として固定 |
| 予防策 (Phase 12) | documentation-changelog.md Step 1-A で 5 ファイル同 wave 同期チェック（ADR / 判定表 / CLAUDE.md / index.md / artifacts.json）を必須化 |

### シナリオ 3: CLAUDE.md だけ更新して wrangler.toml が Pages 形式のまま放置（false-complete）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | cutover 採択 + CLAUDE.md / 判定表は Workers 表記に更新済みだが、`apps/web/wrangler.toml` が Pages 形式（`pages_build_output_dir`）のまま |
| 影響 | 文書とコードの乖離が再発。次の作業者が CLAUDE.md を信じて Workers 機能を追加し、deploy 時に矛盾が顕在化 |
| 検出経路 | Phase 4 検証コマンド #1 で `pages_build_output_dir` と「Cloudflare Workers」の同時検出 |
| 予防策 (Phase 5) | ADR Consequences に「実 cutover は task-impl-opennext-workers-migration-001 で実施するまで wrangler.toml は Pages 形式のまま」を明記、もしくは ADR Status を `Accepted (implementation pending)` に格下げ |
| 予防策 (Phase 12) | cutover stub 起票時に「ADR 採択 ≠ 実 cutover 完了」を unassigned-task-detection.md ヘッダで強調 |

### シナリオ 4: 関連タスク 2 件との重複起票

| 項目 | 内容 |
| --- | --- |
| 発生条件 | `task-impl-opennext-workers-migration-001` と `UT-GOV-006-web-deploy-target-canonical-sync` が本 ADR と同等の決定を独立に再起票 |
| 影響 | source of truth が 3 箇所に分裂。判定表・CLAUDE.md・ADR の triple-write リスク |
| 検出経路 | Phase 4 検証コマンド #5（関連タスク重複チェック）+ Phase 3 軸 C 判定 |
| 予防策 (Phase 5) | ADR Related セクションに「migration-001 = 実 cutover / UT-GOV-006 = canonical sync ガバナンス / 本 ADR = 決定根拠」の責務分離表を必須記載 |
| 予防策 (Phase 12) | unassigned-task-detection.md に「関連タスク差分確認」セクションを設け、重複時は統合先タスク ID を明記して未タスク登録を省略 |

### シナリオ 5: 保留決定時の「将来の cutover 起票タイミング」未明記による議論風化

| 項目 | 内容 |
| --- | --- |
| 発生条件 | base case が「保留」確定。CLAUDE.md / 判定表は Pages 表記に修正完了したが、いつ再検討するかが ADR に未記載 |
| 影響 | 数ヶ月〜年単位で議論が風化。`@opennextjs/cloudflare` バージョン進化と乖離。再検討トリガが失われる |
| 検出経路 | ADR Consequences に「再検討トリガ」セクション欠落の grep 検出 |
| 予防策 (Phase 5) | 保留採択時の ADR Consequences に「再検討トリガ条件」（例: `@opennextjs/cloudflare` v2.0+ リリース時 / Cloudflare Pages の機能制限が apps/web に影響したとき）を必須記載 |
| 予防策 (Phase 12) | 保留採択時は unassigned-task-detection.md に「将来の cutover 再検討タスク」を baseline 候補として記録（current ではない） |

## 追加: 不変条件 #5 抵触シナリオ（保険）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | cutover 採択を契機に「apps/web から D1 を直接読みたい」要求が浮上し、`apps/web/wrangler.toml` に `[[d1_databases]]` が追加される |
| 影響 | 不変条件 #5 違反。apps/api 閉じ込め原則崩壊 |
| 検出経路 | Phase 4 検証コマンド #3（不変条件 #5 抵触ガード） |
| 予防策 (Phase 5) | ADR Consequences で **必須**禁止記載（任意ではない） |
| 予防策 (Phase 12) | 必須実行コマンドとして Phase 9 / Phase 11 ガードに固定 |

## シナリオ × Phase マッピング

| シナリオ | Phase 5 予防 | Phase 9 検出 | Phase 12 措置 |
| --- | --- | --- | --- |
| 1: バージョン破綻 | Consequences 記載 | - | unassigned task 記録 |
| 2: 判定表 drift 再発 | runbook 4 Step | doc 整合 grep | Step 1-A 5 ファイル同期 |
| 3: false-complete | Status 格下げ or Consequences 明記 | wrangler.toml 形式 grep | unassigned に「ADR採択≠cutover完了」記録 |
| 4: 関連タスク重複 | Related 責務分離表 | 関連タスク重複 grep | unassigned 差分確認セクション |
| 5: 保留風化 | 再検討トリガ Consequences | - | baseline 候補記録 |
| 不変条件 #5 抵触 | Consequences 必須禁止 | `[[d1_databases]]` ガード grep | Phase 9 / 11 ガード固定 |

## 完了条件チェックリスト

- [ ] 5 系統 + 不変条件 #5 抵触の合計 6 シナリオが識別
- [ ] 各シナリオに発生条件 / 影響 / 検出経路 / Phase 5 予防 / Phase 12 措置が記述
- [ ] シナリオ × Phase マッピング表が完成
- [ ] base case 3 ケース（cutover / 保留 / 段階移行）すべてに該当するシナリオが網羅
- [ ] 不変条件 #5 抵触が独立シナリオとして強調

## 実行タスク

1. `outputs/phase-06/failure-cases.md` に 6 シナリオを表形式で記述。
2. シナリオ × Phase マッピング表を末尾に追加。
3. base case 別の該当シナリオ表（cutover 該当: 1/3/4 / 保留該当: 2/5 / 段階移行該当: 1/2/3/4 / 全 case 共通: 不変条件 #5）を整理。

## 多角的チェック観点

- **想定漏れ確認**: rollback シナリオ（cutover 後に問題発生で Pages 形式へ戻す）も Consequences に「rollback runbook 別タスク化」として言及されているか。
- **未タスク化の意図的選別**: 6 シナリオすべてを未タスク化するのではなく、「Phase 5 / 9 / 12 で予防可能なもの」と「baseline 候補として記録するもの」を仕分け。
- **不変条件 #5 の独立扱い**: 5 系統に埋め込まず独立シナリオとして冒頭・末尾の 2 箇所で強調。
- **保留 ≠ 何もしない**: シナリオ 5 が保留採択時の唯一の落とし穴ではなく「`@opennextjs/cloudflare` 採用前提を消すと CLAUDE.md 全面修正が必要」も追記候補。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 |
| --- | --- | --- | --- |
| 1 | シナリオ 1（バージョン破綻）記述 | 6 | pending |
| 2 | シナリオ 2（判定表 drift 再発）記述 | 6 | pending |
| 3 | シナリオ 3（false-complete）記述 | 6 | pending |
| 4 | シナリオ 4（関連タスク重複）記述 | 6 | pending |
| 5 | シナリオ 5（保留風化）記述 | 6 | pending |
| 6 | 不変条件 #5 抵触シナリオ独立記述 | 6 | pending |
| 7 | シナリオ × Phase マッピング表 | 6 | pending |
| 8 | base case 別該当表 | 6 | pending |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/failure-cases.md | 6 シナリオ + マッピング表 + base case 別該当表 |
| メタ | artifacts.json | Phase 6 状態の更新 |

## タスク 100% 実行確認【必須】

- 全実行タスク（8 件）が `spec_created` へ遷移
- 6 シナリオすべてに 5 カラム（発生条件 / 影響 / 検出経路 / Phase 5 予防 / Phase 12 措置）
- マッピング表が完成
- 不変条件 #5 抵触が独立シナリオ
- artifacts.json の `phases[5].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 7（AC マトリクス）
- 引き継ぎ事項:
  - 6 シナリオの予防策（Phase 5 ADR Consequences 追補入力）
  - Phase 12 措置（unassigned-task-detection.md 追補入力）
  - base case 別該当シナリオ表
- ブロック条件:
  - シナリオ識別が 5 件未満
  - 不変条件 #5 が独立シナリオ化されていない
  - Phase 5 / Phase 12 へのフィードバックパスが欠落

## 参照資料

- `outputs/phase-05/adr-runbook.md`
- `outputs/phase-05/doc-update-procedure.md`
- `docs/30-workflows/unassigned-task/task-impl-opennext-workers-migration-001.md`

## 統合テスト連携

失敗シナリオは docs-only evidence に反映する。実 runtime の失敗再現は後続 migration task の smoke / rollback rehearsal で扱う。
