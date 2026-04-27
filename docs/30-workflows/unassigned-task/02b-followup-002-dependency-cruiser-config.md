# dependency-cruiser 設定本体の正式導入 - タスク指示書

## メタ情報

```yaml
issue_number: 104
```


## メタ情報

| 項目         | 内容                                                                          |
| ------------ | ----------------------------------------------------------------------------- |
| タスクID     | 02b-followup-002-dependency-cruiser-config                                    |
| タスク名     | dependency-cruiser 設定本体の正式導入                                         |
| 分類         | 改善                                                                          |
| 対象機能     | monorepo 内 repository 層の境界 enforcement                                   |
| 優先度       | 中                                                                            |
| 見積もり規模 | 中規模                                                                        |
| ステータス   | 未実施                                                                        |
| 発見元       | 02b Phase 12                                                                  |
| 発見日       | 2026-04-27                                                                    |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

02a / 02b / 02c は同一 Wave に属する parallel タスクで、`apps/api/src/repository/` 配下を機能ごとに分割する設計を採っている。02b は meeting / tag queue / schema diff repository を実装したが、02a (member identity / response repository) と 02c (admin notes audit / data access boundary) のパスは 02b 単独では未確定だった。AC-9 で「02a / 02c と相互 import 0」を保証するには、CI で機械的に検出する仕組みが必要となる。

### 1.2 問題点・課題

- 02b 単独では、まだ存在しない 02a / 02c のソース path を dependency-cruiser のルールに固定できない
- 現状はコードレビューに依存しており、PR 単位で相互 import が混入するリスクがある
- 02b の Phase 9 で「想定ルール案」を文書化したのみで、本体（`.dependency-cruiser.cjs` と CI 連携）が未導入のまま残っている

### 1.3 放置した場合の影響

- 02a / 02c が後から実装されたとき、02b への逆方向 import が混入しても CI が検知できない
- repository 層の責務分離が崩れ、結合度が増えてリファクタコストが上がる
- 不変条件 #5（apps/web → D1 直接アクセス禁止）と同レベルの境界を repository 内部でも維持する根拠が弱くなる

---

## 2. 何を達成するか（What）

### 2.1 目的

02a / 02b / 02c の repository 群が相互に import しないことを CI で機械検証する仕組みを正式導入し、AC-9 を恒常的に保証する。

### 2.2 最終ゴール

- ルートに `.dependency-cruiser.cjs` が配置され、02a 群 ↔ 02b 群 ↔ 02c 群の相互 import が `error` レベルで検出される
- pnpm script `pnpm depcruise` で誰でも同じ検査をローカル実行できる
- PR 時に GitHub Actions が `pnpm depcruise` を実行し、違反がある場合はマージ前にブロックする
- 違反時のエラーメッセージが「違反元ファイル」「違反先ファイル」「違反ルール名」を明示する

### 2.3 スコープ

#### 含むもの

- ルート `.dependency-cruiser.cjs` の新規作成（02a / 02b / 02c 各群のパス境界を `forbidden` ルールとして定義）
- pnpm script `pnpm depcruise` の追加
- `.github/workflows/` への depcruise 実行 job 追加（PR トリガ）
- 02a / 02b / 02c の境界定義を `aiworkflow-requirements/references/database-implementation-core.md` の正本ファイル群と整合
- ルール違反時のエラーメッセージで違反元・違反先を明示

#### 含まないもの

