# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | branch protection 草案の required_status_checks contexts 同期 (UT-GOV-004) |
| Phase 番号 | 1 / 3（本セッション分） |
| Phase 名称 | 要件定義 |
| 作成日 | 2026-04-29 |
| Wave | governance / pre UT-GOV-001 |
| 実行種別 | serial（UT-GOV-001 の前提） |
| 前 Phase | なし |
| 次 Phase | 2 (設計) |
| 状態 | spec_created |
| タスク分類 | governance / docs-only / NON_VISUAL（実コード変更なし、調査+ドキュメント化） |

## 目的

「草案 8 contexts を CI 実在 job 名と同期する」という抽象タスクを、**「branch protection を適用した瞬間に main / dev への merge が永続停止しないことを保証する確定 context リストと段階適用ルール」を生成するタスク** に再定義し、UT-GOV-001 が apply できる形の入力契約を Phase 2 に渡せる粒度で固定する。

## 真の論点 (true issue)

- 「8 contexts を CI 実在名にリネームする」ことが本質ではなく、**「投入する文字列が GitHub 上で過去 1 回以上 check-run として報告された実績を持つ」ことを契約として担保する** ことが本質。
- 投入対象 context は「設計の意図を保ったまま実在名へリネーム」「実在 workflow を新設」「branch protection 投入から意図的に除外」の 3 経路に分岐し、本タスクは新設は行わず、リネーム or 除外で吸収する範囲を確定する。
- 副次的論点として、lefthook と CI のドリフトを防ぐため、双方が同一 `pnpm` script を呼ぶ対応表を運用契約として固定する。

## 依存境界

| 種別 | 対象 | 受け取る前提 | 渡す出力 |
| --- | --- | --- | --- |
| 上流 | なし | - | - |
| 下流（強） | UT-GOV-001（branch protection apply） | 確定 context リスト・`strict` 採否方針・段階適用フェーズ | 本タスクの成果物パスを唯一の入力契約として渡す |
| 関連 | task-git-hooks-lefthook-and-post-merge | hook 名と pnpm script の規約 | lefthook ↔ CI 対応表・同一 pnpm script 共有契約 |
| 関連 | UT-GOV-005 | 新規 CI 追加リレー先 | 「実在しないが将来必要な context」の名寄せ |
| 関連 | UT-GOV-006 / UT-GOV-007 | deploy 系 / action ピン留め | 修正時の同一 PR ルール参照 |
| 既存組み込み | task-github-governance-branch-protection | outputs/phase-2/design.md §2.b 草案 8 件 | 上書き確定リスト |

## 価値とコスト

- 価値: UT-GOV-001 の実行が安全になる（main / dev の merge 経路が永続停止しない）。lefthook と CI が pnpm script で揃い、ローカル PASS → CI FAIL の摩擦がゼロ化する。
- コスト: 実装はほぼゼロ（調査 + Markdown 数本）。`gh api` 実績確認に数十回の API 呼び出し（公開 repo なので rate limit に十分余裕）。
- 機会コスト: 本タスクを省略すると UT-GOV-001 が永続停止事故を起こす確率が定量的に高くなる（草案 8 件中、CI 実在名と完全一致するのは限定的なため）。

## 4条件評価

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | UT-GOV-001 の前提整備として唯一不可欠。代替手段なし（実績確認なしで投入は事故）。 |
| 実現性 | PASS | `.github/workflows/` の grep + `gh api check-runs` で完結。新規実装ゼロ。 |
| 整合性 | PASS | アプリ層の不変条件 #1〜#7 に影響せず、governance 層に閉じる。 |
| 運用性 | PASS | 段階適用案 + 名前変更時の同一 PR 運用ルールで継続的なドリフトを防止できる。 |

## 既存 CI / hook 命名規則の確認指示書（Phase 2 入力）

Phase 2 で実在 context 名を抽出する前に、以下を必ず走査すること。

