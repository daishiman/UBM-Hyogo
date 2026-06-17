# admin-attendance-dashboard-jp-clarity-and-ux — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-jp-clarity-and-ux |
| ディレクトリ | docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux |
| 作成日 | 2026-06-11 |
| 実行種別 | serial（単一 workflow / 1 サイクル完了） |
| 担当 | web (apps/web 表現層) |
| 状態 | implemented_local_visual_present_staging_pending（apps/web 実装・focused 検証済み。6 canonical screenshot は admin 認証 gate 配下・Playwright staging 専用のためlocal fixture で取得済み。authenticated staging capture / commit / PR は user-gated） |
| タスク種別 | implementation |
| 実装区分 | **[実装区分: 実装仕様書]**（VISUAL / コード変更を伴う・CONST_004 デフォルト。判定根拠は _shared-context.md §0） |
| 関連 issue | なし（staging スクリーンショット観察起点・relatedIssue=null） |

## 目的

管理画面の出席ダッシュボード `/(admin)/admin/dashboard/attendance` で、**英語表記（PRIMARY / TREND / DETAIL / ADMIN / DASHBOARD / TOP10 / 3M / 6M / 1Y / CSV）とエンジニア寄りの日本語専門語（セッション / トレンド / ユニーク出席率 / 区画 / KPI / pt）を、非エンジニアの会員・管理者が直感的に読める平易な日本語へ統一**する。あわせて見にくい箇所（要フォロー対象の行・長い文言のはみ出し）を軽微に整える。**API / D1 / Google Form schema / `packages/shared` 型は一切変更せず、`apps/web` 表現層（文言の置換 + 軽微な `globals.css` 調整 + 既存テスト追従）のみで達成する。** 3 ゾーン（全体の状況 / 出席の移り変わり / くわしい一覧）の骨格は維持する。

## ユーザー確定事項（AskUserQuestion・全て推奨案）

| Q | 決定 |
| --- | --- |
| Q1 英語見出しの扱い | **完全に日本語へ置換**（英語は残さない） |
| Q2「セッション」 | **「開催回」へ統一** |
| Q3 UI/UX 改善範囲 | **ラベル平易化 ＋ 見やすさ微調整**（新規 primitive は作らない・レイアウト大規模再設計はしない） |
| Q4「CSVエクスポート」 | **「表計算ファイルで書き出す」へ** |

> 用語リネームの逐語正本表は [_shared-context.md](./_shared-context.md) §2（R-01〜R-10 / S-01〜S-10 / J-01〜J-12 / U-01〜U-03）。全 Phase はこの表を正とする。

## スコープ

### 含む
- 英語表記の日本語化（§2-A R-01〜R-10）
- 「セッション」→「開催回」統一（§2-B S-01〜S-10）
- その他エンジニア専門語の平易化（§2-C J-01〜J-12）
- 見やすさ微調整（§2-D U-01〜U-03・新規 primitive なし）
- 既存テスト/Playwright の After 文言追従（§3 T-01〜T-06）＋ 回帰テスト追加
- 軽微な `globals.css` リズム調整（はみ出し回避・必要時のみ）

### 含まない
- 3 ゾーン構造の作り替え・カード配置の大規模変更・チャート表現の刷新（Q3 は「微調整」）
- API endpoint / D1 schema / Google Form schema / `packages/shared` 型の変更（diff ゼロ）
- 新規 UI primitive / 新規 component の追加
- 既に平易な日本語の文言（`MemberAttendanceTable` / `AttendanceTop10Ranking` / `AttendanceDrilldownModal` / `ZONE_LABEL`）

## 受入条件 (AC)

[_shared-context.md](./_shared-context.md) §5 の AC-1〜AC-10 を正本とする。

