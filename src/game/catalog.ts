import { raDecDistToThree, type Vec3 } from "./coords";
import { galacticOverlook, wonderApproaches } from "./masses";

export type CatalogStar = {
  name: string;
  zh: string;
  ra: number;
  dec: number;
  mag: number;
  bv: number;
  dist: number;
  pmRa: number;
  pmDec: number;
  con: string;
  conZh: string;
};

/** Hipparcos-ish bright-star snapshot (J2000). RA/Dec degrees, dist ly, pm mas/yr. */
export const CATALOG: CatalogStar[] = [
  { name: "Sol", zh: "太阳", ra: 0, dec: 0, mag: 4.83, bv: 0.65, dist: 0.000016, pmRa: 0, pmDec: 0, con: "—", conZh: "—" },
  { name: "Sirius", zh: "天狼", ra: 101.287, dec: -16.716, mag: -1.46, bv: 0.0, dist: 8.6, pmRa: -546, pmDec: -1223, con: "CMa", conZh: "大犬" },
  { name: "Canopus", zh: "老人", ra: 95.988, dec: -52.696, mag: -0.74, bv: 0.15, dist: 310, pmRa: 20, pmDec: 23, con: "Car", conZh: "船底" },
  { name: "Rigil Kentaurus", zh: "南门二", ra: 219.902, dec: -60.834, mag: -0.27, bv: 0.71, dist: 4.37, pmRa: -3679, pmDec: 473, con: "Cen", conZh: "半人马" },
  { name: "Arcturus", zh: "大角", ra: 213.915, dec: 19.182, mag: -0.05, bv: 1.23, dist: 36.7, pmRa: -1093, pmDec: -2000, con: "Boo", conZh: "牧夫" },
  { name: "Vega", zh: "织女", ra: 279.235, dec: 38.784, mag: 0.03, bv: 0.0, dist: 25.04, pmRa: 201, pmDec: 287, con: "Lyr", conZh: "天琴" },
  { name: "Capella", zh: "五车二", ra: 79.172, dec: 45.998, mag: 0.08, bv: 0.8, dist: 42.9, pmRa: 75, pmDec: -427, con: "Aur", conZh: "御夫" },
  { name: "Rigel", zh: "参宿七", ra: 78.634, dec: -8.202, mag: 0.13, bv: -0.03, dist: 860, pmRa: 1, pmDec: 0, con: "Ori", conZh: "猎户" },
  { name: "Procyon", zh: "南河三", ra: 114.825, dec: 5.225, mag: 0.34, bv: 0.42, dist: 11.46, pmRa: -715, pmDec: -1035, con: "CMi", conZh: "小犬" },
  { name: "Achernar", zh: "水委一", ra: 24.429, dec: -57.237, mag: 0.46, bv: -0.16, dist: 139, pmRa: 87, pmDec: -38, con: "Eri", conZh: "波江" },
  { name: "Betelgeuse", zh: "参宿四", ra: 88.793, dec: 7.407, mag: 0.5, bv: 1.85, dist: 548, pmRa: 27, pmDec: 11, con: "Ori", conZh: "猎户" },
  { name: "Hadar", zh: "马腹一", ra: 210.956, dec: -60.373, mag: 0.61, bv: -0.23, dist: 390, pmRa: -33, pmDec: -23, con: "Cen", conZh: "半人马" },
  { name: "Altair", zh: "牛郎", ra: 297.696, dec: 8.868, mag: 0.76, bv: 0.22, dist: 16.7, pmRa: 537, pmDec: 386, con: "Aql", conZh: "天鹰" },
  { name: "Acrux", zh: "十字架二", ra: 186.65, dec: -63.099, mag: 0.77, bv: -0.24, dist: 320, pmRa: -36, pmDec: -15, con: "Cru", conZh: "南十字" },
  { name: "Aldebaran", zh: "毕宿五", ra: 68.98, dec: 16.509, mag: 0.85, bv: 1.54, dist: 65.3, pmRa: 63, pmDec: -189, con: "Tau", conZh: "金牛" },
  { name: "Antares", zh: "心宿二", ra: 247.352, dec: -26.432, mag: 0.96, bv: 1.83, dist: 550, pmRa: -12, pmDec: -23, con: "Sco", conZh: "天蝎" },
  { name: "Spica", zh: "角宿一", ra: 201.298, dec: -11.161, mag: 0.97, bv: -0.23, dist: 250, pmRa: -42, pmDec: -31, con: "Vir", conZh: "室女" },
  { name: "Pollux", zh: "北河三", ra: 116.329, dec: 28.026, mag: 1.14, bv: 1.0, dist: 33.8, pmRa: -627, pmDec: -46, con: "Gem", conZh: "双子" },
  { name: "Fomalhaut", zh: "北落师门", ra: 344.413, dec: -29.622, mag: 1.16, bv: 0.09, dist: 25.1, pmRa: 329, pmDec: -164, con: "PsA", conZh: "南鱼" },
  { name: "Deneb", zh: "天津四", ra: 310.358, dec: 45.28, mag: 1.25, bv: 0.09, dist: 2615, pmRa: 2, pmDec: 2, con: "Cyg", conZh: "天鹅" },
  { name: "Mimosa", zh: "十字架三", ra: 191.93, dec: -59.689, mag: 1.25, bv: -0.23, dist: 280, pmRa: -48, pmDec: -13, con: "Cru", conZh: "南十字" },
  { name: "Regulus", zh: "轩辕十四", ra: 152.093, dec: 11.967, mag: 1.35, bv: -0.11, dist: 79, pmRa: -248, pmDec: 6, con: "Leo", conZh: "狮子" },
  { name: "Adhara", zh: "弧矢七", ra: 104.656, dec: -28.972, mag: 1.5, bv: -0.21, dist: 430, pmRa: 3, pmDec: 2, con: "CMa", conZh: "大犬" },
  { name: "Castor", zh: "北河二", ra: 113.65, dec: 31.888, mag: 1.58, bv: 0.03, dist: 51, pmRa: -191, pmDec: -146, con: "Gem", conZh: "双子" },
  { name: "Shaula", zh: "尾宿八", ra: 263.402, dec: -37.104, mag: 1.62, bv: -0.22, dist: 570, pmRa: -8, pmDec: -30, con: "Sco", conZh: "天蝎" },
  { name: "Bellatrix", zh: "参宿五", ra: 81.283, dec: 6.35, mag: 1.64, bv: -0.22, dist: 250, pmRa: -8, pmDec: -13, con: "Ori", conZh: "猎户" },
  { name: "Elnath", zh: "五车五", ra: 81.573, dec: 28.608, mag: 1.65, bv: -0.13, dist: 134, pmRa: 23, pmDec: -174, con: "Tau", conZh: "金牛" },
  { name: "Miaplacidus", zh: "南船五", ra: 138.3, dec: -69.717, mag: 1.67, bv: 0.07, dist: 113, pmRa: -156, pmDec: 59, con: "Car", conZh: "船底" },
  { name: "Alnilam", zh: "参宿二", ra: 84.053, dec: -1.202, mag: 1.69, bv: -0.18, dist: 2000, pmRa: 1, pmDec: -1, con: "Ori", conZh: "猎户" },
  { name: "Alnair", zh: "鹤一", ra: 332.058, dec: -46.961, mag: 1.74, bv: -0.13, dist: 101, pmRa: 127, pmDec: -148, con: "Gru", conZh: "天鹤" },
  { name: "Alioth", zh: "玉衡", ra: 193.507, dec: 55.96, mag: 1.77, bv: -0.02, dist: 83, pmRa: 112, pmDec: -9, con: "UMa", conZh: "大熊" },
  { name: "Alnitak", zh: "参宿一", ra: 85.19, dec: -1.943, mag: 1.77, bv: -0.21, dist: 1260, pmRa: 4, pmDec: 2, con: "Ori", conZh: "猎户" },
  { name: "Dubhe", zh: "天枢", ra: 165.46, dec: 61.751, mag: 1.79, bv: 1.07, dist: 123, pmRa: -134, pmDec: -35, con: "UMa", conZh: "大熊" },
  { name: "Mirfak", zh: "天船三", ra: 51.081, dec: 49.861, mag: 1.79, bv: 0.48, dist: 592, pmRa: 24, pmDec: -26, con: "Per", conZh: "英仙" },
  { name: "Wezen", zh: "弧矢一", ra: 107.098, dec: -26.393, mag: 1.83, bv: 0.67, dist: 1600, pmRa: -3, pmDec: 4, con: "CMa", conZh: "大犬" },
  { name: "Alkaid", zh: "摇光", ra: 206.885, dec: 49.313, mag: 1.86, bv: -0.02, dist: 104, pmRa: -121, pmDec: -15, con: "UMa", conZh: "大熊" },
  { name: "Sargas", zh: "尾宿五", ra: 264.33, dec: -42.998, mag: 1.86, bv: 0.4, dist: 270, pmRa: 6, pmDec: -7, con: "Sco", conZh: "天蝎" },
  { name: "Avior", zh: "海石一", ra: 125.628, dec: -59.51, mag: 1.86, bv: 1.2, dist: 630, pmRa: -26, pmDec: 23, con: "Car", conZh: "船底" },
  { name: "Menkalinan", zh: "五车三", ra: 89.882, dec: 44.947, mag: 1.9, bv: 0.08, dist: 81, pmRa: -57, pmDec: -1, con: "Aur", conZh: "御夫" },
  { name: "Atria", zh: "三角三", ra: 252.166, dec: -69.028, mag: 1.91, bv: 1.44, dist: 415, pmRa: 18, pmDec: -32, con: "TrA", conZh: "南三角" },
  { name: "Kaus Australis", zh: "箕宿三", ra: 276.043, dec: -34.385, mag: 1.85, bv: -0.03, dist: 143, pmRa: -40, pmDec: -124, con: "Sgr", conZh: "人马" },
  { name: "Alhena", zh: "井宿三", ra: 99.428, dec: 16.399, mag: 1.92, bv: 0.0, dist: 109, pmRa: 56, pmDec: -12, con: "Gem", conZh: "双子" },
  { name: "Peacock", zh: "孔雀十一", ra: 306.412, dec: -56.735, mag: 1.94, bv: -0.2, dist: 179, pmRa: 7, pmDec: -86, con: "Pav", conZh: "孔雀" },
  { name: "Polaris", zh: "北极星", ra: 37.955, dec: 89.264, mag: 1.98, bv: 0.6, dist: 433, pmRa: 44, pmDec: -12, con: "UMi", conZh: "小熊" },
  { name: "Mirzam", zh: "军市一", ra: 95.675, dec: -17.956, mag: 1.98, bv: -0.24, dist: 500, pmRa: -3, pmDec: -2, con: "CMa", conZh: "大犬" },
  { name: "Alphard", zh: "星宿一", ra: 141.897, dec: -8.659, mag: 1.98, bv: 1.44, dist: 177, pmRa: -15, pmDec: 33, con: "Hya", conZh: "长蛇" },
  { name: "Algieba", zh: "轩辕十二", ra: 154.993, dec: 19.842, mag: 2.08, bv: 1.13, dist: 130, pmRa: 305, pmDec: -154, con: "Leo", conZh: "狮子" },
  { name: "Hamal", zh: "娄宿三", ra: 31.793, dec: 23.462, mag: 2.0, bv: 1.15, dist: 66, pmRa: 189, pmDec: -145, con: "Ari", conZh: "白羊" },
  { name: "Diphda", zh: "土司空", ra: 10.897, dec: -17.987, mag: 2.04, bv: 1.02, dist: 96, pmRa: 233, pmDec: 33, con: "Cet", conZh: "鲸鱼" },
  { name: "Nunki", zh: "斗宿四", ra: 283.816, dec: -26.297, mag: 2.05, bv: -0.13, dist: 228, pmRa: 15, pmDec: -53, con: "Sgr", conZh: "人马" },
  { name: "Menkent", zh: "库楼三", ra: 211.671, dec: -36.37, mag: 2.06, bv: 1.01, dist: 61, pmRa: -521, pmDec: -518, con: "Cen", conZh: "半人马" },
  { name: "Alpheratz", zh: "壁宿二", ra: 2.097, dec: 29.09, mag: 2.06, bv: -0.04, dist: 97, pmRa: 135, pmDec: -163, con: "And", conZh: "仙女" },
  { name: "Mirach", zh: "奎宿九", ra: 17.433, dec: 35.62, mag: 2.05, bv: 1.58, dist: 197, pmRa: 176, pmDec: -112, con: "And", conZh: "仙女" },
  { name: "Saiph", zh: "参宿六", ra: 86.939, dec: -9.67, mag: 2.06, bv: -0.18, dist: 650, pmRa: 1, pmDec: -1, con: "Ori", conZh: "猎户" },
  { name: "Mintaka", zh: "参宿三", ra: 83.002, dec: -0.299, mag: 2.23, bv: -0.22, dist: 1200, pmRa: 1, pmDec: 1, con: "Ori", conZh: "猎户" },
  { name: "Meissa", zh: "猎户座λ", ra: 83.784, dec: 9.934, mag: 3.39, bv: -0.16, dist: 1100, pmRa: -4, pmDec: -2, con: "Ori", conZh: "猎户" },
  { name: "Merak", zh: "天璇", ra: 165.46, dec: 56.382, mag: 2.37, bv: 0.06, dist: 80, pmRa: 81, pmDec: 34, con: "UMa", conZh: "大熊" },
  { name: "Phecda", zh: "天玑", ra: 178.457, dec: 53.695, mag: 2.44, bv: 0.04, dist: 83, pmRa: 108, pmDec: 11, con: "UMa", conZh: "大熊" },
  { name: "Megrez", zh: "天权", ra: 183.856, dec: 57.033, mag: 3.31, bv: 0.08, dist: 81, pmRa: 104, pmDec: 9, con: "UMa", conZh: "大熊" },
  { name: "Mizar", zh: "开阳", ra: 200.981, dec: 54.925, mag: 2.23, bv: 0.13, dist: 83, pmRa: 121, pmDec: -23, con: "UMa", conZh: "大熊" },
  { name: "Gacrux", zh: "十字架一", ra: 187.791, dec: -57.113, mag: 1.63, bv: 1.59, dist: 88, pmRa: 28, pmDec: -265, con: "Cru", conZh: "南十字" },
  { name: "Delta Cru", zh: "十字架四", ra: 183.786, dec: -58.749, mag: 2.79, bv: -0.24, dist: 345, pmRa: -37, pmDec: -11, con: "Cru", conZh: "南十字" },
  { name: "Sadr", zh: "天津一", ra: 305.557, dec: 40.257, mag: 2.23, bv: 0.67, dist: 1800, pmRa: 2, pmDec: -1, con: "Cyg", conZh: "天鹅" },
  { name: "Albireo", zh: "辇道增七", ra: 292.68, dec: 27.96, mag: 3.05, bv: 1.13, dist: 430, pmRa: -7, pmDec: -6, con: "Cyg", conZh: "天鹅" },
  { name: "Gienah", zh: "天津九", ra: 311.665, dec: 33.97, mag: 2.48, bv: -0.09, dist: 72, pmRa: -9, pmDec: -197, con: "Cyg", conZh: "天鹅" },
  { name: "Denebola", zh: "五帝座一", ra: 177.265, dec: 14.572, mag: 2.14, bv: 0.09, dist: 36, pmRa: -499, pmDec: -114, con: "Leo", conZh: "狮子" },
  { name: "Algieba", zh: "轩辕十二", ra: 154.993, dec: 19.842, mag: 2.08, bv: 1.13, dist: 130, pmRa: 305, pmDec: -154, con: "Leo", conZh: "狮子" },
  { name: "Zosma", zh: "太微右垣四", ra: 168.527, dec: 20.524, mag: 2.56, bv: 0.13, dist: 58, pmRa: 144, pmDec: -130, con: "Leo", conZh: "狮子" },
  { name: "Alcyone", zh: "昴宿六", ra: 56.871, dec: 24.105, mag: 2.87, bv: -0.09, dist: 440, pmRa: 19, pmDec: -46, con: "Tau", conZh: "金牛" },
  { name: "Electra", zh: "昴宿一", ra: 56.219, dec: 24.113, mag: 3.7, bv: -0.12, dist: 440, pmRa: 21, pmDec: -46, con: "Tau", conZh: "金牛" },
  { name: "Maia", zh: "昴宿四", ra: 56.457, dec: 24.368, mag: 3.87, bv: -0.07, dist: 440, pmRa: 21, pmDec: -46, con: "Tau", conZh: "金牛" },
  { name: "Merope", zh: "昴宿五", ra: 56.219, dec: 23.948, mag: 4.18, bv: -0.06, dist: 440, pmRa: 21, pmDec: -44, con: "Tau", conZh: "金牛" },
  { name: "Taygeta", zh: "昴宿二", ra: 56.302, dec: 24.467, mag: 4.3, bv: -0.11, dist: 440, pmRa: 21, pmDec: -41, con: "Tau", conZh: "金牛" },
  { name: "Barnard's Star", zh: "巴纳德星", ra: 269.452, dec: 4.693, mag: 9.54, bv: 1.74, dist: 5.96, pmRa: -803, pmDec: 10363, con: "Oph", conZh: "蛇夫" },
  { name: "Proxima Cen", zh: "比邻星", ra: 217.429, dec: -62.679, mag: 11.13, bv: 1.8, dist: 4.24, pmRa: -3776, pmDec: 770, con: "Cen", conZh: "半人马" },
  { name: "Kochab", zh: "帝星", ra: 222.676, dec: 74.155, mag: 2.08, bv: 1.4, dist: 131, pmRa: -32, pmDec: 12, con: "UMi", conZh: "小熊" },
  { name: "Pherkad", zh: "太子", ra: 230.182, dec: 71.834, mag: 3.05, bv: 0.05, dist: 487, pmRa: -18, pmDec: 18, con: "UMi", conZh: "小熊" },
  { name: "Schedar", zh: "王良四", ra: 10.127, dec: 56.537, mag: 2.23, bv: 1.17, dist: 228, pmRa: 50, pmDec: -32, con: "Cas", conZh: "仙后" },
  { name: "Caph", zh: "王良一", ra: 2.295, dec: 59.15, mag: 2.27, bv: 0.34, dist: 54, pmRa: 524, pmDec: -180, con: "Cas", conZh: "仙后" },
  { name: "Gamma Cas", zh: "策", ra: 14.177, dec: 60.717, mag: 2.47, bv: -0.15, dist: 550, pmRa: 25, pmDec: -4, con: "Cas", conZh: "仙后" },
  { name: "Ruchbah", zh: "阁道三", ra: 21.454, dec: 60.235, mag: 2.68, bv: 0.16, dist: 99, pmRa: 297, pmDec: -47, con: "Cas", conZh: "仙后" },
  { name: "Segin", zh: "阁道二", ra: 28.599, dec: 63.67, mag: 3.38, bv: -0.2, dist: 410, pmRa: 37, pmDec: -8, con: "Cas", conZh: "仙后" },
  { name: "Kaus Media", zh: "箕宿二", ra: 273.441, dec: -29.828, mag: 2.7, bv: 0.98, dist: 348, pmRa: 15, pmDec: 17, con: "Sgr", conZh: "人马" },
  { name: "Kaus Borealis", zh: "箕宿一", ra: 276.043, dec: -26.048, mag: 2.81, bv: 0.62, dist: 78, pmRa: -45, pmDec: -186, con: "Sgr", conZh: "人马" },
  { name: "Ascella", zh: "斗宿六", ra: 285.653, dec: -29.88, mag: 2.6, bv: 0.07, dist: 88, pmRa: 27, pmDec: -121, con: "Sgr", conZh: "人马" },
  { name: "Alnasl", zh: "箕宿四", ra: 271.452, dec: -30.424, mag: 2.98, bv: 0.0, dist: 96, pmRa: -50, pmDec: -181, con: "Sgr", conZh: "人马" },
  { name: "Dschubba", zh: "房宿三", ra: 240.083, dec: -22.622, mag: 2.32, bv: -0.12, dist: 400, pmRa: -8, pmDec: -33, con: "Sco", conZh: "天蝎" },
  { name: "Pi Sco", zh: "房宿一", ra: 237.0, dec: -26.0, mag: 2.89, bv: -0.18, dist: 590, pmRa: -12, pmDec: -28, con: "Sco", conZh: "天蝎" },
  { name: "Graffias", zh: "房宿四", ra: 241.359, dec: -19.805, mag: 2.5, bv: -0.06, dist: 404, pmRa: -6, pmDec: -24, con: "Sco", conZh: "天蝎" },
  { name: "Scorpion τ", zh: "心宿一", ra: 248.971, dec: -28.216, mag: 2.82, bv: 0.51, dist: 400, pmRa: -6, pmDec: -22, con: "Sco", conZh: "天蝎" },
  { name: "Wei", zh: "尾宿一", ra: 252.968, dec: -34.293, mag: 2.39, bv: 0.4, dist: 65, pmRa: -19, pmDec: -265, con: "Sco", conZh: "天蝎" },
  { name: "Lesath", zh: "尾宿九", ra: 262.69, dec: -37.296, mag: 2.7, bv: -0.18, dist: 580, pmRa: -4, pmDec: -30, con: "Sco", conZh: "天蝎" },
  { name: "Thuban", zh: "右枢", ra: 211.098, dec: 64.376, mag: 3.67, bv: -0.05, dist: 303, pmRa: -48, pmDec: 14, con: "Dra", conZh: "天龙" },
  { name: "Eltanin", zh: "天棓四", ra: 269.151, dec: 51.489, mag: 2.23, bv: 1.52, dist: 154, pmRa: -8, pmDec: -23, con: "Dra", conZh: "天龙" },
  { name: "Enif", zh: "危宿三", ra: 326.046, dec: 9.875, mag: 2.38, bv: 1.52, dist: 690, pmRa: 7, pmDec: 1, con: "Peg", conZh: "飞马" },
  { name: "Markab", zh: "室宿一", ra: 346.19, dec: 15.205, mag: 2.49, bv: -0.01, dist: 133, pmRa: 61, pmDec: -41, con: "Peg", conZh: "飞马" },
  { name: "Scheat", zh: "室宿二", ra: 345.944, dec: 28.083, mag: 2.42, bv: 1.67, dist: 196, pmRa: 188, pmDec: 137, con: "Peg", conZh: "飞马" },
  { name: "Algenib", zh: "壁宿一", ra: 3.308, dec: 15.183, mag: 2.83, bv: -0.19, dist: 390, pmRa: 5, pmDec: -8, con: "Peg", conZh: "飞马" },
  { name: "Ankaa", zh: "火鸟六", ra: 6.571, dec: -42.306, mag: 2.37, bv: 1.09, dist: 85, pmRa: 224, pmDec: -342, con: "Phe", conZh: "凤凰" },
  { name: "Algol", zh: "大陵五", ra: 47.042, dec: 40.956, mag: 2.12, bv: -0.05, dist: 90, pmRa: 3, pmDec: -1, con: "Per", conZh: "英仙" },
];