| 観点 | 確認対象 | 期待される情報 |
| --- | --- | --- |
| Workflow ファイル一覧 | `.github/workflows/*.yml` 全件 | 各ファイルの `name:` トップレベル値 |
| Job ファイル単位 | 各 workflow の `jobs.<key>.name` | 明示 `name:` の有無、未指定時は YAML キー名 |
| Matrix 展開 | `strategy.matrix` | matrix 値 × job の最終 context 名（実 run の Actions UI で目視確認） |
| 直近成功実績 | `gh api repos/:owner/:repo/commits/<recent-sha>/check-runs` | 過去 30 日以内の `conclusion=success` の有無 |
| lefthook 設定 | `lefthook.yml` | hook 名 → pnpm script マッピング |
| pnpm script | `package.json` の `scripts` | `typecheck` / `lint` / `test` 等の実体 |

## 草案 8 contexts と暫定分類（Phase 2 で確定）

| # | 草案 context 名 | 想定対応経路 | 備考 |
| --- | --- | --- | --- |
| 1 | typecheck | リネーム見込み | `pnpm typecheck` を呼ぶ job が ci.yml / backend-ci.yml にあるか確認 |
| 2 | lint | リネーム見込み | 同上、複数 workflow にある場合フルパス記載必須 |
| 3 | unit-test | リネーム見込み | matrix 展開の有無を確認 |
| 4 | integration-test | リネーム or 除外 | 実在しない可能性あり、UT-GOV-005 リレー候補 |
| 5 | build | リネーム見込み | validate-build.yml が候補 |
| 6 | security-scan | 除外見込み | 現状 workflow に存在しない可能性、UT-GOV-005 リレー |
| 7 | docs-link-check | 除外見込み | 同上、UT-GOV-005 リレー候補 |
| 8 | phase-spec-validate | 除外見込み | 同上、UT-GOV-005 リレー候補。verify-indexes.yml との関連も確認 |

> 上記は Phase 1 時点の暫定。Phase 2 で `.github/workflows/` 走査後に確定する。

## 実行タスク

1. 原典 `UT-GOV-004-required-status-checks-context-sync.md` の苦戦箇所 6 件（merge 完全停止 / context 名規則 / 同名 job / strict トレードオフ / lefthook ドリフト / 名前変更事故）を Phase 1 の AC 化（完了条件: 各苦戦箇所が AC または多角的チェックに対応）。
2. 真の論点を「リネーム」ではなく「投入文字列の実績担保」に再定義する（完了条件: main.md 冒頭に明記）。
3. 依存境界（下流 1 強・関連 4・既存組み込み 1）を確定（完了条件: 表に前提と出力が記載）。
4. 4条件評価を全 PASS で確定（完了条件: 各観点に PASS 判定と根拠）。
5. 草案 8 contexts の暫定分類（リネーム / 除外）を Phase 2 入力として固定（完了条件: 8 件すべてに想定経路が付与）。
6. 既存 CI / hook 命名規則チェック観点 6 件を Phase 2 への引き渡しチェックリストとして整理。
7. AC-1〜AC-10 を index.md と同期（完了条件: AC 文言の差分ゼロ）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-004-required-status-checks-context-sync.md | 原典スペック |
| 必須 | docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md | 後続タスク入力契約の確認 |
| 必須 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-2/design.md | §2.b 草案 8 contexts |
| 必須 | docs/30-workflows/completed-tasks/task-github-governance-branch-protection/outputs/phase-12/implementation-guide.md | §1 target contexts / §5 H-1 context drift hazard |
| 必須 | .github/workflows/ 配下全ファイル | 実在 workflow / job 名抽出元 |
| 参考 | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches | Require status checks before merging 公式 |

## 実行手順

### ステップ 1: 原典苦戦箇所の写経と AC 化

- 苦戦箇所 6 件を AC-1〜AC-10 に分解写像する。
- merge 完全停止リスク → AC-3（実績確認）/ AC-4（除外）
- context 名規則 → AC-2（フルパス記載）/ AC-8
- 同名 job → AC-8
- strict トレードオフ → AC-7
- lefthook ドリフト → AC-5
- 名前変更事故 → AC-9

