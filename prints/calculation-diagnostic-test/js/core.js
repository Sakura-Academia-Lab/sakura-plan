window.curriculumData = [];
let activeUnitIdx = 0;
let activePatternIdx = 0;
let openChapters = new Set();
let openSections = new Set();

function wrapAnnotationMath(text) {
    if (!text) return '';
    const segments = text.split(/([\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\u3000-\u303f★☆・。、「」（）！？\s]+)/);
    return segments.map(seg => {
        if (seg.includes('\\') && /[a-z]/.test(seg)) {
            return `\\(${seg.trim()}\\)`;
        }
        return seg;
    }).join('');
}

// すでに \( \) などで囲まれている場合は囲まない
function safeWrapMath(text) {
    if (text === null || text === undefined) return '';
    const s = String(text).trim();
    if ((s.startsWith('\\(') && s.endsWith('\\)')) || (s.startsWith('$') && s.endsWith('$'))) {
        return s;
    }
    return `\\(${s}\\)`;
}

function renderAnswers(col) {
    return col.problems.map((p, i) => {
        const isVertical = p.includes('範囲') || p.includes('概数');
        return `
        <div class="exp-unit">
            <div class="exp-top${isVertical ? ' vertical' : ''}">
                <span class="p-num">(${i + 1})</span>
                <div class="p-content">${safeWrapMath(p)}</div>
                <div class="ans-box-filled${p.includes('素因数分解') ? ' factor' : ''}${p.includes('範囲') ? ' range' : ''}">
                    <span class="ans-text">${safeWrapMath(col.answers[i])}</span>
                </div>
            </div>
            ${col.annotations && col.annotations[i] ? `
            <div class="exp-annotation">
                <span class="handwritten-note">${wrapAnnotationMath(col.annotations[i])}</span>
            </div>` : ''}
        </div>`;
    }).join('');
}

function addData(unitData) {
    const existingIdx = window.curriculumData.findIndex(u => u.id === unitData.id);
    if (existingIdx !== -1) {
        window.curriculumData[existingIdx] = unitData;
    } else {
        window.curriculumData.push(unitData);
    }

    if (window.curriculumData.length === 1) {
        openChapters.add(unitData.chapter);
        if (unitData.section) openSections.add(unitData.chapter + '|' + unitData.section);
        renderMenu();
        renderSheet();
    } else {
        renderMenu();
    }
}

function formatLevelName(chapterName) {
    return chapterName.replace(/第(\d+)部/, "ステージ$1");
}

function formatSectionLabel(section) {
    const labelMap = {
        'サバイバルテスト': '',
        '訓練': ''
    };
    return labelMap[section] !== undefined ? labelMap[section] : section;
}

function renderMenu() {
    const container = document.getElementById('menu-container');
    if (!container) return; // コンテナがない場合はスキップ
    container.innerHTML = '';

    const hierarchy = {};
    window.curriculumData.forEach((unit, idx) => {
        const chapter = unit.chapter;
        const section = unit.section || '未分類';
        if (!hierarchy[chapter]) hierarchy[chapter] = {};
        if (!hierarchy[chapter][section]) hierarchy[chapter][section] = [];
        hierarchy[chapter][section].push({ unit, idx });
    });

    Object.keys(hierarchy).forEach(chapter => {
        const chapterHeader = document.createElement('div');
        chapterHeader.className = 'nav-group-header';
        chapterHeader.innerHTML = `<span>${formatLevelName(chapter)}</span>`;
        container.appendChild(chapterHeader);

        const chapterWrapper = document.createElement('div');
        chapterWrapper.className = 'nav-level-wrapper';
        container.appendChild(chapterWrapper);

        Object.keys(hierarchy[chapter]).forEach(section => {
            const label = formatSectionLabel(section);
            if (label) {
                const sectionHeader = document.createElement('div');
                sectionHeader.className = 'nav-section-header';
                sectionHeader.innerHTML = `<span>${label}</span>`;
                chapterWrapper.appendChild(sectionHeader);
            }

            hierarchy[chapter][section].forEach(({ unit, idx }) => {
                const unitItem = document.createElement('div');
                unitItem.className = `nav-item ${idx === activeUnitIdx ? 'active' : ''}`;
                unitItem.innerText = unit.title;
                unitItem.onclick = (e) => {
                    e.stopPropagation();
                    activeUnitIdx = idx;
                    const controls = document.querySelector('.controls');
                    if (controls) controls.style.display = 'flex';
                    renderMenu();
                    renderSheet();
                };
                chapterWrapper.appendChild(unitItem);
            });
        });
    });
}

function setPattern(idx) {
    const unit = window.curriculumData[activeUnitIdx];
    if (!unit || idx >= unit.patterns.length) return;
    activePatternIdx = idx;
    document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', i === idx));
    renderSheet();
}

