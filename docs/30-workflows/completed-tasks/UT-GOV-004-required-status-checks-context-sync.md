# Required Status Checks の context 名同期 (草案 8 件 ↔ 実在 GitHub Actions job) - タスク指示書

## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | UT-GOV-004-required-status-checks-context-sync                                |
| タスク名     | branch protection 草案の required_status_checks contexts と現行 CI job 名の同期 |
| 分類         | 実装 / CI / governance                                                        |
| 対象機能     | branch protection 設定 / GitHub Actions workflow / lefthook hook              |
| 優先度       | 高（UT-GOV-001 の前提条件）                                                   |
| 見積もり規模 | 中規模                                                                        |
| ステータス   | 未実施 (proposed)                                                             |
| 親タスク     | task-github-governance-branch-protection                                      |
| 発見元       | outputs/phase-12/unassigned-task-detection.md current U-4                     |
| 発見日       | 2026-04-28                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`task-github-governance-branch-protection` の outputs/phase-2/design.md §2.b および outputs/phase-12/implementation-guide.md §1 では、`main` / `dev` ブランチに適用する branch protection の `required_status_checks.contexts` として 8 件の context 名を草案として列挙している（typecheck / lint / unit-test / integration-test / build / security-scan / docs-link-check / phase-spec-validate 等の予定）。一方、これらの context 名が現在 `.github/workflows/` 配下の workflow 群で実際に GitHub に登録されている job 名と一致しているかは未検証である。

### 1.2 問題点・課題

- 草案 context 名は設計時点の仮置きで、実在の GitHub Actions job 名とドリフトしている可能性がある
- GitHub の branch protection は、`required_status_checks.contexts` に「過去に一度も GitHub 上で報告されたことのない文字列」を設定すると、その branch への PR を **永続的に merge 不能** にする（status が `pending` のまま埋まらない）
- `task-git-hooks-lefthook-and-post-merge` で導入予定の lefthook hook 名と、CI 上の job 名の対応関係が未整理で、ローカルチェックと CI チェックがどう対応するかがチームに見えない

### 1.3 放置した場合の影響

- UT-GOV-001（branch protection apply）を実行した瞬間に main / dev への merge 経路が完全停止し、緊急の rollback 作業が必要になる
- ローカル lefthook と CI のチェック内容が一致せず、ローカル PASS → CI FAIL の摩擦が常態化する
- governance タスク全体（UT-GOV-001〜007）の前提が崩れて wave 全体が遅延する

---

## 2. 何を達成するか（What）

### 2.1 目的

branch protection 草案の 8 target contexts を、現行 `.github/workflows/` の **実在 job 名** および **GitHub 上で少なくとも 1 回成功した実績** と同期させ、UT-GOV-001 を安全に実行できる状態に整える。あわせて lefthook hook 名と CI job 名の対応表を文書化する。

### 2.2 想定 AC

1. `.github/workflows/` 配下の全 workflow を grep し、実在の workflow `name:` / job `name:` を一覧化した表が成果物に含まれる
2. 草案 8 contexts の各々について、対応する実在 context 名（`<workflow name> / <job name>` 形式 or matrix 展開時の `<workflow> / <job> (<matrix-value>)`）が確定している
3. 各 context が GitHub 上で **過去 30 日以内に少なくとも 1 回成功実績がある** ことが確認済み（`gh api` または Actions UI で検証）
4. 未出現 context は branch protection 草案から除外され、「段階適用案」セクションに後追い投入条件が記載される
5. lefthook hook 名（pre-commit / pre-push 等）と CI job 名の対応表が `task-git-hooks-lefthook-and-post-merge` 仕様と整合する形で作成される
6. UT-GOV-001 の `required_status_checks.contexts` に投入する確定リストが、本タスクの成果物として参照可能になる
7. `strict: true`（up-to-date 必須）の採否方針が決定され、根拠がドキュメント化される

### 2.3 スコープ

#### 含むもの

- `.github/workflows/*.yml` の workflow / job 名抽出
- 草案 8 contexts の名寄せ・確定
- GitHub 上の実績確認（`gh api repos/:owner/:repo/commits/:sha/check-runs` 等）
- lefthook hook ↔ CI job 対応表の作成
- 段階適用案（既出 context 先行投入 → 新規 context は CI 成功確認後に追加）の設計

#### 含まないもの

- branch protection の実適用（UT-GOV-001 の責務）
- lefthook 自体の導入（`task-git-hooks-lefthook-and-post-merge` の責務）
- 新規 CI job の追加（UT-GOV-005 / UT-GOV-006 等の責務）

### 2.4 成果物

- 実在 workflow / job 名の一覧表（Markdown）
- 確定 context 名リスト（UT-GOV-001 が直接参照する）
- lefthook hook ↔ CI job 対応表
- 段階適用案（フェーズ 1: 既出 context のみ / フェーズ 2: 新規 context 投入条件）
- `strict` オプションの採否決定メモ

---

## 3. 影響範囲

- `.github/workflows/` 配下の全 workflow（読み取り専用）
- UT-GOV-001 が参照する確定 context リスト
- `task-git-hooks-lefthook-and-post-merge` の hook 名設計
- `task-github-governance-branch-protection` outputs/phase-2/design.md §2.b の更新
- outputs/phase-12/implementation-guide.md §1, §5(H-1) の追記

