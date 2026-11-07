export interface LanguageOption {
  code: string;
  name: string;
  country: string;
  flag: string;
}

export const G20_LANGUAGES: LanguageOption[] = [
  { code: 'ko', name: '한국어', country: '대한민국', flag: '🇰🇷' },
  { code: 'en', name: 'English', country: 'United States / UK', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', country: '日本', flag: '🇯🇵' },
  { code: 'zh', name: '中文 (简体)', country: '中国', flag: '🇨🇳' },
  { code: 'es', name: 'Español', country: 'España / México', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', country: 'France', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', country: 'Deutschland', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', country: 'Italia', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', country: 'Brasil', flag: '🇧🇷' },
  { code: 'ru', name: 'Русский', country: 'Россия', flag: '🇷🇺' },
  { code: 'hi', name: 'हिन्दी', country: 'भारत', flag: '🇮🇳' },
  { code: 'id', name: 'Bahasa Indonesia', country: 'Indonesia', flag: '🇮🇩' },
  { code: 'tr', name: 'Türkçe', country: 'Türkiye', flag: '🇹🇷' },
  { code: 'ar', name: 'العربية', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'vi', name: 'Tiếng Việt', country: 'Việt Nam', flag: '🇻🇳' },
  { code: 'nl', name: 'Nederlands', country: 'Nederland', flag: '🇳🇱' },
  { code: 'pl', name: 'Polski', country: 'Polska', flag: '🇵🇱' },
  { code: 'sv', name: 'Svenska', country: 'Sverige', flag: '🇸🇪' },
  { code: 'th', name: 'ไทย', country: 'ประเทศไทย', flag: '🇹🇭' },
  { code: 'af', name: 'Afrikaans', country: 'South Africa', flag: '🇿🇦' }
];

export interface TranslationDict {
  subtitle: string;
  studioEdition: string;
  adminMode: string;
  themeManager: string;
  modelSettings: string;
  googleSheetSync: string;
  logout: string;
  licenseVerification: string;
  enterLicensePrompt: string;
  licenseKeyLabel: string;
  licenseKeyPlaceholder: string;
  loginButton: string;
  quickTestKeys: string;
  googleSheetGuideLink: string;
  providerApiKey: string;
  currentModel: string;
  autoTokenOptimized: string;
  changeModel: string;
  themeLabel: string;
  selectThemePlaceholder: string;
  noThemesRegistered: string;
  noThemesAdminPrompt: string;
  addThemeAdmin: string;
  trackCountLabel: string;
  tracksUnit: string;
  vocalLabel: string;
  vocalRandom: string;
  vocalMale: string;
  vocalFemale: string;
  vocalNone: string;
  startButton: string;
  stopButton: string;
  progressTitle: string;
  totalProgress: string;
  currentTaskTitle: string;
  waiting: string;
  completedModalTitle: string;
  tracksTab: string;
  youtubeTab: string;
  allInOneTab: string;
  copy: string;
  copied: string;
  copyAll: string;
  downloadTxt: string;
  close: string;
  expiredTitle: string;
  expiredDesc: string;
  expiredPaymentCta: string;
  expiredReenterKey: string;
  paymentNotice: string;
}

export const TRANSLATIONS: Record<string, TranslationDict> = {
  ko: {
    subtitle: 'YouTube Playlist Planning & Audio Production Suite',
    studioEdition: '스튜디오 에디션',
    adminMode: '관리자 모드 (Admin)',
    themeManager: '테마 관리 (Admin)',
    modelSettings: '모델 설정',
    googleSheetSync: '구글 시트 연동',
    logout: '로그아웃',
    licenseVerification: '라이선스 키 인증',
    enterLicensePrompt: '스튜디오 사용을 위해 발급받으신 라이선스 키를 입력해 주세요.',
    licenseKeyLabel: '라이선스 키',
    licenseKeyPlaceholder: '',
    loginButton: '접속하기',
    quickTestKeys: '테스트용 키 (권한별 모드 확인):',
    googleSheetGuideLink: '구글 스프레드시트 연동 방법 안내',
    providerApiKey: 'API Key',
    currentModel: '현재 모델',
    autoTokenOptimized: '최저 토큰 자동 최적화',
    changeModel: '모델 변경',
    themeLabel: '1. 테마',
    selectThemePlaceholder: '테마를 선택해 주세요',
    noThemesRegistered: '등록된 테마가 없습니다',
    noThemesAdminPrompt: '등록된 테마가 없습니다 (관리자 등록 필요)',
    addThemeAdmin: '+ 새 테마 SOP 직접 등록하기 (Admin)',
    trackCountLabel: '2. 제작 곡 수',
    tracksUnit: '곡',
    vocalLabel: '3. 보컬 설정',
    vocalRandom: '랜덤',
    vocalMale: '남성',
    vocalFemale: '여성',
    vocalNone: '없음',
    startButton: '시작',
    stopButton: '중지',
    progressTitle: '제작 진행 상황',
    totalProgress: '전체 진행률',
    currentTaskTitle: '현재 작업',
    waiting: '대기 중...',
    completedModalTitle: '제작 완료 결과물',
    tracksTab: '1. 트랙 상세 정보',
    youtubeTab: '2. 유튜브 업로드 패키지',
    allInOneTab: '전체 모아보기',
    copy: '복사',
    copied: '복사됨!',
    copyAll: '전체 복사',
    downloadTxt: 'TXT 다운로드',
    close: '닫기',
    expiredTitle: '사용 기간이 만료되었습니다',
    expiredDesc: '현재 입력하신 라이선스의 사용 기한이 지났습니다. 서비스를 계속 이용하시려면 결제 후 이용해 주세요.',
    expiredPaymentCta: '결제 사이트 바로가기 (litt.ly/plymaster)',
    expiredReenterKey: '다른 라이선스 키 입력하기',
    paymentNotice: '결제 완료 후 신규 라이선스 키가 즉시 발급됩니다.'
  },
  en: {
    subtitle: 'YouTube Playlist Planning & Audio Production Suite',
    studioEdition: 'Studio Edition',
    adminMode: 'Admin Mode',
    themeManager: 'Themes (Admin)',
    modelSettings: 'Model Settings',
    googleSheetSync: 'Google Sheets',
    logout: 'Logout',
    licenseVerification: 'License Key Verification',
    enterLicensePrompt: 'Please enter your license key (UUID) to access the studio.',
    licenseKeyLabel: 'License Key',
    licenseKeyPlaceholder: '',
    loginButton: 'Connect',
    quickTestKeys: 'Test Keys for Quick Access:',
    googleSheetGuideLink: 'Google Sheets Integration Guide',
    providerApiKey: 'API Key',
    currentModel: 'Current Model',
    autoTokenOptimized: 'Auto Token Optimized',
    changeModel: 'Change Model',
    themeLabel: '1. Theme',
    selectThemePlaceholder: 'Select a theme',
    noThemesRegistered: 'No themes registered',
    noThemesAdminPrompt: 'No themes registered (Admin setup required)',
    addThemeAdmin: '+ Add New Theme SOP (Admin)',
    trackCountLabel: '2. Number of Tracks',
    tracksUnit: 'Tracks',
    vocalLabel: '3. Vocal Setting',
    vocalRandom: 'Random',
    vocalMale: 'Male',
    vocalFemale: 'Female',
    vocalNone: 'None',
    startButton: 'Start',
    stopButton: 'Stop',
    progressTitle: 'Production Progress',
    totalProgress: 'Total Progress',
    currentTaskTitle: 'Current Task',
    waiting: 'Waiting...',
    completedModalTitle: 'Generated Playlist Results',
    tracksTab: '1. Track Details',
    youtubeTab: '2. YouTube Package',
    allInOneTab: 'All in One',
    copy: 'Copy',
    copied: 'Copied!',
    copyAll: 'Copy All',
    downloadTxt: 'Download TXT',
    close: 'Close',
    expiredTitle: 'Your License Has Expired',
    expiredDesc: 'The validity period for this license key has ended. Please renew your subscription to continue using the studio.',
    expiredPaymentCta: 'Go to Payment Website (litt.ly/plymaster)',
    expiredReenterKey: 'Enter Another License Key',
    paymentNotice: 'A new license key will be issued immediately after payment.'
  },
  ja: {
    subtitle: 'YouTube プレイリスト企画・制作スタジオ',
    studioEdition: 'スタジオエディション',
    adminMode: '管理者モード (Admin)',
    themeManager: 'テーマ管理 (Admin)',
    modelSettings: 'モデル設定',
    googleSheetSync: 'スプレッドシート連携',
    logout: 'ログアウト',
    licenseVerification: 'ライセンスキー認証',
    enterLicensePrompt: 'スタジオを利用するにはライセンスキー（UUID）を入力してください。',
    licenseKeyLabel: 'ライセンスキー',
    licenseKeyPlaceholder: '',
    loginButton: '接続',
    quickTestKeys: 'テスト用キー:',
    googleSheetGuideLink: 'Googleスプレッドシート連携ガイド',
    providerApiKey: 'API Key',
    currentModel: '現在のモデル',
    autoTokenOptimized: 'トークン自動最適化',
    changeModel: 'モデル変更',
    themeLabel: '1. テーマ',
    selectThemePlaceholder: 'テーマを選択してください',
    noThemesRegistered: '登録されたテーマがありません',
    noThemesAdminPrompt: 'テーマ未登録 (管理者の登録が必要です)',
    addThemeAdmin: '+ 新規テーマSOP登録 (Admin)',
    trackCountLabel: '2. 制作曲数',
    tracksUnit: '曲',
    vocalLabel: '3. ボーカル設定',
    vocalRandom: 'ランダム',
    vocalMale: '男性',
    vocalFemale: '女性',
    vocalNone: 'なし',
    startButton: '開始',
    stopButton: '停止',
    progressTitle: '制作進行状況',
    totalProgress: '全体進捗率',
    currentTaskTitle: '現在のタスク',
    waiting: '待機中...',
    completedModalTitle: '制作完了結果',
    tracksTab: '1. トラック詳細',
    youtubeTab: '2. YouTubeアップロードパッケージ',
    allInOneTab: '全文表示',
    copy: 'コピー',
    copied: 'コピー完了！',
    copyAll: '一括コピー',
    downloadTxt: 'TXTダウンロード',
    close: '閉じる',
    expiredTitle: 'ご利用期限が満了しました',
    expiredDesc: 'このライセンスの有効期限（due date）が過ぎています。決済完了後に再度ご利用いただけます。',
    expiredPaymentCta: '決済サイトへ移動 (litt.ly/plymaster)',
    expiredReenterKey: '別のライセンスキーを入力',
    paymentNotice: '決済完了後、新しいライセンスが即座に発行されます。'
  },
  zh: {
    subtitle: 'YouTube 播放列表策划与制作工坊',
    studioEdition: '工作室版',
    adminMode: '管理员模式 (Admin)',
    themeManager: '主题管理 (Admin)',
    modelSettings: '模型设置',
    googleSheetSync: 'Google表格同步',
    logout: '退出登录',
    licenseVerification: '许可证密钥验证',
    enterLicensePrompt: '请输入您的许可证密钥 (UUID) 以访问工作室。',
    licenseKeyLabel: '许可证密钥',
    licenseKeyPlaceholder: '',
    loginButton: '连接',
    quickTestKeys: '快速测试密钥:',
    googleSheetGuideLink: 'Google表格集成指南',
    providerApiKey: 'API Key',
    currentModel: '当前模型',
    autoTokenOptimized: '最低Token自动优化',
    changeModel: '更改模型',
    themeLabel: '1. 主题',
    selectThemePlaceholder: '请选择一个主题',
    noThemesRegistered: '暂无已注册的主题',
    noThemesAdminPrompt: '暂无主题 (需管理员注册)',
    addThemeAdmin: '+ 添加新主题SOP (Admin)',
    trackCountLabel: '2. 制作曲目数',
    tracksUnit: '首',
    vocalLabel: '3. 人声设置',
    vocalRandom: '随机',
    vocalMale: '男声',
    vocalFemale: '女声',
    vocalNone: '纯音乐',
    startButton: '开始',
    stopButton: '停止',
    progressTitle: '制作进度',
    totalProgress: '整体进度',
    currentTaskTitle: '当前任务',
    waiting: '等待中...',
    completedModalTitle: '制作完成结果',
    tracksTab: '1. 曲目详情',
    youtubeTab: '2. YouTube上传包',
    allInOneTab: '全部汇总',
    copy: '复制',
    copied: '已复制！',
    copyAll: '全部复制',
    downloadTxt: '下载TXT',
    close: '关闭',
    expiredTitle: '许可证已过期',
    expiredDesc: '此许可证的使用期限已过。请前往付款网站充值或购买后继续使用。',
    expiredPaymentCta: '前往付款网站 (litt.ly/plymaster)',
    expiredReenterKey: '输入其他许可证密钥',
    paymentNotice: '付款完成后将立即发放新的有效密钥。'
  },
  es: {
    subtitle: 'Suite de Planificación y Producción de Playlists de YouTube',
    studioEdition: 'Edición Estudio',
    adminMode: 'Modo Administrador',
    themeManager: 'Temas (Admin)',
    modelSettings: 'Modelos',
    googleSheetSync: 'Google Sheets',
    logout: 'Cerrar sesión',
    licenseVerification: 'Verificación de Licencia',
    enterLicensePrompt: 'Ingrese su clave de licencia (UUID) para acceder al estudio.',
    licenseKeyLabel: 'Clave de Licencia',
    licenseKeyPlaceholder: '',
    loginButton: 'Conectar',
    quickTestKeys: 'Claves de prueba:',
    googleSheetGuideLink: 'Guía de Google Sheets',
    providerApiKey: 'API Key',
    currentModel: 'Modelo actual',
    autoTokenOptimized: 'Optimizado de Tokens',
    changeModel: 'Cambiar',
    themeLabel: '1. Tema',
    selectThemePlaceholder: 'Seleccione un tema',
    noThemesRegistered: 'No hay temas registrados',
    noThemesAdminPrompt: 'Sin temas (Registro de admin requerido)',
    addThemeAdmin: '+ Agregar Tema SOP (Admin)',
    trackCountLabel: '2. Cantidad de Canciones',
    tracksUnit: 'canciones',
    vocalLabel: '3. Voz',
    vocalRandom: 'Aleatorio',
    vocalMale: 'Masculino',
    vocalFemale: 'Femenino',
    vocalNone: 'Instrumental',
    startButton: 'Iniciar',
    stopButton: 'Detener',
    progressTitle: 'Progreso de Producción',
    totalProgress: 'Progreso Total',
    currentTaskTitle: 'Tarea Actual',
    waiting: 'Esperando...',
    completedModalTitle: 'Resultado del Playlist',
    tracksTab: '1. Detalles de Pistas',
    youtubeTab: '2. Paquete YouTube',
    allInOneTab: 'Ver Todo',
    copy: 'Copiar',
    copied: '¡Copiado!',
    copyAll: 'Copiar Todo',
    downloadTxt: 'Descargar TXT',
    close: 'Cerrar',
    expiredTitle: 'Su licencia ha expirado',
    expiredDesc: 'El período de validez de esta clave ha finalizado. Realice el pago para continuar.',
    expiredPaymentCta: 'Ir al sitio de pago (litt.ly/plymaster)',
    expiredReenterKey: 'Ingresar otra clave',
    paymentNotice: 'Se emitirá una nueva clave inmediatamente después del pago.'
  }
};

export function getTranslation(lang: string): TranslationDict {
  return TRANSLATIONS[lang] || TRANSLATIONS['en'] || TRANSLATIONS['ko'];
}
