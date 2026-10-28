import { OutputFormat, PromptConfig } from '../types/prompt';
import { SECTION_OPTIONS } from '../data/sectionsData';

export interface GeneratedOutput {
  promptText: string;
  negativeText: string;
  wordCount: number;
  charCount: number;
}

export function generatePrompt(config: PromptConfig, format: OutputFormat = 'prose'): GeneratedOutput {
  const isHumanOrCreature = config.subjectPerson.category === 'person' || config.subjectPerson.category === 'creature';
  const isProduct = config.subjectPerson.category === 'product';
  const isArchitecture = config.subjectPerson.category === 'architecture';
  const isAbstract = config.subjectPerson.category === 'abstract';

  // 1. Medium & Style opening
  let styleClause = '';
  if (config.renderStyle.selected && config.renderStyle.selected !== 'Custom style') {
    styleClause = config.renderStyle.selected;
  }
  if (config.renderStyle.customDescription?.trim()) {
    styleClause = styleClause
      ? `${styleClause}, ${config.renderStyle.customDescription.trim()}`
      : config.renderStyle.customDescription.trim();
  }
  if (!styleClause) {
    styleClause = 'High-end visual artwork';
  }

  // 2. Purpose & Context
  let purposeClause = '';
  if (config.purpose.selected) {
    purposeClause = `for a ${config.purpose.selected.toLowerCase()}`;
  }
  if (config.purpose.customConcept?.trim()) {
    purposeClause = purposeClause
      ? `${purposeClause} featuring ${config.purpose.customConcept.trim()}`
      : `featuring ${config.purpose.customConcept.trim()}`;
  }

  // 3. Subject Identity
  let subjectSentence = '';
  if (isHumanOrCreature) {
    const subjectTokens: string[] = [];
    if (config.subjectPerson.bodyBuild) subjectTokens.push(config.subjectPerson.bodyBuild.toLowerCase());
    if (config.subjectPerson.skinTone) subjectTokens.push(`with ${config.subjectPerson.skinTone.toLowerCase()} skin`);
    if (config.subjectPerson.ageRange) subjectTokens.push(config.subjectPerson.ageRange.toLowerCase());
    if (config.subjectPerson.gender) subjectTokens.push(config.subjectPerson.gender.toLowerCase());
    if (config.subjectPerson.characteristics?.length > 0) {
      subjectTokens.push(`with ${config.subjectPerson.characteristics.map(c => c.toLowerCase()).join(' and ')}`);
    }

    let coreSubject = subjectTokens.length > 0 ? subjectTokens.join(' ') : 'subject';
    if (config.subjectPerson.customSubjectDescription?.trim()) {
      coreSubject = `${coreSubject}, ${config.subjectPerson.customSubjectDescription.trim()}`;
    }

    // Face & Features
    const faceTokens: string[] = [];
    if (config.faceDetails.expression) faceTokens.push(`a ${config.faceDetails.expression.toLowerCase()} expression`);
    if (config.faceDetails.hairstyle) {
      const hairDesc = config.faceDetails.hairColorTexture
        ? `${config.faceDetails.hairColorTexture.toLowerCase()} styled into a ${config.faceDetails.hairstyle.toLowerCase()}`
        : config.faceDetails.hairstyle.toLowerCase();
      faceTokens.push(hairDesc);
    }
    if (config.faceDetails.eyewear && config.faceDetails.eyewear !== 'None') {
      faceTokens.push(`wearing ${config.faceDetails.eyewear.toLowerCase()}`);
    }
    if (config.faceDetails.headwear && config.faceDetails.headwear !== 'None') {
      faceTokens.push(`wearing ${config.faceDetails.headwear.toLowerCase()}`);
    }
    if (config.faceDetails.facialAccessories?.length > 0) {
      faceTokens.push(`accented with ${config.faceDetails.facialAccessories.map(a => a.toLowerCase()).join(', ')}`);
    }
    if (config.faceDetails.customFaceDetails?.trim()) {
      faceTokens.push(config.faceDetails.customFaceDetails.trim());
    }

    const faceSummary = faceTokens.length > 0 ? `. Features ${faceTokens.join(', ')}` : '';

    // Pose
    let poseClause = '';
    if (config.pose.selected) {
      poseClause = `Posed in ${config.pose.selected.toLowerCase()}`;
    }
    if (config.pose.customPose?.trim()) {
      poseClause = poseClause
        ? `${poseClause}, ${config.pose.customPose.trim()}`
        : `Posed ${config.pose.customPose.trim()}`;
    }

    // Outfit
    let outfitClause = '';
    if (config.outfit.styles?.length > 0) {
      outfitClause = `Dressed in ${config.outfit.styles.map(s => s.toLowerCase()).join(' and ')}`;
    }
    if (config.outfit.customOutfitDescription?.trim()) {
      outfitClause = outfitClause
        ? `${outfitClause} consisting of ${config.outfit.customOutfitDescription.trim()}`
        : `Dressed in ${config.outfit.customOutfitDescription.trim()}`;
    }

    subjectSentence = `Depicting a ${coreSubject}${faceSummary}.`;
    if (outfitClause) subjectSentence += ` ${outfitClause}.`;
    if (poseClause) subjectSentence += ` ${poseClause}.`;
  } else if (isProduct) {
    let productDesc = config.subjectPerson.customSubjectDescription?.trim() || 'an exquisite designer product';
    if (config.pose.customPose?.trim()) {
      productDesc += `, presented ${config.pose.customPose.trim()}`;
    }
    subjectSentence = `Focusing on ${productDesc}.`;
  } else if (isArchitecture) {
    const archDesc = config.subjectPerson.customSubjectDescription?.trim() || 'a striking architectural structure';
    subjectSentence = `Showcasing ${archDesc}.`;
  } else {
    // Abstract
    const absDesc = config.subjectPerson.customSubjectDescription?.trim() || 'an expressive abstract visual exploration';
    subjectSentence = `Centerpiece is ${absDesc}.`;
  }

  // 4. Camera & Composition
  const cameraTokens: string[] = [];
  if (config.cameraComposition.cropShot) cameraTokens.push(config.cameraComposition.cropShot.toLowerCase());
  if (config.cameraComposition.angle) cameraTokens.push(`from an ${config.cameraComposition.angle.toLowerCase()}`);
  if (config.cameraComposition.lens) cameraTokens.push(`captured with a ${config.cameraComposition.lens}`);
  if (config.cameraComposition.compositionRule) cameraTokens.push(`utilizing ${config.cameraComposition.compositionRule.toLowerCase()}`);
  if (config.cameraComposition.depthOfField) cameraTokens.push(config.cameraComposition.depthOfField.toLowerCase());
  if (config.cameraComposition.perspective) cameraTokens.push(config.cameraComposition.perspective.toLowerCase());

  const cameraSentence = cameraTokens.length > 0 ? `Composition is framed as a ${cameraTokens.join(', ')}.` : '';

  // 5. Background & Environment
  let bgSentence = '';
  const bgTokens: string[] = [];
  if (config.background.preset) bgTokens.push(config.background.preset.toLowerCase());
  if (config.background.customBackground?.trim()) bgTokens.push(config.background.customBackground.trim());
  if (bgTokens.length > 0) {
    bgSentence = `Set against ${bgTokens.join(', ')}.`;
  }

  // 6. Lighting & Atmosphere
  let lightingSentence = '';
  const lightTokens: string[] = [];
  if (config.lightingMood.lighting) lightTokens.push(config.lightingMood.lighting.toLowerCase());
  if (config.lightingMood.customLightingMood?.trim()) lightTokens.push(config.lightingMood.customLightingMood.trim());
  if (config.lightingMood.mood) lightTokens.push(`cultivating a ${config.lightingMood.mood.toLowerCase()} atmosphere`);
  if (lightTokens.length > 0) {
    lightingSentence = `Illuminated with ${lightTokens.join(', ')}.`;
  }

  // 7. Palette & Brand Colors
  let paletteSentence = '';
  const paletteTokens: string[] = [];
  if (config.brandIdentity.presetPalette) {
    paletteTokens.push(`${config.brandIdentity.presetPalette} color scheme`);
  }
  if (config.brandIdentity.customColors?.trim()) {
    paletteTokens.push(config.brandIdentity.customColors.trim());
  }
  if (config.brandIdentity.hexCodes?.length > 0) {
    paletteTokens.push(`color accents (${config.brandIdentity.hexCodes.join(', ')})`);
  }
  if (paletteTokens.length > 0) {
    paletteSentence = `Defined by a ${paletteTokens.join(' with ')}.`;
  }

  // 8. Typography
  let typographySentence = '';
  if (config.typography.style && config.typography.style !== 'No text or visual only') {
    const typoTokens: string[] = [config.typography.style.toLowerCase()];
    if (config.typography.fontCharacteristics?.trim()) typoTokens.push(config.typography.fontCharacteristics.trim());
    if (config.typography.placement) typoTokens.push(`positioned at ${config.typography.placement.toLowerCase()}`);
    if (config.typography.exactWording?.trim()) typoTokens.push(`with exact text reading "${config.typography.exactWording.trim()}"`);
    typographySentence = `Incorporates typography in ${typoTokens.join(', ')}.`;
  }

  // 9. Props & Visual Effects
  let propsSentence = '';
  const propTokens: string[] = [...(config.propsEffects.items || []).map(p => p.toLowerCase())];
  if (config.propsEffects.customProps?.trim()) propTokens.push(config.propsEffects.customProps.trim());
  if (propTokens.length > 0) {
    propsSentence = `Enhanced with ${propTokens.join(', ')}.`;
  }

  // 10. Quality & Technical Finishes
  let qualitySentence = '';
  const qualTokens: string[] = [...(config.quality.presets || [])];
  if (config.quality.renderEngine) qualTokens.push(config.quality.renderEngine);
  if (config.quality.rawAesthetic) qualTokens.push('unfiltered authentic sensor texture');
  if (qualTokens.length > 0) {
    qualitySentence = `${qualTokens.join(', ')}.`;
  }

  // 11. Aspect ratio tag
  const matchingAr = SECTION_OPTIONS.aspectRatios.find(a => a.ratio === config.cameraComposition.aspectRatio);
  const arTag = matchingAr ? matchingAr.tag : (config.cameraComposition.aspectRatio ? `--ar ${config.cameraComposition.aspectRatio.replace(':', ':')}` : '');

  // Negative prompt assembly
  const negativeList: string[] = [];
  if (config.negativePrompt.enabled) {
    if (config.negativePrompt.exclusions?.length > 0) {
      negativeList.push(...config.negativePrompt.exclusions);
    }
    if (config.negativePrompt.customNegative?.trim()) {
      negativeList.push(config.negativePrompt.customNegative.trim());
    }
  }
  const negativeText = negativeList.join(', ');

  // Assemble based on Format
  let promptText = '';

  if (format === 'structured') {
    promptText = [
      `[ART DIRECTION & MEDIUM]\n${styleClause}${purposeClause ? ` (${purposeClause})` : ''}`,
      `[SUBJECT SPECIFICATIONS]\n${subjectSentence.trim()}`,
      cameraSentence ? `[CAMERA & FRAMING]\n${cameraSentence}` : null,
      bgSentence ? `[ENVIRONMENT & LOCATION]\n${bgSentence}` : null,
      lightingSentence ? `[LIGHTING & MOOD]\n${lightingSentence}` : null,
      paletteSentence ? `[COLOR PALETTE]\n${paletteSentence}` : null,
      typographySentence ? `[TYPOGRAPHY]\n${typographySentence}` : null,
      propsSentence ? `[ELEMENTS & FX]\n${propsSentence}` : null,
      qualitySentence ? `[FINISH & RESOLUTION]\n${qualitySentence}` : null,
      arTag ? `[ASPECT RATIO]\n${arTag}` : null,
    ].filter(Boolean).join('\n\n');
  } else if (format === 'flux') {
    // Flux / SD weighted style
    const fluxParts = [
      styleClause,
      purposeClause,
      subjectSentence.replace(/\.$/, ''),
      cameraSentence.replace(/\.$/, ''),
      bgSentence.replace(/\.$/, ''),
      lightingSentence.replace(/\.$/, ''),
      propsSentence.replace(/\.$/, ''),
      paletteSentence.replace(/\.$/, ''),
      typographySentence.replace(/\.$/, ''),
      qualitySentence.replace(/\.$/, ''),
    ].filter(Boolean);

    promptText = fluxParts.join(', ');
  } else if (format === 'midjourney') {
    // Midjourney standard with parameters
    const coreParagraphs = [
      `${styleClause} ${purposeClause}.`,
      subjectSentence,
      cameraSentence,
      bgSentence,
      lightingSentence,
      propsSentence,
      paletteSentence,
      typographySentence,
      qualitySentence,
    ].filter(Boolean).join(' ');

    const params: string[] = [];
    if (arTag) params.push(arTag);
    params.push('--v 6.1');
    params.push('--style raw');

    promptText = `${coreParagraphs} ${params.join(' ')}`.trim();
  } else {
    // Standard Natural Prose
    const paragraphs = [
      `${styleClause} ${purposeClause ? `${purposeClause}.` : '.'}`,
      subjectSentence,
      cameraSentence,
      bgSentence,
      lightingSentence,
      propsSentence,
      paletteSentence,
      typographySentence,
      qualitySentence,
    ].filter(Boolean).join(' ');

    promptText = paragraphs.replace(/\s+/g, ' ').replace(/\.\s*\./g, '.').trim();
  }

  const cleanPrompt = promptText.trim();
  const wordCount = cleanPrompt ? cleanPrompt.split(/\s+/).filter(Boolean).length : 0;
  const charCount = cleanPrompt.length;

  return {
    promptText: cleanPrompt,
    negativeText,
    wordCount,
    charCount,
  };
}
