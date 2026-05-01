# Phase 6 成果物: 異常系シナリオ（6 件）

## シナリオ 1: `@opennextjs/cloudflare` メジャーアップデート互換性破綻

| 項目 | 内容 |
| --- | --- |
| 発生条件 | cutover 採択後、`@opennextjs/cloudflare` のメジャーバージョンアップで `[assets]` binding 仕様や `.open-next/worker.js` 出力構造が破壊的変更 |
| 影響 | apps/web deploy 失敗 / production の Web UI 更新不能 |
| 検出経路 | `web-cd.yml` の deploy step エラー / staging smoke test 失敗 |
| 予防策 (Phase 5) | ADR Consequences に「`@opennextjs/cloudflare` バージョン更新時は migration-001 連動タスクで再評価」を明記 |
| 予防策 (Phase 12) | `unassigned-task-detection.md` baseline 候補に「`@opennextjs/cloudflare` バージョン監視タスク」を記録 |

## シナリオ 2: `deployment-cloudflare.md` 判定表更新漏れによる drift 再発

| 項目 | 内容 |
| --- | --- |
| 発生条件 | ADR を起票したが判定表「現状 / 将来」列を更新せず、下流タスクが古い判定表（`current facts (2026-04-29)` Pages 形式表記）を参照 |
| 影響 | UT-04 / UT-09 等の下流タスクが誤った deploy target を前提に着手 |
| 検出経路 | Phase 4 検証コマンド #2（ADR ⇔ 判定表照合）で記述不一致を検出 |
| 予防策 (Phase 5) | `doc-update-procedure.md` で判定表更新を **必須 4 Step** として固定 |
| 予防策 (Phase 12) | `documentation-changelog.md` Step 1-A で 5 ファイル同 wave 同期チェック [FB-04] を必須化 |

## シナリオ 3: false-complete（CLAUDE.md だけ整合済を信じて `web-cd.yml` の Pages 形式が放置）

| 項目 | 内容 |
| --- | --- |
| 発生条件 | cutover 採択 + ADR / 判定表 / CLAUDE.md / wrangler.toml は Workers 整合済だが、`.github/workflows/web-cd.yml` が依然 `command: pages deploy .next ...`（Pages 形式）のまま |
| 影響 | wrangler.toml は Workers 形式 (`main = ".open-next/worker.js"`) なのに deploy 経路が `pages deploy .next` を要求し、`.next` ディレクトリ不在で deploy 失敗 / または Pages project に Workers 出力を流す mismatch |
| 検出経路 | Phase 4 検証コマンド #1 で `pages deploy` 行と `main = ".open-next/worker.js"` が同時検出 |
| 予防策 (Phase 5) | ADR Consequences に「ADR 採択 ≠ 実 cutover 完了。`web-cd.yml` 切替は migration-001 で実施」を明記 / ADR Status を一時的に `Accepted (implementation pending)` 表記の選択肢を残す |
| 予防策 (Phase 12) | `unassigned-task-detection.md` ヘッダで「ADR 採択 ≠ cutover 完了」を強調 + migration-001 を current として識別 |

## シナリオ 4: 関連タスク 2 件との重複起票

| 項目 | 内容 |
| --- | --- |
| 発生条件 | `task-impl-opennext-workers-migration-001` と `UT-GOV-006-web-deploy-target-canonical-sync` が本 ADR と同等の決定を独立に再起票 |
| 影響 | source of truth が 3 箇所に分裂。判定表 / CLAUDE.md / ADR の triple-write リスク |
| 検出経路 | Phase 4 検証コマンド #5（関連タスク重複チェック）+ Phase 3 軸 C 判定 |
| 予防策 (Phase 5) | ADR Related セクションに「migration-001 = 実 cutover / UT-GOV-006 = canonical sync ガバナンス / 本 ADR = 決定根拠」の責務分離表を必須記載 |
| 予防策 (Phase 12) | `unassigned-task-detection.md` に「関連タスク差分確認」セクションを設け、重複時は統合先タスク ID を明記して未タスク登録を省略 |

## シナリオ 5: 保留決定時の「将来 cutover 起票タイミング」未明記による議論風化

| 項目 | 内容 |
| --- | --- |
| 発生条件 | （base case が保留採択された場合の仮想シナリオ）CLAUDE.md / 判定表は Pages 表記に修正完了したが、いつ再検討するかが ADR に未記載 |
| 影響 | 数ヶ月〜年単位で議論が風化。`@opennextjs/cloudflare` バージョン進化と乖離。再検討トリガが失われる |
| 検出経路 | ADR Consequences に「再検討トリガ」セクション欠落の grep 検出 |
| 予防策 (Phase 5) | 保留採択時の ADR Consequences に「再検討トリガ条件」（例: `@opennextjs/cloudflare` v2.0+ リリース時 / Cloudflare Pages の機能制限が apps/web に影響したとき）を必須記載 |
| 予防策 (Phase 12) | 保留採択時は `unassigned-task-detection.md` に「将来の cutover 再検討タスク」を baseline 候補として記録 |

> 本タスクは **cutover 採択** のため本シナリオは仮想。base case 別該当表で「保留採択時のみ該当」と明示。

## シナリオ 6: 不変条件 #5 抵触（保険）

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
| 1: バージョン破綻 | Consequences 記載 | - | unassigned baseline |
| 2: 判定表 drift 再発 | runbook 4 Step | doc 整合 grep | Step 1-A 5 ファイル同期 |
| 3: false-complete | Consequences 明記 | wrangler.toml + web-cd.yml 形式 grep | unassigned に「ADR 採択 ≠ cutover 完了」記録 |
| 4: 関連タスク重複 | Related 責務分離表 | 関連タスク重複 grep | unassigned 差分確認セクション |
| 5: 保留風化 | 再検討トリガ Consequences（保留時のみ） | - | baseline 候補（保留時のみ） |
| 6: 不変条件 #5 抵触 | Consequences 必須禁止 | `[[d1_databases]]` ガード grep | Phase 9 / 11 ガード固定 |

## base case 別該当シナリオ表

| base case | 該当シナリオ |
| --- | --- |
| **cutover（採択）** | 1, 2, 3, 4, 6 |
| 保留 | 2, 5, 6 |
| 段階移行 | 1, 2, 3, 4, 6 |
| **全 base case 共通** | **6（不変条件 #5）** |

## rollback シナリオへの言及

cutover 採択後に問題発生で Pages 形式へ戻す場合の rollback runbook は別タスク化（baseline 候補）として `unassigned-task-detection.md` に記録する。

## 完了確認

- [x] 6 シナリオすべてに 5 カラム（発生条件 / 影響 / 検出経路 / Phase 5 予防 / Phase 12 措置）
- [x] シナリオ × Phase マッピング表完成
- [x] base case 別該当表
- [x] 不変条件 #5 抵触が独立シナリオとして強調
- [x] rollback runbook の baseline 化言及
