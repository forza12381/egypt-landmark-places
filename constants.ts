
import { Landmark, TranslationMap, Category } from './types';

export const INITIAL_GOVERNORATES: Category[] = [
  { id: 'beni-suef', name: { en: 'Beni Suef', ar: 'بني سويف' } },
  { id: 'fayoum', name: { en: 'Fayoum', ar: 'الفيوم' } }
];

export const INITIAL_TYPES: Category[] = [
  { id: 'temple', name: { en: 'Temple', ar: 'معبد' } },
  { id: 'pyramid', name: { en: 'Pyramid', ar: 'هرم' } },
  { id: 'religious', name: { en: 'Religious Site', ar: 'موقع ديني' } },
  { id: 'museum', name: { en: 'Museum', ar: 'متحف' } },
  { id: 'natural', name: { en: 'Natural Landmark', ar: 'معلم طبيعي' } },
  { id: 'archaeological', name: { en: 'Archaeological Site', ar: 'موقع أثري' } }
];

export const INITIAL_LANDMARKS: Landmark[] = [
  {
    id: 'meidum-pyramid',
    name: { en: 'Meidum Pyramid', ar: 'هرم ميدوم' },
    type: 'pyramid',
    governorate: 'beni-suef',
    coords: [29.3886, 31.1578],
    images: [
      'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1601597111158-2fcee29ec4d0?auto=format&fit=crop&q=80&w=1000'
    ],
    description: {
      en: 'The Meidum Pyramid is thought to have been built for Huni, the last pharaoh of the Third Dynasty, and continued by Sneferu. It marks the transition from the "step" pyramid to the "true" smooth-sided pyramid structure.',
      ar: 'يعتقد أن هرم ميدوم قد بني للملك حوني، آخر ملوك الأسرة الثالثة، واستكمله الملك سنفرو. يمثل الهرم مرحلة الانتقال من الهرم المدرج إلى الهرم الكامل ذو الأسطح الملساء.'
    }
  },
  {
    id: 'deir-el-adhra',
    name: { en: 'Monastery of the Virgin Mary', ar: 'دير العذراء مريم' },
    type: 'religious',
    governorate: 'beni-suef',
    coords: [29.0661, 31.0994],
    images: [
      'https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1590076215667-873d38354153?auto=format&fit=crop&q=80&w=1000'
    ],
    description: {
      en: 'Also known as the Monastery of Sannur, this ancient site is located in a cave where the Holy Family is believed to have rested during their flight into Egypt. It was formally established by Empress Helena in 328 AD.',
      ar: 'يُعرف أيضاً بدير بياض، ويقع في كف يعتقد أن العائلة المقدسة استراحت فيه خلال رحلتها إلى مصر. أسسته الملكة هيلانة عام 328 ميلادية.'
    }
  },
  {
    id: 'qarun-lake',
    name: { en: 'Qarun Lake', ar: 'بحيرة قارون' },
    type: 'natural',
    governorate: 'fayoum',
    coords: [29.475, 30.638],
    images: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=1000'
    ],
    description: {
      en: 'Lake Qarun is the remaining part of the ancient Moeris Lake. It is one of the oldest natural lakes in the world and a vital wetland for migratory birds and local biodiversity.',
      ar: 'تعتبر بحيرة قارون البقية الباقية من بحيرة موريس القديمة. وهي واحدة من أقدم البحيرات الطبيعية في العالم وتعد محمية طبيعية هامة للطيور المهاجرة والتنوع البيولوجي.'
    }
  }
];

