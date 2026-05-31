# システム仕様書更新サマリー — 新規インターフェース有無の判定

> task-specification-creator Phase 12 の「Step 2: システム仕様書更新」を実施するか否かを判定する。結論は **N/A（更新不要）**。理由を以下に明記する。

## 1. 新規インターフェース有無の判定

| 観点 | 本タスクでの変更 | 公開 API / 型契約への影響 |
| --- | --- | --- |
| 内部 helper 追加 | `createIndexWritePlan` / `writeIndexFilesAtomically` / `withIndexContext` を `generate-index.js` 内に追加 | なし（同一スクリプト内の private→named export 化のみ。テスト用 import 経路で、外部消費者なし） |
| 既存関数の export 化 | `generateTopicMap` / `generateKeywordIndex` を named export 化 | なし（出力 byte-identical、シグネチャ不変、呼び出し側は `pnpm indexes:rebuild` の CLI のみ） |
| CLI 実行ガード追加 | `import.meta.url === pathToFileURL(process.argv[1]).href` | なし（CLI 経路の挙動は不変。import 副作用のみ排除） |
| skill-local ESM marker | `.claude/skills/aiworkflow-requirements/package.json` に `{ "type": "module" }` を追加 | なし（対象 skill 配下の Node 実行解釈のみ。root package / workspace 契約には影響しない） |
| 出力ファイル形式 | `indexes/topic-map.md` / `indexes/keywords.json` | なし（byte-identical / drift 0） |
| exit code 契約 | 成功 0 / 失敗 1 | 既存契約を回帰維持（hook / CI が依存する挙動を変えない） |

> 判定: 追加されるのは `generate-index.js` の **内部 helper** と skill-local ESM marker のみで、公開 API / 型 / IPC 契約 / D1 schema / Google Form 仕様のいずれも変更しない。export 化はテスト可能化のための同一ファイル内 named export であり、aiworkflow-requirements / task-specification-creator の正本仕様（references）が記述する契約面には影響しない。

## 2. Step 2（システム仕様書更新）実施判定

| 判定 | 値 |
| --- | --- |
| 新規インターフェース | なし（内部 helper のみ） |
| 公開 API / 型変更 | なし |
| **Step 2 実施** | **N/A（更新不要）** |

理由: 仕様書（specs / references）が記述するのは公開契約・運用ルールであり、本タスクの変更（atomic write helper の内部追加・export 化・CLI ガード）はそのいずれにも触れない。出力 byte-identical のため既存ドキュメントの記述（`pnpm indexes:rebuild` の振る舞い・出力ファイル・exit code 依存）は引き続き正しい。よってシステム仕様書本体への差分は発生しない。

## 3. aiworkflow-requirements references への反映要否

| reference | 反映要否 | 理由 |
| --- | --- | --- |
| spec-guidelines.md | 不要 | 公開契約の変更なし |
| technology-devops-core.md（hook 運用） | 不要 | hook 側の挙動・exit code 依存は回帰維持。記述は現状で正しい |
| その他 references | 不要 | 内部 helper 追加は references の契約面に非接触 |

> 本タスクは今回サイクルで実装済みだが、変更は CLI 内部 helper とテスト可能化の named export に閉じるため、上記判定（Step 2 N/A）は維持する。万一 export を外部 skill が消費する設計に変わった場合のみ再判定する。
