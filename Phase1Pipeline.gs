function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Phase1')
    .addItem('シートを初期化', 'initializePhase1Workbook')
    .addItem('説明書を更新', 'refreshGuideSheet')
    .addItem('確認用シートを更新', 'refreshConfirmationSheet')
    .addItem('中間CSVを書き出し', 'exportIntermediateCsv')
    .addItem('ir-item.csvを書き出し', 'exportIrItemCsv')
    .addSeparator()
    .addItem('テストを実行', 'runPhase1Tests')
    .addToUi();
}

function initializePhase1Workbook() {
  const ss = getActiveSpreadsheet_();
  writeGuideSheet_();
  initializeSheet_(ss, PHASE1_CONFIG.sheetNames.input, buildInputSheetRows_(), 1);
  initializeSheet_(ss, PHASE1_CONFIG.sheetNames.review, [REVIEW_SCHEMA], 1);
  initializeSheet_(ss, PHASE1_CONFIG.sheetNames.errors, [ERROR_SCHEMA], 1);
}

function refreshGuideSheet() {
  writeGuideSheet_();
}

function refreshConfirmationSheet() {
  const result = buildPhase1Result_();
  writeReviewSheet_(result.reviewRows);
  writeErrorSheet_(result.errorRows);
}

function exportIntermediateCsv() {
  const rows = readInputRows_();
  const matrix = [
    PHASE1_INPUT_SCHEMA.map(function (item) { return item.key; }),
    PHASE1_INPUT_SCHEMA.map(function (item) { return item.note; })
  ];

  rows.forEach(function (row) {
    matrix.push(PHASE1_INPUT_SCHEMA.map(function (item) {
      return normalizeCellValue_(row[item.key]);
    }));
  });

  const fileName = buildExportFileName_('phase1_intermediate', 'csv');
  createCsvFile_(fileName, matrix, PHASE1_CONFIG.exportEncoding.intermediate);
}

function exportIrItemCsv() {
  const result = buildPhase1Result_();
  writeReviewSheet_(result.reviewRows);
  writeErrorSheet_(result.errorRows);

  const exportRows = result.records
    .filter(function (record) {
      return record.shouldExport;
    })
    .map(function (record) {
      return IR_ITEM_HEADER.map(function (header) {
        return normalizeCellValue_(record.irItemRow[header]);
      });
    });

  if (exportRows.length === 0) {
    throw new Error('出力対象がありません。publish_flag または エラー一覧を確認してください。');
  }

  const matrix = [IR_ITEM_HEADER].concat(exportRows);
  const fileName = buildExportFileName_('ir-item', 'csv');
  createCsvFile_(fileName, matrix, PHASE1_CONFIG.exportEncoding.irItem);
}

function buildPhase1Result_() {
  const sourceRows = readInputRows_();
  const records = sourceRows.map(function (sourceRow, index) {
    return buildPhase1Record_(sourceRow, index + 3);
  });

  appendDuplicateProductCodeErrors_(records);

  const reviewRows = [REVIEW_SCHEMA].concat(records.map(buildReviewRow_));
  const errorRows = [ERROR_SCHEMA];
  records.forEach(function (record) {
    record.errors.forEach(function (error) {
      errorRows.push([
        record.sourceRowNumber,
        error.field,
        error.code,
        error.message,
        record.source.publish_flag || '',
        record.normalized.productCode || ''
      ]);
    });
  });

  return {
    records: records,
    reviewRows: reviewRows,
    errorRows: errorRows
  };
}

