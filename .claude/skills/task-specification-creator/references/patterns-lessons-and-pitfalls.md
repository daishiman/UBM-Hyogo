# 失敗パターンと教訓集

> 親ファイル: [patterns.md](patterns.md)

## 目的

過去のタスク実行で発生した失敗事例と教訓を記録する。再発防止と初動短縮のためのリファレンス。

---

## スクリプト・正規表現関連

### Markdown見出しレベルの誤検出

- **状況**: 検証スクリプトでMarkdownのH2セクション（`##`）を検出して処理範囲を区切る際
- **問題**: `/^##/` パターンがH3（`###`）やH4（`####`）にもマッチし、予期せずループが早期終了した
- **原因**: 正規表現 `/^##/` は「##で始まる」だけを検査し、その後の文字を考慮していないため
- **教訓**: H2のみを検出したい場合は `/^## [^#]/` または `/^## (?!#)/` を使用する
- **発見日**: 2026-01-24
- **修正ファイル**: `scripts/verify-all-specs.js`

### Markdown見出し検出パターン（正解）

- **指針**:
  - H1のみ: `/^# [^#]/`
  - H2のみ: `/^## [^#]/`
  - H3のみ: `/^### [^#]/`
  - H2以上（H1, H2）: `/^#{1,2} [^#]/`
- **根拠**: 見出しの後にはスペースが続き、より深い見出し（例：###）との誤検出を防ぐ
- **発見日**: 2026-01-24

### validate-phase-output のセクション終端誤判定

- **状況**: `validate-phase-output.js` で「実行タスク」「完了条件」を抽出する際
- **問題**: 終端指定に `\z` を使っており、JavaScript正規表現では終端として解釈されず誤判定の温床になった
- **原因**: Ruby系正規表現の終端表記をNode.jsに持ち込んだ実装差異
- **解決策**: `content + sentinel heading` 方式に変更し、`(?=^##\s+)` のみでセクションを安定抽出
- **教訓**:
  1. Node.jsでは `\z` / `\Z` に依存しない
  2. Markdownセクション抽出は「終端見出しを付与してから切り出す」実装が安全
  3. 検証スクリプト自身の判定結果は、実ファイル内容と合わせて二重確認する
- **修正ファイル**: `.claude/skills/task-specification-creator/scripts/validate-phase-output.js`
- **発見日**: 2026-02-24

---

## Phase 12 関連失敗パターン

### 未タスク検出後のtask-workflow.md登録漏れ（TASK-9B-G）

- **状況**: Phase 12で5件の未タスクを検出し、指示書を作成した
- **問題**: 指示書作成のみで完了と誤認し、task-workflow.mdの残課題テーブルへの登録を忘れた
- **原因**:
  1. 「指示書を作成した = 未タスク管理が完了」という誤った認識
  2. unassigned-task-guidelines.mdの「3ステップ必須」規定の見落とし
  3. documentation-changelog.mdに「完了」と記載したため、再検証をスキップ
- **教訓**:
  1. 未タスク検出は**3ステップ全て**を完了して初めて完了: ①指示書作成 → ②task-workflow.md登録 → ③関連仕様書登録
  2. Phase 12完了前に必ずtask-workflow.mdの残課題テーブルを確認
  3. documentation-changelog.mdへの「完了」記載は3ステップ確認後に行う
- **発見日**: 2026-02-03
- **関連タスク**: TASK-9B-G

### ネイティブモジュールNODE_MODULE_VERSION不一致（ENV-INFRA-001）

- **状況**: better-sqlite3がNODE_MODULE_VERSION不一致エラー（127 vs 131）で動作しない
- **問題**: pnpm storeに古いNode.jsバージョン用にコンパイルされたバイナリがキャッシュされ続ける
- **教訓**:
  1. NODE_MODULE_VERSION不一致は**pnpm store prune**でキャッシュクリアが必要
  2. その後**pnpm install --force**で再ビルドを強制
  3. .nvmrc/package.json engines/voltaの三重構造でバージョン管理する
- **修正コマンド**:
  ```bash
  pnpm store prune
  pnpm install --force
  ```
- **発見日**: 2026-02-04
- **関連タスク**: ENV-INFRA-001

### Phase 12 Task 2 Step 1-A更新漏れ（task-imp-search-ui-001）

- **状況**: Phase 12 Task 2実行時、タスク完了記録をシステム仕様書に追加した
- **問題**: 以下の3つの必須更新を漏らした
  1. **LOGS.md×2ファイル更新漏れ**: aiworkflow-requirements/LOGS.mdのみ更新し、task-specification-creator/LOGS.mdを忘れた
  2. **SKILL.md変更履歴更新漏れ**: 両スキルの変更履歴にバージョン番号を追記しなかった
  3. **topic-map.md再生成漏れ**: 仕様書更新後にgenerate-index.jsを実行しなかった
- **教訓**:
  1. Phase 12 Task 2は必ず**Step 1-A〜1-D + Step 2**の全ステップを個別に確認
  2. LOGS.mdは**aiworkflow-requirements + task-specification-creator**の**2ファイル**を更新
  3. SKILL.mdの変更履歴も更新対象（見落としやすい）
  4. 仕様書変更後はgenerate-index.jsで**topic-map.md再生成**が必須
  5. documentation-changelog.mdに各Stepの完了結果を詳細に記録することで漏れを可視化
- **発見日**: 2026-02-04
- **関連タスク**: task-imp-search-ui-001

### Phase 12 の skill root 取り違え（TASK-UI-06-HISTORY-SEARCH-VIEW）

- **状況**: system spec 更新で `.claude/skills/...` と `.agents/skills/...` の両方が存在する repo を扱った
- **問題**: mirror 側 `.agents` だけを更新し、ユーザー指定の `.claude` 正本が stale のまま残りうる
- **教訓**:
  1. system spec 更新先は `.claude/skills/...` を canonical root に固定する
  2. `.agents` は mirror 扱いとし、正本更新の代替にしない
  3. `rg -n "\\.agents/skills/.+references" docs/30-workflows/<workflow>` で workflow / outputs の mirror 参照を確認する
- **発見日**: 2026-03-10
- **関連タスク**: UT-IMP-SKILL-ROOT-CANONICAL-SYNC-GUARD-001

### Phase 12出力要件の漏れ

- **状況**: タスク仕様書（phase-12-documentation.md）作成時
- **漏れた要件**:
  1. `implementation-guide.md` Part 1（中学生レベル概念説明）
  2. `documentation-changelog.md`（システム仕様書更新履歴）
  3. `unassigned-task-detection.md`（0件でも必須）
- **教訓**: Phase 12タスク仕様書作成時は必ずphase-11-12-guide.mdのTask 1-4を確認
- **発見日**: 2026-01-26
- **関連タスク**: TASK-3-1-D

### Notification 統合の段階導入で既存テストを壊さない

- **状況**: `RuntimeSkillCreatorFacade` に通知サービスと before-quit ガードを追加した
- **教訓**:
  1. `notificationService?: INotificationService` の optional DI にすると、既存の `RuntimeSkillCreatorFacade` テスト群を壊さずに段階導入できる
  2. 実行中判定は boolean ではなく `activeExecutionCount` + `try/finally` にすると、並行 execute と before-quit ガードの両方に整合する
  3. Vitest の coverage コマンドはバージョンや cwd で挙動が変わるため、`cd apps/desktop && pnpm exec vitest run ...` のように実際に通ったコマンドを current facts に残す
- **発見日**: 2026-04-02
- **関連タスク**: TASK-NOTIFICATION-SERVICE-001

### 未タスク配置ディレクトリの間違い（TASK-9B-I）

