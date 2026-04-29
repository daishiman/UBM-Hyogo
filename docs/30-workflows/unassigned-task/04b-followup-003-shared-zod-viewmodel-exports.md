# packages/shared zod/viewmodel exports field 整備 - タスク指示書

## メタ情報

```yaml
issue_number: 219
```

## メタ情報

| 項目         | 内容                                                  |
| ------------ | ----------------------------------------------------- |
| タスクID     | 04b-followup-003-shared-zod-viewmodel-exports         |
| タスク名     | packages/shared zod/viewmodel exports field 整備      |
| 分類         | 改善                                                  |
| 対象機能     | `@repo/shared` の subpath exports                     |
| 優先度       | 低                                                    |
| 見積もり規模 | 小規模                                                |
| ステータス   | 未実施                                                |
| 発見元       | 04b Phase 12 skill-feedback                           |
| 発見日       | 2026-04-29                                            |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

04b で `apps/api/src/routes/me/schemas.ts` から `MemberProfileZ` / `SessionUserZ` を
直接 import する際、`packages/shared` の `package.json` の `exports` field が
`./zod/viewmodel` を subpath として公開していなかったため、import path の調整が必要だった。

### 1.2 問題点・課題

- 04b のスコープに `packages/shared` の API 整備を組み込むのはスコープ外だったため、
  暫定的な import path で commit されている可能性がある
- 後続タスク（06b 会員ページ、07a/07c admin workflow）でも同じ zod 型を import するため、
  暫定回避を踏襲すると subpath が分散する
- TypeScript の `node` resolution と `bundler` resolution で挙動が異なる場合があり、
  `exports` field を正式に切ると安全性が高まる

### 1.3 放置した場合の影響

- 同じ workaround が後続 PR で繰り返され、コードレビュー時に都度議論が発生する
- `tsc --moduleResolution bundler` 環境と `node16` 環境で異なる import path が要求され、
  monorepo 内で統一が崩れる

---

## 2. 何を達成するか（What）

### 2.1 目的

`@repo/shared` の `package.json` に `./zod/viewmodel` 等の subpath exports を正式定義し、
04b 以降の利用者が `import { MemberProfileZ } from "@repo/shared/zod/viewmodel"` の
形式で参照できる状態に揃える。

### 2.2 最終ゴール

- `packages/shared/package.json` の `exports` に該当 subpath が追加されている
- `apps/api/src/routes/me/schemas.ts` を含む全利用箇所が公式 subpath で import している
- typecheck / lint / test 全グリーン

### 2.3 スコープ

#### 含むもの

- `packages/shared/package.json` の `exports` 更新
- 既存 import path の置換（grep ベースで一括）
- 必要に応じて `tsconfig.json` の `paths` 整合

#### 含まないもの

- `@repo/shared` の API 自体の追加・削除
- 他 package（ui-primitives 等）の exports 整備

### 2.4 成果物

- `packages/shared/package.json` 差分
- 各 import 箇所の置換差分

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- 04b マージ済み

### 3.2 必要な知識

- Node.js `package.json` exports field
- TypeScript `moduleResolution: bundler` の解決ルール
- pnpm workspace の linking 仕様

### 3.3 推奨アプローチ

1. `packages/shared` の現状の `exports` を読む
2. `./zod/viewmodel` を含む subpath を追加
3. `rg "@repo/shared"` で利用箇所を列挙し、必要に応じて置換
4. typecheck / test を CI と同条件で確認

---

## 4. 実行手順

### Phase構成

1. exports の現状調査
2. exports field 追加
3. 利用箇所の置換と検証

### Phase 1: exports の現状調査

#### 完了条件

`packages/shared/package.json` の現行 `exports` と利用パターンが整理済み

### Phase 2: exports field 追加

#### 完了条件

`./zod/viewmodel`（必要に応じて他 subpath）が `exports` に追加されている

### Phase 3: 利用箇所の置換と検証

#### 完了条件

import path が公式 subpath に統一され、typecheck / test が緑

---

## 5. 完了条件チェックリスト

### 機能要件

- [ ] `@repo/shared/zod/viewmodel` で MemberProfileZ / SessionUserZ が import できる
- [ ] 04b で発生した workaround import が解消されている

### 品質要件

- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] 関連テスト緑

### ドキュメント要件

- [ ] `packages/shared/README.md` または `_design/` に subpath 一覧を追記

---

## 6. 検証方法

### 検証手順

```bash
rg -n "@repo/shared" apps packages
mise exec -- pnpm typecheck
mise exec -- pnpm test
```

---

## 7. リスクと対策

| リスク                                                         | 影響度 | 発生確率 | 対策                                                          |
| -------------------------------------------------------------- | ------ | -------- | ------------------------------------------------------------- |
| `exports` 追加で既存 import が解決できなくなる                 | 中     | 低       | 既存 import path を `exports` の `default` 経路で残す         |
| `moduleResolution` 差異で IDE 補完と CI 結果が乖離             | 低     | 低       | tsconfig を bundler に統一し、CI と同じ解決ルールでローカル検証 |

---

## 8. 参照情報

### 関連ドキュメント

- `docs/30-workflows/04b-parallel-member-self-service-api-endpoints/outputs/phase-12/skill-feedback-report.md`
- `packages/shared/package.json`
- `apps/api/src/routes/me/schemas.ts`

---

## 9. 備考

### 苦戦箇所【記入必須】

| 項目     | 内容                                                                                                                                            |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 症状     | `MemberProfileZ` / `SessionUserZ` を import しようとしたとき、`@repo/shared` の `exports` field が `./zod/viewmodel` を subpath として公開していなかった |
| 原因     | 04b はスコープ的に `packages/shared` の API 整備に踏み込めず、`exports` field 修正が積み残された                                                 |
| 対応     | import path を一段調整して 04b 内で完結させ、subpath 正式公開は本タスクで補強する方針とした                                                     |
| 再発防止 | 新規 subpath を消費するタスクは事前に `packages/shared` 側 PR を分離し、import path 調整に振り回されないよう先行整備する                        |

### 補足事項

優先度は低（dx 改善）。06b / 07a / 07c が同じ zod を消費する前に解消しておくと、
import path の workaround が monorepo 全体に広がるのを防げる。
