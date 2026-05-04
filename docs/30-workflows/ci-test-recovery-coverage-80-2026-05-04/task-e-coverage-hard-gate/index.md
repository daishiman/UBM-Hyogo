# タスク仕様書: Task E — coverage-gate hard gate 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | ci-recover-task-e-coverage-gate-hard |
| 親 wave | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/` |
| 配置先 | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-e-coverage-hard-gate/` |
| 作成日 | 2026-05-04 |
| 状態 | implemented-local / runtime-evidence-pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 親タスクの wave | wave-3 |
| dependencies | Task C (apps/web coverage 80%) + Task D (apps/api coverage 80%) の現存 `coverage-summary.json` は全 metric 80% 以上。CI runtime evidence は Phase 11 で取得 |
| ブランチ（想定） | `feat/ci-recover-task-e-coverage-gate-hard` |
| 想定 PR 数 | 1 |
| coverage AC | 適用（≥80% を全 package で維持。本タスクの差分は workflow yml のみだがリポジトリ全体の閾値は維持確認対象） |

## 目的

Task C / D 完了後、`.github/workflows/ci.yml` の `coverage-gate` job から `continue-on-error: true` を削除し、coverage 80% 未達時に CI が即 fail する **hard gate** に昇格させる。これは coverage-80-enforcement workflow の最終段（PR3/3）に相当する。

## スコープ

| 含む | 含まない |
| --- | --- |
| `.github/workflows/ci.yml` の job レベル `continue-on-error: true` 削除（line 62 付近） | `coverage-gate` job の test 実行ロジック変更 |
| 同 workflow の step `Run coverage-guard` の `continue-on-error: true` 削除（line 97 付近） | 閾値 80% の引き上げ・引き下げ |
| 関連 inline コメント（PR1/3 → PR3/3）更新 | branch protection 変更（既存 CI gate 強化のみ） |
| `scripts/coverage-guard.sh` full mode を判定対象 package loop に統一 | 閾値 80% の変更 |
| `scripts/coverage-guard.test.ts` に hard gate 再混入防止テスト追加 | branch protection 変更（ユーザー承認後の外部設定変更） |
| `docs/30-workflows/completed-tasks/coverage-80-enforcement/outputs/phase-12/implementation-guide.md` への hard gate 化完了追記（存在時） | 新規 coverage-80-enforcement spec 作成 |

## 不変条件（CLAUDE.md 継承）

- 不変条件 #5: D1 への直接アクセスは `apps/api` に閉じる（本タスクは workflow yml のみだが、coverage gate を hard 化することで apps/web からの D1 直接アクセスを起点とする regression を CI で阻止する効果を強化する）
- 不変条件 #6: GAS prototype は本番バックエンド仕様に昇格させない
- CONST_007: 本 Task で発生した未解決事項は別 PR / 別 wave に送らず、`outputs/phase-12/unassigned-task-detection.md` に「除外理由付き 0 件 close」または fixture 補強で吸収する

## 完了条件（spec 段階）

- [x] Phase 1-13 の `phase-N.md` が存在し、各 Phase が `## メタ情報` / `## 目的` / `## 実行タスク` / `## 完了条件` を持つ
- [x] coverage AC（≥80% / `bash scripts/coverage-guard.sh` exit 0）が Phase 6 / Phase 9 / Phase 11 完了条件に明記されている
- [x] Phase 13 が blocked placeholder（commit / push / PR / deploy 禁止）として配置されている
- [x] dependencies に Task C / Task D の完了必須が明記されている

## 完了条件（実装段階）

- [x] `.github/workflows/ci.yml` の `coverage-gate` job 定義（line 56-62 付近）から `continue-on-error: true` が削除済み
- [x] 同 workflow の step `Run coverage-guard`（line 94-100 付近）から `continue-on-error: true` が削除済み
- [x] inline コメントの `PR1/3` 表現が `PR3/3 完了 / hard gate 化済` に更新されている
- [x] `scripts/coverage-guard.test.ts` で `coverage-gate` block の `continue-on-error` 再混入を検出する
- [ ] 本タスクのブランチを push し、`coverage-gate` job が PASS したことを Phase 11 evidence で記録
- [ ] Statements / Branches / Functions / Lines が apps/api / apps/web / packages/* 全パッケージで ≥80%
- [ ] `bash scripts/coverage-guard.sh` exit 0
- [x] `docs/30-workflows/completed-tasks/coverage-80-enforcement/` の implementation-guide.md（存在時）に「PR3/3 hard gate 化完了」追記
- [ ] main 取り込み後の CI run が緑

## 参照資料

| 参照資料 | パス |
| --- | --- |
| 親 wave 仕様 | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/index.md` |
| Phase 1-3 共通設計 | `../outputs/phase-{1,2,3}/*.md` |
| CI workflow 正本 | `.github/workflows/ci.yml`（line 56-110 が coverage-gate job） |
| coverage-guard スクリプト | `scripts/coverage-guard.sh` |
| 既存 enforcement spec | `docs/30-workflows/completed-tasks/coverage-80-enforcement/`（存在時） |
| coverage-standards | `.claude/skills/task-specification-creator/references/coverage-standards.md` |
| Task C 仕様 | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-c-apps-web-coverage-80/` |
| Task D 仕様 | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-d-apps-api-coverage-80/` |

## Phase 一覧

| Phase | 名称 | 状態 |
| --- | --- | --- |
| 1 | 要件定義 | spec_created |
| 2 | 設計 | spec_created |
| 3 | アーキテクチャ確認 | spec_created |
| 4 | テスト設計 | spec_created |
| 5 | 実装（workflow 編集） | spec_created |
| 6 | テスト実装・カバレッジ確認 | spec_created |
| 7 | テストカバレッジ確認 | spec_created |
| 8 | 統合テスト | spec_created |
| 9 | 品質検証 | spec_created |
| 10 | 最終レビュー | spec_created |
| 11 | 手動テスト / runtime evidence | spec_created |
| 12 | ドキュメント更新（7 必須成果物） | spec_created |
| 13 | コミット・PR 作成 | blocked（user 明示承認後のみ） |