- **状況**: Phase 12 で UT-9B-I-001 を検出し指示書を作成した
- **問題**: 配置先を `docs/30-workflows/unassigned-task/` ではなく `docs/30-workflows/skill-import-agent-system/tasks/` に配置
- **教訓**:
  1. 未タスク指示書は必ず `docs/30-workflows/unassigned-task/` に配置する
  2. 親タスクの `docs/30-workflows/{feature-name}/tasks/` はタスク仕様書の配置先であり、未タスク指示書の配置先ではない
  3. 配置後に `ls docs/30-workflows/unassigned-task/` で物理ファイルの存在を検証する
- **発見日**: 2026-02-12
- **関連タスク**: TASK-9B-I-SDK-FORMAL-INTEGRATION

### テスト数の設計時固定値使用（TASK-9B-I）

- **状況**: Phase 4 で設計した想定テスト数「18」を Phase 12 まで使い続けた
- **問題**: 実装後の実際のテスト数は「13」であり、Phase 12 のドキュメントに不正確な数値が記載された
- **教訓**:
  1. Phase 12 では必ず `grep -c "it\\(" *.test.ts` で実際のテスト数をカウントする
  2. Phase 4 の想定テスト数はあくまで「設計時の見積もり」であり、最終的な数値ではない
- **発見日**: 2026-02-12
- **関連タスク**: TASK-9B-I-SDK-FORMAL-INTEGRATION

### Phase 9/10/台帳のテスト件数ドリフト

- **状況**: Phase 6 で回帰テストを増やした後、Phase 9・Phase 10・台帳の一部だけを更新した
- **問題**: ドキュメント間で `7 files / 264 tests` と `8 files / 267 tests` が混在した
- **教訓**:
  1. テスト件数は「最新実行ログ」を単一ソースに固定する
  2. Phase 6/9/10 + `task-workflow.md` を同時更新してから検証を再実行する
  3. 数値反映後に `rg "264|7ファイル"` で旧値残存0件を確認する
- **発見日**: 2026-03-04
- **関連タスク**: TASK-FIX-SKILL-AUTH-PREFLIGHT-GUARD-001

### artifacts.json Phaseステータスの更新忘れ（UT-FIX-SKILL-IMPORT-INTERFACE-001）

- **状況**: 全Phase完了後に成果物を検証した
- **問題**: artifacts.json の全Phase statusが「pending」のまま残っていた
- **教訓**:
  1. 成果物生成後に必ず artifacts.json の当該 Phase status を `completed` に更新する
  2. Phase 完了時のチェックリストに「artifacts.json 更新」を明示的に含める
  3. 手動生成フローでは complete-phase.js が行う後処理（ステータス更新）を手動で補完する
- **発見日**: 2026-02-21
- **関連タスク**: UT-FIX-SKILL-IMPORT-INTERFACE-001

---

## エージェント実行関連

### 並列エージェント実行時のAPIレートリミット（TASK-9A-C）

- **状況**: Phase 1の4タスクを4つのSubAgentで同時実行した
- **問題**: 4エージェント中3つがAPI rate limitに到達し、エージェントが停止
- **教訓**:
  1. 並列エージェント数は**2-3が上限目安**（4以上はレートリミットリスクが高い）
  2. 重要度の高いタスクを先に実行し、残りを後続バッチで実行する
- **発見日**: 2026-02-19
- **関連タスク**: TASK-9A-C

### complete-phase.jsパス解決誤り（TASK-9A-C）

- **状況**: Phase完了処理で `node scripts/complete-phase.js` を実行した
- **問題**: モジュール未発見エラーが発生しスクリプトが実行できなかった
- **教訓**:
  1. スキルスクリプトは必ず `.agents/skills/{skill-name}/scripts/` パスで参照する
  2. `node scripts/xxx.js` ではなく `node .claude/skills/task-specification-creator/scripts/xxx.js` と完全パスで実行する
- **発見日**: 2026-02-19
- **関連タスク**: TASK-9A-C

### マルチエージェントPhase実行の依存順序違反

- **状況**: Phase 1-12を5エージェント（Phase 1-3, 4-7, 8-10, 11, 12）に分割して全て並列ディスパッチ
- **問題**: Phase 4-7エージェントがPhase 1-3エージェントより先に完了。要件定義前に実装が進行した
- **解決**: ゲートPhase（Phase 3, Phase 10）の前後で並列化区間を分離
- **推奨**: [1→2→3] → [4→5→6→7] → [8→9→10] → [11] → [12]
- **教訓**: 「並列実行できる部分」は依存関係チェーン内ではなく、チェーン間のTask並列化に限定する
- **発見日**: 2026-02-21
- **関連タスク**: UT-FIX-SKILL-REMOVE-INTERFACE-001

### worktree環境でも Phase 11 screenshot は実行可能

- **状況**: Git worktree 上で UI task の Phase 11 を再監査した
- **問題**: Electron 実アプリ起動前提で考えると「worktree では手動テスト不可」と誤認しやすい
- **解決**: Playwright + Vite harness で current worktree の build / route を直接起動し、main shell screenshot を取得した
- **教訓**: worktree を理由に Phase 11 を自動テスト代替へ落とし込まない。UI task は harness capture、docs-only task は walkthrough に切り分ける
- **発見日**: 2026-02-21
- **関連タスク**: UT-FIX-SKILL-REMOVE-INTERFACE-001

### docs-only タスクのプロバイダー依存機能ゲート（UT-02-D1-WAL-MODE）

- **状況**: docs-only タスクとして Cloudflare D1 の WAL モード設定（`PRAGMA journal_mode=WAL`）を仕様書化した
- **問題**: 提案実装がプロバイダー（Cloudflare D1）の特定動作（PRAGMA サポート）に依存していたが、公式サポートの確認ゲートを Phase 1/2 に設けなかったため、仕様書に未確認の前提が混入した
- **原因**: docs-only タスクは実装コードを書かないため「動作確認不要」と誤認しやすく、プロバイダー公式ドキュメントの照合を省略した
- **教訓**:
  1. docs-only タスクでも提案実装がプロバイダーの特定動作に依存する場合は、Phase 1（要件定義）または Phase 2（設計）に **official-support gate** を設ける
  2. 公式ドキュメントで当該機能がサポートされているか確認し、結果を仕様書に明記する
  3. サポートが未確認の場合は「official-support 未確認」として前提化せず、条件付き方針として記録する
  4. runtime mitigation（retry/backoff 等）への委譲を代替案として検討する
- **フィードバック元**: 「Docs-only tasks need an early official-support gate when the proposed implementation depends on provider behavior.」
- **発見日**: 2026-04-26
- **関連タスク**: UT-02-D1-WAL-MODE

### カバレッジ閾値のスコープ解釈あいまいさ

- **状況**: Phase 7でskillHandlers.ts全体のLine Coverage 45.14%が最低基準80%を下回った
- **問題**: バグ修正タスクではファイル全体のカバレッジではなく修正対象関数のカバレッジで判定すべきだが、仕様書上の基準が不明確
- **解決**: skill:remove固有の分岐カバレッジ（全5分岐カバー済み）を別途記録し、PASS判定
- **教訓**: Phase 7テンプレートに「修正対象関数のBranch Coverage 100%」を追加判定基準として明記
- **発見日**: 2026-02-21
- **関連タスク**: UT-FIX-SKILL-REMOVE-INTERFACE-001

---

## 順序事故防止パターン（前提タスク 3 重明記）

> 完了必須の上流タスク（A-2 等）が存在する場合、Phase 1 / Phase 2 / Phase 3 の 3 箇所で重複明記することで順序事故を抑止する。