| AC | 要旨 |
| --- | --- |
| AC-1 | 英語表記（§2-A）が全て日本語へ置換され画面に英語が残らない（grep 0 件） |
| AC-2 | 「セッション」（§2-B）が全て「開催回」系へ置換（grep 0 件） |
| AC-3 | エンジニア専門語（§2-C: トレンド/ユニーク/KPI/区画/帯/pt）が平易日本語へ置換 |
| AC-4 | 見やすさ微調整（§2-D）が反映・DOM 構造/testid/href は不変 |
| AC-5 | 全色 OKLch トークン経由・HEX 0 件・新規 token 0（`verify-design-tokens` pass） |
| AC-6 | 新規 primitive / component 追加ゼロ |
| AC-7 | API/D1/Form/shared 型 変更ゼロ（`git diff -- apps/api packages/shared` 空） |
| AC-8 | testid/`data-*`/`href`/`role`/`aria-*` の構造保持（aria-label の文言変更は意図的・属性キーは維持） |
| AC-9 | 既存テスト（T-01〜T-06）が After 文言へ追従し focused vitest PASS・回帰テスト追加 |
| AC-10 | 既存全機能が挙動不変（フィルタ/書き出し/modal/テーブル/degrade） |

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | ui-prototype-alignment-mvp-recovery（design tokens / primitives 正本） | 色トークン・primitive を再利用する前提 |
| 上流 | admin-attendance-dashboard-ux（CSS 復旧・landed） | `.attendance-*` CSS 実体の前提 |
| 上流 | completed-tasks/admin-attendance-dashboard-ux-hierarchy-refine（3 ゾーン階層化・landed） | PRIMARY/TREND/DETAIL 3 ゾーン構造の前提 |
| 参照 | 既存 attendance API（6 endpoint） | データ供給元（変更しない） |
| 下流 | なし（本タスクは表現層に閉じる） | — |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/admin-attendance-dashboard-jp-clarity-and-ux/_shared-context.md | 調査結果・方針・用語リネーム正本表・AC の集約正本 |
| 必須 | apps/web/src/styles/tokens.css | OKLch トークン正本 |
| 必須 | docs/00-getting-started-manual/specs/09b-design-tokens.md | トークン値正本・HEX 禁止ルール |
| 参考 | docs/00-getting-started-manual/claude-design-prototype/ | デザイン言語（primitives + rhythm）正本 |
| 参考 | docs/30-workflows/completed-tasks/admin-attendance-dashboard-ux-hierarchy-refine/ | 直前タスク（3 ゾーン化）の構造・テンプレ |

## システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| UI/UX | `.claude/skills/aiworkflow-requirements/references/ui-ux-*.md` | UI/UX 設計指針・文言/ラベル方針 |
| アーキテクチャ | `.claude/skills/aiworkflow-requirements/references/architecture-*.md` | apps/web / apps/api 境界 |
| API | `.claude/skills/aiworkflow-requirements/references/api-*.md` | endpoint surface（参照のみ） |

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/{main,rename-map}.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/{main,change-map}.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/{main,alternatives}.md |
| 4 | テスト作成 | phase-04.md | completed | outputs/phase-04/{main,test-plan}.md |
| 5 | 実装 | phase-05.md | completed | outputs/phase-05/{main,runbook}.md |
| 6 | テスト拡充 | phase-06.md | completed | outputs/phase-06/{main,regression-cases}.md |
| 7 | カバレッジ確認 | phase-07.md | completed | outputs/phase-07/{main,ac-matrix}.md |
| 8 | リファクタリング | phase-08.md | completed | outputs/phase-08/{main,before-after}.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/{main,token-audit}.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/{main,go-no-go}.md |
| 11 | 手動テスト | phase-11.md | completed | outputs/phase-11/{main,manual-test-result,screenshot-plan.json,phase11-capture-metadata.json,ui-sanity-visual-review} |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/* 7 種 |
| 13 | PR 作成 | phase-13.md | pending_user_approval | outputs/phase-13/* 4 種 |

## 触れる不変条件

| # | 不変条件 | このタスクでの扱い |
| --- | --- | --- |
| 5 | apps/web から D1 直接アクセス禁止 | `safeServerFetch` 経由のまま。D1 binding 不使用 |
| ui-prototype #1 | 既存 API のみ接続・新 endpoint/D1/Form 変更禁止 | AC-7 で保証 |
| ui-prototype #2 | OKLch トークン正本化・HEX 禁止 | AC-5 で保証（`verify-design-tokens` gate） |
| ui-prototype #3 | プロトタイプ primitives 正本・新規 primitive 禁止 | AC-6 で保証（文言と軽微 CSS のみ） |

## 完了判定

- Phase 1〜12 completed / Phase 13 pending_user_approval の状態が artifacts.json と一致する
- AC-1〜AC-10 が Phase 7（AC マトリクス）/ Phase 10（最終レビュー）で完全トレースされる
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- 用語リネーム正本表（_shared-context.md §2）が全 Phase に trace されている
- commit・PR・staging capture は**ユーザー明示承認なしでは実行しない**（apps/web 実装とローカル検証は本サイクルで完了）

## 関連リンク

- 共有コンテキスト: ./_shared-context.md
- メタ: ./artifacts.json / ./outputs/artifacts.json
