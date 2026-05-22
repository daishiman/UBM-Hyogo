# Phase 2: 設計

[実装区分: ドキュメントのみ]
判定根拠: 章立て・シグネチャ・派生ルール正本転記計画のみ。コード変更なし。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-21-w2-screen-blueprints-admin |
| Phase 番号 | 2 / 13 |
| Phase 名称 | 設計 |
| Wave | W2 (parallel) |
| Mode | sequential / docs-only / NON_VISUAL |
| 作成日 | 2026-05-07 |
| 前 Phase | 1（要件定義） |
| 次 Phase | 3（テスト戦略） |
| 状態 | completed |

## 目的

Phase 1 で確定した AC-1〜9 を満たす `09g-screen-blueprints-admin.md` の章立て・各 § のシグネチャ・派生ルール正本転記計画を確定する。
本 Phase の出力は実装フェーズ（Phase 5〜8）が `09g` を逐次組み立てるための「テンプレ」と「構造 contract/派生ルールの転記マップ」である。

## 主要意思決定

- **決定 1**: 章立ては task-21 §0.7 に従い `1. AdminSidebar / 2. dashboard / 3. members / 4. tags / 5. meetings / 6. schema / 7. requests / 8. identity-conflicts / 9. audit / 99. 不採用` の 10 セクション固定。
- **決定 2**: §X (2〜9) は `X.1 prototype 由来 / X.2 コピー原文 / X.3 状態遷移 / X.4 API 表 / X.5 props/state / X.6 a11y / X.7 操作手順 / X.8 参照` の 8 サブセクション固定。
- **決定 3**: §1 AdminSidebar は `1.1 prototype 由来 / 1.2 nav 表 / 1.3 active state / 1.4 token / icon` の 4 サブセクション。
- **決定 4**: 未掲載 4 画面は §冒頭に `> 派生元: phase-3 §3 §5.x` 注記 + 派生ルール本文を 09g 内に正本転記。
- **決定 5**: a11y 共通文字列（`role="dialog"`, `aria-modal="true"`, focus trap, Esc close）は各画面 §X.6 で必須出現させ、grep gate（AC-7）で担保。

## 依存境界

| 種別 | 対象 | 引き取るもの | 渡すもの |
| --- | --- | --- | --- |
| 上流 | Phase 1 | AC-1〜9 / 5 論点 | 章立て・シグネチャ |
| 下流 | Phase 3 | 章立て / シグネチャ | grep gate / structure check 設計 |
| 下流 | Phase 5〜8 | 転記マップ | 実装手順 |

## 変更対象ファイル（C/R/M/D）

| 区分 | path | 用途 |
| --- | --- | --- |
| C | `outputs/phase-02/main.md` | Phase 2 主成果物 |
| C | `outputs/phase-02/section-signature.md` | §1〜§99 シグネチャテンプレ |
| C | `outputs/phase-02/transcription-map.md` | JSX 行範囲 ↔ §X 対応 + 派生ルール ↔ §X 対応 |

## 章構成 / シグネチャ

### §1 AdminSidebar

```
## 1. AdminSidebar (全画面共通)
### 1.1 prototype 由来
（pages-admin.jsx AdminLayout 内 sidebar JSX を構造 contract 転記）
### 1.2 nav 項目（8 行表）
| order | label | route | icon |
### 1.3 active state
（aria-current="page" / focus-visible ring を token 経由で）
### 1.4 token / icon 参照
（primitive: 09c §9 / icon: 09d §X / token: 09b §X）
```

### §X (2〜9) 共通テンプレ

```
## X. /(admin)/admin/<route>
> Sidebar は §1 を参照（本 § では再記述しない）
> 派生元: phase-3 §3 §5.x（未掲載画面のみ）

### X.1 prototype 由来 / 派生ルール
### X.2 コピー原文（一字一句）
### X.3 状態遷移（mermaid stateDiagram-v2）
### X.4 API 表（phase-3 §2 完全一致）
### X.5 props / state
### X.6 a11y
### X.7 操作手順
### X.8 参照（09c / 09b / 09d / 09a）
```

### §99 不採用

```
## 99. 不採用要素
| 要素 | 理由 |
| TweaksPanel | EDITMODE 専用 |
| theme switcher | dark mode MVP 非対応 |
| data-theme="warm"/"cool" | 同上 |
```

## 転記マップ（JSX 行範囲 ↔ §X）