- **状況**: 派生タスクが上流タスク（前提）の完了を必要とするが、Phase 1 だけに前提を書くと Phase 4 以降の実装着手者が前提存在に気付かない
- **パターン**: 前提タスク完了必須を以下 3 箇所で重複明記
  1. Phase 1 requirements の冒頭（「前提条件」セクション）
  2. Phase 2 design の実施前提条件（設計開始前に再確認）
  3. Phase 3 review の前提条件チェック（レビュアーが順序を確認）
- **効果**: 実装者・レビュアー双方が異なる文脈で順序制約を視認でき、前提漏れを防止
- **発見日**: 2026-04-28
- **関連タスク**: skill-ledger-a1-gitignore（A-2 fragment 化を A-1 の 3 箇所で前提明記）

---

## フェーズ境界遷移パターン（Phase Boundary Transition）

> タスクの12フェーズ実行において、フェーズ間の成果物・知見の引き継ぎが品質を左右する。

| パターン                                | 説明                                                   | 適用場面                                         |
| --------------------------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| Phase 3 → Phase 4 ゲート                | レビュー結果に基づくテスト設計方針の引き継ぎ           | 設計レビューで発見した懸念事項をテスト仕様に反映 |
| Phase 7 → Phase 8 カバレッジ→リファクタ | カバレッジ不足の原因分析を元にリファクタリング方針決定 | Function Coverage不足 → forwardRef導入           |
| Phase 10 → Phase 11 品質→手動テスト     | 品質チェック結果を手動テストシナリオに反映             | 自動テスト検証済み項目は手動テストからスキップ   |
| Phase 11 → Phase 12 テスト→ドキュメント | 手動テスト結果と品質メトリクスをドキュメントに統合     | テスト結果サマリーを実装ガイドに含める           |

- **発見日**: 2026-01-30
- **関連タスク**: TASK-7D

---

## 失敗回避パターン（クイックリファレンス）

> Phase実行中に繰り返し発生した失敗を未然に防ぐための回避策。

| パターン                 | 失敗例                                                                 | 回避策                                             |
| ------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------- |
| artifacts.json同期漏れ   | Phase完了後にartifacts.jsonが未更新                                    | 各Phase完了時に必ずartifacts.jsonを更新            |
| 未タスクファイル配置漏れ | Phase 12で検出した未タスクがdocs/30-workflows/unassigned-task/に未配置 | 検出と同時にファイル生成を実行                     |
| topic-map.md再生成忘れ   | システム仕様書更新後にインデックスが古いまま                           | spec更新後は必ずnode scripts/generate-index.js実行 |

- **発見日**: 2026-01-31
- **関連タスク**: TASK-7D

---

## TASK-UT-RT-01 executeAsync / IPC 関連 Pitfall（2026-04-06）

### Pitfall: executeAsync テストで executeMock を使う場合の注意

- **状況**: `skillExecutor.execute` をモックしても structured error パスの `error.message` が undefined になる
- **原因**: `execute()` 内でレスポンスが `SkillExecuteResult` 型に変換されるため
- **対策**: structured error パスのテストは `vi.spyOn(facade, 'execute')` を使い、`RuntimeSkillCreatorExecuteErrorResponse` 型を直接返すこと
- **影響**: Phase 4 のテスト設計時に考慮が必要
- **発見日**: 2026-04-06

### Pitfall: package-local lint script の不在

- **状況**: `apps/desktop/package.json` には `lint` script がない
- **原因**: モノレポ構成で lint は workspace ルートに集約されているため
- **対策**: workspace ルートの `pnpm lint` を使うか、対象ファイルを `eslint` で直接実行する（`pnpm --filter @repo/desktop lint` は実行不可）
- **影響**: 手動テスト手順を package 前提で書くと再現コマンドが失われる
- **発見日**: 2026-04-06

### Pitfall: vitest のファイル指定は直接実行が安定

- **状況**: `pnpm --filter @repo/desktop test -- --testPathPattern "..."` が期待より広い範囲のテストを走らせることがある
- **対策**: `pnpm --filter @repo/desktop exec vitest run <file>` のように対象ファイルを明示する
- **影響**: focused な回帰確認の再現性が上がる
- **発見日**: 2026-04-06

### Pitfall: preload の `safeOn` は tuple 化しないと多引数を落とす

- **状況**: callback 型を `(...rest: unknown[])` にしても TypeScript の型整合性と実行時の意図は一致しないことがある
- **対策**: multi-arg event は `safeOn<T, R extends unknown[]>()` のように tuple で受け渡しの形を固定する
- **影響**: errorMessage のような補助情報が silent drop されるのを防げる
- **発見日**: 2026-04-06

### Pitfall: Renderer での node-only import（browser bundle 破壊）

- **状況**: `node-cron` など Node.js 専用パッケージを renderer 側の UI コンポーネントで直接 import した
- **問題**: Vite ブラウザバンドルのビルド時は通過しても、ルートを開いた瞬間に runtime error が発生しアプリが初期化できなくなる
- **原因**: Node.js 組み込み API（`process`、`fs`、`module` 等）をブラウザ環境で解決できないため
- **対策**:
  1. renderer コンポーネントでは node-only パッケージを直接 import しない
  2. cron / schedule 検証は browser-safe な薄いユーティリティに切り出す（例: 5-field regex で validate するだけの関数）
  3. Phase 11 capture 前に「ブラウザで実際に route を開く smoke test」を必須にする
  4. `apps/desktop/vite.config.ts` の `ssr.noExternal` / `ssr.external` で不意のバンドルを早期検出する
- **影響**: Phase 11 の手動テスト冒頭でブランクスクリーンになり、screenshot 全件がブロックされる
- **発見日**: 2026-04-08
- **関連タスク**: UT-SKILL-WIZARD-W1-par-02b

---

## 苦戦箇所セクション標準テンプレ（T-6 / Issue #161 由来）

タスク仕様 `index.md` の末尾に「苦戦箇所」セクションを配置し、3〜5 件を箇条書きで記録する。各項目は以下 4 要素で構成する:

- **症状**: 観測された具体現象（再現条件込み）
- **影響**: blocking 範囲（gate 失敗、Phase 戻り、CI fail 等）
- **緩和策**: 暫定回避と恒久対策の差を区別
- **関連 AC**: 影響を受ける受け入れ基準 ID（AC-1, AC-2 ... を列挙）

### テンプレ

```md
## 苦戦箇所

1. **症状**: <現象>
   **影響**: <blocking 範囲>
   **緩和策**: <暫定 / 恒久>
   **関連 AC**: AC-X, AC-Y
```

- 配置: `index.md` 末尾（次タスクへの handoff 直前）
- 件数目安: 3〜5 件（多すぎると S/N が下がる）
- 出典: `docs/30-workflows/skill-ledger-t6-hook-idempotency/` workflow（Issue #161 / T-6）

---

## 並列 smoke における `wait` 個別集約パターン

複数 worktree を並列起動して smoke する際、`wait` を引数なしで使うと最後の終了コードしか取れない。pid を配列に積み、個別に `wait` して `rc` を集約する。

```bash
pids=()
for wt in "${WORKTREES[@]}"; do
  run_smoke "$wt" &
  pids+=("$!")
done

rc=0
for pid in "${pids[@]}"; do
  wait "$pid" || rc=$?
done

exit "$rc"
```

- 失敗 worktree の特定: `pid → worktree` の対応表をログに残す
- 出典: T-6 / Issue #161 workflow

---

## smoke 二段構え（小規模再現 → 本番再現）

並列 hook の冪等性検証は以下の 2 段で実施する。

| 段階 | 対象 | 目的 |
| --- | --- | --- |
| 小規模再現 | 2 worktree | ロジック起動・wait 集約の動作確認（短時間でフィードバック） |
| 本番再現 | 4 worktree | 実運用相当の競合密度で race condition / lock starvation を観測 |