function renderSheet() {
    if (window.curriculumData.length === 0) return;
    const unit = window.curriculumData[activeUnitIdx];
    if (!unit) return;

    if (activePatternIdx >= unit.patterns.length) activePatternIdx = 0;
    const pattern = unit.patterns[activePatternIdx];
    const isSurvivalTest = unit.section === 'サバイバルテスト';

    const patternLabels = isSurvivalTest && unit.patternLabels
        ? unit.patternLabels
        : unit.patterns.map(p => p.label);

    document.querySelectorAll('.tab').forEach((t, i) => {
        if (i < unit.patterns.length) {
            t.style.display = '';
            t.textContent = patternLabels[i] || `レベル${i + 1}`;
        } else {
            t.style.display = 'none';
        }
    });

    const area = document.getElementById('sheet-area');
    if (!area) return;
    const label = patternLabels[activePatternIdx] || `レベル${activePatternIdx + 1}`;

    if (pattern.twoColumn) {
        const col1 = pattern.col1;
        const col2 = pattern.col2;
        const today = new Date();
        const printDate = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;
        const pageTitle = `${formatLevelName(unit.chapter)} ${unit.title} 【${label}】`;
        document.title = pageTitle;

        const renderProblems = (col) => col.problems.map((p, i) => `
        <li class="problem-item">
            <span class="p-num">(${i + 1})</span>
            <div class="p-content">${safeWrapMath(p)}</div>
            <div class="answer-box-empty"></div>
        </li>`).join('');

        area.innerHTML = `
        <div class="page page-break two-col-sheet">
            <div class="header">
                <div class="title-area">
                    <span class="chapter-label">${formatLevelName(unit.chapter)}</span>
                    <div class="main-title">${unit.title}<span class="pattern-label">【${label}】</span></div>
                </div>
                <div class="header-right">
                    <div class="header-date">${printDate}</div>
                    <div class="info-box"><div class="info-item name-item">名前</div></div>
                </div>
            </div>
            <div class="method-box">${unit.method}</div>
            <div class="two-col-layout">
                <div class="col-section">
                    <div class="col-header">${col1.label}</div>
                    <div class="col-coaching">${col1.coaching}</div>
                    <ul class="problems">${renderProblems(col1)}</ul>
                </div>
                <div class="col-section">
                    <div class="col-header">${col2.label}</div>
                    <div class="col-coaching">${col2.coaching}</div>
                    <ul class="problems">${renderProblems(col2)}</ul>
                </div>
            </div>
        </div>
        <div class="page two-col-sheet">
            <div class="header color-exp">
                <div class="title-area">
                    <span class="chapter-label">解答と指導ポイント</span>
                    <div class="main-title">${unit.title}<span class="pattern-label">【${label}】解説</span></div>
                </div>
            </div>
            <div class="two-col-layout">
                <div class="col-section">
                    <div class="col-header col-header-ans">${col1.label}【解答】</div>
                    <div class="explanation-container">${renderAnswers(col1)}</div>
                </div>
                <div class="col-section">
                    <div class="col-header col-header-ans">${col2.label}【解答】</div>
                    <div class="explanation-container">${renderAnswers(col2)}</div>
                </div>
            </div>
        </div>`;
        if (window.MathJax) MathJax.typeset();
        return;
    }

    const pageTitle = `${formatLevelName(unit.chapter)} ${unit.title} 【${label}】`;
    document.title = pageTitle;

    let layoutClass = '';
    if (pattern.problems.length >= 20) {
        layoutClass = 'survival-sheet';
    } else if (pattern.problems.length <= 2) {
        layoutClass = 'ultra-few';
    } else if (pattern.problems.length <= 5) {
        layoutClass = 'few-problems';
    }

    const today = new Date();
    const printDate = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;

    area.innerHTML = `
    <div class="page page-break ${layoutClass}">
        <div class="header">
            <div class="title-area">
                <span class="chapter-label">${formatLevelName(unit.chapter)}</span>
                <div class="main-title">${isSurvivalTest ? '3分チャレンジ' : unit.title}<span class="pattern-label">【${label}】</span></div>
            </div>
            <div class="header-right">
                <div class="header-date">${printDate}</div>
                <div class="info-box">
                    <div class="info-item name-item">名前</div>
                    ${isSurvivalTest ? '<div class="info-item score-item">得点</div>' : ''}
                </div>
            </div>
        </div>
        ${isSurvivalTest ? '' : `<div class="method-box">目標：${unit.method}</div>`}
        <ul class="problems">
            ${pattern.problems.map((p, i) => {
        // 【カスタマイズ用注釈】解答欄の幅を広げる判定（特定のキーワードが含まれる場合）
        const isVertical = p.includes('範囲') || p.includes('概数');

        // 【カスタマイズ用注釈】解答欄の中に補助テキストを入れる判定（整数なら「以下」、小数なら「未満」）
        const isRangeProblem = p.includes('範囲');
        let rangeHtml = '';
        if (isRangeProblem) {
            const isDecimal = p.includes('.');
            const tailText = isDecimal ? '未満' : '以下';
            rangeHtml = `<div class="range-guide"><span>以上</span><span>${tailText}</span></div>`;
        }

        return `
                <li class="problem-item${isVertical ? ' vertical' : ''}">
                    <span class="p-num">(${i + 1})</span>
                    <div class="p-content">${safeWrapMath(p)}</div>
                    <div class="answer-box-empty${p.includes('素因数分解') ? ' factor' : ''}${p.includes('範囲') ? ' range' : ''}">
                        ${rangeHtml}
                    </div>
                </li>
                `;
    }).join('')}
        </ul>
    </div>

    <div class="page ${layoutClass}">
        <div class="header color-exp">
            <div class="title-area">
                <span class="chapter-label">解答と指導ポイント</span>
                <div class="main-title">${unit.title} <span class="pattern-label">【${label}】解説</span></div>
            </div>
        </div>
        <div class="explanation-container">
            ${pattern.problems.map((p, i) => {
        // 【カスタマイズ用注釈】解答と解説の幅判定（問題文にキーワードがあれば広くする）
        const isVertical = p.includes('範囲') || p.includes('概数');
        return `
                <div class="exp-unit">
                    <div class="exp-top${isVertical ? ' vertical' : ''}">
                        <span class="p-num">(${i + 1})</span>
                        <div class="p-content">${safeWrapMath(p)}</div>
                        <div class="ans-box-filled${p.includes('素因数分解') ? ' factor' : ''}${p.includes('範囲') ? ' range' : ''}">
                            <span class="ans-text">${safeWrapMath(pattern.answers[i])}</span>
                        </div>
                    </div>
                </div>
                `;
    }).join('')}
        </div>
    </div>
    `;
    if (window.MathJax) MathJax.typeset();
}

