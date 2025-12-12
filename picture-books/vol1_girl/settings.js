const settings = {
    girlName: "女の子"
};

// ブラウザ環境で読み込まれた場合にグローバル変数として公開する
if (typeof window !== 'undefined') {
    window.bookSettings = settings;
}