- 小規模で fail する設計は本番で必ず fail するため、まず 2 worktree で固める
- 本番再現で初めて顕在化する事象（lock 取得タイムアウト等）は別 issue として記録
- 出典: T-6 / Issue #161 workflow

---

## Resumable Batch / Cron Budget チェック項目（U-UT01-09 由来 / 2026-04-30）

cron-driven / queue-driven / paginated batch（Forms sync / Sheets ingest / D1 backfill 等）の retry / offset / cursor / invocation budget を spec 段階で固定するためのチェックリスト。
相互参照: `.claude/skills/aiworkflow-requirements/references/lessons-learned-u-ut01-09-retry-offset-2026-04.md` の **L-UUT0109-003**（retry/offset canonical 実装契約）。

### Phase 2 設計時の必須チェック項目

| 項目 | 確認内容 | 既定値 / 例 |
| --- | --- | --- |
| **chunk size** | 1 invocation あたりの最大処理件数 | U-UT01-09: 200 行 / chunk |
| **cursor 列名** | 進捗永続化に使う DB 列名（処理済みオフセット） | `processed_offset`（U-UT01-09 では INTEGER NOT NULL DEFAULT 0） |
| **chunk index 単位** | offset の最小増分単位（行 / バッチ / page） | U-UT01-09: 行単位（chunk 終端で flush） |
| **invocation budget** | cron 1 ティックあたりの想定実行時間 / quota | Cloudflare Workers 30s CPU / 50 subrequests |
| **max retry** | 失敗時の最大リトライ回数 | U-UT01-09: 3（旧 5 から下方修正） |
| **backoff** | リトライ間隔 (linear / exponential / jitter) | U-UT01-09: exponential + jitter |
| **invalidation 条件** | cursor を巻き戻す / 無効化する条件 | source schema 変化、checksum mismatch、destructive migration |
| **stable high-water fallback** | 想定外停止時に巻き戻す安全な処理済み境界 | 直前 chunk 終端の processed_offset |

### NG パターン

- chunk / cursor / max retry を spec に書かず実装で決め打ち → 仕様変更追跡不能・combined budget 計算不能
- max retry を上限のみ書き backoff を書かない → cron 衝突 / quota 飽和 を招く
- invalidation 条件を「将来検討」で empty にする → 既存仕様を本番運用で上書き破壊する事故源
- `processed_offset` 列を migration に含めず実装 PR で初出 → spec_created と implementation の責務逆転

### OK パターン

- Phase 2 設計テーブル + Phase 12 main / system-spec-update-summary の双方に retry/offset 数値を併記
- combined budget = `chunk_size × max_retry × invocation interval` を spec に記録
- invalidation 条件を 3 系統（schema 変化 / checksum / destructive migration）で列挙
- 既存 sync / 別タスク（U-UT01-07 / UT-09 等）の現行値を上書きしない場合は「上書き禁止対象」を spec に明記

## Cloudflare Audit Logs / monitoring workflow

issue-408（Cloudflare Audit Logs monitoring）実装で得た知見。Cloudflare 系 audit / monitoring タスクを spec する際の必須前提。

- **CF Audit Logs API retention は 90 日固定**: 90 日超の保管はサポートされず、cold storage（R2 など）への定期 export が必須。長期保管要件があるタスクは spec 段階で「export → R2」を併記し、未対応の場合は followup task（FU）を起票して runtime 完了前に独立タスク化する経路を確保する。issue-408 では `FU-02-cold-storage` として記録。
- **`Audit Logs:Read` scope は Account-level 必須**: Zone-level token では取得不可。Token 発行ガイドや Phase 5 deployment checkpoint に「Account scope 指定」を明示しないと production runtime で 403 が頻発する落とし穴。
- **ml-anomaly 検出は最低 90 日 baseline が必要**: 7 日 baseline では分散が不足し ML 判定不可。FU-03 等で baseline 日数充足を待つ runtime gate を設けるのが既定運用。spec の「着手判断」に `baseline_days >= 90` を明記する。
- **D1 migration 番号衝突**: monitoring 系は新テーブル追加が多く、並列タスクと migration 番号が衝突しやすい。Phase 5 の「D1 migration 番号予約 SOP」に従い、PR description / artifacts.json に予約番号を宣言してから着手する（`phase-5-deployment-checkpoint-standard.md` 参照）。

## dev-sync merge conflict（lint scope / version table）の Phase 仕様反映

