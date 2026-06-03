# Phase 3 — 設計レビュー

> **実装区分: 実装仕様書** — 新規 Playwright spec 1 ファイルのコード追加を伴う（CONST_004）。

Phase 2 設計を 4 観点（価値性 / 実現性 / 整合性 / 運用性）で評価し、Phase 4 へ進める判定を行う。

---

## 3.1 価値性（なぜ作るに値するか）

- bulk tag picker は不変条件 #13 の「第3経路」であり、現状 visual 証跡が local fixture（`page.setContent()`）のみ。実機 `/admin/members` 到達の baseline が欠落しており、staging 上の実レイアウト崩れ（トークン適用・grid・sticky 配置）を検知できない。
- 本 spec により assign / unassign 2 状態が **認証付き実機**で baseline 化され、CI の `playwright-staging-visual-authenticated.yml` で回帰検知できるようになる。
- 手動 user-gated screenshot から自動 CI 化への移行であり、恒久的な保守コスト削減。

→ **価値あり**。

---

## 3.2 実現性（現行コードで作れるか）

- 必要なセレクタ（region / group / checkbox / row testid）はすべて landed 済みコードに実在（Phase 2 §2.3 で実コード行番号付きで確定）。
- 認証基盤・project 登録・snapshot 名前空間も既存（`playwright.config.ts:368-388`）。config 編集不要。
- 参照モデル（`admin-dashboard-authenticated.spec.ts`）が `test.use({ storageState })` + `goto` + `addStyleTag` + `toHaveScreenshot` の完成パターンを提供。
- 唯一の不確実性は staging データ（member ≥ 2 / tag ≥ 1）。前提 assert で明示 fail させる設計（Phase 2 §2.7）でカバー。

→ **実現可能**。

---

## 3.3 整合性（既存資産・不変条件との矛盾なし）

| 確認項目 | 結果 |
| --- | --- |
| issue-901 authenticated 基盤との整合 | ✅ 同一 project / 同一 storageState / 同一 snapshot 名前空間。`admin-dashboard-authenticated.spec.ts` と並列で同居可能。 |
| 不変条件 #5（D1 直接アクセス禁止） | ✅ spec は UI 経由のみ。 |
| 不変条件 #2（OKLch トークン） | ✅ HEX 直書きなし。spec にスタイル定義なし。 |
| AC-6 mutation ゼロ | ✅ apply は disabled / 非 click（§2.6）。 |
| AC-7 ソース不変 | ✅ apps/api・apps/web `src` 非接触。テストコード追加のみ。 |
| local fixture spec との baseline 衝突 | ✅ project / testDir / 名前空間が分離（§2.5）。 |

→ **矛盾なし**。

---

## 3.4 運用性（保守・実行・失敗時対応）

- baseline 生成は `--update-snapshots` で初回 mint、以降は比較。`maxDiffPixelRatio: 0.05` で軽微なレンダ差を吸収。
- 失敗時は CI が diff 画像を artifact 出力（既存 authenticated project 設定に準拠）。
- staging データ変動リスク → read-only ゆえ mutation 副作用なし。レイアウト差は `--update-snapshots` 再生成で解消。
- `retries: 2`（project 設定）でネットワーク揺らぎを吸収。

→ **運用上問題なし**。

---

## 3.5 リスク評価

| リスク | 深刻度 | 緩和策 |
| --- | --- | --- |
| staging データ可変性（member/tag 数変動） | 低 | read-only。前提未達は明示 fail。baseline は再生成可能。 |
| 誤って apply を click し mutation 発火 | 中→低 | apply は `selectedTagIds.size===0` で disabled。tag pill を選択しない設計で構造的に発火不能。 |
| baseline 名前空間 drift | 低 | project snapshotPathTemplate により local fixture と物理分離。 |
| 認証 storageState 失効 | 低 | setup project が毎回 mint。dependency 未充足なら本 spec はスキップ。 |

---

## 3.6 判定

**GO** — Phase 4（テスト計画）へ進む。

価値性・実現性・整合性・運用性すべて充足。リスクはいずれも低〜中で緩和策あり。設計変更を要する論点なし。
