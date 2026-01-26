---
description: sakura-academia内でHTMLファイルを作成する際のルール
---

# 更新履歴の記録ルール

sakura-academia 内のファイルを更新・作成した場合は、**必ず `UPDATE_LOG.md` に記録する**こと。

## 記録フォーマット

```markdown
| 時刻 | 更新ファイル | 更新内容 |
|------|-------------|---------|
| HH:MM | `ファイルパス` | 簡潔な更新内容 |
```

## 記録のルール

- **日付ごとにセクション**を作成（`### YYYY-MM-DD`）
- **月が変わったら見出し**を追加（`## YYYY年M月`）
- 一括更新の場合は、更新したファイルをすべて列挙
- ファイルパスは sakura-academia からの相対パスで記載

---

# HTML作成ルール

## 注釈（コメント）のルール

HTMLファイルを作成・編集する際は、**初心者でも手修正できるように**、以下のルールに従って注釈をふんだんに記述すること。

### 必須の注釈

- **セクションの開始・終了**: 各セクション（ヘッダー、メイン、フッターなど）の開始と終了を明記
- **カスタマイズポイント**: 色、サイズ、テキストなど、ユーザーが変更したい箇所には「ここを編集」と明記
- **複雑なコード**: JavaScript や CSS の処理内容をわかりやすく説明

### 注釈の書き方例

```html
<!-- ========================================
     ヘッダーセクション
     ※ロゴやナビゲーションを編集する場合はこの中を修正
======================================== -->

<!-- ★★★ ここを編集：サイトのタイトルを変更できます ★★★ -->
<h1>サイト名</h1>

<!-- 色を変えたい場合: 下の #ff6600 を好きな色コードに変更 -->
<div style="background-color: #ff6600;">

<!-- ヘッダーセクション 終わり -->
```

---

sakura-academia 内で新しいHTMLファイルを作成する際は、以下のトラッキングコードを必ず挿入すること。

## Google Tag Manager (head内に挿入)

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PRPCBPS2');</script>
<!-- End Google Tag Manager -->
```

## Google Tag Manager noscript (body開始直後に挿入)

```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PRPCBPS2"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

## Google Analytics (head内に挿入)

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-YV5WWWG39Z"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-YV5WWWG39Z');
</script>
```