dev → feature の sync-merge で発生した conflict 解消ルール（aiworkflow-requirements の `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-016 / L-DEVSYNC-017）を、本 skill で生成するタスク仕様にも反映する。

- **L-DEVSYNC-016 (lint scope glob 収束)**: workflow YAML や lint 対象を `package.json` / CI YAML で explicit list 化する仕様を立てる際は、**Phase 12 implementation-guide に「glob 化されたら glob を採用」のガード**を含める。`actionlint`, `shellcheck`, `yamllint` 等の lint scope 拡張系で「特定 workflow を allowlist に追加」する仕様は将来の sync-merge で時限爆弾化するため、原則 `.github/workflows/*.yml` glob を推奨し、explicit list は permission / gate 差分がある場合のみとする。
- **L-DEVSYNC-017 (version table 両側 row 保持)**: `references/*-gha.md` / `deployment-secrets-management.md` 等の append-only version 表に行を追加する仕様は、Phase 12 で「同 wave の他タスクと version 番号が衝突した場合は dev-sync wave 側を minor bump して上に重ねる」運用ルールを明記する。`spec_created` の changelog 表生成 helper は `LAST_VERSION + 0.0.1` を返すように設計する。
- **L-DEVSYNC-030 (improvements 系 index / completed-tasks のステータス行 3-way conflict)**: `docs/30-workflows/<umbrella>/improvements/<sub>/index.md` および対応する `completed-tasks/<sub>-iNN-*.md` の **ステータス表行** で diff3 conflict が発生した際は、**行単位で両側採用**（HEAD が自スコープ task の完了を、dev が他スコープ task の完了を別行で更新するため）。`||||||| base` セクションは破棄。`completed-tasks/iNN-*.md` 内のメタ情報表は HEAD 側の実装完了情報を base に、dev 側のみが追加した key（`canonical_workflow` / `consumed_by`）を merge して統合する。Phase 12 の implementation-guide で improvements 系 spec の状態遷移を記述する際、**自 task の完了行のみ更新し、他 i 行には触れない**ことを明示し、merge 時の干渉を最小化する。

これら 3 件は本 skill の `evidence-sync-rules.md` / `patterns-phase12-sync.md` で扱う「Phase 12 strict 7 / sync gate」と整合する追加ガード。

- **L-DEVSYNC-043 (`pnpm sync:resolve` 中の worktree `index.lock` 失敗)**: sync-merge を伴う Phase（特に Phase 5 / Phase 12 の skill index 更新 + Phase 13 PR 前）で `pnpm sync:resolve` が `fatal: Unable to create '.../worktrees/<wt>/index.lock'` で失敗するケースを runbook 化する。**仕様書側の Phase 12 implementation-guide / Phase 13 PR pre-flight チェックリスト**に「`pnpm sync:resolve` 失敗時は `rm -f $(git rev-parse --git-dir)/index.lock` を試す」troubleshoot 行を含めること（worktree 環境では `.git` がファイルなので `.git/index.lock` 直接除去はできない）。詳細手順は aiworkflow-requirements skill L-DEVSYNC-043 を参照。

## enum → route exhaustiveness guard pattern（issue-891）

issue-891（member detail kind exhaustiveness guard）実装で得た知見。zod enum / TypeScript discriminated union を UI 表示分類へ写像するタスク仕様で再利用する。

- **L-I891-001 (型強制パターン)**: allowlist `ReadonlySet<Enum>` を spec の正本にしない。`const ROUTE_MAP = {...} as const satisfies Record<EnumMember, Route>` を SSOT として spec の Phase 4 contracts に明記し、派生集合（`DETAIL_KINDS` 等）は `Object.keys(ROUTE_MAP).filter(k => ROUTE_MAP[k] === route)` で生成する仕様にする。enum 拡張時の silent-skip を `pnpm typecheck` と adapter spec（`Enum.options` parity test）の二段で検知できるよう Phase 6 テスト戦略に含める。
- **L-I891-002 (Route literal union)**: 「除外」と「別 region 表示」を boolean filter で表現する仕様は禁止。最初から `type Route = "primary" | "secondary" | "excluded"` 等の literal union で設計し、新 region 追加は (1) `Route` リテラル拡張 + (2) `ROUTE_MAP` 上書きの 2 点同 wave 修正で済む構造を Phase 2 architecture に書く。
- **L-I891-003 (`__testInternals` 慣行)**: pure adapter / pure function の内部 lookup table を spec から exhaustiveness 検証したいときは、`export const __testInternals = { ROUTE_MAP, DERIVED_SET_A, DERIVED_SET_B } as const` を adapter ファイル末尾 1 行で添える。consumer 側 public API（`toXxxProps` 等）には map 自体を露出しない。Phase 5 implementation-guide で「test-only export 識別子の命名規約」として明記し、`eslint-no-restricted-imports` の対象パターンに含める運用 hook を Phase 7 quality gate に記録する。
- **L-I891-004 (closed issue 再分類)**: GitHub 上 CLOSED の issue を spec 化する際、Phase 1 の最初に `git status` / `git diff` で実差分を確認し、実コード変更が乗る場合は `artifacts.json` の `status` / `workflow_state` / `implementation_status` を `implemented_local_evidence_captured` へ早期確定する。`spec_created` のまま実装に進むと Phase 11 evidence 表生成と `verify-phase12-compliance.js` の evidence 存在ゲートが衝突する。
- **L-I891-005 (unassigned task consumed trace)**: 後続 workflow が unassigned task を吸収したら 3 点同 wave: (1) 元 unassigned file 先頭に `> superseded by <workflow-id> at <date>` 追記、(2) `docs/30-workflows/unassigned-task/` から `docs/30-workflows/completed-tasks/unassigned-task/` へ `git mv`、(3) 吸収先 `artifacts.json metadata.supersedes` にパス記録。削除は永続的に避け、`git log --follow` で起票根拠まで辿れる経路を保つ。

## Playwright / Server Component topology

- **pitfall - Server Component fetch + `page.route()` 不整合**: Next.js SSR fetch は Node 側で起きるため Playwright の `page.route()` で intercept できない。in-process mockApi fixture（`INTERNAL_API_BASE_URL` 差し替え）または standalone mock server を使う。詳細 SSOT: [`server-component-e2e-pattern.md`](./server-component-e2e-pattern.md) / [`quality-gates.md` §SSR fetch](./quality-gates.md) / [`phase-11-screenshot-guide.md`](./phase-11-screenshot-guide.md)。
- **pitfall - Playwright `testDir` の topology**: 本リポジトリの Playwright `testDir` は `apps/web/playwright/tests/`（`apps/web/tests/e2e/` ではない）。Phase 6 spec 起草時は `cat apps/web/playwright.config.ts | grep testDir` を最初に実行して現行 path を確認すること。

## layer-specific helper の horizontal expansion（lib-elevation / Option B）

`apps/web/src/lib/<layer>/<helper>.ts` のような layer-specific helper を他 layer から再利用する spec を書く際は、以下 Option B を既定にする（issue-879 で実証、aiworkflow-requirements の `lessons-learned-issue-879-safe-server-fetch-horizontal-expansion-2026-05.md` L-ISSUE-879-001..005）。

- **Option A (NG)**: 既存 layer path をそのまま共用し、`codePrefix` 等を引数化する。既存 layer 側の spec 全てが破壊的に更新対象になる。
- **Option B (採用)**: 新 path（`apps/web/src/lib/<neutral>/<helper>.ts`）に common を新設し、既存 layer-specific path は **signature 維持の thin adapter (re-export)** に縮小する。既存 spec を一切 touch せず横展開できる。

Phase 仕様で記述する際の必須項目:

- **Phase 1 acceptance**: 既存 layer の error code 文字列（`ADMIN_FETCH_401` 等）が回帰しないことを AC として明記する。
- **Phase 2 design table**: `common` / `<layer>-adapter` の責務分離表を必ず置く。codePrefix / rethrowOn 等の injection 方針も列に立てる。
- **Phase 4 test plan**: 既存 layer spec が touch されない（spec file modification 数 0）ことを「regression guard」項目に書く。
- **Phase 5 implementation**: S-1=新設 common / S-2=adapter 化 / S-3=新 layer 利用、と step を分け commit 順序を「common → adapter → 新 layer」に固定する。
- **Phase 12 system-spec-update-summary**: 共通 helper の path と各 layer adapter path を明記し、CLAUDE.md の不変条件として「helper は共通 path のみ参照、layer-specific は re-export adapter 維持」を加筆候補に挙げる。

### page-fatal error の rethrowOn 設計（同 spec の必須節）

Next.js server component の `redirect()` / `notFound()` を SafeResult に閉じ込めると framework signal が抑止され UX が壊れるため、`safeServerFetch` 系 spec には必ず以下を含める。

- `rethrowOn: ReadonlyArray<new (...args: never[]) => Error>` option を持たせ、fatal class は pass-through。
- Next.js native の `isRedirectError` / `isNotFoundError` を併用する場合は import path を Phase 2 design に明記。
- Phase 4 test plan に「fatal は throw を expect / transient は SafeResultError shape を assert」の 2 系統を必ず置く。

### section degrade primitive の単一化

複数 page で「fetch 失敗時は該当 section だけ degrade」を導入する spec では、`role="alert" aria-live="polite"` 付きの SectionError primitive を 1つだけ作る方針を Phase 2 で固定する。tokens.css に従う class 名のみで配色し、design-token gate（HEX 直書き禁止）を維持する。

## layout / page 共有 UI primitive の責務分離（issue-894 由来汎化）

issue-894（admin topbar breadcrumb 二重描画解消）実装で得た知見を、UI primitive を layout / page で共有する後続タスク（admin actions slot / page-header 系 / public breadcrumb 等）の Phase 仕様に予め埋め込む。詳細は aiworkflow-requirements `lessons-learned-issue-894-admin-topbar-breadcrumb-integration-2026-05.md` L-I894-001..005 参照。

- **L-I894-001 (layout-owned vs page-owned 軸の Phase 3 必須化)**: layout と page が同一 RSC primitive（`Breadcrumb` / `PageHeader` / `StatusBadge` 等）を共有する spec では、Phase 3 component API に「layout-owned / page-owned」の責務軸表を必須セクションとして含める。両層に同じ宣言が出ると差分発生時に表記揺れが起き、後付けの grep gate で再発防止する必要が生じる。
- **L-I894-002 (UI 文字列重複の grep gate 化)**: 「管理」「ホーム」など layout 所有の root 文字列を page から除去する仕様は、Phase 7 quality-gates に `rg '"<root-string>"' apps/web/app/<segment>/**/page.tsx` の 0 hit gate を embed する。実装単発で終わらせると将来の page 追加で再混入する。`source_issue_state_verified` evidence と並列に Phase 11 / Phase 12 で grep gate 結果を保存する。
- **L-I894-003 (RSC 維持のため layout から static 値を slot prop で渡す)**: 「現在地表示」のためだけに `usePathname` で client 化するのは過剰。layout が静的部分を所有し、page が動的部分を server で導出して slot prop として渡せば全段 RSC 境界を維持できる。Phase 2 architecture で「client 化を選ぶ場合の理由（pathname dependency / interactive state）」を明示する選択肢を必須化する。
- **L-I894-004 (ARIA derived state contract の Phase 6 必須化)**: `aria-current="page"` 等の ARIA derived state を持つ primitive は、Phase 6 test-strategy で「href 有無 × 最終 item か否か」の 2 軸を spec で固定する。primitive 側 spec が contract を、consumer 側 spec が wiring を担当する責務分離を明示する。
- **L-I894-005 (CLOSED issue + コード未解決パターン)**: GitHub Issue の状態と実コード状態は乖離しうる。Phase 1 で `gh issue view <num> --json state,number,title` を実行して state を実測し、`CLOSED` で未解決なら reopen ではなく `artifacts.json.metadata.source_issue_relation = "Refs #<num>"` で追加 PR を出す経路を取る。`artifacts.json.metadata.source_issue_state_verified` に実測コマンドと実測日時を明示する。`github-issue-manager` skill の Phase 1 トリアージにも同テンプレートを embed する。


---

## Design-token exempt artifact (third-party brand asset) パターン（Issue #872 / FU-LOGIN-001 由来 / 2026-05-24）

外部ブランドの公式アセット（Google / Apple / Facebook 等）を取り込む際、`verify-design-tokens` (HEX 直書き禁止) と third-party brand color の「色は変えてはいけない」制約が衝突する。Issue #872（Google "G" OAuth button official 4-tone icon）で確立した責務分離パターンを spec に反映する。

### 必須前提

- **HEX 直書き exempt は「特定 directory 配下の `.svg` ファイル名」だけに限定する**。`.tsx` wrapper / nested SVG / `.ts` color 定数 / `.css` 変数 を exempt 対象にしてはいけない。理由: brand 色は SVG の `<path fill="...">` 属性に閉じ込めるべきで、wrapper や CSS に漏らすと「いつのまにか OKLch token 違反箇所が増殖」する逆流リスクがある。
- **exempt scope は正規表現で path/ファイル種別の両方を絞る**。例: `/\/components\/ui\/brand-icons\/[^/]+\.svg$/`。`/brand-icons/` だけで絞ると `.tsx` まで巻き込み事故になる。
- **exempt 境界の単体テストを spec の Phase 6 / 11 に必ず含める**。`scripts/verify-design-tokens.spec.ts` に「`brand-icons/google.svg` は pass」「`brand-icons/Foo.tsx` の HEX 直書きは fail」「`brand-icons/_legacy/inner/foo.svg` も pass しない（一階層 only）」の 3 ケース最低限。
- **wrapper コンポーネントは aria-hidden を固定**し、テキストラベルでアクセシブル名を担保する。SVG path の色は brand 公式値のまま、装飾は OKLch token surface 側で行う責務分離。

### L-BRAND-001 (asset wrapper exempt boundary)

- **NG**: `apps/web/src/components/ui/brand-icons/GoogleBrandIcon.tsx` 内に `fill="#4285F4"` を直書きし、verify-design-tokens の exempt list に「`brand-icons` dir 全部」と書く。
- **OK**: `google.svg` に 4 path の HEX を閉じ込め、`GoogleBrandIcon.tsx` は `<img src="/brand-icons/google.svg" />` または静的 import で SVG を render するだけ。exempt は `*.svg` ファイル名にのみ適用。
- **Why**: wrapper を exempt すると将来「ついでに色も足す」運用劣化が必ず起きる。境界を「ファイル種別 + ファイル名 pattern」で物理的に固定するのが SSOT。

### L-BRAND-002 (verify-design-tokens regex 単体テスト先行)

- **NG**: exempt 追加 PR で `verify-design-tokens.ts` の regex を変更しただけで「動いた」とする。
- **OK**: 同 PR 内で `verify-design-tokens.spec.ts` に positive / negative 両ケース（`.svg` pass / `.tsx` fail / dir 外 fail）を追加し、CI gate 化する。
- **Why**: exempt 境界は意図せず広がりやすい (`.tsx` まで巻き込む regex は実例として一度書かれた)。spec 段階で「exempt regex の変更は spec 必須」と書き、Phase 6 acceptance に regex unit test を含める。

### Phase 12 への反映項目

- **system-spec-update-summary.md**: `09b-design-tokens.md` の「HEX exempt 境界」セクション更新を必ず Step として含める。文言例: 「brand asset exempt は `apps/web/src/components/ui/brand-icons/*.svg` のみ。`.tsx` wrapper の HEX 直書きは引き続き fail」。
- **implementation-guide.md**: 「中学生向け説明」で「ブランドの色は変えられないので決まった場所にしまっておく」「決まった場所以外で色を直接書いたら警告が出る」の二段で必ず説明。
- **unassigned-task-detection.md**: 別 OAuth provider (GitHub / Apple / X 等) の brand-icon 追加は、本パターンが拡張テンプレートとして使い回せることが Phase 12 で確認されたなら FU として起票してよい。ただし「採用判断待ち (auth strategy 議論)」を明確な前提条件として記載し、即着手可能タスクと混同しない（Issue #872 では `pending (OAuth provider 採用判断待ち)` で起票）。

### Anti-pattern

- exempt path を「pattern template として汎用化したいから」と理由なく広げる（例: `apps/web/src/components/**/*.svg`）。**brand-icon 専用 dir に物理的に閉じ込める**こと。CONST_007 (unassigned-task は実装過程で実際に発見されたもののみ) に準拠し、speculative な exempt 拡張は避ける。

---

## DELETE-race UI wiring pattern (Issue #911 / 2026-05-25)

既存 endpoint が「削除済み / 解除済み」を 404 で返す UI caller では、API surface を増やす前に既存 mutation policy で race を success-equivalent に倒せるか確認する。

- **L-I911-001**: `treat404AsSuccess` は解除・削除系 caller のみに付与し、追加・登録系 caller へ流用しない。
- **L-I911-002**: 同じ endpoint でも register/unregister の 404 意味が異なる場合は mutation instance を 2 本に分ける。
- **L-I911-003**: component spec は toast だけでなく payload、DOM state、CTA 消滅/出現を assert する。
- **L-I911-004**: 親 workflow に「caller 未移行」などの stale note がある場合、実装 wave で正本 index も補正する。
- **L-I911-005**: Phase 12 optional summary (`phase-12.md`) と strict 7 inventory を混同しない。

## parallel adapter signature extension（dev sync-merge / 2026-05-26）

dev sync-merge で同一の pure adapter / pure function 関数が **HEAD 側と dev 側で独立に signature 拡張**された場合の統合パターン。spec を起草する段階で、adapter signature の進化方針をこの形式に揃えておくと merge 衝突時の解消コストが激減する（aiworkflow-requirements の `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-043）。

