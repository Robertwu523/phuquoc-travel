// Curated travel-documents guide for the /info/documents page.
// Content is CN-traveler oriented (Chinese). Destination-specific visa info is
// from the HK SAR passport perspective (the site's departure city is Hong Kong).
// NOTE: visa policies change — always verify at the official source before departure.

export type Destination = {
  code: string;
  flag: string;
  name: string;
  visa: string; // short verdict for HK SAR passport
  stays: string;
  fee: string;
  official: string; // official source to check the latest
  note: string;
};

// HK SAR passport visa treatment for common short-haul + a few long-haul destinations
export const destinations: Destination[] = [
  {
    code: "VN",
    flag: "🇻🇳",
    name: "越南 · 富国岛",
    visa: "电子签 e-Visa（必办）",
    stays: "最多 90 天，单次/多次入境",
    fee: "单次约 US$25 · 多次 US$50 / US$90",
    official: "https://evisa.xuatnhapcanh.gov.vn",
    note: "香港特区护照赴越南需提前办 e-Visa，约 3-5 工作日出签，出签后打印随身携带。富国岛可凭 e-Visa + 往返机票直飞入境。",
  },
  {
    code: "TH",
    flag: "🇹🇭",
    name: "泰国",
    visa: "免签（落地亦可）",
    stays: "免签最多 60 天",
    fee: "免签免费",
    official: "https://www.thaievisa.go.th",
    note: "HK 护照赴泰旅游通常免签；政策偶有调整，出发前到官网确认。",
  },
  {
    code: "JP",
    flag: "🇯🇵",
    name: "日本",
    visa: "免签",
    stays: "最长 90 天",
    fee: "免费",
    official: "https://www.mofa.go.jp",
    note: "HK 特区护照赴日短期旅游免签；建议登记 Visit Japan Web 加速入境。",
  },
  {
    code: "MY",
    flag: "🇲🇾",
    name: "马来西亚",
    visa: "免签",
    stays: "最长 90 天",
    fee: "免费",
    official: "https://www.imi.gov.my",
    note: "HK 护照赴马旅游免签；入境前填写 MDAC 电子入境卡。",
  },
  {
    code: "SG",
    flag: "🇸🇬",
    name: "新加坡",
    visa: "免签",
    stays: "最长 90 天",
    fee: "免费",
    official: "https://www.ica.gov.sg",
    note: "HK 护照赴新免签；入境前 3 天内填写 SG Arrival Card。",
  },
  {
    code: "KR",
    flag: "🇰🇷",
    name: "韩国",
    visa: "免签（需 K-ETA）",
    stays: "最长 90 天",
    fee: "K-ETA 约 US$3",
    official: "https://www.k-eta.go.kr",
    note: "HK 护照赴韩免签，但需提前获 K-ETA 电子旅行许可。",
  },
  {
    code: "SCH",
    flag: "🇪🇺",
    name: "申根区（欧洲）",
    visa: "须办申根签",
    stays: "最长 90 天 / 180 天",
    fee: "约 €80（签证费）",
    official: "https://europa.eu",
    note: "材料多、需预约录指纹；建议提前 1-2 个月办理，强制要求旅行保险（≥€3 万医疗保障）。",
  },
  {
    code: "US",
    flag: "🇺🇸",
    name: "美国",
    visa: "须办 B1/B2 签（或 ESTA）",
    stays: "B 签最长 180 天",
    fee: "约 US$185",
    official: "https://travel.state.gov",
    note: "需填 DS-160 + 面签；HK 护照若持 BNO 可申请 ESTA（更简单），HKSAR 护照须正式签证。",
  },
];

export type DocItem = { name: string; desc: string; tip?: string };

export const requiredDocs: DocItem[] = [
  { name: "护照 Passport", desc: "出国的「身份证」，最核心的证件", tip: "有效期须超过归国日 6 个月以上，至少 2-4 页空白签证页；快过期赶紧换发" },
  { name: "签证 Visa / e-Visa", desc: "目的地国家的「入场许可」", tip: "免签/落地签/电子签/贴纸签，各国不同；出发前务必确认最新政策" },
  { name: "往返机票行程单", desc: "入境时可能被查", tip: "打印纸质版或存手机离线版，部分国家入境必须出示" },
  { name: "酒店预订单", desc: "入境时可能被查", tip: "落地签/免签国家海关常查，建议打印或离线保存" },
];