function buildPhase1Record_(source, sourceRowNumber) {
  const errors = [];
  const normalized = {};

  normalized.publishFlag = normalizePublishFlag_(source.publish_flag);
  normalized.productCode = normalizeProductCode_(source.product_code || source.product_code_seed, errors);
  normalized.title = resolveTitle_(source, errors);
  normalized.category = normalizeCategory_(source.category_id_final, errors);
  normalized.salePrice = resolveSalePrice_(source.sale_price, source.price_suggested, errors);
  normalized.displayPrice = resolveDisplayPrice_(normalized.salePrice);
  normalized.tax = resolveTaxRule_(source.tax_class, errors);
  normalized.warehouseFlag = normalizeZeroOneField_(
    source.warehouse_flag,
    PHASE1_CONFIG.defaultWarehouseFlag,
    'warehouse_flag',
    errors
  );
  normalized.janCode = normalizeJanCode_(source.jan_code, errors);
  normalized.catchcopy = trimToString_(source.ai_catchcopy);
  normalized.description = trimToString_(source.ai_description_material);
  normalized.imageBundle = buildImageBundle_(
    normalized.productCode,
    source.image_count,
    source.image_ext,
    source.has_white_image,
    errors
  );

  const irItemRow = createEmptyIrItemRow_();
  irItemRow['商品コード（楽天URL）'] = normalized.productCode;
  irItemRow['楽天商品番号'] = PHASE1_CONFIG.copyProductCodeToRakutenItemNumber ? normalized.productCode : '';
  irItemRow['カテゴリ'] = normalized.category;
  irItemRow['商品名'] = normalized.title;
  irItemRow['キャッチコピー'] = normalized.catchcopy;
  irItemRow['モバイルキャッチコピー'] = normalized.catchcopy;
  irItemRow['販売価格'] = normalized.salePrice;
  irItemRow['消費税'] = normalized.tax.taxFlag;
  irItemRow['消費税率'] = normalized.tax.taxRate;
  irItemRow['軽減税率'] = normalized.tax.reducedTaxRateFlag;
  irItemRow['表示価格'] = normalized.displayPrice;
  irItemRow['送料'] = PHASE1_CONFIG.defaultShippingCode;
  irItemRow['個別送料'] = PHASE1_CONFIG.defaultIndividualShippingCode;
  irItemRow['倉庫指定'] = normalized.warehouseFlag;
  irItemRow['JANコード'] = normalized.janCode;
  irItemRow['PC用商品説明文'] = normalized.description;
  irItemRow['PC用商品説明文改行'] = '0';
  irItemRow['モバイル用商品説明文'] = normalized.description;
  irItemRow['モバイル用商品説明文改行'] = '0';
  irItemRow['スマートフォン用商品説明文'] = normalized.description;
  irItemRow['スマートフォン用商品説明文改行'] = '0';
  irItemRow['PC用販売説明文'] = '';
  irItemRow['PC用販売説明文改行'] = PHASE1_CONFIG.defaultPcSalesCopyLineBreak;
  irItemRow['在庫タイプ'] = PHASE1_CONFIG.defaultStockType;
  irItemRow['在庫数'] = PHASE1_CONFIG.defaultStockQuantity;
  irItemRow['在庫無制限'] = PHASE1_CONFIG.defaultStockUnlimited;
  irItemRow['新品・中古'] = PHASE1_CONFIG.defaultConditionCode;

  normalized.imageBundle.urls.forEach(function (url, index) {
    irItemRow[`画像${index + 1}`] = url;
  });

  const shouldExport = normalized.publishFlag === '1' && errors.length === 0;

  return {
    sourceRowNumber: sourceRowNumber,
    source: source,
    normalized: normalized,
    irItemRow: irItemRow,
    errors: errors,
    shouldExport: shouldExport
  };
}

function appendDuplicateProductCodeErrors_(records) {
  const buckets = {};

  records.forEach(function (record) {
    if (!record.normalized.productCode || record.normalized.publishFlag !== '1') {
      return;
    }
    if (!buckets[record.normalized.productCode]) {
      buckets[record.normalized.productCode] = [];
    }
    buckets[record.normalized.productCode].push(record);
  });

  Object.keys(buckets).forEach(function (productCode) {
    if (buckets[productCode].length <= 1) {
      return;
    }
    buckets[productCode].forEach(function (record) {
      record.errors.push({
        field: 'product_code',
        code: 'DUPLICATE_PRODUCT_CODE',
        message: `product_code が重複しています: ${productCode}`
      });
      record.shouldExport = false;
    });
  });
}