- **L-DEVSYNC-043 (signature union 化)**: 同じ関数（`normalizeField(field, ...)` 等）に対し、HEAD = routing 用引数追加（`routeKinds: ReadonlySet<Kind>`）、dev = observability callback 追加（`onUnknownKind?: (field) => void`）のように **orthogonal な拡張**が並列で入ったら、片側 take せず引数列を **必須 → routing → observability → options の順で union** する。spec の Phase 4 contracts に「adapter signature 拡張は this order で並べる」と明示しておく。
- **Phase 2 architecture への反映**: pure adapter を「将来複数 issue から拡張される SSOT」と位置づけ、最初から `interface ToXxxOptions { onXxx?: (...) => void }` を options bag 化して関数末尾に置く。routing 用引数は別 issue が同位置に挿入してくる可能性があるため、`routeKinds` / `route` のような分類引数を**第 2 引数固定**で書く。
- **Phase 4 test plan**: adapter spec の `import { ... }` 行は merge 時に高頻度で conflict する。export 群（`__testInternals` / 公開 schema / 公開関数）を**1 import 行に並べた union**で書く規約を spec に明記し、HEAD/dev 双方が新 export を追加しても 1 行 union で機械的に解消可能な状態を維持する。
- **Phase 6 quality gate**: 統合 commit 後の最初のゲートは `pnpm typecheck`。`satisfies Record<EnumMember, Route>` のような exhaustiveness 強制と callback callback の signature 統合は型レベルで矛盾検出できるため、typecheck → lint → unit spec の順を Phase 6 順序として固定する。
- **Phase 12 sync gate への反映**: `pnpm sync:resolve` の `UNION_MERGE_TARGETS` には **adapter ソース (`apps/web/src/lib/adapters/*.ts`) を意図的に含めない**。コード union は意味壊しのリスクがあるため、本パターンは「手動 union ルール」として spec template / Phase 12 implementation-guide に組み込む。resolver 自動化は doc / index 系のみに留める。

