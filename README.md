# item Robot Phase1 / Phase2 GAS

`中間入力` は 1 枚のまま使い、出力先だけを Phase1 / 楽天 / Yahoo で分ける実装です。Phase2 は実CSVに近い楽天/Yahoo itemsub を作りつつ、入力列は絞ったまま運用します。

## 今回の仕様
- 入力シートは `中間入力` のみ
- 確認用は 3 系統
  - `確認用`
  - `楽天確認用`
  - `Yahoo確認用`
- エラー一覧は 3 系統
  - `エラー一覧`
  - `楽天エラー一覧`
  - `Yahooエラー一覧`
- CSV 出力は 3 種類
  - `ir-item.csv`
  - `ir-itemsub_楽天.csv`
  - `ir-itemsub_Yahoo.csv`

## 中間入力列
1. `product_code`
2. `title`
3. `category`
4. `rakuten_genre_id`
5. `yahoo_product_category`
6. `sale_price`
7. `jan_code`
8. `food_flag`
9. `image_count`
10. `image_ext`
11. `ai_catchcopy`
12. `ai_description_material`
13. `rakuten_title`
14. `rakuten_catchcopy`
15. `rakuten_pc_desc`
16. `rakuten_sales_desc`
17. `rakuten_sp_desc`
18. `yahoo_title`
19. `yahoo_catchcopy`
20. `yahoo_desc`
21. `yahoo_sp_free`
22. `rakuten_delivery_set_id`
23. `rakuten_display_price`
24. `rakuten_double_price_text_mode`
25. `yahoo_shipping_group_id`
26. `attribute_template_key`
27. `note`
28. `publish_phase1`
29. `publish_rakuten`
30. `publish_yahoo`

## 楽天 itemsub の回収点
- `表示先カテゴリ` は itemsub では空欄で出力します
- `楽天ジャンルID` は itemsub では空欄で出力します
- `カタログID` は itemsub では空欄で出力します
- `商品画像1〜20` は itemsub では空欄で出力します
- `rakuten_display_price` を `表示価格` に出力します
  - 空欄なら `sale_price` を使います
- `rakuten_double_price_text_mode` を `二重価格文言` に出力します
  - 許可値は `0 / 1 / 2 / 空欄`
- `在庫あり時出荷リードタイム` は `リードタイム（１日）` 固定です
- `在庫あり時納期管理番号` は `1` 固定です
- 商品属性の列見出しは CSV に残します
  - いったん値は入れず、空欄のまま出力します
- `attribute_template_key` は今は未使用です
- `rakuten_delivery_lead_time` は中間入力から削除済みです

## CSV 出力時の吸収ルール
- 楽天の `送料` は `rakuten_delivery_set_id` から導出します
  - `5 -> 1`
  - `2 -> 0`
- 楽天の固定値は `Phase1Config.gs` の `mallSettings.rakuten.defaults`
- Yahoo の固定値は `Phase1Config.gs` の `mallSettings.yahoo.defaults`

## publish フラグ
- `publish_phase1 = 1` の行だけ `ir-item.csv` の対象
- `publish_rakuten = 1` の行だけ `ir-itemsub_楽天.csv` の対象
- `publish_yahoo = 1` の行だけ `ir-itemsub_Yahoo.csv` の対象

## 使い方
1. `Phase1 > シートを初期化`
2. `入力見本` と `使い方` を見ながら `中間入力` に入力
3. 必要に応じて次を更新
   - `Phase1の確認用を更新`
   - `楽天確認用を更新`
   - `Yahoo確認用を更新`
4. エラー一覧を見て `中間入力` を修正
5. 必要な CSV だけ書き出す

## 実装ファイル
- `Phase1Config.gs`
- `Phase1Schema.gs`
- `Phase1Pipeline.gs`
- `Phase2Schema.gs`
- `Phase2RakutenPipeline.gs`
- `Phase2YahooPipeline.gs`
- `Phase1Tests.gs`
