# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

> 目的: Phase 4 進行可否（GO / NO-GO）を判定する。Phase 1-2 成果物の整合性 / リスク / 不変条件遵守をチェックリスト方式で確認する。

---

## 1. レビュー観点と判定

| # | 観点 | 確認内容 | 判定 |
|---|------|---------|------|
| R-01 | スコープ整合 | Phase 1 §2 in-scope と §4 インベントリが対応している | GO 条件: 新規 20 件 + 修正 6 件の列挙が DoD G-01〜G-12 を満たすこと |
| R-02 | 依存準備 | task-09 (tokens) / task-10 (primitives) / task-13 (auth) が完了済み | GO 条件: Phase 1 §1.1 確認コマンドが全て success |
| R-03 | API 不変条件 | `apps/api/src/routes/admin/` に追加・変更なし | GO 条件: Phase 2 §4 で client は既存 endpoint のみ呼ぶ |
| R-04 | OKLch tokens 専用 | HEX 直書きが Phase 2 設計のコード断片に存在しない | GO 条件: 全 component で `bg-[var(--ubm-color-*)]` 形式 |
| R-05 | state ownership | Phase 2 §3 で全 state の所有者と更新経路が明示 | GO 条件: 5 state すべて owner / trigger / consumer 記載 |
| R-06 | a11y 契約 | Phase 2 §5.2 で table / dialog / region / img の role 必須項目が明示 | GO 条件: 6 コンポーネントで a11y 要件記載 |
| R-07 | wave 分割と layout merge gate | Phase 2 §7 で task-16/17 着手 gate が明示 | GO 条件: layout merge 順序が確定 |
| R-08 | エラーハンドリング | Phase 2 §8 で想定エラー 6 件に対処方針 | GO 条件: 6 パターン全てに対応策あり |
| R-09 | セキュリティ | requireAdmin / PII masking / CSRF が Phase 2 §9 に明示 | GO 条件: 4 項目全て言及 |
| R-10 | テスト方針 | vitest 5 ファイルが Phase 1 §4.1 に列挙され、Phase 4 で TDD Red 着手可能 | GO 条件: テストファイル列挙完了 |

---

## 2. リスク再評価

| リスク | 緩和状況 | 残リスク |
|-------|---------|---------|
| task-16/17 並行開発で `(admin)/layout.tsx` merge conflict | Phase 2 §7 で W5 gate 明示、§0.10 で task-16/17 着手保留ルール明記 | 低（運用ルール遵守次第） |
| `/admin/dashboard` API が `byZone`/`byStatus` 未提供 | Phase 2 §4.3 で UI 側 optional schema + placeholder で吸収 | 低（未タスク化候補に登録予定） |
| Drawer の focus trap 不在 | task-10 Drawer primitive 仕様に依存 | 中: Phase 5 着手時に primitive の focus trap 動作確認、不在なら最小実装追加 |
| OpenNext Workers bundle 失敗 | Phase 9 で `next build --webpack` を必須コマンド化 | 低 |
| renderer から node-only import (FB-W1-02b-4) | Phase 2 §6 で recharts 不採用、自前 SVG 採用 | 低 |
| Phase 11 screenshot mode 設定漏れ (FB-W1-02b-1) | UI task は VISUAL デフォルト、Phase 11 で `screenshot-plan.json` を `mode: "VISUAL"` で生成 | 低 |

---

## 3. 不変条件遵守確認（CLAUDE.md + 元仕様 §0.5）

- [x] D1 直アクセスなし（Server Component は `fetchAdmin<T>()`、Client mutation は `/api/admin/*` proxy helper のみ）
- [x] OKLch tokens 専用
- [x] consent キー `publicConsent` / `rulesConsent` 別名禁止（drawer answers 表示時に確認）
- [x] `responseEmail` は system field（drawer identity ブロックで分離）
- [x] GAS prototype を import しない
- [x] members detail drawer の answers は read-only
- [x] 新 admin endpoint なし

---

## 4. Phase 3 GO/NO-GO 判定

**判定: GO**（Phase 4 進行可）

**前提**: Phase 1 §1.1 前提確認コマンドが Phase 4 着手時に再実行され全て success であること。

**条件付き事項**:
- task-10 Drawer primitive に focus trap が無い場合、Phase 5 で最小実装を追加（仕様書 Phase 5 §2 タスク表に明記）

---

## 5. 完了条件

- [ ] §1 R-01〜R-10 全て GO
- [ ] §2 残リスクの mitigation が Phase 5/6 で対処可能
- [ ] §3 不変条件遵守確認完了
- [ ] `outputs/phase-03/review-result.md` 生成

## 成果物

- `outputs/phase-03/review-result.md`（GO/NO-GO 判定 + 残リスク + 条件付き事項）
- 実行後に `artifacts.json` の `phase03.status` を `completed` へ更新（仕様書作成時点は `spec_created`）
