const settings = {
    boyName: "男の子",
    // QRコードにするURL（公開するWebサイトのURLに書き換えてください）
    siteUrl: "https://sakura-academia-lab.github.io/sakura-plan/picture-books/index.html",

    // QRコード画像を更新する関数
    updateQR: function () {
        const img = document.getElementById('qr-code-img');
        if (img && this.siteUrl) {
            img.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(this.siteUrl)}`;
        }
    }
};

// ブラウザ環境で読み込まれた場合にグローバル変数として公開する
if (typeof window !== 'undefined') {
    window.bookSettings = settings;
}