const byName = new Map(CATALOG.map((s) => [s.name, s]));

function starPos(name: string): Vec3 {
  const s = byName.get(name);
  if (!s) return [0, 0, 0];
  const d = Math.max(s.dist, 0.01);
  return raDecDistToThree(s.ra, s.dec, d);
}

type LinePair = [string, string];

const LINE_DEFS: { name: string; pairs: LinePair[] }[] = [
  {
    name: "Ori",
    pairs: [
      ["Meissa", "Betelgeuse"],
      ["Meissa", "Bellatrix"],
      ["Betelgeuse", "Alnitak"],
      ["Bellatrix", "Mintaka"],
      ["Mintaka", "Alnilam"],
      ["Alnilam", "Alnitak"],
      ["Alnitak", "Saiph"],
      ["Mintaka", "Rigel"],
      ["Saiph", "Rigel"],
    ],
  },
  {
    name: "UMa",
    pairs: [
      ["Dubhe", "Merak"],
      ["Merak", "Phecda"],
      ["Phecda", "Megrez"],
      ["Megrez", "Alioth"],
      ["Alioth", "Mizar"],
      ["Mizar", "Alkaid"],
      ["Megrez", "Dubhe"],
    ],
  },
  {
    name: "Cru",
    pairs: [
      ["Acrux", "Gacrux"],
      ["Mimosa", "Delta Cru"],
    ],
  },
  {
    name: "Cyg",
    pairs: [
      ["Deneb", "Sadr"],
      ["Sadr", "Albireo"],
      ["Gienah", "Sadr"],
    ],
  },
  {
    name: "Cas",
    pairs: [
      ["Caph", "Schedar"],
      ["Schedar", "Gamma Cas"],
      ["Gamma Cas", "Ruchbah"],
      ["Ruchbah", "Segin"],
    ],
  },
  {
    name: "Sco",
    pairs: [
      ["Dschubba", "Graffias"],
      ["Dschubba", "Pi Sco"],
      ["Dschubba", "Antares"],
      ["Antares", "Scorpion τ"],
      ["Scorpion τ", "Wei"],
      ["Wei", "Lesath"],
      ["Lesath", "Shaula"],
    ],
  },
  {
    name: "Leo",
    pairs: [
      ["Regulus", "Algieba"],
      ["Algieba", "Zosma"],
      ["Zosma", "Denebola"],
      ["Algieba", "Denebola"],
    ],
  },
  {
    name: "Gem",
    pairs: [
      ["Castor", "Pollux"],
      ["Castor", "Alhena"],
      ["Pollux", "Alhena"],
    ],
  },
  {
    name: "Tau",
    pairs: [
      ["Aldebaran", "Elnath"],
      ["Aldebaran", "Alcyone"],
    ],
  },
  {
    name: "Sgr",
    pairs: [
      ["Kaus Borealis", "Kaus Media"],
      ["Kaus Media", "Kaus Australis"],
      ["Kaus Australis", "Alnasl"],
      ["Alnasl", "Kaus Borealis"],
      ["Nunki", "Ascella"],
    ],
  },
  {
    name: "UMi",
    pairs: [
      ["Polaris", "Kochab"],
      ["Kochab", "Pherkad"],
    ],
  },
  {
    name: "Lyr",
    pairs: [["Vega", "Vega"]],
  },
  {
    name: "Aql",
    pairs: [["Altair", "Altair"]],
  },
];

