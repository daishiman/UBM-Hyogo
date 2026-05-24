# serial-06 followup-003 — Phase 6 spec ↔ 実装 Playwright topology の sync

## メタ情報

```yaml
issue_number: TBD
```

| 項目         | 内容                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------ |
| タスクID     | serial-06-followup-003-phase-6-playwright-topology-sync                                    |
| タスク名     | Phase 6 test-strategy spec を実装 topology（playwright/tests + mockApi fixture）に同期    |
| 分類         | ドキュメント整合                                                                           |
| 対象機能     | serial-06 Phase 6 仕様書 / 関連 spec                                                       |
| 優先度       | 中                                                                                         |
| 見積もり規模 | 小規模                                                                                     |
| ステータス   | 未実施                                                                                     |
| 発見元       | serial-06 Phase 12 implementation-guide §「Phase 6 §3 Playwright visual spec の配置」    |
| 発見日       | 2026-05-23                                                                                 |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

serial-06 Phase 6 spec は `apps/web/tests/e2e/public-member-detail.spec.ts` と `page.route` mock 戦略を前提に書かれていたが、実装時に以下 2 点で乖離が発覚:

- 本リポジトリの Playwright `testDir` は `apps/web/playwright/tests`（`apps/web/tests/e2e` ではない）
- Next.js Server Component の `fetch` は Node ランタイムで実行されるため `page.route` で intercept できない（page.route はブラウザ初期化リクエストのみ対象）

実装は `apps/web/playwright/fixtures/auth.ts` の in-process `mockApi` fixture を使う形に変更し、`outputs/phase-12/implementation-guide.md` 末尾で判断記録を残したが、**Phase 6 仕様書本体は更新されていない**。

### 1.2 問題点・課題

- spec と実装で Playwright topology が drift しており、後続レビュー / 引き継ぎで「どちらが正本か」判断コストが発生
- 「SSR fetch は page.route で intercept できない」という重要な制約が Phase 6 spec に反映されていない
- 同種ミスが他 sub-workflow（serial-07 / parallel-*）の test 設計で再発する余地が残る

### 1.3 放置した場合の影響

- 別 sub-workflow の Phase 6 spec 起草時に同じ誤った前提（`tests/e2e/` + `page.route`）が踏襲される
- serial-07 regression-evidence の baseline 設計時に再度同じ制約に直面する

---

## 2. 何を達成するか（What）

### 2.1 目的

serial-06 Phase 6 仕様書本体を実装 topology に合わせて backfill し、SSR fetch intercept 制約を明文化する。

### 2.2 最終ゴール

- `serial-06-form-response-binding/phase-06-test-strategy.md` 内の Playwright spec ファイルパス記述が `apps/web/playwright/tests/serial-06-member-detail.spec.ts` に統一
- 「SSR fetch は page.route で intercept できない / mockApi fixture を使う」の制約が Phase 6 spec §3 に追記される
- Phase 6 spec の前提を踏まえた共通 pattern が `.claude/skills/task-specification-creator/references/` の patterns 系 reference に追記される

### 2.3 スコープ

#### 含むもの

- Phase 6 spec 本体の path 整合 backfill
- SSR fetch intercept 制約の note 追加
- patterns reference への lessons-learned 反映

#### 含まないもの

- Playwright 設定（`playwright.config.ts`）の変更
- 既存 `playwright/fixtures/auth.ts` の API 変更
- serial-07 spec の同等修正（serial-07 側 sub-task として別途切り出す）

### 2.4 成果物

- `docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/phase-06-test-strategy.md` 差分
- `.claude/skills/task-specification-creator/references/patterns-*.md` への lessons-learned 追記
- backfill 後の compliance check（Phase 12 strict 7 / canonical heading SSOT との整合）

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- serial-06 implementation merge 済み
- Phase 12 compliance check が canonical 9 headings を満たす

### 3.2 依存タスク

- serial-06 merge 必須
- `.claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md` の更新権限

### 3.3 必要な知識

- Next.js App Router の Server Component fetch ランタイム
- Playwright `page.route` の intercept scope（browser context のみ）
- mockApi fixture pattern（`apps/web/playwright/fixtures/auth.ts`）
- task-specification-creator skill の Phase 6 template

### 3.4 推奨アプローチ

- Phase 6 spec §3 を「実装 topology」と「制約」の 2 ブロックに再構成し、判断記録を本体に昇格させる
- patterns reference は「pitfall: Server Component fetch + page.route」を 1 項目として追記

---

## 4. 実行手順

### Phase構成

1. drift 箇所の全件抽出（grep）
2. Phase 6 spec backfill
3. patterns reference への昇格
4. compliance check 再実行

### Phase 1: drift 抽出

```bash
grep -nR "tests/e2e/public-member-detail" docs/30-workflows/ui-prototype-design-system-foundation/
grep -nR "page.route" docs/30-workflows/ui-prototype-design-system-foundation/serial-06-form-response-binding/
```

### Phase 2: Phase 6 spec backfill

- 全 path を `apps/web/playwright/tests/serial-06-member-detail.spec.ts` に置換
- §3 末尾に「SSR fetch intercept 制約 + mockApi fixture 採用理由」を追記

### Phase 3: patterns reference

`.claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md` に:
- 「Server Component fetch は page.route で intercept できない」
- 「Playwright testDir は本リポジトリで `apps/web/playwright/tests`」
を 2 行 entry で追加

### Phase 4: compliance check

- `bash scripts/verify-pr-ready.sh` の `verify:phase12-compliance` を実行
- canonical 9 headings drift が無いことを確認

---

## 5. 苦戦箇所メモ

- **`page.route` の intercept scope の盲点**: Phase 6 起草時点では「Playwright = E2E = fetch 全部 intercept できる」というメンタルモデルだったが、SSR fetch は Node 側で起きるため `page.route` の対象外。実装フェーズで初めて気づき、`mockApi` fixture に切り替えた。spec 段階で「fetch がどの runtime で起きるか」を Phase 2 architecture と紐づけて確認するのが正解。
- **`apps/web/tests/e2e/` vs `apps/web/playwright/tests/`**: 過去の workflow と現在の workflow で testDir が異なる時期があり、spec template が古い path を引きずっている。task-specification-creator の Phase 6 template に「現在の `testDir` を最初に grep する」ステップを追加すると再発が防げる。

---

## 6. 完了条件

- [ ] Phase 6 spec 内の path が全て `apps/web/playwright/tests/...` に統一
- [ ] §3 に SSR fetch intercept 制約 note 追記
- [ ] patterns-lessons-and-pitfalls.md に 2 entry 追加
- [ ] `verify:phase12-compliance` pass
