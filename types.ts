
export interface Category {
  id: string;
  name: {
    en: string;
    ar: string;
  };
}

export type LandmarkType = string; // id of Category
export type Governorate = string; // id of Category

export interface Landmark {
  id: string;
  name: {
    en: string;
    ar: string;
  };
  type: LandmarkType;
  governorate: Governorate;
  coords: [number, number];
  images: string[];
  description: {
    en: string;
    ar: string;
  };
}

export type Language = 'en' | 'ar';

export interface Translations {
  // General UI
  title: string;
  searchPlaceholder: string;
  filters: string;
  governorate: string;
  type: string;
  clearFilters: string;
  all: string;
  
  // App Navigation
  adminPanel: string;
  viewMap: string;
  explorer: string;
  
  // Admin Labels
  manageCategories: string;
  manageLandmarks: string;
  manageTranslations: string;
  addLandmark: string;
  editLandmark: string;
  addCategory: string;
  categoryName: string;
  save: string;
  cancel: string;
  deleteConfirm: string;
  duplicate: string;
  noResults: string;
  actions: string;
  landmark: string;
  location: string;
  nameEn: string;
  nameAr: string;

  // Admin Dashboard & Details (New)
  overview: string;
  welcomeBack: string;
  totalLandmarks: string;
  totalGovernorates: string;
  totalCategories: string;
  totalTranslations: string;
  recentInventory: string;
  viewAll: string;
  basicDetails: string;
  descriptionEn: string;
  descriptionAr: string;
  locationCoordinates: string;
  latitude: string;
  longitude: string;
  clickMapTip: string;
  mediaGallery: string;
  addImage: string;
  noImages: string;
  adminConsole: string;
  version: string;
  main: string;
  configuration: string;
  dashboard: string;
  switchLanguage: string;
  exit: string;
  manageGovernorates: string;
  manageTypes: string;
  manageGovernoratesDesc: string;
  manageTypesDesc: string;
  addRegion: string;
  addType: string;
  editCategory: string;
  newCategory: string;
  saveChanges: string;
  usedByLandmarks: string;
  deleteCategoryConfirm: string;
  manageLandmarksDesc: string;
  manageTranslationsDesc: string;
  key: string;
  english: string;
  arabic: string;
}

export type TranslationMap = Record<Language, Translations>;