function buildReviewRow_(record) {
  const urls = record.normalized.imageBundle.urls;
  const errorMessages = record.errors.map(function (error) {
    return `[${error.code}] ${error.message}`;
  }).join('\n');

  return [
    record.sourceRowNumber,
    record.source.publish_flag || '',
    record.shouldExport ? '1' : '0',
    record.source.product_code_seed || '',
    record.source.product_code || '',
    record.normalized.productCode || '',
    record.source.raw_name || '',
    record.source.ai_title || '',
    record.source.final_title_override || '',
    record.normalized.title || '',
    record.source.category_id_final || '',
    record.normalized.category || '',
    record.source.price_suggested || '',
    record.source.sale_price || '',
    record.normalized.salePrice || '',
    record.normalized.displayPrice || '',
    record.source.jan_code || '',
    record.source.warehouse_flag || '',
    record.source.tax_class || '',
    record.normalized.tax.taxFlag || '',
    record.normalized.tax.taxRate || '',
    record.normalized.tax.reducedTaxRateFlag || '',
    record.source.image_count || '',
    record.source.image_ext || '',
    record.source.has_white_image || '',
    String(urls.length),
    urls[0] || '',
    urls[1] || '',
    urls[2] || '',
    urls[3] || '',
    record.source.ai_catchcopy || '',
    record.source.ai_description_material || '',
    record.source.attribute_template_key || '',
    record.source.note || '',
    String(record.errors.length),
    errorMessages
  ];
}

function readInputRows_() {
  const sheet = getOrCreateSheet_(PHASE1_CONFIG.sheetNames.input);
  const lastRow = sheet.getLastRow();
  const columnCount = PHASE1_INPUT_SCHEMA.length;

  if (lastRow < 3) {
    return [];
  }

  const values = sheet.getRange(3, 1, lastRow - 2, columnCount).getDisplayValues();
  const rows = [];

  values.forEach(function (line) {
    if (line.every(isBlankCell_)) {
      return;
    }
    const row = {};
    PHASE1_INPUT_SCHEMA.forEach(function (item, index) {
      row[item.key] = normalizeCellValue_(line[index]);
    });
    rows.push(row);
  });

  return rows;
}

function writeReviewSheet_(rows) {
  initializeSheet_(getActiveSpreadsheet_(), PHASE1_CONFIG.sheetNames.review, rows, 1);
}

function writeErrorSheet_(rows) {
  initializeSheet_(getActiveSpreadsheet_(), PHASE1_CONFIG.sheetNames.errors, rows, 1);
}

function writeGuideSheet_() {
  const ss = getActiveSpreadsheet_();
  const rows = buildGuideSheetRows_();
  initializeSheet_(ss, PHASE1_CONFIG.sheetNames.guide, rows, 2);

  const sheet = getOrCreateSheet_(PHASE1_CONFIG.sheetNames.guide, ss);
  applyGuideSheetFormat_(sheet, rows.length);
}

function initializeSheet_(ss, sheetName, rows, frozenRows) {
  const sheet = getOrCreateSheet_(sheetName, ss);
  sheet.clearContents();
  sheet.clearFormats();

  if (rows.length > 0) {
    const maxColumns = rows.reduce(function (maxValue, row) {
      return Math.max(maxValue, row.length);
    }, 0);
    const normalizedRows = rows.map(function (row) {
      return padRow_(row, maxColumns);
    });
    sheet.getRange(1, 1, normalizedRows.length, maxColumns).setValues(normalizedRows);
  }

  if (frozenRows) {
    sheet.setFrozenRows(frozenRows);
  }

  sheet.autoResizeColumns(1, Math.max(sheet.getLastColumn(), 1));
}

function buildInputSheetRows_() {
  return [
    PHASE1_INPUT_SCHEMA.map(function (item) { return item.key; }),
    PHASE1_INPUT_SCHEMA.map(function (item) { return item.note; })
  ];
}