### ステップ 2: 真の論点の再定義

- 「リネーム」より「実績担保」が本質である旨を明記。
- 段階適用 + 同一 PR ルールが運用契約として必須である旨を Phase 2 入力に固定。

### ステップ 3: 4条件のロックと AC との同期

- 4条件すべて PASS で固定。
- AC-1〜AC-10 を `outputs/phase-01/main.md` に列挙し index.md と完全一致させる。

### ステップ 4: Phase 2 への引き渡しチェックリスト出力

- 命名規則チェック 6 観点を `outputs/phase-01/main.md` に明記。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 2 | 真の論点・依存境界・4条件・命名規則チェックリスト・草案 8 暫定分類を設計入力として渡す |
| Phase 3 | 4条件評価の根拠を代替案 PASS/MINOR/MAJOR の比較軸として再利用 |

## 多角的チェック観点（AI が判断）

- branch protection 永続停止リスク: 投入前 check-run 実績確認が AC に組み込まれているか。
- merge 摩擦: `strict` 採否が dev / main 別に決定可能な構造になっているか。
- CI 実績の真正性: `gh api` 等で機械的に検証可能な手順になっているか。
- hook 整合性: lefthook と CI が同一 pnpm script を呼ぶ規約として明文化されているか。
- 名前変更事故: 名前変更を伴う workflow refactor の運用ルールが AC に含まれているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 真の論点を「実績担保」に再定義 | 1 | spec_created | main.md 冒頭 |
| 2 | 依存境界（下流 1 強・関連 4・組み込み 1） | 1 | spec_created | UT-GOV-001 を強下流 |
| 3 | 4条件評価 PASS 確定 | 1 | spec_created | 全件 PASS |
| 4 | 草案 8 contexts 暫定分類 | 1 | spec_created | リネーム / 除外 |
| 5 | 命名規則チェック 6 観点 | 1 | spec_created | Phase 2 入力 |
| 6 | AC-1〜AC-10 確定 | 1 | spec_created | index.md と完全一致 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-01/main.md | 要件定義主成果物（4条件・true issue・依存境界・暫定分類・命名規則チェックリスト） |
| メタ | artifacts.json | Phase 1 状態の更新 |

## 完了条件 (Acceptance Criteria for this Phase)

- [ ] 真の論点が「リネーム」ではなく「投入文字列の実績担保」に再定義されている
- [ ] 4条件評価が全 PASS で確定し、根拠が記載されている
- [ ] 依存境界に下流 UT-GOV-001（強）と関連 4 件、既存組み込み 1 件が前提と出力付きで記述されている
- [ ] AC-1〜AC-10 が index.md と完全一致している
- [ ] 草案 8 contexts のすべてに暫定分類（リネーム / 除外）が付与されている
- [ ] 既存命名規則チェック観点 6 件が Phase 2 入力として整理されている

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 全成果物が `outputs/phase-01/` 配下に配置済み
- 苦戦箇所 6 件すべてが AC または多角的チェックに対応
- 異常系（merge 永続停止 / 名前変更事故 / lefthook ドリフト）の論点が要件レベルで提示されている
- artifacts.json の `phases[0].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 2 (設計)
- 引き継ぎ事項:
  - 真の論点 = 投入文字列の実績担保
  - 4条件評価（全 PASS）の根拠
  - 草案 8 contexts の暫定分類（リネーム / 除外の振り分け）
  - 命名規則チェック 6 観点（workflow / job / matrix / 直近実績 / lefthook / pnpm script）
  - 設計成果物を 3 ファイル（context-name-mapping.md / staged-rollout-plan.md / lefthook-ci-correspondence.md）に分離する指示
- ブロック条件:
  - 4条件のいずれかが MINOR/MAJOR
  - AC-1〜AC-10 が index.md と乖離
  - 草案 8 件のいずれかに暫定分類が付与されていない
