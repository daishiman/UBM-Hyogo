# Implementation Guide

## Part 1: 中学生レベル

なぜ必要かというと、あとから作業する人が画面の数や守るルールで迷わないようにするためです。このタスクは、サイトに作る画面の一覧表を先に作る作業です。学校行事で、最初に「どの教室で何をするか」を一覧にしておくのと同じです。先に一覧がないと、あとから準備する人が別々の数を覚えてしまい、必要な部屋が足りなくなります。

今回決めたことは3つです。画面は19個作ること、今ある入口だけを使うこと、色の決め方を同じにすることです。これを `CLAUDE.md`、概要資料、`SCOPE.md` に書いたので、次の作業をする人は迷わず同じ表を見られます。

### 今回作ったもの

- 画面19個の一覧表
- 画面が使う入口の対応表
- 色と部品の守り方

| 言葉 | やさしい言い換え |
| --- | --- |
| route | サイトの中の行き先 |
| API | 画面がデータを受け取る入口 |
| D1 | データをしまう箱 |
| OKLch | 色を同じ見え方にそろえる決め方 |
| adapter | 受け取った形を画面用に並べ替える係 |

## Part 2: 技術者レベル

### TypeScript の型定義

```ts
type Layer = "公開" | "会員" | "管理" | "共通";

interface ScopeRouteRow {
  layer: Layer;
  route: string;
  prototypeCoverage: "有" | "部分" | "無";
  designPolicy: string;
}

interface ApiMappingRow {
  screenGroup: string;
  endpoints: string[];
}
```

### Interface Equivalent

`SCOPE.md` §1 は `| 層 | route | プロトタイプ掲載 | 設計指針 |` の4列で 19 routes を固定する。`SCOPE.md` §2 は `| 画面群 | 主要 endpoint |` の2列で既存 API surface への接続を固定する。

### APIシグネチャ

本タスクで API endpoint は追加しない。接続可能な endpoint surface は `SCOPE.md` §2 に列挙した `GET /public/*`、`POST /auth/magic-link`、`GET /me`、`GET /admin/*` などの既存 route に限定する。

```ts
function resolveScopeRouteRows(): ScopeRouteRow[];
function resolveApiMappingRows(): ApiMappingRow[];
```

### 使用例

後続 task-02..22 は、各仕様書の自己完結コンテキストまたは参照資料に `../SCOPE.md` を置き、19 routes / API mapping / 不変条件をこの scope gate から引く。

```bash
grep -n "## 1. 全画面実装スコープ" docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md
grep -cE "^\| (公開|会員|管理|共通) \|" docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md
```

### エラーハンドリング

- `SCOPE.md` が存在しない場合、W2 以降は起動しない。
- 19 routes の数が 6 + 2 + 8 + 3 と一致しない場合、Phase 11 に差し戻す。
- API shape が UI 期待と乖離する場合、API を変更せず web adapter で吸収する。

### エッジケース

- 管理画面の一部が prototype に未掲載でも、新 primitive は増やさず既存 primitive の組み合わせで設計する。
- Google Form の register 導線は外部 redirect とし、新 endpoint を追加しない。
- 古い downstream 導線は task-02..22 に補正する。

### 設定項目と定数一覧

| key | value |
| --- | --- |
| `taskType` | `docs-only` |
| `visualEvidence` | `NON_VISUAL` |
| `workflow_state` | `spec_created` |
| route count | 19 |

### テスト構成

| 検証 | コマンド |
| --- | --- |
| route count | `grep -cE "^\| (公開|会員|管理|共通) \|" docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` |
| CLAUDE anchor | `grep -n "ui-prototype-alignment-mvp-recovery" CLAUDE.md` |
| overview anchor | `grep -n "19 routes" docs/00-getting-started-manual/specs/00-overview.md` |

## 目的

Phase 12 Task 12-1 として、docs-only scope gate の実装意図と後続利用方法を説明する。

## 実行タスク

- Part 1 / Part 2 を作成した。
- docs-only 代替として表 schema / anchor / usage / error handling / parameters を記録した。

## 参照資料

| 参照資料 | パス | 説明 |
| --- | --- | --- |
| scope SSOT | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/SCOPE.md` | 19 routes / mapping |
| phase 12 spec | `../../phase-12.md` | guide 要件 |

## 成果物

| 成果物 | パス |
| --- | --- |
| implementation guide | `outputs/phase-12/implementation-guide.md` |

## 完了条件

- [x] 中学生レベルの説明がある。
- [x] 技術者レベルの docs-only 代替 5 項目がある。