export type ConstellationLines = {
  positions: Float32Array;
  count: number;
};

export function buildConstellationPositions(): ConstellationLines {
  const pts: number[] = [];
  for (const c of LINE_DEFS) {
    for (const [a, b] of c.pairs) {
      if (a === b) continue;
      const pa = starPos(a);
      const pb = starPos(b);
      if (pa[0] === 0 && pa[1] === 0 && pa[2] === 0) continue;
      if (pb[0] === 0 && pb[1] === 0 && pb[2] === 0) continue;
      pts.push(pa[0], pa[1], pa[2], pb[0], pb[1], pb[2]);
    }
  }
  return { positions: new Float32Array(pts), count: pts.length / 3 };
}

export function buildGridPositions(): Float32Array {
  const pts: number[] = [];
  const R = 1000;
  const meridians = 12;
  const parallels = 5;
  const segs = 48;
  for (let m = 0; m < meridians; m++) {
    const ra = (m * 360) / meridians;
    for (let i = 0; i < segs; i++) {
      const t0 = -80 + (160 * i) / segs;
      const t1 = -80 + (160 * (i + 1)) / segs;
      const a = raDecDistToThree(ra, t0, R);
      const b = raDecDistToThree(ra, t1, R);
      pts.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    }
  }
  for (let p = 0; p < parallels; p++) {
    const dec = -60 + p * 30;
    for (let i = 0; i < segs; i++) {
      const r0 = (360 * i) / segs;
      const r1 = (360 * (i + 1)) / segs;
      const a = raDecDistToThree(r0, dec, R);
      const b = raDecDistToThree(r1, dec, R);
      pts.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    }
  }
  return new Float32Array(pts);
}

