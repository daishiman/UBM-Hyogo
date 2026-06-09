# Phase 11: 手動テスト — NON_VISUAL 証跡

> **[実装区分: 実装仕様書]** NON_VISUAL

## NON_VISUAL 宣言（WEEKGRD-03: 冒頭明示）

- **タスク種別**: env schema cleanup（同義 env キー二重化の解消 / 削除・rename リファクタリング）。
- **非視覚的である理由**: 本タスクは env キーの定義・accessor・wrangler config・consumer・spec からの旧 `PUBLIC_API_BASE_URL` 削除 / `NEXT_PUBLIC_API_BASE_URL` への rename のみで、**UI / UX の描画・レイアウト・色・導線を一切変更しない**。base URL 値・解決優先順位・transport 選択は不変（D-5）であり、画面上の見た目・挙動に差分が生じない。
- **screenshot**: **N/A**（理由 = レンダリング結果に変化がないため、視覚的差分を撮るべき対象が存在しない。OKLch トークン・コンポーネント・ルーティングは非変更）。
- **代替証跡**: Phase 10 final-review（AC-1〜AC-9 判定）+ 自動テスト結果（grep gate 0 件 + targeted vitest 全 green）。詳細は `manual-test-result.md`。

## 1. メタ情報

| 項目 | 内容 |
| ---- | ---- |
| Phase | 11（手動テスト） |
| visual_category | NON_VISUAL |
| 実地操作 | 不可（UI 変更なし） |
| screenshot | N/A（理由は上記宣言） |
| 出力 | 本 `phase-11.md` + `manual-test-result.md` |
| 段階 | implemented_local_evidence_captured（証跡は 本サイクル2026-06-08 実測 PASS） |

## 2. なぜ手動 UI テストを行わないか（判断根拠）

| 観点 | 判断 |
| ---- | ---- |
| 画面差分 | 無し（env キー名の内部変更のみ。fetch する base URL 値は同一） |
| ユーザー操作経路 | 不変（公開 members 一覧 / 詳細 / OG 画像生成の挙動は同じ URL を解決） |
| 検証適性 | 視覚比較より **grep gate（構造的単一化の証明）+ targeted vitest（挙動回帰の検出）** が適切 |

→ 視覚回帰テスト・手動ブラウザ操作は本タスクでは証跡価値を持たない。代わりに自動テスト + grep gate を主証跡とする。

## 3. 代替証跡の構成（手順）

| 証跡 | 内容 | 取得手段 | 参照 |
| ---- | ---- | -------- | ---- |
| 証跡 A | 旧キー repo 全体 0 件（単一化の構造的証明） | `grep -rn 'PUBLIC_API_BASE_URL' apps/ \| grep -v NEXT_PUBLIC_` | Phase 9 QG-1 |
| 証跡 B | getApiBaseEnv / ApiBaseEnv 0 件（削除完了） | `grep -rn 'getApiBaseEnv\|ApiBaseEnv' apps/` | Phase 9 QG-2 |
| 証跡 C | targeted vitest 全 green（base URL 解決 / transport 選択の非回帰） | Phase 1 §6 の 11 spec を targeted run | Phase 9 QG-6〜11 |
| 証跡 D | typecheck / lint exit 0（型結合非破壊） | web/og typecheck + web lint | Phase 9 QG-3〜5 |
| 証跡 E | AC-1〜AC-9 final-review 判定 | Phase 10 AC 判定テーブル | Phase 10 §2 |

## 4. 挙動不変の確認観点（自動テストで担保）

- `getBaseUrl()` / `getServiceBinding()` が `NEXT_PUBLIC_API_BASE_URL` 単独で同じ base URL を返す（public.spec / api/public.spec）。
- transport 選択（service binding 優先 → HTTP fallback）が回帰しない（public.spec の transport 系テスト）。
- apps/og の `fetchViaBaseUrl()` が rename 後も同じ URL を読む（og member-source.spec の fallback 経路テスト）。

## 5. 完了条件（PASS）

- [x] NON_VISUAL 宣言を冒頭に明示（済）
- [x] screenshot を作らない理由を記録（済）
- [x] 代替証跡 A〜E の取得手段を列挙（済）
- [x] `manual-test-result.md` に実測証跡を記録（実装後）

> 2026-06-08 本サイクル実装後に実測値を `manual-test-result.md` へ記録済み。

## 6. 参照資料

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 品質ゲート | 本 workflow `outputs/phase-9/phase-9.md` | QG-1〜11 |
| AC 判定 | 本 workflow `outputs/phase-10/phase-10.md` | AC-1〜AC-9 / blocker |
| env アクセス不変条件 | `CLAUDE.md`「apps/web env アクセス不変条件（task-02 wrangler-env-injection）」 | accessor 経由のみ / `process.env.*` 直接禁止 |
