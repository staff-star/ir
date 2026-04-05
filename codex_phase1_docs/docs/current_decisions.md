# current_decisions.md

## 現在の意思決定事項

### 1. Phase1 の対象
Phase1 は `ir-item.csv` のみを対象とする。

### 2. モール別CSV
- 楽天用 `ir-itemsub.csv` は Phase2
- Yahoo!用 `ir-itemsub.csv` は Phase2
- バリエーションCSVは Phase3 または別機能

### 3. 中間データ構造
- 中間CSV / 中間シートは 1商品1行
- 実運用で入力・確認する列だけを持つ
- 最終CSVの大量列は GAS で埋める

### 4. 画像URLの固定部分
画像URLの固定部分は次とする。

`http://r-asp02.item-robot.com/upload/images/1681/`

### 5. 画像URLの可変部分
可変部分は次とする。

`{product_code}/{file_name}.{ext}`

例:

`http://r-asp02.item-robot.com/upload/images/1681/nodonisukkiri/1.png`

### 6. 画像命名規則
標準命名は次とする。

- `1.png`
- `2.png`
- `3.png`
- `w.png`

### 7. 画像運用
- `product_code` と画像フォルダ名を一致させる
- 画像URLは中間CSVで持たず GAS で生成する
- 実画像は item Robot に事前登録済みである前提

### 8. item Robot再ダウンロード
- 標準フローには含めない
- GAS だけで最終CSVを生成する
- 再ダウンロードは将来の保守用途に限る

### 9. 人による確認
- AI 提案のまま確定しない
- GAS 整形後に、人が確認用シートで最終確認する
- 必要箇所のみ修正できる余地を残す

### 10. 実装の切り方
- まず Phase1 の `ir-item.csv` 出力器を作る
- itemsub / バリエーションの実装は混ぜない