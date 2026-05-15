# Phase 1: 要件定義

> Phase: 1 / 13
> 名称: 要件定義
> implementation_mode: `verify_existing`
> task classification: docs-only task
> visual classification: NON_VISUAL

---

## 目的

MVP recovery の戦略目標「公開 / 会員 / 管理」の 3 戦略層に、共通 surface を扱う COM 補助層を加えた 4 列 mapping matrix の要件・スコープ・受入条件を固定する。

---

## P50 前提確認チェック

| 項目 | 結果 | 対応 |
|------|------|------|
| current branch に実装が存在するか | No（本タスクは新規 docs 生成） | 通常 docs-only 実装フローを採用 |
| upstream マージ済みか | N/A | docs-only |
| 前提タスク完了済みか | task-23 / task-24 / task-25 完了必須、task-26 は COM 層 context として参照 | Phase 5 着手前に parent workflow の `VERIFICATION-STATUS.md` / `INVARIANT-AUDIT.md` / `SMOKE-COVERAGE-MATRIX.md` 存在確認 |

`implementation_mode = "verify_existing"`: 既存 22 タスク spec・既存実装ファイル・既存検証 matrix（task-23/24/25）を read-only で参照し、新規生成は mapping matrix と evidence docs のみとする。

---

## スコープ

### in-scope

- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/MVP-3LAYER-TASK-MAPPING.md` の生成
- 全 22 タスク × 4 層 = 88 セルの double-entry matrix 作成
- task-23 で WARN/FAIL になったタスクの層別影響明示
- task-24（invariant audit）/ task-25（smoke coverage）の結果を層別集約欄に取り込む
- task-26 の common surfaces 実装結果を COM 層 context として参照する

### out-of-scope

- 既存タスク spec / 実装ファイルの書き換え
- 新規実装タスクの追加（mapping は read-only）
- API endpoint surface の変更
- D1 schema / Google Form 仕様の変更
- 19 routes 単位での詳細 verification（task-23 / task-25 の責務）

---

## 対象タスク一覧（22 件）

`docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/` 配下の `task-01`〜`task-22` を対象とする。各タスクの主題は同 workflow の `SCOPE.md` および各タスク root `index.md` を一次正本として参照する。

Phase 5 では実際の現行 22 タスクディレクトリ名を `ls` で列挙し、本仕様書記載との一致を確認すること。

---

## 4 層定義（columns）

| 層 | 略号 | 含まれる routes | 主な責務 |
|----|------|----------------|---------|
| 公開層 | PUB | `/`, `/(public)/members`, `/(public)/members/[id]`, `/(public)/register`, `/privacy`, `/terms` | 未認証ユーザーへの会員ディレクトリ・登録導線・規約掲示 |
| 会員層 | MEM | `/login`, `/profile` | 認証導線と本人プロフィール参照 |
| 管理層 | ADM | `/(admin)/admin`, `/(admin)/admin/{members,tags,meetings,schema,requests,identity-conflicts,audit}` | 管理者バックオフィス（会員管理・タグ・ミーティング・schema・申請・同一性・監査） |
| 共通層 | COM | `error.tsx`, `not-found.tsx`, `loading.tsx` | 全 routes 共通の app shell / error boundary / loading state |

---

## 4 分類定義（cell values）

| 値 | 定義 | 判定基準（例） |
|----|------|---------------|
| 必須 | 不在時に層全体が機能不全に陥るタスク | 当該層 route が動作する前提となる primitive / token / API 接続 / auth |
| 強関与 | 不在時に層の主機能・UX が大きく劣化するタスク | 主要 page 実装 / 主要 form / 主要 data 表示 |
| 軽関与 | 当該層に部分的・補助的に影響するタスク | 限定 route のみに関連 / 視覚調整 / 局所的回帰修正 |
| 無関係 | 当該層に直接影響を持たないタスク | 別層 routes 専用 / インフラ・CI gate のみ |

---

## 受入条件（DoD）

1. `MVP-3LAYER-TASK-MAPPING.md` が `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/` 直下に配置されている
2. matrix セクションが 2 つ存在する（タスク → 層 / 層 → タスク）
3. 22 task × 4 layer = **88 セルすべて**が「必須 / 強関与 / 軽関与 / 無関係」のいずれかで埋まっている
4. WARN / FAIL となっているタスク（task-23 由来）に対して、影響を受ける層が明示されている
5. 双方向 matrix の内容が一致している（タスク→層 表で「必須」と書かれたペアは、層→タスク 表でも「必須」に出現）
6. 既存ファイル（task-01〜22 の spec、実装ファイル）は一切書き換えられていない（`git diff` で確認）
7. line budget: `MVP-3LAYER-TASK-MAPPING.md` 単体で 600 行以下（脚注込み）

---

## 不変条件

1. mapping は double-entry matrix（タスク → 層 / 層 → タスク）両方向で記載
2. 各層について 4 分類でラベリング
3. task-23 で WARN/FAIL のタスクは層別影響を明示
4. read-only mapping（既存実装の書き換え禁止）
5. GFM table、空欄禁止
6. 既存 API endpoint surface / D1 schema は変更しない（MVP recovery 共通不変条件）
7. `apps/web` から D1 への直接アクセスは引き続き禁止（mapping 上で当該タスクは管理層 routes との関係を明示）

---

## 命名規約調査

mapping matrix で参照する task ID 命名規約: `task-NN-<slug>`（NN は 01〜22 のゼロパディング 2 桁）。本仕様書および matrix 出力で表記揺れを起こさないこと。

---

## 既存実装 carry-over 確認

| 項目 | 確認結果 |
|------|---------|
| 直近 git log | `git log --oneline -5` で task-23 系の close-out 完了確認 |
| 前タスク成果物 | parent workflow の `VERIFICATION-STATUS.md` / `INVARIANT-AUDIT.md` / `SMOKE-COVERAGE-MATRIX.md` が実体生成済み |
| 重複作業の懸念 | task-23 は「条件 → タスク」表、task-27 は「層 → タスク」表で観点が異なる（重複なし） |

---

## ステークホルダー / 利用シーン

| ステークホルダー | 利用シーン |
|----------------|-----------|
| solo developer | 19 routes のうちどの層が品質不足かを 1 表で判断する |
| Phase 10 reviewer | task 完了報告を `PUB / MEM / ADM / COM` 単位で集約評価する |
| 将来の追加開発者 | 新規 route 追加時に「どの層に属するか / 既存タスクのどれが必須か」を逆引きする |

---

## 次フェーズへの引き継ぎ

Phase 2 では以下を設計する:

1. matrix の物理レイアウト（行・列・脚注配置）
2. セル分類アルゴリズム（task spec 読込 → routes 集合との交差判定）
3. WARN/FAIL 集約のセクション構造（層別影響リスト）
4. 双方向一致のチェック手順
## メタ情報

- Phase: 1 / 要件定義
- taskType: docs-only
- visualEvidence: NON_VISUAL

## 目的

task-27 の scope、入力、成果物、NON_VISUAL 境界を定義する。

## 実行タスク

- 22 task と 4 layer の mapping 要件を確定する。
- 最終成果物の配置先を確定する。

## 参照資料

- `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/`
- `docs/30-workflows/completed-tasks/task-26-ui-mvp-w8-par-error-tsx-token-utility-migration/`

## 成果物

- `phase-1-requirements.md`

## 完了条件

- [x] 要件、境界、参照入力が記録されている。

## 統合テスト連携

docs-only / NON_VISUAL のため runtime integration test は不要。構造検証は Phase 7 / Phase 11 / Phase 12 で扱う。
