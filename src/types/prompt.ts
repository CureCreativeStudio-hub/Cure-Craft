export type SubjectCategory = 'person' | 'creature' | 'product' | 'architecture' | 'abstract';

export type OutputFormat = 'prose' | 'midjourney' | 'flux' | 'structured';

export interface PromptConfig {
  // 01 — Render style and medium
  renderStyle: {
    selected: string;
    customDescription: string;
  };

  // 02 — Subject and purpose
  purpose: {
    selected: string;
    customConcept: string;
  };

  // 03 — Brand identity and color palette
  brandIdentity: {
    presetPalette: string;
    customColors: string;
    hexCodes: string[];
  };

  // 04 — Typography style
  typography: {
    style: string;
    fontCharacteristics: string;
    placement: string;
    exactWording: string;
  };

  // 05 — Subject and person
  subjectPerson: {
    category: SubjectCategory;
    gender: string;
    ageRange: string;
    bodyBuild: string;
    skinTone: string;
    characteristics: string[];
    customSubjectDescription: string;
  };

  // 06 — Face, expression, hair, and accessories
  faceDetails: {
    expression: string;
    hairstyle: string;
    hairColorTexture: string;
    headwear: string;
    eyewear: string;
    facialAccessories: string[];
    customFaceDetails: string;
  };

  // 07 — Pose and body language
  pose: {
    selected: string;
    customPose: string;
  };

  // 08 — Outfit and dressing
  outfit: {
    styles: string[];
    customOutfitDescription: string;
  };

  // 09 — Camera angle, crop, lens, and aspect ratio
  cameraComposition: {
    angle: string;
    cropShot: string;
    lens: string;
    aspectRatio: string;
    depthOfField: string;
    perspective: string;
    compositionRule: string;
  };

  // 10 — Background and location
  background: {
    preset: string;
    customBackground: string;
  };

  // 11 — Lighting and mood
  lightingMood: {
    lighting: string;
    mood: string;
    customLightingMood: string;
  };

  // 12 — Image quality and technical specifications
  quality: {
    presets: string[];
    renderEngine: string;
    rawAesthetic: boolean;
  };

  // 13 — Props, effects, and additional elements
  propsEffects: {
    items: string[];
    customProps: string;
  };

  // 14 — Negative prompt
  negativePrompt: {
    exclusions: string[];
    customNegative: string;
    enabled: boolean;
  };
}

export interface CompletenessScore {
  total: number; // 0 - 100
  categoriesCompleted: number;
  totalCategories: number;
  breakdown: {
    key: string;
    label: string;
    earned: number;
    max: number;
    completed: boolean;
    reason?: string;
  }[];
  suggestions: string[];
}

export interface SavedPrompt {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  promptText: string;
  negativeText: string;
  format: OutputFormat;
  config: PromptConfig;
  tags?: string[];
}

export interface HeaderSettings {
  imageUrl: string | null;
  imageMode: 'banner' | 'avatar';
  darkOverlayOpacity: number; // 0 to 90
  blurAmount: number; // 0 to 12
  positionY: 'top' | 'center' | 'bottom';
}