export type Preset = {
  id: string;
  label: string;
  zh: string;
  x: number;
  y: number;
  z: number;
  look?: string;
  lookAt?: Vec3;
  group?: "place" | "wonder";
};

export const PRESETS: Preset[] = [
  { id: "sol", label: "Sol", zh: "太阳", x: 0, y: 0, z: 0, look: "Sirius" },
  { id: "acen", label: "α Centauri", zh: "半人马座α", x: 0, y: 0, z: 0, look: "Sol" },
  { id: "sirius", label: "Sirius", zh: "天狼星旁", x: 0, y: 0, z: 0, look: "Sol" },
  { id: "vega", label: "Vega", zh: "织女星旁", x: 0, y: 0, z: 0, look: "Altair" },
  { id: "barnard", label: "Barnard's Star", zh: "巴纳德星旁", x: 0, y: 0, z: 0, look: "Sol" },
  { id: "gc", label: "Galactic Centre", zh: "银心", x: 26600, y: 0, z: 0, look: "Sol" },
  { id: "pleiades", label: "Pleiades", zh: "昴星团", x: 0, y: 0, z: 0, look: "Aldebaran" },
  { id: "orion", label: "Orion Nebula", zh: "猎户座大星云", x: 0, y: 0, z: 0, look: "Rigel" },
];