function buildGuideSheetRows_() {
  return [
    ['Phase1 使い方', '', ''],
    ['このシートの目的', 'この表は「どこに何を書けばよいか」を分かりやすくまとめた説明書です。迷ったら最初にここを見てください。', ''],
    ['', '', ''],
    ['やること', '内容', '補足'],
    ['1. 最初の準備', 'メニューの「Phase1」から「シートを初期化」を押します。', '最初だけで大丈夫です。'],
    ['2. 入力する', '「中間入力」シートの3行目から、商品ごとの情報を1行ずつ入れます。', '1行に1商品です。'],
    ['3. 確認する', 'メニューの「確認用シートを更新」を押します。', '「確認用」と「エラー一覧」が更新されます。'],
    ['4. 直す', '「エラー一覧」に出た行や、「確認用」で気になる行を「中間入力」で直します。', '直したら、もう一度「確認用シートを更新」を押します。'],
    ['5. 出力する', '問題がなければ「ir-item.csvを書き出し」を押します。', '出来上がったCSVは Drive に保存されます。'],
    ['', '', ''],
    ['中間入力でよく使う欄', '何を書くか', '例'],
    ['product_code_seed', '商品の管理コードの元になる文字です。まだ確定していないときはこちらだけでも構いません。', 'matcha-200g'],
    ['product_code', '商品の管理コードを自分で決めたいときに書きます。空なら上の欄から自動で整えます。', 'uji-matcha-200g'],
    ['raw_name', '元の商品名です。元データに書かれている名前を入れます。', '宇治抹茶 200g'],
    ['ai_title', 'AI が考えた商品名です。', '宇治抹茶 200g 送料無料'],
    ['final_title_override', '最終的に使いたい商品名です。ここに書いた名前がいちばん優先されます。', '京都宇治抹茶 200g'],
    ['category_id_final', '商品の売り場番号です。数字だけでも大丈夫です。', '683 または 683|530'],
    ['price_suggested', 'AI が出した参考価格です。', '1480'],
    ['sale_price', '実際に出したい販売価格です。空なら参考価格を使います。', '1480'],
    ['jan_code', 'JANコードがある商品だけ入れます。', '4542320580542'],
    ['warehouse_flag', '倉庫の使い分けがあるときだけ入れます。通常は空欄で構いません。', '0'],
    ['tax_class', '食品なら reduced、食品以外なら standard を入れます。', 'reduced'],
    ['image_count', '白背景画像を除いた、通常画像の枚数です。', '3'],
    ['image_ext', '画像の種類です。png や jpg を入れます。', 'png'],
    ['has_white_image', '白背景画像があるなら 1、ないなら 0 です。', '1'],
    ['ai_catchcopy', '短いひとこと説明です。', '毎日使いやすい大容量サイズ'],
    ['ai_description_material', '商品説明の元になる文章です。', '国産茶葉を使った粉末抹茶です。'],
    ['note', 'メモ欄です。CSVには出ません。', '初回出品分'],
    ['publish_flag', '出力したい行だけ 1 を入れます。出さない行は 0 か空欄にします。', '1'],
    ['', '', ''],
    ['困ったときの見方', '見る場所', '意味'],
    ['商品が出力されない', 'エラー一覧', 'その行に直すべき内容が出ます。'],
    ['出力対象か知りたい', '確認用 の「出力対象」', '1 なら出ます。0 なら出ません。'],
    ['画像の並びを見たい', '確認用 の 画像1〜画像4', '実際に作られるURLを確認できます。'],
    ['どの名前で出るか知りたい', '確認用 の「確定商品名」', '最終的にCSVへ入る商品名です。'],
    ['', '', ''],
    ['入力のコツ', '内容', ''],
    ['価格', '数字だけを入れてください。カンマや円は入れません。', '1480 のように書きます。'],
    ['商品コード', '英小文字、数字、-、_ だけが安全です。', '空白や記号が多いと自動で直されます。'],
    ['カテゴリ', '番号が分からないときは、使う予定の番号を確認してから入れてください。', '数字が1つでも入っていれば整形されます。'],
    ['画像', '画像URLは自分で書かなくて大丈夫です。コードと枚数から自動で作られます。', '画像の置き場所は事前準備が必要です。']
  ];
}

function applyGuideSheetFormat_(sheet, rowCount) {
  sheet.setColumnWidths(1, 1, 180);
  sheet.setColumnWidths(2, 1, 620);
  sheet.setColumnWidths(3, 1, 240);
  sheet.getRange(1, 1, rowCount, 3).setWrap(true).setVerticalAlignment('top');
  sheet.getRange(1, 1, 2, 3).setBackground('#f4efe6');
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setFontSize(14);

  [4, 11, 32, 38].forEach(function (row) {
    sheet.getRange(row, 1, 1, 3).setFontWeight('bold').setBackground('#d9ead3');
  });

  [3, 10, 31, 37].forEach(function (row) {
    sheet.getRange(row, 1, 1, 3).setBackground('#ffffff');
  });
}