export const recommendedDocs: DocItem[] = [
  { name: "驾照翻译公证件", desc: "国外租车自驾用", tip: "中国未加入联合国道路交通公约，所谓「国际驾照IDP」在很多国家不被法律承认；实际多需驾照英文翻译公证件，提前办公证" },
  { name: "旅行保险单", desc: "医疗、意外、航班延误理赔", tip: "买后打印保单 + 记下紧急救援电话；申根等强制要求" },
  { name: "身份证", desc: "国内段交通、酒店用", tip: "国内去机场、回来都要用，别因为出国就不带" },
  { name: "信用卡", desc: "境外消费、租车押金", tip: "带 Visa/Mastercard（很多地方不支持银联）；建议两张，一主一备" },
];

export const overlooked: DocItem[] = [
  { name: "护照复印件 / 扫描件", desc: "护照丢了的救星", tip: "提前复印 + 存邮箱/云盘，丢了去大使馆补办更快" },
  { name: "证件照电子版", desc: "补办护照、办落地签可能要用", tip: "存手机里备用" },
  { name: "入境卡 / 海关申报单", desc: "飞机上空姐会发", tip: "提前查好怎么填，别到时候乱写" },
  { name: "疫苗接种证明", desc: "部分国家仍要求", tip: "如黄热病疫苗（非洲/南美部分地区）；目的地无强制则可不办" },
  { name: "当地紧急联系方式", desc: "突发情况救命", tip: "中国驻当地大使馆电话、报警、急救，存手机里" },
];

export type VisaType = { type: string; difficulty: string; examples: string; key: string };

export const visaTypes: VisaType[] = [
  { type: "免签", difficulty: "⭐", examples: "泰国、阿联酋、塞尔维亚、斐济等", key: "拿护照直接去，注意停留天数限制" },
  { type: "落地签", difficulty: "⭐⭐", examples: "越南(部分)、柬埔寨、老挝、埃及等", key: "提前备好照片、现金(签证费)、酒店单、往返机票" },
  { type: "电子签 e-Visa", difficulty: "⭐⭐", examples: "越南、土耳其、印度、澳洲等", key: "网上申请、出签快，打印出来带着" },
  { type: "贴纸签", difficulty: "⭐⭐⭐⭐", examples: "美国、加拿大、申根、英国、日本(部分)等", key: "材料多、审核严、可能面签；提前 1-2 个月办" },
];

export type CostItem = { item: string; cost: string; note: string };

export const costs: CostItem[] = [
  { item: "护照（首次/换发）", cost: "¥120", note: "出入境管理局办理；遗失补发 ¥120" },
  { item: "越南 e-Visa", cost: "约 US$25–90", note: "单次约 $25，多次 $50/$90；线上支付" },
  { item: "驾照翻译公证", cost: "¥200–400", note: "公证处办理，约 3-7 工作日" },
  { item: "旅行保险（短途）", cost: "¥30–150", note: "按天数/保额；申根强制 ≥€3 万医疗" },
  { item: "证件照", cost: "¥30–80", note: "办签证/补办护照用，建议提前拍好" },
  { item: "国际信用卡年费", cost: "¥0–数百", note: "很多免年费卡，境外返现/免货币转换费更优" },
  { item: "K-ETA(韩)/ESTA(美BNO)", cost: "约 US$3–21", note: "电子许可，2 年有效" },
];