---

## 4. 依存・関連タスク

- 前提（強）: なし（本タスクは UT-GOV-001 の前提）
- 後続（強）: UT-GOV-001（branch protection apply）— 本タスクの確定 context リストを必須入力とする
- 関連: `task-git-hooks-lefthook-and-post-merge` — hook 名 ↔ CI job 名の対応表で双方向の整合を取る
- 関連: UT-GOV-005（docs-only / non-visual / template / skill sync 系 CI 追加）
- 関連: UT-GOV-006（web deploy target canonical sync）
- 関連: UT-GOV-007（GitHub Actions の action ピン留めポリシー）

---

## 5. 推奨タスクタイプ

implementation（調査+設計+ドキュメント化が中心、コード実装はほぼ無し）

---

## 6. 参照情報

- 検出ログ: `docs/30-workflows/task-github-governance-branch-protection/outputs/phase-12/unassigned-task-detection.md` の current U-4
- 設計: `docs/30-workflows/task-github-governance-branch-protection/outputs/phase-2/design.md` §2.b（required_status_checks 草案）
- 実装ガイド: `docs/30-workflows/task-github-governance-branch-protection/outputs/phase-12/implementation-guide.md` §1（target contexts）, §5（H-1: context drift hazard）
- 現行 workflow: `.github/workflows/` 配下全ファイル
- 関連タスク仕様: `docs/30-workflows/unassigned-task/UT-GOV-001-github-branch-protection-apply.md`
- GitHub Docs: About protected branches — Require status checks before merging

---

## 7. 備考

- 草案 8 件（typecheck / lint / unit-test / integration-test / build / security-scan / docs-link-check / phase-spec-validate）はあくまで設計時点の仮称であり、実在 job 名と完全一致するとは限らない。本タスクは「設計の意図を保ったまま実在名へリネーム」または「実在 workflow を新設」のどちらで吸収するかを判断する。
- 新設が必要な context（例: phase-spec-validate がまだ workflow 化されていない場合）は UT-GOV-005 等にリレーし、本タスクでは branch protection への投入対象から **意図的に除外** する。
- UT-GOV-001 は本タスクの確定リストを唯一の入力として apply するため、本タスク完了 = UT-GOV-001 着手可能の関係になる。

---

## 8. 苦戦箇所・落とし穴

### 8.1 存在しない context 名による merge 完全停止

- `required_status_checks.contexts` に「過去に GitHub 上で 1 回も報告されたことのない文字列」を入れると、その branch への全 PR が `Expected — Waiting for status to be reported` で永遠に止まる
- この状態は admin override か protection 設定の修正でしか解除できない（rollback コストが極めて高い）
- **対策**: 投入前に `gh api repos/:owner/:repo/commits/<recent-sha>/check-runs` で各 context が check-run として実在することを必ず確認する

### 8.2 context 名の生成規則の混乱

- workflow の `name:` と job の `name:` の **どちらが context 名になるか** は GitHub の内部規則に依存する
- 一般的なパターン: `<workflow name> / <job name>`
- matrix を使うと `<workflow name> / <job name> (<matrix-value-1>, <matrix-value-2>)` のように展開され、matrix の値ごとに別 context として登録される
- `name:` を省略すると job key（YAML のキー名）が使われるため、後から `name:` を足すと context 名が変わって過去実績が無効化される
- **対策**: 全 job に明示的な `name:` を付け、matrix 展開後の最終 context 名を実 run の Actions UI で目視確認する

### 8.3 同名 job が複数 workflow に存在するケース

- 例えば `lint` という job 名が `ci.yml` と `pr-check.yml` の両方に存在しても、context は workflow 単位で別物（`ci / lint` と `pr-check / lint`）
- 設計書で「lint」とだけ書かれていると、どちらを必須にするかが曖昧
- **対策**: 確定リストでは必ず `<workflow> / <job>` のフルパスで記載する

### 8.4 `strict: true`（up-to-date 必須）のトレードオフ

- `strict: true` を入れると、PR ブランチが base ブランチの最新を取り込んでいないと merge できなくなり、他 PR が merge されるたびに rebase / merge と CI 再実行が必要になる
- 開発体験は悪化するが、main の壊れリスクは下がる
- **対策**: dev は `strict: false`、main は `strict: true` のような段階適用も検討。決定事項は備考に明記する

### 8.5 lefthook hook と CI job のドリフト

- ローカル lefthook で走るチェックと CI で走るチェックが別実装になると、ローカル PASS → CI FAIL の摩擦が起きる
- **対策**: 同一の `pnpm` script（例: `pnpm typecheck` / `pnpm lint`）を lefthook と CI 双方から呼び、対応表を仕様書で固定する

### 8.6 段階適用時の「先に投入した context が後から名前変更される」事故

- フェーズ 1 で投入した context の workflow 名 / job 名が、後の refactor で変更されると、その瞬間から context 不一致で merge 不能になる
- **対策**: context 名変更を伴う refactor は branch protection 設定の更新と同一 PR で行うこと（または事前に新旧両方を contexts に並べ、旧側で 1 回 PASS してから旧を外す）を運用ルールとして文書化する