function getOrCreateSheet_(sheetName, ss) {
  const spreadsheet = ss || getActiveSpreadsheet_();
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function getActiveSpreadsheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('アクティブなスプレッドシートが見つかりません。コンテナバインドされた GAS で実行してください。');
  }
  return ss;
}

function createEmptyIrItemRow_() {
  return IR_ITEM_HEADER.reduce(function (row, header) {
    row[header] = '';
    return row;
  }, {});
}

function normalizeProductCode_(value, errors) {
  let productCode = trimToString_(value);

  if (!productCode) {
    errors.push(buildError_('product_code', 'REQUIRED', 'product_code または product_code_seed が必要です。'));
    return '';
  }

  productCode = productCode
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[　\s]+/g, '-')
    .replace(/[^0-9a-z_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/_+/g, '_')
    .replace(/^[-_]+|[-_]+$/g, '');

  if (!productCode) {
    errors.push(buildError_('product_code', 'INVALID', 'product_code が空になりました。許可文字のみで入力してください。'));
    return '';
  }

  if (!/^[0-9a-z_-]+$/.test(productCode)) {
    errors.push(buildError_('product_code', 'INVALID', 'product_code は英小文字、数字、-、_ のみ使用できます。'));
  }

  if (productCode.length > PHASE1_CONFIG.maxProductCodeLength) {
    errors.push(buildError_('product_code', 'TOO_LONG', `product_code は ${PHASE1_CONFIG.maxProductCodeLength} 文字以内で入力してください。`));
  }

  return productCode;
}

function resolveTitle_(source, errors) {
  const title = trimToString_(source.final_title_override) ||
    trimToString_(source.ai_title) ||
    trimToString_(source.raw_name);

  if (!title) {
    errors.push(buildError_('title', 'REQUIRED', '商品名を決定できません。raw_name / ai_title / final_title_override を確認してください。'));
    return '';
  }

  if (title.length > PHASE1_CONFIG.maxProductNameLength) {
    errors.push(buildError_('title', 'TOO_LONG', `商品名は ${PHASE1_CONFIG.maxProductNameLength} 文字以内で入力してください。`));
  }

  return title;
}

function normalizeCategory_(value, errors) {
  const rawValue = trimToString_(value);
  const ids = rawValue.match(/\d+/g) || [];

  if (ids.length === 0) {
    errors.push(buildError_('category_id_final', 'REQUIRED', 'category_id_final にカテゴリIDを入力してください。'));
    return '';
  }

  return `|${ids.join('|')}|`;
}

function resolveSalePrice_(salePrice, suggestedPrice, errors) {
  const rawValue = trimToString_(salePrice) || trimToString_(suggestedPrice);

  if (!rawValue) {
    errors.push(buildError_('sale_price', 'REQUIRED', 'sale_price または price_suggested が必要です。'));
    return '';
  }

  if (!/^\d+$/.test(rawValue)) {
    errors.push(buildError_('sale_price', 'INVALID', '販売価格は半角数字のみで入力してください。'));
    return rawValue;
  }

  if (rawValue.length > PHASE1_CONFIG.maxPriceDigits) {
    errors.push(buildError_('sale_price', 'TOO_LONG', `販売価格は ${PHASE1_CONFIG.maxPriceDigits} 桁以内で入力してください。`));
  }

  return rawValue;
}

function resolveDisplayPrice_(salePrice) {
  if (!salePrice) {
    return '';
  }
  if (PHASE1_CONFIG.displayPriceMode === 'same_as_sale_price') {
    return salePrice;
  }
  return salePrice;
}

function resolveTaxRule_(value, errors) {
  const rawValue = trimToString_(value).toLowerCase();

  if (!rawValue) {
    return TAX_CLASS_RULES[PHASE1_CONFIG.defaultTaxClass];
  }

  if (['standard', 'normal', '10', '10%', '0'].indexOf(rawValue) >= 0) {
    return TAX_CLASS_RULES.standard;
  }
  if (['reduced', 'food', '8', '8%', '1'].indexOf(rawValue) >= 0) {
    return TAX_CLASS_RULES.reduced;
  }

  errors.push(buildError_('tax_class', 'INVALID', 'tax_class は standard / reduced / 10 / 8 系の値で入力してください。'));
  return TAX_CLASS_RULES[PHASE1_CONFIG.defaultTaxClass];
}

