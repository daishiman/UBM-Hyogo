<!-- workflow: issue-1005-members-ux-playwright-baseline-stabilization / phase: 12 -->

# Skill Feedback Report — issue-1005-members-ux-playwright-baseline-stabilization

3 観点固定（テンプレ改善 / ワークフロー改善 / ドキュメント改善）でフィードバックを記録する。

## 1. テンプレ改善（task-specification-creator）

**なし。** 既存 Phase 1-13 テンプレートと canonical 9 見出しで本タスクを過不足なく表現できた。
test-stabilization（test infra 編集）も implementation テンプレートで吸収できている。

## 2. ワークフロー改善

**知見あり（再発防止）:**

- **completed-tasks への dir 移動時の path drift**: workflow dir を `completed-tasks/` 配下へ移動すると、
  その dir パスを **ハードコード参照する spec / コード**（本件では Playwright spec の `workflowRoot` 定数）が
  古い active path を指したまま残り、再実行時に誤った新規 dir へ evidence を書き込む path drift 回帰が起きる。
- **再発防止策**: close-out / dir 移動時に「移動 dir をハードコード参照する非ドキュメント資産（test spec の出力先定数・
  config の EVIDENCE_DIR・env default 等）」を grep で洗い出し、移動先 path へ同 wave で補正する。
  特に `docs/30-workflows/<name>` 形式の文字列リテラルを `apps/web/playwright/` 等の実コードから検索する。
- これは MEMORY.md の「移動先 dir 配下の残存検索に `grep -v` で自分自身を除外して self-ref を見逃す」教訓と
  対をなす（移動 dir を**参照する側**の drift）。
- **cold-start visual baseline の二段 race**: `/members` route compile は 120s を超える場合があるため
  task-specific evidence flag では `webServer.timeout` も route ready URL と同時に延長する。また mobile collapsed filter は
  hydration 直後に click state が反映されない場合があるため、visual spec では `data-expanded=true` を待ち、component test が
  interaction contract を担保している場合に限り capture-only DOM fallback を許容する。

## 3. ドキュメント改善

**なし。** 関連正本仕様（specs/・design-tokens）への影響がなく、追記対象ドキュメントは生じなかった。

## aiworkflow-requirements 同期

同 wave で反映済み。`workflow-issue-1005-members-ux-playwright-baseline-stabilization-artifact-inventory.md` と task workflow/indexes に、completed-task path drift と Playwright baseline evidence routing の知見を同期した。

## 30種思考法 compact evidence

| カテゴリ | 適用した思考法 | 実装判断 |
| --- | --- | --- |
| 論理分析系 | 批判的思考 / 演繹思考 / 帰納的思考 / アブダクション / 垂直思考 | `implementation / VISUAL` で実コード対象が明記されているため spec-only close は矛盾。cold-start timeout、path drift、multi-project上書きを根本原因として確定。 |
| 構造分解系 | 要素分解 / MECE / 2軸思考 / プロセス思考 | RC-1..5を config / spec / evidence / docs-sync に分解し、Gate-A/BとGate-Cを分離。 |
| メタ・抽象系 | メタ思考 / 抽象化思考 / ダブル・ループ思考 | 「仕様書を作る」ではなく「実装可能な実コード差分を同 wave で完了する」へ前提を修正。 |
| 発想・拡張系 | ブレインストーミング / 水平思考 / 逆説思考 / 類推思考 / if思考 / 素人思考 | webServer ready URL、spec beforeAll、env override、default matrix ignoreを組み合わせ、将来の workflow root 移動にも耐える形へ最小化。 |
| システム系 | システム思考 / 因果関係分析 / 因果ループ | completed-task移動→hardcoded path→誤dir生成→evidence drift のループを skill 正本へ反映して再発を遮断。 |
| 戦略・価値系 | トレードオン思考 / プラスサム思考 / 価値提案思考 / 戦略的思考 | local deterministic evidence は完了、commit/PR/staging/Issue mutationのみ user-gatedに残し、価値と権限境界を両立。 |
| 問題解決系 | why思考 / 改善思考 / 仮説思考 / 論点思考 / KJ法 | stale path、cold compile、mobile hydration、project duplication、state/docs driftを束ね、実装・Phase 11・Phase 12・2 skill反映を同一解決単位に統合。 |

## DoD

- [ ] 3 観点すべてに記載がある（改善なしは「なし」と明記）
- [ ] path drift 再発防止知見が記録されている
