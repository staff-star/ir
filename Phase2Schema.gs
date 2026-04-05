const RAKUTEN_REVIEW_SCHEMA = Object.freeze([
  '入力した行番号',
  '楽天itemsubを出力するか',
  '楽天CSVに出るか',
  '最終的な商品コード',
  'CSVに入る楽天商品名',
  'CSVに入るショップ内カテゴリ',
  '入力した販売価格',
  'CSVに入る販売価格',
  '入力した配送方法セット番号',
  'CSVに入る配送方法セット番号',
  'CSVに入る送料設定',
  '入力した在庫あり時納期番号',
  'CSVに入る在庫あり時納期番号',
  'CSVに入る在庫切れ時納期番号',
  'CSVに入る在庫連動',
  'CSVに入る検索非表示',
  'CSVに入る二重価格文言',
  'CSVに入る販売開始日時',
  'CSVに入る販売終了日時',
  '画像1',
  '画像2',
  '楽天PC説明文',
  '楽天販売説明文',
  '楽天スマホ説明文',
  'エラー件数',
  '止まっている理由'
]);

const RAKUTEN_ERROR_SCHEMA = Object.freeze([
  '入力した行番号',
  'どの項目で止まったか',
  '止まり方の種類',
  '直し方の案内',
  '楽天itemsubを出力するか',
  '商品コード'
]);

const YAHOO_REVIEW_SCHEMA = Object.freeze([
  '入力した行番号',
  'Yahoo itemsubを出力するか',
  'Yahoo CSVに出るか',
  '最終的な商品コード',
  'CSVに入るページID',
  'CSVに入るYahoo商品名',
  'CSVに入るパス',
  '入力したYahoo productカテゴリ',
  'CSVに入るYahoo productカテゴリ',
  '入力した販売価格',
  'CSVに入る販売価格',
  '入力した配送グループ番号',
  'CSVに入る配送グループ番号',
  'CSVに入るアップロード対象',
  'CSVに入るページ非公開',
  '商品情報',
  '商品説明',
  'スマホ自由欄',
  'エラー件数',
  '止まっている理由'
]);

const YAHOO_ERROR_SCHEMA = Object.freeze([
  '入力した行番号',
  'どの項目で止まったか',
  '止まり方の種類',
  '直し方の案内',
  'Yahoo itemsubを出力するか',
  '商品コード'
]);

const RAKUTEN_ITEMSUB_HEADER = buildRakutenItemsubHeader_();
const YAHOO_ITEMSUB_HEADER = buildYahooItemsubHeader_();

function buildRakutenItemsubHeader_() {
  const header = [
    'メインデータの商品コード（楽天URL）',
    'ショップ名',
    '商品コード（楽天URL）',
    '楽天商品番号',
    'ショップ内カテゴリ',
    '商品名',
    'PC用キャッチコピー',
    '消費税',
    '販売価格',
    'PC用商品説明文',
    'PC用商品説明文改行',
    'PC用販売説明文',
    'PC用販売説明文改行',
    'スマートフォン用商品説明文',
    'スマートフォン用商品説明文改行',
    'カタログID',
    '在庫連動',
    '倉庫指定',
    '送料'
  ];

  for (let i = 1; i <= PHASE1_CONFIG.maxImageSlots; i += 1) {
    header.push(`商品画像${i}`);
  }

  header.push(
    'アップロード対象設定',
    '販売期間（開始）',
    '販売期間（終了）',
    '表示価格',
    '二重価格文言',
    '在庫あり時納期管理番号',
    '在庫切れ時納期管理番号',
    '配送方法セット管理番号',
    'サーチ非表示'
  );

  return header;
}

function buildYahooItemsubHeader_() {
  return [
    'メインデータの商品コード（楽天URL）',
    'ショップ名',
    '商品コード',
    'パス',
    'yahooプロダクトカテゴリ',
    '商品名',
    'キャッチコピー',
    '消費税',
    '通常販売価格',
    '商品情報',
    '商品情報改行フラグ',
    '商品説明',
    '商品説明改行フラグ',
    'フリースペース（スマホのみ）',
    'フリースペース（スマホのみ）改行フラグ',
    'JANコード/ISBNコード',
    'ページ公開',
    'アップロード対象設定',
    '配送グループ管理番号'
  ];
}