### Anti-pattern

- 片側 take（HEAD のみ採用して dev 側の callback を捨てる、または逆）→ 失われた振る舞いが test green でも実機で silent regression。
- 引数名衝突の自動 union（同じ位置に意味が違う引数を両方差し込む）→ 呼び出し側 type-check fail。意味衝突は最終レポートに記録し人間判断。
- `UNION_MERGE_TARGETS` への adapter ソース追加 → コード union による意味壊しが将来再現するため禁止。
## route group migration × dev primitive swap の二重 conflict（dev sync-merge / 2026-05-26）

dev sync-merge で **HEAD = route group rename（`app/<route>/` → `app/(group)/<route>/`）** と **dev = 同一ファイルでの UI primitive swap（native `<input>` → `<Input>` 等）** が並列発生した際の統合パターン。仕様起草時に import 規約を `@/*` alias 起点に固定しておくと merge 衝突時の正規化コストが消える（aiworkflow-requirements の `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-045）。

- **L-DEVSYNC-045 (route group + primitive swap の二重発生)**: `app/(member)/` / `app/(public)/` / `app/(admin)/` 等の route group migration を含む Phase は、Phase 12 implementation-guide で **import を必ず `@/*` path alias で書く**ことを明示し、relative path (`../../../src/...`) を spec / 実装の両方で禁止する。route group は file system 上は実在セグメントのため、relative depth が `(group)` 1 段分ずれて build break する。
- **正規化ルール**: HEAD 側 alias 形式（`@/lib/api/me-requests.types`, `@/components/ui`）を採用し、dev 側 relative 追記を **alias に正規化して 1 行に統合**。conflict marker の trailing `:path` suffix（`<<<<<<< HEAD:apps/web/app/(member)/...` / `>>>>>>> dev:apps/web/app/...`）が rename 同時発生のシグナル。
- **Phase 12 ガード**: route group migration を伴う仕様には pre-flight として `grep -rn "from \"\.\./" apps/web/app/(member)/` 等の relative-import 検出 gate を含め、merge 後の typecheck 前段で alias 化を強制する。

### Anti-pattern

- 片側 take（HEAD path だけ採用して dev の UI primitive swap を捨てる、または逆で route group 外しに戻す）→ 仕様退行。
- relative path を残したまま route group 配下に移す → file system depth ずれで import 解決失敗、CI typecheck で初めて発覚。
- `UNION_MERGE_TARGETS` への `apps/web/app/**/_components/*.tsx` 追加 → JSX 構造の機械 union は意味壊し、禁止。

## Playwright spec / setup の ESM `__dirname` 対応（2026-05-26）

`apps/web/playwright/playwright.config.ts` が ESM 化されていると、その下の spec / setup / teardown ファイルでも CommonJS の `__dirname` は**未定義**になり実行時 `ReferenceError: __dirname is not defined in ES module scope` で全 test が即 fail する（CI: `authenticated-visual` ジョブで再発確認、Issue #901 PR #946）。lint / typecheck では検出されない（型定義上は globalThis 扱い）ため CI まで気付かない。

- **L-PWESM-001 (`__dirname` 復元パターン)**: Playwright の spec / setup / teardown で `__dirname` を参照する場合は必ず以下 3 行を冒頭に追加する。
  ```ts
  import path from "node:path";
  import { fileURLToPath } from "node:url";
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  ```
  既存実装の正本: `apps/web/playwright/tests/profile-readonly.spec.ts:1-6`。
- **L-PWESM-002 (storageState 参照)**: `test.use({ storageState: join(__dirname, "..", ".auth", "*.json") })` 形式は authenticated visual / e2e で頻出。spec 追加時は spec template に上記 3 行を含めるか、`playwright/fixtures/auth-paths.ts` のような共通モジュールに集約して spec 側から `__dirname` 直参照を排除する。
- **L-PWESM-003 (Phase 4 test plan)**: 新規 Playwright spec を仕様書に書く Phase 4 では「ESM `__dirname` 復元 import 3 行 OR 共通 fixture 経由」を acceptance に含める。typecheck / lint では落ちないため Phase 6 で `pnpm exec playwright test --list` を local で 1 回走らせてエラーが出ないことを確認する gate を含める。
- **L-PWESM-004 (cookie/token leak guard との依存)**: `__dirname` 解決失敗で setup が落ちると teardown も実行されず、`apps/web/playwright/.auth` が残留して後続の `Cookie/token leak guard` step も連鎖 fail する。一見独立した 2 つの fail を見たら、まず setup の ESM エラーを疑う。

### Anti-pattern

- spec / setup を CommonJS 前提のテンプレ（`__dirname` 直書き）で量産する → Playwright config 側を ESM 化したタイミングで全 authenticated spec が同時 fail。
- `import.meta.dirname`（Node 20.11+）への置換 → Playwright が ts-node / esbuild loader 経由で実行する場合に `import.meta.dirname` が undefined になる環境がある（CI ubuntu 上で再現確認）。`fileURLToPath` 経由が最も移植性が高い。

## 環境 secrets 必須 workflow の PR 非ブロック化（2026-05-26）

`staging-*` / `production-*` 系の baseline / smoke workflow は GitHub Environment secrets を必要とし、secrets 投入は **user-gated**（CLAUDE.md / memory `feedback_no_doc_for_secrets.md`）。pull_request event で secrets 未投入のまま起動すると、毎 PR が secrets validation エラーで blocked になり、AI からの自動修復が一切不能になる構造的問題。

- **L-ENVSEC-001 (secrets gate step パターン)**: workflow の最初に `secrets-gate` step を置き、`env:` 経由で secrets を読み取って欠落チェックする。欠落時:
  - `github.event_name == 'workflow_dispatch'` → `exit 1`（user が手動 trigger した場合は厳格 fail）
  - それ以外（`pull_request` 等）→ `echo "skip=true" >> "$GITHUB_OUTPUT"` で success-skip
- **L-ENVSEC-002 (後続 step の guard)**: 各 step に `if: steps.secrets-gate.outputs.skip != 'true'` を付ける。`if: always()` 系も `&& steps.secrets-gate.outputs.skip != 'true'` で AND 結合する。
- **L-ENVSEC-003 (Phase 4 test plan)**: secrets 必須 workflow を新規作成する spec では、Phase 4 contracts に「pull_request event での secrets 未投入時の graceful skip」を必ず含める。後付けで PR を unblock する作業（本 lesson が示すような追従 PR）を発生させない。
- **L-ENVSEC-004 (required status check の整合性)**: branch protection の required status check に当該 workflow を含める場合は、graceful skip success が「実 baseline 撮影 = skip」を意味することを understand。実 baseline 検証は workflow_dispatch / dev push 後の secret 投入完了状態で別途実施する設計を spec に明記する。

### Anti-pattern

- secrets を `vars` に降格させる「妥協」→ secrets 漏洩リスクが上がる。
- workflow から `pull_request` trigger を外す→ workflow file 自体の variation や spec 変更を CI で検知できなくなる。secrets-gate skip で trigger 自体は保持する。
- `continue-on-error: true` で誤魔化す → 真の secrets 欠落と spec バグの双方が無視される。skip 判定を明示的に行う。

## skill index-only sync-merge happy path（dev sync-merge / 2026-05-26）

並列 worktree が aiworkflow-requirements の `SKILL.md` / `indexes/topic-map.md` (`merge=union`) / `indexes/keywords.json` (`--ours + rebuild`) のみを更新し、ソース・spec・docs に手を入れない場合の sync-merge は、`pnpm sync:resolve` 単独で unhandled ゼロ完結する（aiworkflow-requirements の `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-046）。

- **L-DEVSYNC-046 (index-only happy path)**: Phase 12 implementation-guide / Phase 13 PR pre-flight で「conflict が 3 ファイル（`SKILL.md` + `indexes/topic-map.md` + `indexes/keywords.json`）以下に閉じる場合は resolver 単独完結で OK」と明示し、追加の手動 union を試みない。逆に conflict 件数が 4 以上、もしくは `.claude/skills/*/lessons-learned/` 配下が UU で出てきた場合は L-DEVSYNC-040 系（並列 export 追加）/ L-DEVSYNC-043（adapter signature union）/ L-DEVSYNC-045（route group rename + import 正規化）のいずれかにフォールバック判定する troubleshoot 行を runbook に含める。
- **Phase 12 sync gate への反映**: `pnpm sync:resolve` の `UNION_MERGE_TARGETS` を **skill index / lessons-learned / SKILL-changelog** に限定し続け、resolver の責務を「並列 worktree が末尾 append-only で更新するファイル」のみに固定する。`.gitattributes merge=union` 対象を追加する際は本 happy path が壊れないか（行単位の意味独立性）を spec template の review checklist に組み込む。

## CI re-trigger 戦略（transient infra failure / 2026-05-26）

GitHub Actions の transient 失敗（`actions/download-artifact` archive download error / runner provisioning timeout 等）で `mergeStateStatus=BLOCKED` になった PR の再 trigger 順序を Phase 12 implementation-guide / Phase 13 PR pre-flight に明文化する（aiworkflow-requirements の `lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` L-DEVSYNC-047）。

- **L-DEVSYNC-047 (CI re-trigger 順序)**: Phase 13 PR pre-flight runbook に以下の優先順位を含める。
  1. `gh run rerun --failed <run-id>` を最優先（同一 head SHA で job だけ re-queue、required check の鏡像維持）。
  2. 10 分以上 queued のまま進行しない場合のみ、**実ファイル変更を含む 1 commit** で head を進める（最小コストは `merge=union` 対象 lessons-learned / `docs/30-workflows/LOGS.md` への trailer 1 行追記）。
  3. **空コミット (`git commit --allow-empty`) は使わない**。empty commit は tree-hash 不変で `pull_request synchronize` が workflow run を schedule しないケースがあり、PR を BLOCKED 状態に陥らせる（既存の `feedback_visual_baseline_github_token_retrigger.md` は GITHUB_TOKEN 検知遅延向けで本ケースに適用できない）。
  4. CI re-trigger 目的で `apps/*/src/...` 実装側ファイルを触らない。code-change diff が PR review に紛れる。
- **gh api SHA 照合**: `gh api repos/.../actions/runs?head_sha=<sha>` で workflow run 登録を確認する際は **full 40-char SHA**（`git rev-parse HEAD`）を渡す。short SHA prefix では match しない。bash の `python3 -c "...$VAR..."` 変数展開漏れで「0 件」と誤判定する事故あり、SHA は environment variable ではなく argv / stdin か直接 string literal で渡す。

## API method/path 切替時の Playwright mock fixture 追従（2026-05-26）

admin API の method/endpoint を切替える PR（例: issue-912 で `POST /attendances` → `DELETE /attendance/:memberId`）では、本実装・vitest spec・runtime smoke と合わせて `apps/web/playwright/fixtures/auth.ts` の mock handler も**同一 PR で追従**させる必要がある。漏れた場合、mock の末尾 fallback `response(res, 404, { error: 'MOCK_API_NOT_FOUND' })` が新 endpoint への request を吸収してしまい、UI 側の idempotent 404 分岐（"既に出席解除されています"）に silent に流れ、`smoke (chromium)` / `e2e (desktop-chromium)` が "出席を削除しました" を期待する toast assertion で fail する。

- **L-APIMETH-001 (Phase 4 contracts)**: API method / path を変更する仕様書では Phase 4 contracts に「`apps/web/playwright/fixtures/auth.ts` の新 endpoint handler 追加」「旧 endpoint handler の取り扱い（残置 / 削除）」を必ず明記する。`grep -nE "POST|DELETE|method ===" apps/web/playwright/fixtures/auth.ts` を Phase 6 acceptance に含めて漏れを防ぐ。
- **L-APIMETH-002 (idempotent endpoint の mock 表現)**: idempotent DELETE/PUT の場合、mock も冪等にする。1回目=200/204、2回目以降=404 で `attendees` 配列を実際に更新する handler を書き、retry/idempotency path が test 側でも到達可能にする。状態を持たない `return 204 always` にすると、UI 側の "既に削除済" 分岐が一切踏まれず regression を検出できない。
- **L-APIMETH-003 (CI signal の二重化)**: typecheck / lint は mock 漏れを検出できない。Playwright `smoke` / `e2e` が API endpoint surface 変更の正本検証 gate であり、PR では verify-conflict-markers ではなく `playwright-smoke` の green を必須 check に含める運用を維持する。
- **L-APIMETH-004 (二系統 mock の同時追従)**: Playwright には mock が**二系統**存在する。`playwright-smoke.yml` は `apps/web/playwright/fixtures/auth.ts`（in-process fixture）を使い、`e2e-tests.yml` は `scripts/e2e-mock-api.mjs`（別 Node プロセス・stand-alone mock）を起動する。同じ症状（404 fall-through → idempotent 分岐の toast）が出るが、片方だけ直すと workflow 片側のみ green になり「smoke は通ったのに e2e-tests-coverage-gate が落ち続ける」という asymmetric failure が起きる。Phase 4 contracts と Phase 6 acceptance grep には**両ファイルを明記**する: `grep -nE "POST|DELETE|method ===" apps/web/playwright/fixtures/auth.ts scripts/e2e-mock-api.mjs`。

### Anti-pattern

- mock fixture の末尾に `response(res, 404, ...)` fallback を残したまま新 endpoint handler 追加を後続 PR に分割 → fallback が新 request を吸収し、UI 側の idempotent 404 分岐に silent fall-through → toast assertion が新 PR で fail。
- mock を always 200 success にする → UI の "既に削除済" toast 分岐が一切踏まれず、本番で初めて該当分岐の regression が出る。
- handler を mock に追加する代わりに `test.skip` / `test.fixme` で逃がす → playwright が API shape の正本検証 gate なのに gate が空洞化する。
- `apps/web/playwright/fixtures/auth.ts` のみ追従し `scripts/e2e-mock-api.mjs` を忘れる → `playwright-smoke` は green になるが `e2e-tests-coverage-gate` (3 shard) が同症状で fail し続け、原因切り分けで時間を浪費する。
