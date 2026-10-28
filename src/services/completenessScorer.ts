import { CompletenessScore, PromptConfig } from '../types/prompt';

export function calculateCompletenessScore(config: PromptConfig): CompletenessScore {
  const isHumanOrCreature = config.subjectPerson.category === 'person' || config.subjectPerson.category === 'creature';

  interface AreaDef {
    key: string;
    label: string;
    maxWeight: number;
    check: () => { earned: number; completed: boolean; reason?: string };
  }

  const breakdown: CompletenessScore['breakdown'] = [];
  const suggestions: string[] = [];

  // Determine base weights depending on whether face/pose/outfit apply
  // Standard (person/creature): Style(12), Purpose(10), Subject(14), Face(10), Pose(10), Outfit(10), Camera(12), Background(12), Lighting(10) = 100
  // Non-human (product/architecture/abstract): Style(16), Purpose(15), Subject(24), Camera(16), Background(15), Lighting(14) = 100
  const weights = isHumanOrCreature
    ? {
        style: 12,
        purpose: 10,
        subject: 14,
        face: 10,
        pose: 10,
        outfit: 10,
        camera: 12,
        background: 12,
        lighting: 10,
      }
    : {
        style: 16,
        purpose: 15,
        subject: 24,
        face: 0,
        pose: 0,
        outfit: 0,
        camera: 16,
        background: 15,
        lighting: 14,
      };

  // 1. Render style
  const hasStyle = Boolean(config.renderStyle.selected?.trim() || config.renderStyle.customDescription?.trim());
  const styleScore = hasStyle ? weights.style : 0;
  breakdown.push({
    key: 'style',
    label: '01 Render Style & Medium',
    earned: styleScore,
    max: weights.style,
    completed: hasStyle,
    reason: hasStyle ? undefined : 'Choose an artistic medium or photography style.',
  });
  if (!hasStyle) suggestions.push('Select a render style (e.g. Photorealistic, 3D render, Editorial).');

  // 2. Purpose
  const hasPurpose = Boolean(config.purpose.selected?.trim() || config.purpose.customConcept?.trim());
  const purposeScore = hasPurpose ? weights.purpose : 0;
  breakdown.push({
    key: 'purpose',
    label: '02 Subject & Purpose',
    earned: purposeScore,
    max: weights.purpose,
    completed: hasPurpose,
    reason: hasPurpose ? undefined : 'Define the primary use-case or concept intent.',
  });
  if (!hasPurpose) suggestions.push('Specify what this image is designed for (e.g. Portrait, Product showcase, Hero).');

  // 3. Subject definition
  let hasSubject = false;
  if (isHumanOrCreature) {
    hasSubject = Boolean(
      config.subjectPerson.gender?.trim() ||
      config.subjectPerson.ageRange?.trim() ||
      config.subjectPerson.skinTone?.trim() ||
      config.subjectPerson.bodyBuild?.trim() ||
      config.subjectPerson.customSubjectDescription?.trim()
    );
  } else {
    hasSubject = Boolean(config.subjectPerson.customSubjectDescription?.trim());
  }
  const subjectScore = hasSubject ? weights.subject : 0;
  breakdown.push({
    key: 'subject',
    label: '05 Subject Description',
    earned: subjectScore,
    max: weights.subject,
    completed: hasSubject,
    reason: hasSubject ? undefined : 'Describe the focal subject or character identity.',
  });
  if (!hasSubject) suggestions.push('Detail the subject (age, build, skin tone, or product identity).');

  // 4. Face & defining traits (only if human/creature)
  if (weights.face > 0) {
    const hasFace = Boolean(
      config.faceDetails.expression?.trim() ||
      config.faceDetails.hairstyle?.trim() ||
      config.faceDetails.eyewear?.trim() ||
      config.faceDetails.customFaceDetails?.trim()
    );
    const faceScore = hasFace ? weights.face : 0;
    breakdown.push({
      key: 'face',
      label: '06 Expression & Features',
      earned: faceScore,
      max: weights.face,
      completed: hasFace,
      reason: hasFace ? undefined : 'Specify facial expression, hairstyle, or eye gaze.',
    });
    if (!hasFace) suggestions.push('Pick an expression and hairstyle to give personality to your subject.');
  }

  // 5. Pose & body language (only if human/creature)
  if (weights.pose > 0) {
    const hasPose = Boolean(config.pose.selected?.trim() || config.pose.customPose?.trim());
    const poseScore = hasPose ? weights.pose : 0;
    breakdown.push({
      key: 'pose',
      label: '07 Pose & Body Language',
      earned: poseScore,
      max: weights.pose,
      completed: hasPose,
      reason: hasPose ? undefined : 'Choose how your subject is positioned or interacting.',
    });
    if (!hasPose) suggestions.push('Set the body posture or stance (e.g. confident standing, three-quarter turn).');
  }

  // 6. Outfit & dressing (only if human/creature)
  if (weights.outfit > 0) {
    const hasOutfit = Boolean(config.outfit.styles?.length > 0 || config.outfit.customOutfitDescription?.trim());
    const outfitScore = hasOutfit ? weights.outfit : 0;
    breakdown.push({
      key: 'outfit',
      label: '08 Outfit & Styling',
      earned: outfitScore,
      max: weights.outfit,
      completed: hasOutfit,
      reason: hasOutfit ? undefined : 'Select clothing styles or describe custom garments.',
    });
    if (!hasOutfit) suggestions.push('Add outfit styling (e.g. Luxury fashion, Streetwear, Tailored suit).');
  }

  // 7. Camera & composition
  const hasCamera = Boolean(
    config.cameraComposition.angle?.trim() ||
    config.cameraComposition.cropShot?.trim() ||
    config.cameraComposition.lens?.trim()
  );
  const cameraScore = hasCamera ? weights.camera : 0;
  breakdown.push({
    key: 'camera',
    label: '09 Camera & Composition',
    earned: cameraScore,
    max: weights.camera,
    completed: hasCamera,
    reason: hasCamera ? undefined : 'Set camera framing, shot distance, or focal lens.',
  });
  if (!hasCamera) suggestions.push('Select camera angle, crop shot, or prime lens (e.g. 85mm portrait, Half-body).');

  // 8. Background
  const hasBackground = Boolean(config.background.preset?.trim() || config.background.customBackground?.trim());
  const backgroundScore = hasBackground ? weights.background : 0;
  breakdown.push({
    key: 'background',
    label: '10 Background & Setting',
    earned: backgroundScore,
    max: weights.background,
    completed: hasBackground,
    reason: hasBackground ? undefined : 'Choose an environment or backdrop setting.',
  });
  if (!hasBackground) suggestions.push('Establish a background (e.g. Studio cyclorama, Penthouse, City street).');

  // 9. Lighting & mood
  const hasLighting = Boolean(
    config.lightingMood.lighting?.trim() ||
    config.lightingMood.mood?.trim() ||
    config.lightingMood.customLightingMood?.trim()
  );
  const lightingScore = hasLighting ? weights.lighting : 0;
  breakdown.push({
    key: 'lighting',
    label: '11 Lighting & Mood',
    earned: lightingScore,
    max: weights.lighting,
    completed: hasLighting,
    reason: hasLighting ? undefined : 'Define the studio lighting scheme and atmospheric mood.',
  });
  if (!hasLighting) suggestions.push('Add lighting direction (e.g. Rembrandt, Golden hour, Soft octabox).');

  // Total
  const total = breakdown.reduce((acc, curr) => acc + curr.earned, 0);
  const categoriesCompleted = breakdown.filter((b) => b.completed).length;

  return {
    total: Math.min(100, Math.round(total)),
    categoriesCompleted,
    totalCategories: breakdown.length,
    breakdown,
    suggestions: suggestions.slice(0, 3), // Show top 3 most relevant tips
  };
}