- 02a / 02c 自身の repository 実装
- packages/* / apps/web 側の依存ルール
- ESLint plugin (`eslint-plugin-boundaries` 等) による補助 (別タスク)

### 2.4 成果物

- ルート `.dependency-cruiser.cjs`
- `package.json` の scripts 追加差分
- GitHub Actions workflow 差分
- `database-implementation-core.md` への境界レギュレーション追記差分

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 02a / 02c の repository 実装が完了し、配置 path が確定している
- 02b の Phase 9 ルール案 (`outputs/phase-09/free-tier.md`) を読んでいる

### 3.2 依存タスク

- 02a (member-identity-status-and-response-repository) 実装完了
- 02c (admin-notes-audit-sync-jobs-and-data-access-boundary) 実装完了

### 3.3 必要な知識

- dependency-cruiser の `forbidden` / `allowed` ルール構文
- pnpm workspace でのルートからの相対パス解決
- GitHub Actions の job composition

### 3.4 推奨アプローチ

02c 実装の最終 Phase に組み込む形で導入する。02b の Phase 9 ルール案を出発点にし、02a / 02c の実 path に合わせて調整する。CI 連携前にローカルで違反パターン（あえて相互 import を仕込む dry-run）を試して error レベルで検出されることを確認する。

---

## 4. 実行手順

### Phase構成

1. 境界 path の確定
2. `.dependency-cruiser.cjs` 作成
3. pnpm script と CI workflow 追加
4. レギュレーション昇格と検証

### Phase 1: 境界 path の確定

#### 目的

02a / 02b / 02c の repository 群が配置されている実 path を確定する。

#### 手順

1. 02a / 02b / 02c の実装ファイル一覧を `apps/api/src/repository/` 配下から列挙
2. 各群を pattern（例: `^apps/api/src/repository/member-identity/`）で表現
3. 02b Phase 9 のルール案と差分を確認

#### 成果物

境界 path 一覧表

#### 完了条件

3 群の path が一意に表現できている

### Phase 2: `.dependency-cruiser.cjs` 作成

#### 目的

ルート設定本体を作成し、相互 import を `error` レベルで検出する。

#### 手順

1. `forbidden` ルールに 02a → 02b、02b → 02a、02b → 02c、02c → 02b、02a → 02c、02c → 02a の 6 方向を定義
2. 各ルールに `name` と `comment`（違反元・違反先・理由）を設定
3. `severity: "error"` を指定
4. 共有モジュールが存在する場合は `_shared/` 等の例外パスを明示

#### 成果物

`.dependency-cruiser.cjs`

#### 完了条件

ローカルで `pnpm depcruise` が違反 0 件で通る

### Phase 3: pnpm script と CI workflow 追加

#### 目的

ローカルと CI の両方で同じ検査を実行できるようにする。

#### 手順

1. `package.json` に `"depcruise": "depcruise apps/api/src"` を追加
2. `.github/workflows/` に `depcruise` job を追加（PR トリガ、`pnpm install` → `pnpm depcruise`）
3. dry-run 用のあえて違反した branch で CI が fail することを確認

#### 成果物

`package.json` 差分 + workflow ファイル

#### 完了条件

PR で違反があれば CI が失敗し、エラーメッセージに違反元・違反先が含まれる

### Phase 4: レギュレーション昇格と検証

#### 目的

同 Wave の境界 enforcement を最後の parallel タスクで導入するルールを正本化する。

#### 手順

1. `database-implementation-core.md` に「同 Wave parallel タスクの境界 enforcement は最終タスクで導入する」レギュレーションを追記
2. AC-9 検証手順に `pnpm depcruise` を追加
3. 02b の Phase 9 ルール案と本体の差分を `outputs/` にクローズ記録

#### 成果物

更新済み正本ドキュメント

#### 完了条件

AC-9 が機械検証できる手順として参照可能

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `.dependency-cruiser.cjs` がルートに存在し、6 方向の `forbidden` が定義されている
- [ ] `pnpm depcruise` がローカルで動作する
- [ ] PR 時に CI が depcruise を実行している
- [ ] 違反時のエラーメッセージに違反元・違反先が含まれる

### 品質要件

- [ ] severity が `error` で fail-fast する
- [ ] `audit-unassigned-tasks.js` の currentViolations = 0

### ドキュメント要件

- [ ] `database-implementation-core.md` に境界レギュレーション追記
- [ ] 02b Phase 9 ルール案と本体の対応関係が記録されている

---

## 6. 検証方法

### テストケース

- 正常系: 既存 02a / 02b / 02c の実装で違反 0 件
- 異常系: 02b から 02a / 02c へのダミー import を仕込み、CI が fail する

### 検証手順

```bash
pnpm depcruise
rg -n "dependency-cruiser|depcruise" .github package.json .dependency-cruiser.cjs
node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js \
  --target-file docs/30-workflows/unassigned-task/02b-followup-002-dependency-cruiser-config.md
```

---

## 7. リスクと対策

| リスク                                                              | 影響度 | 発生確率 | 対策                                                                |
| ------------------------------------------------------------------- | ------ | -------- | ------------------------------------------------------------------- |
| 02a / 02c の path がリファクタで変わるとルールが古くなる            | 中     | 中       | path を index ファイル単位ではなくディレクトリ単位の pattern で定義 |
| `_shared/` 等の共有モジュールが過剰例外化される                     | 中     | 中       | 例外は最小限に絞り、ADR に共有理由を残す                            |
| CI 実行コストが増える                                               | 低     | 低       | 依存解析を `apps/api/src` に限定し、キャッシュ活用                  |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/02b-parallel-meeting-tag-queue-and-schema-diff-repository/outputs/phase-09/free-tier.md`
- `docs/30-workflows/02b-parallel-meeting-tag-queue-and-schema-diff-repository/outputs/phase-12/unassigned-task-detection.md`
- 02b index.md の AC-9
- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`

### 参考資料

- dependency-cruiser 公式ドキュメント (`forbidden` / `severity`)
- 不変条件 #5（`apps/web` から D1 直接アクセス禁止）

---

## 9. 備考

### 苦戦箇所【記入必須】

> 02b 実装時に気づいた具体的困難点を記録する。

| 項目     | 内容                                                                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | 02b 単独では `apps/api/src/repository/_shared/` の sources を 02a の責務へ寄せる構造を選んだが、CI で「02a と 02c の中身を 02b が直接 import していないこと」を機械検証する仕組みがなかった |
| 原因     | dependency-cruiser を 02b 単独で導入すると、まだ存在しない 02a / 02c の path をルールで定義できないため、ルール本体は最後に追加する 02c 側の責務に置いた                                    |
| 対応     | 02b では `outputs/phase-09/free-tier.md` 配下に「想定ルール案」のみ書き、本体導入を 02c に切り出した                                                                                          |
| 再発防止 | 同 Wave 内の境界 enforcement は最後の parallel タスク (02c) で導入することを `database-implementation-core.md` のレギュレーションに昇格させる                                                |

### レビュー指摘の原文（該当する場合）

```
02b Phase 12 unassigned-task-detection.md にて「dependency-cruiser 設定本体は 02c で導入」と記録
```

### 補足事項

02b では Phase 9 でルール案のみを記録し、AC-9 の機械検証は本タスク（02c 側で実施）に委ねる。同 Wave parallel タスクで境界 enforcement を導入する場合は、対象 path が出揃う最終タスクに集約することが原則となる。