function showCriteria() {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const criteriaMenu = document.querySelector('.criteria-menu');
    if (criteriaMenu) criteriaMenu.classList.add('active');

    const controls = document.querySelector('.controls');
    if (controls) controls.style.display = 'none';

    const area = document.getElementById('sheet-area');
    const criteriaContent = document.getElementById('criteria-content');
    if (area && criteriaContent) {
        area.innerHTML = `<div class="page criteria-page">${criteriaContent.innerHTML}</div>`;
    }
    document.title = '計算脳・自動化レベル判定基準';
}

function showPassport() {
    window.open('record-passport.html', '_blank');
}

function generateSheet(unit, pattern, label) {
    if (pattern.twoColumn) {
        const col1 = pattern.col1;
        const col2 = pattern.col2;
        const today = new Date();
        const printDate = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;

        const renderProblems = (col) => col.problems.map((p, i) => `
        <li class="problem-item">
            <span class="p-num">(${i + 1})</span>
            <div class="p-content">${safeWrapMath(p)}</div>
            <div class="answer-box-empty"></div>
        </li>`).join('');

        return `
        <div class="page page-break two-col-sheet">
            <div class="header">
                <div class="title-area">
                    <span class="chapter-label">${formatLevelName(unit.chapter)}</span>
                    <div class="main-title">${unit.title}<span class="pattern-label">【${label}】</span></div>
                </div>
                <div class="header-right">
                    <div class="header-date">${printDate}</div>
                    <div class="info-box"><div class="info-item name-item">名前</div></div>
                </div>
            </div>
            <div class="method-box">${unit.method}</div>
            <div class="two-col-layout">
                <div class="col-section">
                    <div class="col-header">${col1.label}</div>
                    <div class="col-coaching">${col1.coaching}</div>
                    <ul class="problems">${renderProblems(col1)}</ul>
                </div>
                <div class="col-section">
                    <div class="col-header">${col2.label}</div>
                    <div class="col-coaching">${col2.coaching}</div>
                    <ul class="problems">${renderProblems(col2)}</ul>
                </div>
            </div>
        </div>
        <div class="page two-col-sheet">
            <div class="header color-exp">
                <div class="title-area">
                    <span class="chapter-label">解答と指導ポイント</span>
                    <div class="main-title">${unit.title}<span class="pattern-label">【${label}】解説</span></div>
                </div>
            </div>
            <div class="two-col-layout">
                <div class="col-section">
                    <div class="col-header col-header-ans">${col1.label}【解答】</div>
                    <div class="explanation-container">${renderAnswers(col1)}</div>
                </div>
                <div class="col-section">
                    <div class="col-header col-header-ans">${col2.label}【解答】</div>
                    <div class="explanation-container">${renderAnswers(col2)}</div>
                </div>
            </div>
        </div>`;
    }

    const isSurvivalTest = unit.section === 'サバイバルテスト';
    let layoutClass = '';
    if (pattern.problems.length >= 20) {
        layoutClass = 'survival-sheet';
    } else if (pattern.problems.length <= 2) {
        layoutClass = 'ultra-few';
    } else if (pattern.problems.length <= 5) {
        layoutClass = 'few-problems';
    }

    const today = new Date();
    const printDate = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;

    return `
    <div class="page page-break ${layoutClass}">
        <div class="header">
            <div class="title-area">
                <span class="chapter-label">${formatLevelName(unit.chapter)}</span>
                <div class="main-title">${isSurvivalTest ? '3分チャレンジ' : unit.title}<span class="pattern-label">【${label}】</span></div>
            </div>
            <div class="header-right">
                <div class="header-date">${printDate}</div>
                <div class="info-box">
                    <div class="info-item name-item">名前</div>
                    ${isSurvivalTest ? '<div class="info-item score-item">得点</div>' : ''}
                </div>
            </div>
        </div>
        ${isSurvivalTest ? '' : `<div class="method-box">目標：${unit.method}</div>`}
        <ul class="problems">
            ${pattern.problems.map((p, i) => {
        // 【カスタマイズ用注釈】解答欄の幅を広げる判定
        const isVertical = p.includes('範囲') || p.includes('概数');

        // 【カスタマイズ用注釈】解答欄の中に補助テキストを入れる判定（整数なら「以下」、小数なら「未満」）
        const isRangeProblem = p.includes('範囲');
        let rangeHtml = '';
        if (isRangeProblem) {
            const isDecimal = p.includes('.');
            const tailText = isDecimal ? '未満' : '以下';
            rangeHtml = `<div class="range-guide"><span>以上</span><span>${tailText}</span></div>`;
        }

        return `
                <li class="problem-item${isVertical ? ' vertical' : ''}">
                    <span class="p-num">(${i + 1})</span>
                    <div class="p-content">${safeWrapMath(p)}</div>
                    <div class="answer-box-empty${p.includes('素因数分解') ? ' factor' : ''}${p.includes('範囲') ? ' range' : ''}">
                        ${rangeHtml}
                    </div>
                </li>
                `;
    }).join('')}
        </ul>
    </div>

    <div class="page ${layoutClass}">
        <div class="header color-exp">
            <div class="title-area">
                <span class="chapter-label">解答と指導ポイント</span>
                <div class="main-title">${unit.title} <span class="pattern-label">【${label}】解説</span></div>
            </div>
        </div>
        <div class="explanation-container">
            ${pattern.problems.map((p, i) => {
        // 【カスタマイズ用注釈】解答と解説箇所の幅判定
        const isVertical = p.includes('範囲') || p.includes('概数');
        return `
                <div class="exp-unit">
                    <div class="exp-top${isVertical ? ' vertical' : ''}">
                        <span class="p-num">(${i + 1})</span>
                        <div class="p-content">${safeWrapMath(p)}</div>
                        <div class="ans-box-filled${p.includes('素因数分解') ? ' factor' : ''}${p.includes('範囲') ? ' range' : ''}">
                            <span class="ans-text">${safeWrapMath(pattern.answers[i])}</span>
                        </div>
                    </div>
                </div>
                `;
    }).join('')}
        </div>
    </div>
    `;
}

function printAllStageUnits(stage) {
    const stageUnits = window.curriculumData.filter(unit => unit.chapter.startsWith(stage));

    if (stageUnits.length === 0) {
        alert(`${stage}のユニットが見つかりません`);
        return;
    }

    const controls = document.querySelector('.controls');
    if (controls) controls.style.display = 'none';

    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    const area = document.getElementById('sheet-area');
    if (!area) return;
    area.innerHTML = '';

    stageUnits.forEach(unit => {
        unit.patterns.forEach((pattern, patternIndex) => {
            const label = unit.patternLabels
                ? unit.patternLabels[patternIndex]
                : (unit.section === 'サバイバルテスト' ? `セット${String.fromCharCode(65 + patternIndex)}` : `レベル${patternIndex + 1}`);
            area.innerHTML += generateSheet(unit, pattern, label);
        });
    });

    if (window.MathJax) MathJax.typeset();
    document.title = `${stage} 全ユニット一括印刷`;

    setTimeout(() => {
        window.print();
    }, 1000);
}