// Vietnam e-Visa step-by-step (the relevant one for Phu Quoc)
export const evisaSteps: string[] = [
  "进入越南移民局 e-Visa 官网（evisa.xuatnhapcanh.gov.vn），点「Apply e-visa」",
  "填写申请表：个人信息、护照信息、入境口岸（富国岛选 Phu Quoc Int'l Airport）、入境日期",
  "上传白底证件照 + 护照人像页扫描件（按官网尺寸要求）",
  "在线支付签证费（信用卡，单次约 US$25）",
  "等待审批：通常 3-5 个工作日，结果发到邮箱",
  "下载并打印 e-Visa（A4 彩色或黑白均可），随护照一同携带入境",
];

export const evisaLinks = {
  official: "https://evisa.xuatnhapcanh.gov.vn",
  // tutorial search links (so the user can find the latest walkthrough videos)
  bilibili: "https://search.bilibili.com/all?keyword=%E8%B6%8A%E5%8D%97%E7%94%B5%E5%AD%90%E7%AD%BE%E7%94%B3%E8%AF%B7%E6%95%99%E7%A8%8B",
  youtube: "https://www.youtube.com/results?search_query=vietnam+evisa+application+tutorial",
  xiaohongshu: "https://www.xiaohongshu.com/search_result?keyword=%E8%B6%8A%E5%8D%97%E7%94%B5%E5%AD%90%E7%AD%BE",
};

export const officialSources = [
  { name: "中国领事服务网（出国指南 / 最新提醒）", url: "https://cs.mfa.gov.cn" },
  { name: "越南电子签官网", url: "https://evisa.xuatnhapcanh.gov.vn" },
  { name: "香港入境事务处（护照 / 出入境）", url: "https://www.immd.gov.hk" },
  { name: "国家移民管理局（护照办理）", url: "https://www.nia.gov.cn" },
];

export type ChecklistGroup = { name: string; emoji: string; items: string[] };

export const checklistGroups: ChecklistGroup[] = [
  {
    name: "证件与文件",
    emoji: "🛂",
    items: [
      "护照有效期 > 6 个月，且有 2-4 页空白页",
      "签证 / e-Visa 已出签（或确认免签 / 落地签政策）",
      "往返机票行程单（打印或存手机离线）",
      "酒店预订单（打印或存手机）",
      "护照复印件 / 扫描件（单独存放）",
      "证件照电子版 + 打印件",
      "国际驾照翻译公证件（如需自驾）",
    ],
  },
  {
    name: "钱与支付",
    emoji: "💰",
    items: [
      "越南盾现金（多备小面额）",
      "Visa / Mastercard 两张（一主一备）",
      "少量港元备用金",
      "手机绑定境外可用支付 / 告知银行出境",
    ],
  },
  {
    name: "健康与安全",
    emoji: "🏥",
    items: [
      "旅行保险单 + 紧急救援电话",
      "常用药（肠胃 / 感冒 / 晕车）",
      "防晒 SPF50+ + 防蚊液",
      "创可贴 / 消毒用品",
      "紧急联系方式（领事 / 报警 113 / 急救 115）",
    ],
  },
  {
    name: "电子与通讯",
    emoji: "📱",
    items: [
      "手机 + 充电器 + 移动电源",
      "越南 SIM / eSIM（流量）",
      "转换插头（220V · 插座 A / C / D）",
      "数据线 / 耳机",
      "离线地图 + 翻译 App",
    ],
  },
  {
    name: "衣物与日用品",
    emoji: "👕",
    items: [
      "夏装 + 防晒衣",
      "泳衣 / 沙滩装备",
      "沙滩拖鞋",
      "帽子 + 太阳镜",
      "薄雨衣（雨季）",
    ],
  },
  {
    name: "出发前确认",
    emoji: "✅",
    items: [
      "航班值机 / 再次确认时间",
      "确认酒店入住时间",
      "手机开通国际漫游 / 买好流量",
      "告知家人行程",
      "家中断电、关好门窗（长离开时）",
    ],
  },
];

// common pitfalls
export const pitfalls: string[] = [
  "护照有效期不足 6 个月—— 很多国家直接拒绝入境，哪怕签证有效也没用",
  "免签/落地签政策变了—— 出发前一周再确认一次，政策可能随时调整",
  "只带银联卡—— 国外很多地方刷不了，务必带 Visa 或 Mastercard",
];
