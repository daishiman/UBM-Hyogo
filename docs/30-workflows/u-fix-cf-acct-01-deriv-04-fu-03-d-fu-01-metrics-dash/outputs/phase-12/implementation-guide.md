# Implementation Guide Part 1

Refs #549, Refs #586, Refs #656.

## 中学生レベルの説明

毎週の体調をノートにつけると、1 日だけでは分からない変化に気づけます。このタスクも同じです。Cloudflare の監視結果を毎週まとめ、あとから見やすい表と絵にします。

なぜ必要かというと、1 回の結果だけでは「少し悪くなっているのか」「たまたまなのか」が分かりにくいからです。週ごとの変化を見ることで、早めに直すべき場所を見つけられます。

何をするかはシンプルです。まず 7 日分の結果に週の名前を付けます。次に、何週間分かを集めて、4 つの数字を並べます。最後に、公開しない HTML ファイルでグラフとして見ます。

## 専門用語セルフチェック

| 専門用語 | 日常語での言い換え |
| --- | --- |
| aggregator | ばらばらの記録をまとめる係 |
| schema_version | 記録用紙の版番号 |
| week_starting | その週の名前 |
| dashboard | ひと目で見るための掲示板 |
| evidence | あとで確認できる証拠 |

## なぜこの設計か

静的 HTML を採用するのは、現 worktree に admin audit route が存在せず、最小の追加で週次傾向を見られるためです。public route には置かず、`docs/dashboards/cf-audit-log-7day-trend/index.html` を local evidence として扱います。
