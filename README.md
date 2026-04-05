# item Robot Phase1 / Phase2 GAS

`中間入力` は 1 枚のまま使い、出力先だけを Phase1 / 楽天 / Yahoo で分ける実装です。

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

## 中間入力の考え方
- 左 21 列は AI や元データをまとめて貼る欄です
- 右 20 列は人が確認して決める欄です
- 商品名や説明文は楽天用 / Yahoo用を別で持てます
- 価格は `sale_price` の 1 列だけです
- 画像は `1..image_count` のみ生成し、白背景画像は作りません

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
22. `rakuten_display_category`
23. `rakuten_sale_start`
24. `rakuten_sale_end`
25. `rakuten_shipping_code`
26. `rakuten_delivery_set_id`
27. `rakuten_delivery_lead_time`
28. `rakuten_stock_lead_time`
29. `rakuten_stock_management_id`
30. `rakuten_search_visible_flag`
31. `rakuten_double_price_text`
32. `yahoo_path`
33. `yahoo_page_code`
34. `yahoo_shipping_group_id`
35. `yahoo_upload_target_flag`
36. `yahoo_hidden_page_flag`
37. `attribute_template_key`
38. `note`
39. `publish_phase1`
40. `publish_rakuten`
41. `publish_yahoo`

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

## 仕様メモ
- Phase1 は既存どおり `ir-item.csv` 用です
- Phase2 は楽天 / Yahoo の `itemsub` を別ロジックで出します
- バリエーションCSVはまだ未実装です
- ショップ名や固定値は `Phase1Config.gs` で調整できます
