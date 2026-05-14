# Phase 2: 設計

> Phase: 2 / 13
> 名称: 設計
> implementation_mode: `verify_existing`

---

## 目的

mapping matrix の物理レイアウト・セル分類アルゴリズム・WARN/FAIL 集約方法・双方向一致検証手順を設計する。

---

## 既存コンポーネント再利用可否（FB-SDK-07-1）

| 既存資産 | 再利用方針 |
|---------|-----------|
| `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md` | 19 routes と層対応の一次正本として参照 |
| 各 task root `index.md`（task-01〜22） | scope / 対象ファイル / DoD の参照元 |
| `task-23/.../VERIFICATION-STATUS.md`（task-23 実行結果） | WARN/FAIL 情報源 |
| `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/INVARIANT-AUDIT.md`（task-24 実行結果） | 不変条件遵守度の層別集約 |
| `task-25/.../SMOKE-COVERAGE-MATRIX.md`（task-25 実行結果、利用可能なら） | route 単位 smoke の層別集約 |

新規 primitive / 新規 spec ファイルは作成しない。

---

## 物理レイアウト

`MVP-3LAYER-TASK-MAPPING.md` の構成:

```
# MVP 3層 × 22 タスク Mapping Matrix

## 1. 概要 / 凡例
## 2. 4 層定義（routes 一覧）
## 3. Matrix A: タスク → 層（22 行 × 4 列）
## 4. Matrix B: 層 → タスク（4 行 × タスク集合）
## 5. WARN / FAIL タスクの層別影響集約
## 6. invariant audit（task-24）層別集約（利用可能時）
## 7. smoke coverage（task-25）層別集約（利用可能時）
## 8. 戦略整合性サマリー（層別 readiness 判定）
## 9. 脚注 / 参考リンク
```

### Matrix A（タスク → 層）の列構造

| Task ID | 主題 | 公開層 (PUB) | 会員層 (MEM) | 管理層 (ADM) | 共通層 (COM) | 備考 |

### Matrix B（層 → タスク）の構造

層ごとに 4 つのバケツ（必須 / 強関与 / 軽関与 / 無関係）を作り、所属タスク ID を列挙する。

---

## セル分類アルゴリズム

各セル（task × layer）に対して、以下の判定樹を順に適用する。

1. **必須判定**: task の変更対象に「当該層 routes が動作するために構造的に必要な primitive / token / auth / API client / app shell」が含まれるか
   - 例: `tokens.css`（全層必須） / `error.tsx` 共通（共通層必須） / auth config（会員層・管理層必須）
2. **強関与判定**: task の主スコープが当該層 routes 1 つ以上の主機能を実装しているか
   - 例: register form タスク → 公開層 強関与
3. **軽関与判定**: task の対象ファイルが当該層 routes に局所的に影響するか
   - 例: token 修正の一部が公開層のみに作用、管理層 1 route のみの微修正
4. **どれにも該当しない場合は無関係**

判定根拠は Phase 5 の `implementation-notes.md` に task ID ごとに記録する。

---

## WARN / FAIL 集約アルゴリズム

task-23 `VERIFICATION-STATUS.md` の各 task 行を読み、WARN または FAIL を含む task を抽出して、Matrix A のそのタスク行で「必須」「強関与」とラベル付けされた層に対して影響を伝播させる。

集約セクション（matrix セクション 5）の形式:

```
### 公開層への影響
- task-XX (WARN: 理由): 公開層 6 routes のうち YY に影響
- ...

### 会員層への影響
...
```

「軽関与」「無関係」の層は集約対象外（影響軽微または無し）。

---

## 双方向一致検証手順

Matrix A と Matrix B の内容一致を以下で確認する:

1. Matrix A で `(task-XX, layer-Y) = 必須` のペアをすべて抽出
2. Matrix B の `layer-Y` の「必須」バケツに `task-XX` が含まれているかを確認
3. 「強関与」「軽関与」も同様に確認
4. 不一致が 1 件でもあれば Phase 5 で修正してから Phase 6 へ進む

検証は Phase 4 で設計するチェックリストと Phase 6 の cross-check で実施する。

---

## 戦略整合性サマリー

層ごとに以下を判定し、`MVP-3LAYER-TASK-MAPPING.md` の section 8 に記載する:

| 層 | readiness | 判定基準 |
|----|-----------|---------|
| 公開層 | READY / AT_RISK / BLOCKED | 必須タスクが全 PASS なら READY、WARN/FAIL が 1 件以上なら AT_RISK、必須が FAIL なら BLOCKED |
| 会員層 | 同上 | 同上 |
| 管理層 | 同上 | 同上 |
| 共通層 | 同上 | 同上 |

---

## SubAgent lane（3 並列以下）

本タスクは docs-only で SubAgent 分割不要。実行は単一実装者が直列で進める。

---

## 不変条件（再掲）

- read-only mapping
- 88 セル空欄禁止
- GFM table 形式
- 既存実装書き換え禁止

---

## 次フェーズへの引き継ぎ

Phase 3 では本設計のゲート判定を行う。