export const INITIAL_TRANSLATIONS: TranslationMap = {
  en: {
    title: 'Egypt Landmarks',
    searchPlaceholder: 'Search landmarks...',
    filters: 'Filters',
    governorate: 'Governorate',
    type: 'Landmark Type',
    clearFilters: 'Clear All',
    all: 'All',
    adminPanel: 'Admin Panel',
    viewMap: 'View Map',
    explorer: 'Explorer',
    manageCategories: 'Categories',
    manageLandmarks: 'Landmarks',
    manageTranslations: 'Translations',
    addLandmark: 'Add Landmark',
    editLandmark: 'Edit Landmark',
    addCategory: 'Add New',
    categoryName: 'Category Name',
    save: 'Save',
    cancel: 'Cancel',
    deleteConfirm: 'Are you sure? This action cannot be undone.',
    duplicate: 'Duplicate',
    noResults: 'No results found.',
    actions: 'Actions',
    landmark: 'Landmark',
    location: 'Location',
    nameEn: 'Name (EN)',
    nameAr: 'Name (AR)',

    // NEW KEYS
    overview: 'Overview',
    welcomeBack: 'Welcome back to the command center.',
    totalLandmarks: 'Total Landmarks',
    totalGovernorates: 'Total Governorates',
    totalCategories: 'Total Categories',
    totalTranslations: 'Total Translations',
    recentInventory: 'Recent Inventory',
    viewAll: 'View All',
    basicDetails: 'Basic Details',
    descriptionEn: 'Description (English)',
    descriptionAr: 'Description (Arabic)',
    locationCoordinates: 'Location & Coordinates',
    latitude: 'Latitude',
    longitude: 'Longitude',
    clickMapTip: 'Click anywhere on the map to automatically update the latitude and longitude coordinates.',
    mediaGallery: 'Media Gallery',
    addImage: 'Add Image',
    noImages: 'No images added yet.',
    adminConsole: 'Admin Console',
    version: 'v2.0 System',
    main: 'Main',
    configuration: 'Configuration',
    dashboard: 'Dashboard',
    switchLanguage: 'Switch to Arabic',
    exit: 'Exit System',
    manageGovernorates: 'Governorates',
    manageTypes: 'Landmark Types',
    manageGovernoratesDesc: 'Manage region definitions.',
    manageTypesDesc: 'Manage landmark classifications.',
    addRegion: 'Add Region',
    addType: 'Add Category',
    editCategory: 'Edit Category',
    newCategory: 'New Category',
    saveChanges: 'Save Changes',
    usedByLandmarks: 'Landmarks',
    deleteCategoryConfirm: 'Delete this category?',
    manageLandmarksDesc: 'Manage your historical database.',
    manageTranslationsDesc: 'Localize application text content.',
    key: 'Key',
    english: 'English',
    arabic: 'Arabic'
  },
  ar: {
    title: 'معالم مصر',
    searchPlaceholder: 'ابحث عن المعالم...',
    filters: 'التصنيفات',
    governorate: 'المحافظة',
    type: 'نوع المعلم',
    clearFilters: 'مسح الكل',
    all: 'الكل',
    adminPanel: 'لوحة التحكم',
    viewMap: 'عرض الخريطة',
    explorer: 'المستكشف',
    manageCategories: 'التصنيفات',
    manageLandmarks: 'المعالم',
    manageTranslations: 'الترجمات',
    addLandmark: 'إضافة معلم',
    editLandmark: 'تعديل المعلم',
    addCategory: 'إضافة جديد',
    categoryName: 'اسم التصنيف',
    save: 'حفظ',
    cancel: 'إلغاء',
    deleteConfirm: 'هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.',
    duplicate: 'نسخ',
    noResults: 'لا توجد نتائج.',
    actions: 'إجراءات',
    landmark: 'المعلم',
    location: 'الموقع',
    nameEn: 'الاسم (EN)',
    nameAr: 'الاسم (AR)',

    // NEW KEYS
    overview: 'نظرة عامة',
    welcomeBack: 'مرحباً بك في لوحة التحكم.',
    totalLandmarks: 'إجمالي المعالم',
    totalGovernorates: 'إجمالي المحافظات',
    totalCategories: 'إجمالي التصنيفات',
    totalTranslations: 'إجمالي الترجمات',
    recentInventory: 'أحدث الإضافات',
    viewAll: 'عرض الكل',
    basicDetails: 'التفاصيل الأساسية',
    descriptionEn: 'الوصف (إنجليزي)',
    descriptionAr: 'الوصف (عربي)',
    locationCoordinates: 'الموقع والإحداثيات',
    latitude: 'دائرة العرض',
    longitude: 'خط الطول',
    clickMapTip: 'انقر في أي مكان على الخريطة لتحديث الإحداثيات تلقائياً.',
    mediaGallery: 'معرض الوسائط',
    addImage: 'إضافة صورة',
    noImages: 'لم يتم إضافة صور بعد.',
    adminConsole: 'لوحة الإدارة',
    version: 'نظام v2.0',
    main: 'الرئيسية',
    configuration: 'الإعدادات',
    dashboard: 'لوحة المعلومات',
    switchLanguage: 'التبديل للإنجليزية',
    exit: 'خروج',
    manageGovernorates: 'المحافظات',
    manageTypes: 'أنواع المعالم',
    manageGovernoratesDesc: 'إدارة تعريفات المناطق.',
    manageTypesDesc: 'إدارة تصنيفات المعالم.',
    addRegion: 'إضافة محافظة',
    addType: 'إضافة تصنيف',
    editCategory: 'تعديل التصنيف',
    newCategory: 'تصنيف جديد',
    saveChanges: 'حفظ التغييرات',
    usedByLandmarks: 'معلم مرتبط',
    deleteCategoryConfirm: 'حذف هذا التصنيف؟',
    manageLandmarksDesc: 'إدارة قاعدة البيانات التاريخية.',
    manageTranslationsDesc: 'ترجمة محتوى التطبيق.',
    key: 'المفتاح',
    english: 'إنجليزي',
    arabic: 'عربي'
  }
};