| § | 対応元 | 行範囲 / 派生 |
| --- | --- | --- |
| §1 | pages-admin.jsx AdminLayout sidebar | 該当 JSX block |
| §2 dashboard | AdminDashboardPage | L4-L161 |
| §3 members | AdminMembersPage | L162-L368 |
| §4 tags | AdminTagsPage | L369-L507 |
| §5 meetings | phase-3 §3 §5.4 admin CRUD | DataTable + Form Modal |
| §6 schema | SchemaDiffPage | L508-L657 |
| §7 requests | phase-3 §3 §5.3 admin queue | 左 list + 右 detail + approve/reject |
| §8 identity-conflicts | phase-3 §3 §5.6 admin compare | 2-column compare + resolve |
| §9 audit | phase-3 §3 §5.7 admin timeline | TimelineList + AuditFilterBar |

## API 接続表（phase-3 §2 から §X.4 へ転記）

| § | method | endpoint |
| --- | --- | --- |
| §2 | GET | /admin/kpi |
| §3 | GET / PATCH | /admin/members[/:id] |
| §4 | GET / POST | /admin/tags + /admin/tags/:id/{approve,reject} |
| §5 | GET / POST | /admin/meetings |
| §6 | GET / POST | /admin/schema/diff + /admin/schema/apply |
| §7 | GET / POST | /admin/requests + /admin/requests/:id/{approve,reject} |
| §8 | GET / POST | /admin/identity-conflicts + /:id/resolve |
| §9 | GET | /admin/audit |

## 実行タスク

- 本 Phase の目的に対応する文書作成・検証・記録を実行する。
- 実行結果は `outputs/phase-N/` 配下へ保存し、root `artifacts.json` の該当 Phase status と整合させる。
- docs-only / NON_VISUAL のため、`apps/` / `packages/` の実装コードは本 Phase では変更しない。

## 統合テスト連携

N/A。pure docs-only / NON_VISUAL workflow のため、実装統合テストは発生しない。代替として本 Phase の grep / diff / lint / file-existence evidence を Phase 11 と Phase 12 compliance check に連携する。

## 成果物

- 本 Phase の `outputs/phase-N/main.md` または同等の phase evidence。
- 必要に応じた補助ログ・差分・チェック結果。
- root `artifacts.json` の phase status 更新。

## 入力 / 出力

- 入力: Phase 1 outputs（AC-1〜9 / 論点 / 4 条件）、pages-admin.jsx、phase-3 §2/§3/§5.3〜§5.7
- 出力: `outputs/phase-02/main.md` + `section-signature.md` + `transcription-map.md`

## テスト方針

（Phase 3 で具体化。本 Phase では設計成果物の自己整合のみ確認）
- 章立てが AC-3（10 セクション）と一致
- §X 8 サブセクションが AC-4（合計 64）と一致
- 転記マップの API 行数が AC-6（10 endpoint）と一致

## 実行コマンド

```bash
mkdir -p docs/30-workflows/task-21-w2-screen-blueprints-admin/outputs/phase-02
# プロトタイプ JSX 行範囲確認
sed -n '4,161p' docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx | head -20
sed -n '162,368p' docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx | head -20
```

## DoD

- [ ] 章立て 10 セクション固定済み
- [ ] §X 8 サブセクションテンプレ確定
- [ ] 転記マップ（§↔ JSX 行 / 派生ルール）完成
- [ ] API 接続表（10 endpoint）一覧化
- [ ] §99 不採用 3 件確定

## 完了条件チェック

- [ ] outputs/phase-02/main.md 配置
- [ ] section-signature.md / transcription-map.md 配置
- [ ] artifacts.json の phase 2 を completed
- [ ] 次 Phase 引き継ぎ事項記述

## 参照資料

- task-21 §4.1〜§4.6（章立て + 派生ルール）
- pages-admin.jsx（L1-L658）
- phase-3 §2 / §3 / §5.3〜§5.7

## 実行手順

### ステップ 1: 章立て確定
task-21 §0.7 / §4.1 に従い 10 セクション固定。

### ステップ 2: §X テンプレ確定
8 サブセクション構成を section-signature.md に記述。

### ステップ 3: 転記マップ作成
JSX 行範囲（L4-L161 等）と派生ルール（phase-3 §5.x）を § ごとに対応付け。

### ステップ 4: API 接続表転記
phase-3 §2 の 10 endpoint を §X.4 の正本として転記マップに含める。

## 次 Phase

- 次: Phase 3（テスト戦略）
- 引き継ぎ: 章立て / §X 8 サブセクションテンプレ / 転記マップ / API 接続表
- ブロック条件: section-signature.md 未完なら Phase 3 不可。