function normalizeZeroOneField_(value, defaultValue, field, errors) {
  const rawValue = trimToString_(value);
  if (!rawValue) {
    return defaultValue;
  }
  if (rawValue === '0' || rawValue === '1') {
    return rawValue;
  }
  errors.push(buildError_(field, 'INVALID', `${field} は 0 または 1 で入力してください。`));
  return defaultValue;
}

function normalizeJanCode_(value, errors) {
  const rawValue = trimToString_(value);
  if (!rawValue) {
    return '';
  }
  if (!/^\d+$/.test(rawValue)) {
    errors.push(buildError_('jan_code', 'INVALID', 'JAN コードは半角数字のみで入力してください。'));
  }
  return rawValue;
}

function buildImageBundle_(productCode, imageCountValue, imageExtValue, hasWhiteImageValue, errors) {
  const imageCountText = trimToString_(imageCountValue);
  const imageExt = trimToString_(imageExtValue).replace(/^\./, '').toLowerCase();
  const hasWhiteImage = normalizeZeroOneField_(hasWhiteImageValue, '0', 'has_white_image', errors);
  const urls = [];

  if (!productCode) {
    return { urls: urls, hasWhiteImage: hasWhiteImage };
  }

  if (!imageCountText) {
    errors.push(buildError_('image_count', 'REQUIRED', 'image_count が必要です。'));
    return { urls: urls, hasWhiteImage: hasWhiteImage };
  }

  if (!/^\d+$/.test(imageCountText)) {
    errors.push(buildError_('image_count', 'INVALID', 'image_count は 0-20 の整数で入力してください。'));
    return { urls: urls, hasWhiteImage: hasWhiteImage };
  }

  if (!imageExt) {
    errors.push(buildError_('image_ext', 'REQUIRED', 'image_ext が必要です。'));
    return { urls: urls, hasWhiteImage: hasWhiteImage };
  }

  if (!/^[a-z0-9]+$/.test(imageExt)) {
    errors.push(buildError_('image_ext', 'INVALID', 'image_ext は拡張子のみを入力してください。'));
  }

  const imageCount = Number(imageCountText);
  if (imageCount < 0 || imageCount > PHASE1_CONFIG.maxImageSlots) {
    errors.push(buildError_('image_count', 'OUT_OF_RANGE', `image_count は 0-${PHASE1_CONFIG.maxImageSlots} で入力してください。`));
    return { urls: urls, hasWhiteImage: hasWhiteImage };
  }

  if (hasWhiteImage === '1' && imageCount >= PHASE1_CONFIG.maxImageSlots) {
    errors.push(buildError_('image_count', 'WHITE_IMAGE_OVERFLOW', 'has_white_image = 1 の場合、image_count は 19 以下で入力してください。'));
    return { urls: urls, hasWhiteImage: hasWhiteImage };
  }

  for (let i = 1; i <= imageCount; i += 1) {
    urls.push(`${PHASE1_CONFIG.imageBaseUrl}${productCode}/${i}.${imageExt}`);
  }
  if (hasWhiteImage === '1') {
    urls.push(`${PHASE1_CONFIG.imageBaseUrl}${productCode}/w.${imageExt}`);
  }

  return {
    urls: urls,
    hasWhiteImage: hasWhiteImage
  };
}

function createCsvFile_(fileName, rows, charset) {
  const csvText = rows.map(toCsvLine_).join('\r\n');
  const blob = Utilities.newBlob('', 'text/csv', fileName);
  blob.setDataFromString(csvText, charset);
  DriveApp.createFile(blob);
}

function toCsvLine_(row) {
  return row.map(function (cell) {
    const value = normalizeCellValue_(cell);
    if (/[",\r\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }).join(',');
}

function buildExportFileName_(prefix, extension) {
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
  return `${prefix}_${timestamp}.${extension}`;
}

function padRow_(row, length) {
  const clone = row.slice();
  while (clone.length < length) {
    clone.push('');
  }
  return clone;
}

function normalizeCellValue_(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

function trimToString_(value) {
  return normalizeCellValue_(value).trim();
}

function isBlankCell_(value) {
  return trimToString_(value) === '';
}

function buildError_(field, code, message) {
  return {
    field: field,
    code: code,
    message: message
  };
}

function normalizePublishFlag_(value) {
  return trimToString_(value) === '1' ? '1' : '0';
}
