# item Robot Phase1 GAS

`ir-item.csv` だけを生成する Phase1 実装です。`itemsub`、バリエーションCSV、オプションCSV は入れていません。

## 仕様源
- `codex_phase1_docs/docs/requirements_phase1.md`
- `codex_phase1_docs/docs/current_decisions.md`
- `codex_phase1_docs/docs/fixed_rules.md`
- `codex_phase1_docs/docs/acceptance_criteria.md`
- `codex_phase1_docs/docs/ir-item_template_official_note.md`
- `codex_phase1_docs/docs/real_data_sample_note.md`
- `codex_phase1_docs/samples/ir-item_reference_header_from_sample.csv`
- `codex_phase1_docs/samples/ir-item_current_sample.csv`

## 今回実装した範囲
- `使い方` シートの生成
- `中間入力` シートの初期化
- `確認用` シートの生成
- `エラー一覧` シートの生成
- `publish_flag = 1` かつエラー無し行のみ `ir-item.csv` に出力
- 画像URLの自動生成
- Shift_JIS / CRLF の `ir-item.csv` 出力
- 中間入力シートの UTF-8 CSV 出力
- ローカルで読める設計/マッピング/固定値/テストケース文書

## ファイル
- `Phase1Config.gs`: 実行設定と固定値
- `Phase1Schema.gs`: 中間入力定義、確認用列、`ir-item.csv` ヘッダ定義
- `Phase1Pipeline.gs`: シート初期化、整形、検証、CSV出力
- `Phase1Tests.gs`: 純関数ベースの簡易テスト
- `docs/`: 設計と運用資料
- `samples/phase1_intermediate_template.csv`: 中間入力テンプレート

## 想定運用
1. スプレッドシートにコンテナバインドした GAS として配置する
2. `Phase1 > シートを初期化` を実行する
3. `使い方` シートを見ながら、`中間入力` シート 3 行目以降へ AI 提案値または人手値を入れる
4. `Phase1 > 確認用シートを更新` を実行する
5. `確認用` と `エラー一覧` を見て、必要なら `中間入力` を修正する
6. `Phase1 > ir-item.csvを書き出し` を実行する
7. Drive に作られた CSV を item Robot へ取り込む

## 実装上の判断
- `ir-item.csv` ヘッダは `codex_phase1_docs/samples/ir-item_reference_header_from_sample.csv` を採用しました
- 商品名は `final_title_override > ai_title > raw_name` の優先順です
- 表示価格は Phase1 方針どおり販売価格と同値で出します
- 説明文は `ai_description_material` を PC/モバイル/スマホ説明文へ同値展開します
- 画像は `1..N` を先に並べ、`has_white_image = 1` の場合のみ末尾に `w.ext` を追加します
- `楽天商品番号` は Phase1 では `商品コード（楽天URL）` を複写します

## 将来拡張ポイント
- itemsub / バリエーションCSV の別モジュール追加
- `attribute_template_key` による商品属性自動展開
- 表示価格の `-1` / `-2` 運用切り替え
- 倉庫指定、送料、在庫数の設定シート化
- 確認用シートからの上書き編集対応

## TODO / 不足仕様
- `fixed_rules.md` の「A/B/C列は 商品コード / 商品名 / ショップ名」と、同梱ヘッダの先頭列 `商品コード（楽天URL）, 楽天商品番号, カテゴリ` が一致しません。実装はヘッダ正本優先で同梱ヘッダに合わせています
- `ショップ名` の格納列が同梱ヘッダ内に存在しないため、Phase1 実装では CSV に入れていません
- `image_count` が連番画像だけを指すのか、白背景画像込み総数なのか仕様が曖昧です。実装は「連番画像数」で解釈し、`has_white_image = 1` の場合は別枠で `w.ext` を追加しています
- `送料`、`在庫数` などの運用固定値はサンプルと仕様メモを元に仮置きです。店舗運用値に合わせて `Phase1Config.gs` を調整してください
- 最新の item Robot 公式テンプレートが別途提供された場合は、そのヘッダへ差し替えて再検証してください
