# Phase 08: DRY 化 / Before-After

## サマリ

旧 160 行を新 396 行へ書き換えた結果、行数は増えたが、以下の DRY 化観点で重複情報を削減し、後続 task の参照点を一意化した。

## Before / After

| 観点 | Before（旧 160 行） | After（新 396 行） |
| --- | --- | --- |
| 章数 | 8 | 10 |
| 視覚詳細記述 | 散在（HEX/oklch/px/`bg-[`） | 0 件（grep gate で確認） |
| routes 軸の網羅 | 部分的（レイヤ別 UX） | 19 routes + global-error fallback = 20 件統一 |
| primitives 列挙 | 部分（§7.1 のみ） | 13 種すべて 8 列で統一記述 |
| a11y 規範 | §3〜§6 に散在 | §5 独立章（5.1 共通 / 5.2 dialog / 5.3 form / 5.4 live region） |
| token 値 | 一部 HEX 直書き | 0 件（§6.3 prefix 名のみ） |
| login 5 状態 | grep 不可 | §4.2 で 1 件 grep 取得可能 |
| 不採用 | §8 部分 | §4.5 + §8（gas-prototype / tweaks / photo store / data-theme 4 項目） |
| 改訂履歴 | なし | §10 新規 |

## 重複削減の核心

### 1. 視覚詳細の物理分離

旧 §3〜§6（レイヤ別 UX / 一覧 UX / 詳細 UX / 管理 UX）に散在していた視覚詳細記述を **削除**し、§2 / §3 の「視覚詳細 link」列で 09a への path 1 行に集約。

→ 旧仕様で「Hero の構成順序」「密度切替値」「KPI 文言」を契約と視覚詳細の両方で書く重複が消えた。

### 2. token 値の一元化

旧 §3〜§6 に散在した HEX / oklch / px 値を **すべて削除**し、§6.3 prefix 名 8 種への参照のみに統一。値の正本は 09b（task-08）に一元化。

→ token 値変更時の同期事故ゼロ。

### 3. routes 軸の統一 10 列

旧仕様では routes ごとに記述粒度が不揃いだったが、新 §2 では全 20 routes を **同じ 10 列**（認可 / layout / 主 component / API / 状態 / 主 props / a11y / token / 視覚詳細 link / 不採用）で記述。

→ grep `^### 2\.` で 20 件、各 routes が一意に参照可能。

### 4. a11y の独立章昇格

旧仕様で各 routes / component の説明文に散らばっていた a11y 注記を §5 に集約。dialog drawer / form / live region の正本見出しを §5.2 / §5.3 / §5.4 で確定。

### 5. 用語集の追加

zone / gate-state / visibility-request / identity-conflict / pending banner を §9 用語集に集約し、各 routes の説明で重複定義を回避。

## 行数増の正当化

旧 160 行 → 新 396 行（+236 行 / 2.5 倍）の増加要因:

1. 19 routes + global-error fallback の **網羅** 表記（旧は部分記述）
2. primitives 13 種の **統一 8 列表** 記述（旧は §7.1 部分のみ）
3. a11y 4 区分（共通 / dialog / form / live region）の **独立章**化
4. token prefix 8 種の **明示**
5. prototype 由来 19 行 mapping 表 + 不採用 4 項目表
6. 09a..09h index 表 + 用語集 + 改訂履歴

増加分はすべて **網羅性 + 一意性 + 機械検証可能性** の獲得に充てており、視覚詳細値のような重複・冗長は 0 件（grep gate で実証）。

## サブタスク完了状態

| # | サブタスク | 状態 |
| --- | --- | :---: |
| 1 | Before/After 比較表 | completed |
| 2 | DRY 化観点 5 件記述 | completed |
| 3 | 行数増の正当化 | completed |
| 4 | grep gate 0 件証跡参照 | completed |

## 次 Phase

Phase 9（品質保証）へ。