function fillPresetFromStar(id: string, starName: string, offsetLy = 0.12) {
  const s = byName.get(starName);
  if (!s) return;
  const p = raDecDistToThree(s.ra, s.dec, s.dist);
  const n = Math.hypot(p[0], p[1], p[2]) || 1;
  const preset = PRESETS.find((x) => x.id === id);
  if (!preset) return;
  preset.x = p[0] - (p[0] / n) * offsetLy;
  preset.y = p[1] - (p[1] / n) * offsetLy;
  preset.z = p[2] - (p[2] / n) * offsetLy;
}

fillPresetFromStar("acen", "Rigil Kentaurus", 0.08);
fillPresetFromStar("sirius", "Sirius", 0.15);
fillPresetFromStar("vega", "Vega", 0.2);
fillPresetFromStar("barnard", "Barnard's Star", 0.08);
fillPresetFromStar("pleiades", "Alcyone", 8);
fillPresetFromStar("orion", "Alnitak", 12);

const gcThree = galacticOverlook();
{
  const g = PRESETS.find((p) => p.id === "gc");
  if (g) {
    g.x = gcThree[0];
    g.y = gcThree[1];
    g.z = gcThree[2];
  }
}

for (const w of wonderApproaches()) {
  PRESETS.push({
    id: w.id,
    label: w.label,
    zh: w.zh,
    x: w.pos[0],
    y: w.pos[1],
    z: w.pos[2],
    lookAt: w.look,
    group: "wonder",
  });
}

export function nearestCatalog(
  dirX: number,
  dirY: number,
  dirZ: number,
  ox: number,
  oy: number,
  oz: number,
): CatalogStar | null {
  let best: CatalogStar | null = null;
  let bestDot = 0.992;
  for (const s of CATALOG) {
    if (s.name === "Sol" && Math.hypot(ox, oy, oz) < 0.02) continue;
    const d = Math.max(s.dist, 1e-5);
    const p = raDecDistToThree(s.ra, s.dec, d);
    const rx = p[0] - ox;
    const ry = p[1] - oy;
    const rz = p[2] - oz;
    const n = Math.hypot(rx, ry, rz) || 1;
    const dot = (rx * dirX + ry * dirY + rz * dirZ) / n;
    if (dot > bestDot) {
      bestDot = dot;
      best = s;
    }
  }
  return best;
}

export { byName as catalogByName };
