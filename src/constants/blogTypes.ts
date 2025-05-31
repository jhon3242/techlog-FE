export interface BlogType {
  id: string;
  name: string;
  logo: string;
  color: string;
}

export const blogTypeLogos: { [key: string]: string } = {
  WOOWABRO: "/images/woowa-icon.png",
  NAVER: "/images/naver-icon.png",
  LINE: "/images/line-icon.png",
  KAKAO_PAY: "/images/kakao-pay-icon.png",
  KAKAO: "/images/kakao-icon.png",
  COUPANG: "/images/coupang-icon.png",
  TOSS: "/images/toss-icon.png",
  DAANGN: "/images/daangn-icon.png",
  WATCHA: "/images/watcha-icon.png",
  MUSINSA: "/images/musinsa-icon.png",
  ZIGBANG: "/images/zigbang-icon.png",
  MEGAZONE_CLOUD: "/images/megazone-cloud-icon.png",
  YANOLJA_CLOUD: "/images/yanolja-cloud-icon.png",
  WANTED: "/images/wanted-icon.png",
  NAVER_PLACE: "/images/naver-place-icon.png",
  STYLE_SHARE: "/images/style-share-icon.png",
  NHN: "/images/nhn-icon.png",
  KURLY: "/images/kurly-icon.png",
  YEOGI: "/images/yeogi-icon.png"
};

export const blogTypeColors: { [key: string]: string } = {
  WOOWABRO: "#40E0D0",
  NAVER: "#03C75A",
  LINE: "#00B900",
  KAKAO_PAY: "#FFE600",
  KAKAO: "#FFE600",
  COUPANG: "#FF4E50",
  TOSS: "#0064FF",
  DAANGN: "#E78111",
  WATCHA: "#FF0558",
  MUSINSA: "#000000",
  ZIGBANG: "#FF6B00",
  MEGAZONE_CLOUD: "#000000",
  YANOLJA_CLOUD: "#172B4D",
  WANTED: "#0066FF",
  NAVER_PLACE: "#03C75A",
  STYLE_SHARE: "#000000",
  NHN: "#191919",
  KURLY: "#5F0080",
  YEOGI: "#F83747"
};

export const blogTypeNames: Record<string, string> = {
  'WOOWABRO': '우아한형제들',
  'NAVER': '네이버',
  'LINE': '라인',
  'KAKAO_PAY': '카카오페이',
  'KAKAO': '카카오',
  'COUPANG': '쿠팡',
  'TOSS': '토스',
  'DAANGN': '당근',
  'WATCHA': '왓챠',
  'MUSINSA': '무신사',
  'ZIGBANG': '직방',
  'MEGAZONE_CLOUD': '메가존 클라우드',
  'YANOLJA_CLOUD': '야놀자 클라우드',
  'WANTED': '원티드',
  'NAVER_PLACE': '네이버 플레이스',
  'STYLE_SHARE': '스타일쉐어',
  'NHN': 'NHN',
  'KURLY': '마켓컬리',
  'YEOGI': '여기어때'
};

export const companyLogos: BlogType[] = [
  { id: 'WOOWABRO', name: blogTypeNames['WOOWABRO'], logo: blogTypeLogos['WOOWABRO'], color: blogTypeColors['WOOWABRO'] },
  { id: 'NAVER', name: blogTypeNames['NAVER'], logo: blogTypeLogos['NAVER'], color: blogTypeColors['NAVER'] },
  { id: 'LINE', name: blogTypeNames['LINE'], logo: blogTypeLogos['LINE'], color: blogTypeColors['LINE'] },
  { id: 'KAKAO_PAY', name: blogTypeNames['KAKAO_PAY'], logo: blogTypeLogos['KAKAO_PAY'], color: blogTypeColors['KAKAO_PAY'] },
  { id: 'KAKAO', name: blogTypeNames['KAKAO'], logo: blogTypeLogos['KAKAO'], color: blogTypeColors['KAKAO'] },
  { id: 'COUPANG', name: blogTypeNames['COUPANG'], logo: blogTypeLogos['COUPANG'], color: blogTypeColors['COUPANG'] },
  { id: 'TOSS', name: blogTypeNames['TOSS'], logo: blogTypeLogos['TOSS'], color: blogTypeColors['TOSS'] },
  { id: 'DAANGN', name: blogTypeNames['DAANGN'], logo: blogTypeLogos['DAANGN'], color: blogTypeColors['DAANGN'] },
  { id: 'WATCHA', name: blogTypeNames['WATCHA'], logo: blogTypeLogos['WATCHA'], color: blogTypeColors['WATCHA'] },
  { id: 'MUSINSA', name: blogTypeNames['MUSINSA'], logo: blogTypeLogos['MUSINSA'], color: blogTypeColors['MUSINSA'] },
  { id: 'ZIGBANG', name: blogTypeNames['ZIGBANG'], logo: blogTypeLogos['ZIGBANG'], color: blogTypeColors['ZIGBANG'] },
  { id: 'MEGAZONE_CLOUD', name: blogTypeNames['MEGAZONE_CLOUD'], logo: blogTypeLogos['MEGAZONE_CLOUD'], color: blogTypeColors['MEGAZONE_CLOUD'] },
  { id: 'YANOLJA_CLOUD', name: blogTypeNames['YANOLJA_CLOUD'], logo: blogTypeLogos['YANOLJA_CLOUD'], color: blogTypeColors['YANOLJA_CLOUD'] },
  { id: 'WANTED', name: blogTypeNames['WANTED'], logo: blogTypeLogos['WANTED'], color: blogTypeColors['WANTED'] },
  { id: 'NAVER_PLACE', name: blogTypeNames['NAVER_PLACE'], logo: blogTypeLogos['NAVER_PLACE'], color: blogTypeColors['NAVER_PLACE'] },
  { id: 'STYLE_SHARE', name: blogTypeNames['STYLE_SHARE'], logo: blogTypeLogos['STYLE_SHARE'], color: blogTypeColors['STYLE_SHARE'] },
  { id: 'NHN', name: blogTypeNames['NHN'], logo: blogTypeLogos['NHN'], color: blogTypeColors['NHN'] },
  { id: 'KURLY', name: blogTypeNames['KURLY'], logo: blogTypeLogos['KURLY'], color: blogTypeColors['KURLY'] },
  { id: 'YEOGI', name: blogTypeNames['YEOGI'], logo: blogTypeLogos['YEOGI'], color: blogTypeColors['YEOGI'] }
];

export const blogTypes = companyLogos.map(company => ({
  value: company.id,
  label: company.name
})); 
