# settings-diff: 3 層 settings.json `defaultMode` 統一設計

## 注意事項

- 実値（API token / OAuth token / モデルキー / URL / `env` の値）は**一切記載しない**
- 既存の他キー（`hooks`, `statusLine`, `mcpServers` 等）は **本タスクでは変更対象外**
- 行番号は Phase 1 ダンプの実観測値

## 採用案: 案 A（全層 `bypassPermissions` 統一）

### 1. グローバル: `~/.claude/settings.json`（行 318）

```diff
 {
   ...,
   "permissions": {
-    "defaultMode": "acceptEdits",
+    "defaultMode": "bypassPermissions",
     "allow": [ /* 既存維持・本タスクで追記しない */ ],
     "deny":  [ /* 既存維持・本タスクで追記しない */ ]
   },
   ...
 }
```

判定: 案 A。global を含む全層を明示的に `bypassPermissions` にし、最終値が常に `bypassPermissions` になることを構造的に保証する。

### 2. グローバル(local): `~/.claude/settings.local.json`（行 61）

```diff
 {
   ...,
   "permissions": {
     "defaultMode": "bypassPermissions"   // 変更なし
   },
   ...
 }
```

### 3. プロジェクト: `<project>/.claude/settings.json`（行 130）

```diff
 {
   ...,
   "permissions": {
     "defaultMode": "bypassPermissions",  // 変更なし
+    "allow": [ /* whitelist-design.md の allow リスト */ ],
+    "deny":  [ /* whitelist-design.md の deny リスト */ ]
   },
   ...
 }
```

> `allow` / `deny` の具体パターンは `whitelist-design.md` を参照。本ファイルは `defaultMode` 統一の正本。

## 代替案: 案 B（上位層からキー削除し local 委譲）

### 1. グローバル: `~/.claude/settings.json`

```diff
 {
   "permissions": {
-    "defaultMode": "acceptEdits"
+    /* defaultMode キーを削除（local が値を持つ） */
   }
 }
```

### 2. global.local / project は変更なし

| ファイル | After |
| --- | --- |
| `~/.claude/settings.local.json` | `"defaultMode": "bypassPermissions"`（維持） |
| `<project>/.claude/settings.json` | `"defaultMode": "bypassPermissions"`（維持） |

### 案 B 採用条件

- Phase 3 R-1 で「他プロジェクトへの波及が許容不可」と判定された場合のみ案 A を取り下げ案 B にフォールバック
- 案 B は global 本体に「値を持たない」ため、local 未設定環境（別マシン等）で予期せぬ default に戻るリスクが残る

## 階層解決の見え方（採用案 A 適用後）

| プロジェクト状況 | 最終 `defaultMode` |
| --- | --- |
| 本プロジェクト（project 層 = bypass） | `bypassPermissions` |
| 他プロジェクト（project 層なし） | `bypassPermissions`（global.local + global 両方が bypass） |
| local 設定なしの別マシン（global のみ） | `bypassPermissions`（案 A の主目的） |

## 行番号トレース

| ファイル | 行 | 変更前 | 変更後 |
| --- | --- | --- | --- |
| `~/.claude/settings.json` | 318 | `acceptEdits` | `bypassPermissions` |
| `~/.claude/settings.local.json` | 61 | `bypassPermissions` | （変更なし） |
| `<project>/.claude/settings.json` | 130 | `bypassPermissions` | （変更なし） |

## 実装タスクへの引き継ぎ事項

- 本タスクは設計のみ。実 settings ファイル書き換えは別実装タスクで行う
- 実装時は変更前後で `claude` を再起動し、起動直後とリロード後の両方でモード表示を確認すること（Phase 4 / Phase 11 に手順を残す）
- global 本体の書き換えはマシン跨ぎで作用範囲が広いため、実装前に他プロジェクトの `<project>/.claude/settings.json` を grep で再走査すること（Phase 3 impact-analysis を参照）
