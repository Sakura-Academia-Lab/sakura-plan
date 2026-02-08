addData({
  id: "ch5_u1",
  chapter: "第5章：応用・特殊",
  title: "複雑な逆算",
  method: "★計算スペースと、各ステップの計算結果（メモ）を分けて書きましょう。",
  patterns: [
    {
      // パターンA：画像準拠
      problems: [
        "1.5 - \\{ 1 - \\frac{1}{3} \\times ( 2 - \\Box ) \\} = \\frac{2}{3}",
        "1.75 - \\{ \\frac{7}{13} \\times ( 0.75 + \\Box ) - 0.25 \\} \\div \\frac{5}{6} = 1\\frac{7}{20}"
      ],
      answers: ["\\(1\\frac{1}{2}\\)", "\\(\\frac{1}{3}\\)"],
      annotations: Array(2).fill("")
    },
    {
      // パターンB：類題
      problems: [
        "2 - \\{ 1.25 - ( \\Box + \\frac{1}{4} ) \\times 0.6 \\} = 1\\frac{1}{10}",
        "\\{ ( \\Box - 1.2 ) \\times \\frac{5}{8} + 0.375 \\} \\div 1.5 = \\frac{1}{2}"
      ],
      answers: ["\\(1\\frac{1}{12}\\)", "1.8"],
      annotations: Array(2).fill("")
    }
  ]
});