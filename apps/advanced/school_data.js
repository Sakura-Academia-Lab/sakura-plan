/**
 * school_data.js
 * 首都圏 主要中学校データ拡張版
 * ※偏差値(SS)は一般的な模試の目安です。必要に応じて書き換えてください。
 */

window.SCHOOL_DATA = [
    /* =========================================
       1月校 (埼玉・千葉・地方校)
       ========================================= */
    // 埼玉
    { id: 'j_sakae', region:'jan', type:'coed', name:'栄東', kana:'さかえひがし', exams:{'jan_early':[{name:'A日程', ss:58, date:'1/10'},{name:'東大I', ss:62, date:'1/11'}]} },
    { id: 'j_urawa', region:'jan', type:'girl', name:'浦和明の星', kana:'うらわあけのほし', exams:{'jan_early':[{name:'1回', ss:64, date:'1/14'}]} },
    { id: 'j_shukutoku', region:'jan', type:'girl', name:'淑徳与野', kana:'しゅくとくよの', exams:{'jan_early':[{name:'1回', ss:59, date:'1/13'}]} },
    { id: 'j_kaiuchi', region:'jan', type:'coed', name:'開智(埼玉)', kana:'かいち', exams:{'jan_early':[{name:'1回', ss:56, date:'1/10'}]} },
    { id: 'j_rikkyo_n', region:'jan', type:'boy', name:'立教新座', kana:'りっきょうにいざ', exams:{'jan_late':[{name:'1回', ss:60, date:'1/25'}]} },
    
    // 千葉
    { id: 'j_shibumaku', region:'jan', type:'coed', name:'渋谷幕張', kana:'しぶやまくはり', exams:{'jan_late':[{name:'1回', ss:70, date:'1/22'}]} },
    { id: 'j_ichikawa', region:'jan', type:'coed', name:'市川', kana:'いちかわ', exams:{'jan_late':[{name:'1回', ss:64, date:'1/20'}]} },
    { id: 'j_toho_c', region:'jan', type:'coed', name:'東邦大東邦', kana:'とうほうだいとうほう', exams:{'jan_late':[{name:'前期', ss:63, date:'1/21'}]} },
    { id: 'j_showa', region:'jan', type:'coed', name:'昭和秀英', kana:'しょうわしゅうえい', exams:{'jan_late':[{name:'午後', ss:60, date:'1/20'}]} },
    
    // 地方・その他
    { id: 'j_nishiyamato', region:'jan', type:'coed', name:'西大和(東京)', kana:'にしやまと', exams:{'jan_late':[{name:'東京', ss:66, date:'1/20'}]} },
    { id: 'j_hokurei', region:'jan', type:'boy', name:'北嶺', kana:'ほくれい', exams:{'jan_early':[{name:'東京', ss:65, date:'1/8'}]} },
    { id: 'j_hakodate', region:'jan', type:'boy', name:'函館ラ・サール', kana:'はこだてらさーる', exams:{'jan_early':[{name:'東京', ss:62, date:'1/8'}]} },


    /* =========================================
       2月校 - 男子校
       ========================================= */
    // 御三家・トップ層
    { id: 'b_kaisei', region:'feb', type:'boy', name:'開成', kana:'かいせい', exams:{'feb1_am':[{name:'一般', ss:72}]} },
    { id: 'b_azabu', region:'feb', type:'boy', name:'麻布', kana:'あざぶ', exams:{'feb1_am':[{name:'一般', ss:67}]} },
    { id: 'b_musashi', region:'feb', type:'boy', name:'武蔵', kana:'むさし', exams:{'feb1_am':[{name:'一般', ss:65}]} },
    { id: 'b_komato', region:'feb', type:'boy', name:'駒場東邦', kana:'こまばとうほう', exams:{'feb1_am':[{name:'一般', ss:66}]} },
    { id: 'b_tsukukoma', region:'feb', type:'boy', name:'筑波大駒場', kana:'つくばだいこまば', exams:{'feb3_am':[{name:'一般', ss:74}]} },
    
    // 神奈川御三家・難関
    { id: 'b_seiko', region:'feb', type:'boy', name:'聖光学院', kana:'せいこうがくいん', exams:{'feb2_am':[{name:'1回', ss:70}], 'feb4_am':[{name:'2回', ss:70}]} },
    { id: 'b_eiko', region:'feb', type:'boy', name:'栄光学園', kana:'えいこうがくいん', exams:{'feb2_am':[{name:'一般', ss:68}]} },
    { id: 'b_asano', region:'feb', type:'boy', name:'浅野', kana:'あさの', exams:{'feb3_am':[{name:'一般', ss:64}]} },
    
    // 準御三家・人気校
    { id: 'b_kaijo', region:'feb', type:'boy', name:'海城', kana:'かいじょう', exams:{'feb1_am':[{name:'1回', ss:60}], 'feb3_am':[{name:'2回', ss:67}]} },
    { id: 'b_waseda', region:'feb', type:'boy', name:'早稲田', kana:'わせだ', exams:{'feb1_am':[{name:'1回', ss:61}], 'feb3_am':[{name:'2回', ss:66}]} },
    { id: 'b_hongo', region:'feb', type:'boy', name:'本郷', kana:'ほんごう', exams:{'feb1_am':[{name:'1回', ss:56}], 'feb2_am':[{name:'2回', ss:58}], 'feb5':[{name:'3回', ss:60, date:'2/5'}]} },
    { id: 'b_sugamo', region:'feb', type:'boy', name:'巣鴨', kana:'すがも', exams:{'feb1_am':[{name:'1期', ss:54}], 'feb2_am':[{name:'2期', ss:56}]} },
    { id: 'b_shiba', region:'feb', type:'boy', name:'芝', kana:'しば', exams:{'feb1_am':[{name:'1回', ss:58}], 'feb4_am':[{name:'2回', ss:61}]} },
    { id: 'b_kogyokusha', region:'feb', type:'boy', name:'攻玉社', kana:'こうぎょくしゃ', exams:{'feb1_am':[{name:'1回', ss:55}], 'feb2_am':[{name:'2回', ss:58}], 'feb5':[{name:'特別', ss:59, date:'2/5'}]} },
    { id: 'b_joho', region:'feb', type:'boy', name:'城北', kana:'じょうほく', exams:{'feb1_am':[{name:'1回', ss:54}], 'feb2_am':[{name:'2回', ss:56}], 'feb4_am':[{name:'3回', ss:57}]} },
    { id: 'b_setagaya', region:'feb', type:'boy', name:'世田谷学園', kana:'せたがやがくえん', exams:{'feb1_am':[{name:'1次', ss:52}], 'feb1_pm':[{name:'算数', ss:56}], 'feb2_am':[{name:'2次', ss:54}]} },
    { id: 'b_kamagaku', region:'feb', type:'boy', name:'鎌倉学園', kana:'かまくらがくえん', exams:{'feb1_am':[{name:'1次', ss:50}], 'feb2_am':[{name:'2次', ss:52}]} },
    { id: 'b_zushi', region:'feb', type:'boy', name:'逗子開成', kana:'ずしかいせい', exams:{'feb1_am':[{name:'1次', ss:56}], 'feb3_am':[{name:'2次', ss:58}], 'feb5':[{name:'3次', ss:60, date:'2/5'}]} },
    { id: 'b_takanawa', region:'feb', type:'boy', name:'高輪', kana:'たかなわ', exams:{'feb1_am':[{name:'A', ss:50}], 'feb2_am':[{name:'B', ss:52}], 'feb2_pm':[{name:'算数', ss:56}]} },
    { id: 'b_seijo', region:'feb', type:'boy', name:'成城', kana:'せいじょう', exams:{'feb1_am':[{name:'1回', ss:50}], 'feb3_am':[{name:'2回', ss:53}]} },
    { id: 'b_dokkyo', region:'feb', type:'boy', name:'獨協', kana:'どっきょう', exams:{'feb1_am':[{name:'1回', ss:45}], 'feb1_pm':[{name:'2回', ss:50}], 'feb2_am':[{name:'3回', ss:46}]} },


    /* =========================================
       2月校 - 女子校
       ========================================= */
    // 御三家・トップ層
    { id: 'g_oin', region:'feb', type:'girl', name:'桜蔭', kana:'おういん', exams:{'feb1_am':[{name:'一般', ss:70}]} },
    { id: 'g_jg', region:'feb', type:'girl', name:'女子学院', kana:'じょしがくいん', exams:{'feb1_am':[{name:'一般', ss:67}]} },
    { id: 'g_futaba', region:'feb', type:'girl', name:'雙葉', kana:'ふたば', exams:{'feb1_am':[{name:'一般', ss:65}]} },
    { id: 'g_toshima', region:'feb', type:'girl', name:'豊島岡', kana:'としまがおか', exams:{'feb2_am':[{name:'1回', ss:67}], 'feb3_am':[{name:'2回', ss:67}], 'feb4_am':[{name:'3回', ss:67}]} },
    
    // 神奈川・難関・人気校
    { id: 'g_ferris', region:'feb', type:'girl', name:'フェリス', kana:'ふぇりす', exams:{'feb1_am':[{name:'一般', ss:62}]} },
    { id: 'g_yokofuta', region:'feb', type:'girl', name:'横浜雙葉', kana:'よこはまふたば', exams:{'feb1_am':[{name:'一般', ss:56}]} },
    { id: 'g_yokokyo', region:'feb', type:'girl', name:'横浜共立', kana:'よこはまきょうりつ', exams:{'feb1_am':[{name:'A', ss:56}], 'feb3_am':[{name:'B', ss:60}]} },
    { id: 'g_kichijo', region:'feb', type:'girl', name:'吉祥女子', kana:'きちじょうじょし', exams:{'feb1_am':[{name:'1回', ss:60}], 'feb2_am':[{name:'2回', ss:62}], 'feb4_am':[{name:'3回', ss:63}]} },
    { id: 'g_ouyu', region:'feb', type:'girl', name:'鴎友学園', kana:'おうゆうがくえん', exams:{'feb1_am':[{name:'1回', ss:59}], 'feb3_am':[{name:'2回', ss:62}]} },
    { id: 'g_shoei', region:'feb', type:'girl', name:'頌栄女子', kana:'しょうえいじょし', exams:{'feb1_am':[{name:'1回', ss:58}], 'feb5':[{name:'2回', ss:60, date:'2/5'}]} },
    { id: 'g_senzoku', region:'feb', type:'girl', name:'洗足学園', kana:'せんぞくがくえん', exams:{'feb1_am':[{name:'1回', ss:60}], 'feb2_am':[{name:'2回', ss:62}], 'feb5':[{name:'3回', ss:62, date:'2/5'}]} },
    { id: 'g_shina_jo', region:'feb', type:'girl', name:'品川女子', kana:'しながわじょし', exams:{'feb1_am':[{name:'1回', ss:50}], 'feb2_am':[{name:'2回', ss:52}], 'feb4_am':[{name:'3回', ss:53}]} },
    { id: 'g_toyo_eiwa', region:'feb', type:'girl', name:'東洋英和', kana:'とうようえいわ', exams:{'feb1_am':[{name:'A', ss:56}], 'feb3_am':[{name:'B', ss:59}]} },
    { id: 'g_gakushuin', region:'feb', type:'girl', name:'学習院女子', kana:'がくしゅういんじょし', exams:{'feb1_am':[{name:'A', ss:55}], 'feb3_am':[{name:'B', ss:57}]} },
    { id: 'g_kyoritsu', region:'feb', type:'girl', name:'共立女子', kana:'きょうりつじょし', exams:{'feb1_am':[{name:'2/1', ss:50}], 'feb2_am':[{name:'2/2', ss:51}], 'feb4_am':[{name:'2/4', ss:52}]} },
    { id: 'g_otsuma', region:'feb', type:'girl', name:'大妻', kana:'おおつま', exams:{'feb1_am':[{name:'1回', ss:52}], 'feb2_am':[{name:'2回', ss:54}], 'feb3_am':[{name:'3回', ss:55}]} },
    { id: 'g_futsubu', region:'feb', type:'girl', name:'普連土', kana:'ふれんど', exams:{'feb1_am':[{name:'1回', ss:49}], 'feb1_pm':[{name:'算数', ss:55}], 'feb2_pm':[{name:'2回', ss:53}]} },
    { id: 'g_yamawaki', region:'feb', type:'girl', name:'山脇学園', kana:'やまわきがくえん', exams:{'feb1_am':[{name:'A', ss:48}], 'feb1_pm':[{name:'1科', ss:52}], 'feb2_am':[{name:'B', ss:49}]} },


    /* =========================================
       2月校 - 共学校・大学付属など
       ========================================= */
    // 最難関・国際系
    { id: 'c_shibushibu', region:'feb', type:'coed', name:'渋谷渋谷', kana:'しぶやしぶや', exams:{'feb1_am':[{name:'1回', ss:65}], 'feb2_am':[{name:'2回', ss:68}], 'feb5':[{name:'3回', ss:69, date:'2/5'}]} },
    { id: 'c_hiroo', region:'feb', type:'coed', name:'広尾学園', kana:'ひろおがくえん', exams:{'feb1_am':[{name:'1回', ss:60}], 'feb1_pm':[{name:'2回', ss:66}], 'feb5':[{name:'3回', ss:67, date:'2/5'}]} },
    { id: 'c_hiroo_koi', region:'feb', type:'coed', name:'広尾小石川', kana:'ひろおこいしかわ', exams:{'feb1_am':[{name:'1回', ss:56}], 'feb1_pm':[{name:'2回', ss:60}], 'feb2_pm':[{name:'3回', ss:61}]} },
    { id: 'c_mita', region:'feb', type:'coed', name:'三田国際', kana:'みたこくさい', exams:{'feb1_pm':[{name:'IC', ss:58}], 'feb2_pm':[{name:'MST', ss:60}], 'feb4_pm':[{name:'MST', ss:61}]} },
    { id: 'c_shiba_k', region:'feb', type:'coed', name:'芝国際', kana:'しばこくさい', exams:{'feb1_am':[{name:'1回', ss:50}], 'feb1_pm':[{name:'2回', ss:55}]} },
    { id: 'c_kaichi_nb', region:'feb', type:'coed', name:'開智日本橋', kana:'かいちにほんばし', exams:{'feb1_am':[{name:'1回', ss:55}], 'feb2_am':[{name:'2回', ss:57}], 'feb3_pm':[{name:'特待', ss:60}]} },

    // 大学付属系
    { id: 'c_keio_chu', region:'feb', type:'coed', name:'慶應中等部', kana:'けいおうちゅうとうぶ', exams:{'feb3_am':[{name:'1次', ss:66, date:'2/3 (1次)'}] } }, // 2次面接あり
    { id: 'c_waseda_jitsu', region:'feb', type:'coed', name:'早稲田実業', kana:'わせだじつぎょう', exams:{'feb1_am':[{name:'一般', ss:68}]} },
    { id: 'c_aoyama', region:'feb', type:'coed', name:'青山学院', kana:'あおやまがくいん', exams:{'feb2_am':[{name:'一般', ss:62}]} },
    { id: 'c_meidai_m', region:'feb', type:'coed', name:'明大明治', kana:'めいだいめいじ', exams:{'feb2_am':[{name:'1回', ss:62}], 'feb3_am':[{name:'2回', ss:64}]} },
    { id: 'c_chuo_f', region:'feb', type:'coed', name:'中大附属', kana:'ちゅうだいふぞく', exams:{'feb1_am':[{name:'1回', ss:58}], 'feb4_am':[{name:'2回', ss:60}]} },
    { id: 'c_hosei', region:'feb', type:'coed', name:'法政大学', kana:'ほうせいだいがく', exams:{'feb1_am':[{name:'1回', ss:56}], 'feb3_am':[{name:'2回', ss:58}]} },
    
    // 進学校・その他
    { id: 'c_toshi_t', region:'feb', type:'coed', name:'都市大等々力', kana:'としだいとどろき', exams:{'feb1_pm':[{name:'1回', ss:58}], 'feb2_pm':[{name:'2回', ss:60}]} },
    { id: 'c_nogyo', region:'feb', type:'coed', name:'東京農大一', kana:'とうきょうのうだいいち', exams:{'feb1_pm':[{name:'1回', ss:58}], 'feb2_pm':[{name:'2回', ss:60}]} },
    { id: 'c_kugayama', region:'feb', type:'coed', name:'国学院久我山', kana:'こくがくいんくがやま', exams:{'feb1_am':[{name:'1回', ss:55}], 'feb2_am':[{name:'ST1', ss:57}]} },
    { id: 'c_dalton', region:'feb', type:'coed', name:'ドルトン東京', kana:'どるとん', exams:{'feb1_am':[{name:'1回', ss:48}],'feb1_pm':[{name:'2回', ss:50}],'feb2_pm':[{name:'特待', ss:52}],'feb4_pm':[{name:'3回', ss:50}]} }
];