import React, { useState } from 'react';
import { PromptConfig } from '../types/prompt';
import { SECTION_OPTIONS } from '../data/sectionsData';
import { SectionCard } from './SectionCard';
import { ChipGroup, MultiChipGroup, CustomInput, CustomTextarea } from './FormControls';
import { 
  ChevronDown,
  ChevronUp,
  Search
} from 'lucide-react';

interface PromptSectionsProps {
  config: PromptConfig;
  onChange: (config: PromptConfig) => void;
  openSections: Record<string, boolean>;
  onToggleSection: (secId: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export const PromptSections: React.FC<PromptSectionsProps> = ({
  config,
  onChange,
  openSections,
  onToggleSection,
  onExpandAll,
  onCollapseAll,
}) => {
  const [filterText, setFilterText] = useState('');

  const update = <K extends keyof PromptConfig>(key: K, value: PromptConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const isHumanOrCreature = config.subjectPerson.category === 'person' || config.subjectPerson.category === 'creature';

  return (
    <div className="space-y-4">
      {/* Workspace Section Bar with Expand/Collapse & Section Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3 sm:px-4 bg-[#081a24] border border-[#156876]/40 rounded-2xl sm:rounded-full shadow-lg">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-[#8CA0A8]" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search prompt sections (e.g. camera, lighting, colors)..."
            className="w-full pl-9 pr-4 py-1.5 bg-[#000611] border border-[#156876]/60 rounded-full text-xs text-[#F5F9FA] placeholder-[#8CA0A8]/60 focus:outline-none focus:border-[#00E4FF]"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 justify-end w-full sm:w-auto">
          <button
            onClick={onExpandAll}
            className="flex-1 sm:flex-initial justify-center flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[#8CA0A8] hover:text-[#00E4FF] hover:bg-[#156876]/30 border border-[#156876]/50 transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span>Expand All</span>
          </button>
          <button
            onClick={onCollapseAll}
            className="flex-1 sm:flex-initial justify-center flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-[#8CA0A8] hover:text-[#00E4FF] hover:bg-[#156876]/30 border border-[#156876]/50 transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Collapse All</span>
          </button>
        </div>
      </div>

      {/* 01 — Render style and medium */}
      {(!filterText || '01 render style medium photorealistic 3d illustration'.includes(filterText.toLowerCase())) && (
        <SectionCard
          id="sec-01"
          number="01"
          title="Render Style & Medium"
          description="Photorealistic photography, 3D render, 2D graphics, cinematic illustration"
          isFilled={Boolean(config.renderStyle.selected || config.renderStyle.customDescription)}
          isOpen={openSections['sec-01'] ?? true}
          onToggle={() => onToggleSection('sec-01')}
          onClear={() => update('renderStyle', { selected: '', customDescription: '' })}
        >
          <ChipGroup
            label="Style Preset"
            options={SECTION_OPTIONS.renderStyles}
            selected={config.renderStyle.selected}
            onChange={(val) => update('renderStyle', { ...config.renderStyle, selected: val })}
          />
          <CustomInput
            label="Custom Style Description"
            value={config.renderStyle.customDescription}
            onChange={(val) => update('renderStyle', { ...config.renderStyle, customDescription: val })}
            placeholder="e.g. Hyper-detailed analog film with 1970s soft chromatic grain and velvety contrast..."
          />
        </SectionCard>
      )}

      {/* 02 — Subject and purpose */}
      {(!filterText || '02 subject purpose portrait logo showcase billboard hero cover'.includes(filterText.toLowerCase())) && (
        <SectionCard
          id="sec-02"
          number="02"
          title="Subject & Purpose"
          description="Portrait, brand logo, product showcase, album cover, fashion lookbook, hero"
          isFilled={Boolean(config.purpose.selected || config.purpose.customConcept)}
          isOpen={openSections['sec-02'] ?? true}
          onToggle={() => onToggleSection('sec-02')}
          onClear={() => update('purpose', { selected: '', customConcept: '' })}
        >
          <ChipGroup
            label="Design Use-Case"
            options={SECTION_OPTIONS.purposes}
            selected={config.purpose.selected}
            onChange={(val) => update('purpose', { ...config.purpose, selected: val })}
          />
          <CustomInput
            label="Custom Purpose & Concept"
            value={config.purpose.customConcept}
            onChange={(val) => update('purpose', { ...config.purpose, customConcept: val })}
            placeholder="e.g. High-end launch campaign for an architectural design monograph..."
          />
        </SectionCard>
      )}

      {/* 03 — Brand identity and color palette */}
      {(!filterText || '03 brand identity color palette hex gold cyan neon teal'.includes(filterText.toLowerCase())) && (
        <SectionCard
          id="sec-03"
          number="03"
          title="Brand Identity & Color Palette"
          description="Curated color combinations, hex values, and branding tones"
          isFilled={Boolean(config.brandIdentity.presetPalette || config.brandIdentity.customColors || config.brandIdentity.hexCodes.length > 0)}
          isOpen={openSections['sec-03'] ?? true}
          onToggle={() => onToggleSection('sec-03')}
          onClear={() => update('brandIdentity', { presetPalette: '', customColors: '', hexCodes: [] })}
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#8CA0A8] uppercase tracking-wider">
              Preset Color Harmonies
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5">
              {SECTION_OPTIONS.colorPalettes.map((p) => {
                const isSelected = config.brandIdentity.presetPalette === p.name;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        update('brandIdentity', { ...config.brandIdentity, presetPalette: '', hexCodes: [] });
                      } else {
                        update('brandIdentity', {
                          ...config.brandIdentity,
                          presetPalette: p.name,
                          hexCodes: p.colors,
                        });
                      }
                    }}
                    className={`p-2.5 rounded-[20px] border text-left transition-all ${
                      isSelected
                        ? 'bg-[#156876]/40 border-[#00E4FF] shadow-[0_0_12px_rgba(0,228,255,0.35)]'
                        : 'bg-[#040e15] border-[#156876]/50 hover:border-[#438D96]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      {p.colors.map((c, idx) => (
                        <span
                          key={idx}
                          className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-semibold text-[#F5F9FA] block truncate">
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <CustomInput
              label="Custom Color Names"
              value={config.brandIdentity.customColors}
              onChange={(val) => update('brandIdentity', { ...config.brandIdentity, customColors: val })}
              placeholder="e.g. Electric cyan, deep teal, midnight obsidian"
            />
            <CustomInput
              label="HEX Values (comma separated)"
              value={config.brandIdentity.hexCodes.join(', ')}
              onChange={(val) => {
                const codes = val.split(',').map(s => s.trim()).filter(Boolean);
                update('brandIdentity', { ...config.brandIdentity, hexCodes: codes });
              }}
              placeholder="e.g. #00E4FF, #438D96, #156876, #000611"
            />
          </div>
        </SectionCard>
      )}

      {/* 04 — Typography style */}
      {(!filterText || '04 typography style font serif sans placement wording'.includes(filterText.toLowerCase())) && (
        <SectionCard
          id="sec-04"
          number="04"
          title="Typography Style"
          description="Font genre, placement, and exact text rendering instructions"
          isFilled={Boolean(config.typography.style && config.typography.style !== 'No text or visual only')}
          isOpen={openSections['sec-04'] ?? false}
          onToggle={() => onToggleSection('sec-04')}
          onClear={() => update('typography', { style: 'No text or visual only', fontCharacteristics: '', placement: '', exactWording: '' })}
        >
          <ChipGroup
            label="Typography Genre"
            options={SECTION_OPTIONS.typographyStyles}
            selected={config.typography.style}
            onChange={(val) => update('typography', { ...config.typography, style: val || 'No text or visual only' })}
          />

          {config.typography.style && config.typography.style !== 'No text or visual only' && (
            <div className="space-y-3 pt-2 border-t border-[#156876]/30">
              <ChipGroup
                label="Text Placement"
                options={SECTION_OPTIONS.textPlacements}
                selected={config.typography.placement}
                onChange={(val) => update('typography', { ...config.typography, placement: val })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CustomInput
                  label="Exact Wording to Render"
                  value={config.typography.exactWording}
                  onChange={(val) => update('typography', { ...config.typography, exactWording: val })}
                  placeholder='e.g. "CURE CRAFT"'
                />
                <CustomInput
                  label="Font Characteristics & Treatment"
                  value={config.typography.fontCharacteristics}
                  onChange={(val) => update('typography', { ...config.typography, fontCharacteristics: val })}
                  placeholder="e.g. Embossed 3D metallic letterforms with subtle bevel"
                />
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* 05 — Subject and person */}
      {(!filterText || '05 subject person gender age build skin traits product'.includes(filterText.toLowerCase())) && (
        <SectionCard
          id="sec-05"
          number="05"
          title="Subject & Character"
          description="Subject type, demographics, physical build, skin tone, or product identity"
          isFilled={Boolean(
            config.subjectPerson.gender ||
            config.subjectPerson.ageRange ||
            config.subjectPerson.skinTone ||
            config.subjectPerson.customSubjectDescription
          )}
          isOpen={openSections['sec-05'] ?? true}
          onToggle={() => onToggleSection('sec-05')}
          onClear={() => update('subjectPerson', {
            category: 'person',
            gender: '',
            ageRange: '',
            bodyBuild: '',
            skinTone: '',
            characteristics: [],
            customSubjectDescription: '',
          })}
        >
          {/* Subject Category Selector - Fully Rounded Pills */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#8CA0A8] uppercase tracking-wider">
              Subject Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2">
              {SECTION_OPTIONS.subjectCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => update('subjectPerson', { ...config.subjectPerson, category: c.id as any })}
                  className={`py-2 px-3 rounded-full text-xs font-bold border transition-all text-center ${
                    config.subjectPerson.category === c.id
                      ? 'bg-[#00E4FF] text-[#000611] border-[#00E4FF] shadow-[0_0_12px_rgba(0,228,255,0.4)]'
                      : 'bg-[#156876]/20 text-[#8CA0A8] border-[#156876]/50 hover:text-[#F5F9FA] hover:border-[#438D96]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {isHumanOrCreature ? (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ChipGroup
                  label="Gender / Archetype"
                  options={SECTION_OPTIONS.genders}
                  selected={config.subjectPerson.gender}
                  onChange={(val) => update('subjectPerson', { ...config.subjectPerson, gender: val })}
                />
                <ChipGroup
                  label="Age Range"
                  options={SECTION_OPTIONS.ageRanges}
                  selected={config.subjectPerson.ageRange}
                  onChange={(val) => update('subjectPerson', { ...config.subjectPerson, ageRange: val })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ChipGroup
                  label="Body Build"
                  options={SECTION_OPTIONS.bodyBuilds}
                  selected={config.subjectPerson.bodyBuild}
                  onChange={(val) => update('subjectPerson', { ...config.subjectPerson, bodyBuild: val })}
                />
                <ChipGroup
                  label="Skin Tone"
                  options={SECTION_OPTIONS.skinTones}
                  selected={config.subjectPerson.skinTone}
                  onChange={(val) => update('subjectPerson', { ...config.subjectPerson, skinTone: val })}
                />
              </div>

              <MultiChipGroup
                label="Physical Traits"
                options={SECTION_OPTIONS.physicalCharacteristics}
                selected={config.subjectPerson.characteristics}
                onChange={(val) => update('subjectPerson', { ...config.subjectPerson, characteristics: val })}
              />

              <CustomInput
                label="Custom Subject Description"
                value={config.subjectPerson.customSubjectDescription}
                onChange={(val) => update('subjectPerson', { ...config.subjectPerson, customSubjectDescription: val })}
                placeholder="e.g. Visionary creative director wearing bespoke tailoring..."
              />
            </div>
          ) : (
            <div className="pt-2">
              <CustomTextarea
                label="Subject & Object Details"
                value={config.subjectPerson.customSubjectDescription}
                onChange={(val) => update('subjectPerson', { ...config.subjectPerson, customSubjectDescription: val })}
                placeholder={
                  config.subjectPerson.category === 'product'
                    ? 'Describe the product form, materials, finishes (e.g. Matte obsidian perfume bottle with gold metallic pump)...'
                    : 'Describe the scene, architecture, or abstract visual forms...'
                }
                rows={3}
              />
            </div>
          )}
        </SectionCard>
      )}

      {/* 06 — Face, expression, hair, accessories */}
      {isHumanOrCreature && (!filterText || '06 face expression hair accessories eyewear glasses'.includes(filterText.toLowerCase())) && (
        <SectionCard
          id="sec-06"
          number="06"
          title="Face, Expression & Hair"
          description="Facial expression, hairstyle, hair color, eyewear, headwear, accessories"
          isFilled={Boolean(
            config.faceDetails.expression ||
            config.faceDetails.hairstyle ||
            config.faceDetails.eyewear !== 'None' ||
            config.faceDetails.customFaceDetails
          )}
          isOpen={openSections['sec-06'] ?? false}
          onToggle={() => onToggleSection('sec-06')}
          onClear={() => update('faceDetails', {
            expression: '',
            hairstyle: '',
            hairColorTexture: '',
            headwear: 'None',
            eyewear: 'None',
            facialAccessories: [],
            customFaceDetails: '',
          })}
        >
          <ChipGroup
            label="Facial Expression"
            options={SECTION_OPTIONS.expressions}
            selected={config.faceDetails.expression}
            onChange={(val) => update('faceDetails', { ...config.faceDetails, expression: val })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <ChipGroup
              label="Hairstyle"
              options={SECTION_OPTIONS.hairstyles}
              selected={config.faceDetails.hairstyle}
              onChange={(val) => update('faceDetails', { ...config.faceDetails, hairstyle: val })}
            />
            <ChipGroup
              label="Hair Color / Texture"
              options={SECTION_OPTIONS.hairColors}
              selected={config.faceDetails.hairColorTexture}
              onChange={(val) => update('faceDetails', { ...config.faceDetails, hairColorTexture: val })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <ChipGroup
              label="Eyewear"
              options={SECTION_OPTIONS.eyewear}
              selected={config.faceDetails.eyewear}
              onChange={(val) => update('faceDetails', { ...config.faceDetails, eyewear: val })}
            />
            <ChipGroup
              label="Headwear"
              options={SECTION_OPTIONS.headwear}
              selected={config.faceDetails.headwear}
              onChange={(val) => update('faceDetails', { ...config.faceDetails, headwear: val })}
            />
          </div>

          <MultiChipGroup
            label="Facial Accents & Accessories"
            options={SECTION_OPTIONS.facialAccessories}
            selected={config.faceDetails.facialAccessories}
            onChange={(val) => update('faceDetails', { ...config.faceDetails, facialAccessories: val })}
          />

          <CustomInput
            label="Custom Facial & Expression Details"
            value={config.faceDetails.customFaceDetails}
            onChange={(val) => update('faceDetails', { ...config.faceDetails, customFaceDetails: val })}
            placeholder="e.g. Subtle glowing cyan rim reflection on spectacles..."
          />
        </SectionCard>
      )}

      {/* 07 — Pose and body language */}
      {(!filterText || '07 pose body language posture stance'.includes(filterText.toLowerCase())) && (
        <SectionCard
          id="sec-07"
          number="07"
          title="Pose & Body Language"
          description="Subject stance, posture, dynamic action, sitting, or object orientation"
          isFilled={Boolean(config.pose.selected || config.pose.customPose)}
          isOpen={openSections['sec-07'] ?? false}
          onToggle={() => onToggleSection('sec-07')}
          onClear={() => update('pose', { selected: '', customPose: '' })}
        >
          {isHumanOrCreature && (
            <ChipGroup
              label="Pose Suggestions"
              options={SECTION_OPTIONS.poses}
              selected={config.pose.selected}
              onChange={(val) => update('pose', { ...config.pose, selected: val })}
            />
          )}
          <CustomInput
            label={isHumanOrCreature ? 'Custom Pose Description' : 'Object Orientation & Arrangement'}
            value={config.pose.customPose}
            onChange={(val) => update('pose', { ...config.pose, customPose: val })}
            placeholder={isHumanOrCreature ? 'e.g. Standing confident with hand gently adjusting eyeglasses...' : 'e.g. Hovering diagonally at a 30-degree tilt in mid-air...'}
          />
        </SectionCard>
      )}

      {/* 08 — Outfit and dressing */}
      {isHumanOrCreature && (!filterText || '08 outfit dressing clothing streetwear luxury suit'.includes(filterText.toLowerCase())) && (
        <SectionCard
          id="sec-08"
          number="08"
          title="Outfit & Dressing"
          description="Multi-select styling: streetwear, luxury fashion, smart casual, techwear, tailoring"
          isFilled={Boolean(config.outfit.styles.length > 0 || config.outfit.customOutfitDescription)}
          isOpen={openSections['sec-08'] ?? false}
          onToggle={() => onToggleSection('sec-08')}
          onClear={() => update('outfit', { styles: [], customOutfitDescription: '' })}
        >
          <MultiChipGroup
            label="Clothing Styles (Multi-select)"
            options={SECTION_OPTIONS.outfitStyles}
            selected={config.outfit.styles}
            onChange={(val) => update('outfit', { ...config.outfit, styles: val })}
          />
          <CustomInput
            label="Custom Garments & Fabric Description"
            value={config.outfit.customOutfitDescription}
            onChange={(val) => update('outfit', { ...config.outfit, customOutfitDescription: val })}
            placeholder="e.g. Heavyweight matte black tailored vest over crisp white shirt with subtle cyan silk tie..."
          />
        </SectionCard>
      )}

      {/* 09 — Camera angle, crop, lens, and aspect ratio */}
      {(!filterText || '09 camera angle crop lens aspect ratio composition framing'.includes(filterText.toLowerCase())) && (
        <SectionCard
          id="sec-09"
          number="09"
          title="Camera & Framing"
          description="Camera angle, shot crop, focal lens, aspect ratio, depth of field"
          isFilled={Boolean(
            config.cameraComposition.angle ||
            config.cameraComposition.cropShot ||
            config.cameraComposition.lens ||
            config.cameraComposition.aspectRatio
          )}
          isOpen={openSections['sec-09'] ?? true}
          onToggle={() => onToggleSection('sec-09')}
          onClear={() => update('cameraComposition', {
            angle: '',
            cropShot: '',
            lens: '',
            aspectRatio: '16:9',
            depthOfField: '',
            perspective: '',
            compositionRule: '',
          })}
        >
          {/* Aspect Ratio Cards - Generously Rounded */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#8CA0A8] uppercase tracking-wider">
              Aspect Ratio
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2">
              {SECTION_OPTIONS.aspectRatios.map((ar) => {
                const isSelected = config.cameraComposition.aspectRatio === ar.ratio;
                return (
                  <button
                    key={ar.ratio}
                    type="button"
                    onClick={() => update('cameraComposition', { ...config.cameraComposition, aspectRatio: ar.ratio })}
                    className={`p-2.5 rounded-[20px] border text-center transition-all ${
                      isSelected
                        ? 'bg-[#00E4FF] text-[#000611] font-bold border-[#00E4FF] shadow-[0_0_12px_rgba(0,228,255,0.4)]'
                        : 'bg-[#156876]/20 text-[#8CA0A8] border-[#156876]/50 hover:text-[#F5F9FA] hover:border-[#438D96]'
                    }`}
                  >
                    <div className="font-mono font-bold text-xs">{ar.ratio}</div>
                    <div className="text-[10px] opacity-80 truncate">{ar.label.split(' ')[1]}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <ChipGroup
              label="Shot Distance / Crop"
              options={SECTION_OPTIONS.cropShots}
              selected={config.cameraComposition.cropShot}
              onChange={(val) => update('cameraComposition', { ...config.cameraComposition, cropShot: val })}
            />
            <ChipGroup
              label="Camera Angle"
              options={SECTION_OPTIONS.cameraAngles}
              selected={config.cameraComposition.angle}
              onChange={(val) => update('cameraComposition', { ...config.cameraComposition, angle: val })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <ChipGroup
              label="Lens Focal Length & Aperture"
              options={SECTION_OPTIONS.lenses}
              selected={config.cameraComposition.lens}
              onChange={(val) => update('cameraComposition', { ...config.cameraComposition, lens: val })}
            />
            <ChipGroup
              label="Depth of Field"
              options={SECTION_OPTIONS.depthOfFields}
              selected={config.cameraComposition.depthOfField}
              onChange={(val) => update('cameraComposition', { ...config.cameraComposition, depthOfField: val })}
            />
          </div>

          <ChipGroup
            label="Composition Alignment Rule"
            options={SECTION_OPTIONS.compositionRules}
            selected={config.cameraComposition.compositionRule}
            onChange={(val) => update('cameraComposition', { ...config.cameraComposition, compositionRule: val })}
          />
        </SectionCard>
      )}

      {/* 10 — Background and location */}
      {(!filterText || '10 background location studio white black street penthouse'.includes(filterText.toLowerCase())) && (
        <SectionCard
          id="sec-10"
          number="10"
          title="Background & Location"
          description="Studio white, seamless black, luxury penthouse, urban street, desert, nature"
          isFilled={Boolean(config.background.preset || config.background.customBackground)}
          isOpen={openSections['sec-10'] ?? true}
          onToggle={() => onToggleSection('sec-10')}
          onClear={() => update('background', { preset: '', customBackground: '' })}
        >
          <ChipGroup
            label="Backdrop Environment"
            options={SECTION_OPTIONS.backgrounds}
            selected={config.background.preset}
            onChange={(val) => update('background', { ...config.background, preset: val })}
          />
          <CustomInput
            label="Custom Location Description"
            value={config.background.customBackground}
            onChange={(val) => update('background', { ...config.background, customBackground: val })}
            placeholder="e.g. Modernist concrete pavilion with calm reflecting pool and cyan horizon line..."
          />
        </SectionCard>
      )}

      {/* 11 — Lighting and mood */}
      {(!filterText || '11 lighting mood rembrandt golden hour neon atmospheric'.includes(filterText.toLowerCase())) && (
        <SectionCard
          id="sec-11"
          number="11"
          title="Lighting & Mood"
          description="Rembrandt, soft studio octabox, golden hour, cyberpunk neon, elegant mood"
          isFilled={Boolean(
            config.lightingMood.lighting ||
            config.lightingMood.mood ||
            config.lightingMood.customLightingMood
          )}
          isOpen={openSections['sec-11'] ?? true}
          onToggle={() => onToggleSection('sec-11')}
          onClear={() => update('lightingMood', { lighting: '', mood: '', customLightingMood: '' })}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ChipGroup
              label="Lighting Setup"
              options={SECTION_OPTIONS.lightingStyles}
              selected={config.lightingMood.lighting}
              onChange={(val) => update('lightingMood', { ...config.lightingMood, lighting: val })}
            />
            <ChipGroup
              label="Emotional Tone & Mood"
              options={SECTION_OPTIONS.moods}
              selected={config.lightingMood.mood}
              onChange={(val) => update('lightingMood', { ...config.lightingMood, mood: val })}
            />
          </div>
          <CustomInput
            label="Custom Lighting & Atmosphere Instructions"
            value={config.lightingMood.customLightingMood}
            onChange={(val) => update('lightingMood', { ...config.lightingMood, customLightingMood: val })}
            placeholder="e.g. Dramatic electric cyan rim backlight separating subject from deep dark background..."
          />
        </SectionCard>
      )}

      {/* 12 — Image quality and technical specifications */}
      {(!filterText || '12 quality technical 4k 8k octane raw commercial'.includes(filterText.toLowerCase())) && (
        <SectionCard
          id="sec-12"
          number="12"
          title="Image Quality & Technical Specs"
          description="4K, 8K detail, commercial photography, RAW sensor aesthetics, Octane render"
          isFilled={Boolean(config.quality.presets.length > 0 || config.quality.renderEngine)}
          isOpen={openSections['sec-12'] ?? false}
          onToggle={() => onToggleSection('sec-12')}
          onClear={() => update('quality', { presets: [], renderEngine: '', rawAesthetic: false })}
        >
          <MultiChipGroup
            label="Quality Descriptors (Multi-select)"
            options={SECTION_OPTIONS.qualityPresets}
            selected={config.quality.presets}
            onChange={(val) => update('quality', { ...config.quality, presets: val })}
          />

          <ChipGroup
            label="Aesthetic Sensor / Camera Profile"
            options={SECTION_OPTIONS.renderEngines}
            selected={config.quality.renderEngine}
            onChange={(val) => update('quality', { ...config.quality, renderEngine: val })}
          />

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => update('quality', { ...config.quality, rawAesthetic: !config.quality.rawAesthetic })}
              className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${
                config.quality.rawAesthetic ? 'bg-[#00E4FF]' : 'bg-[#156876]/40'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-[#000611] absolute top-0.5 transition-transform ${
                  config.quality.rawAesthetic ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
            <span
              onClick={() => update('quality', { ...config.quality, rawAesthetic: !config.quality.rawAesthetic })}
              className="text-xs text-[#F5F9FA] font-medium cursor-pointer"
            >
              Enforce authentic RAW sensor texture (suppresses over-smoothed plastic AI skins)
            </span>
          </div>

          <p className="text-[11px] text-[#8CA0A8]/80 italic pt-1">
            Note: Resolution terms serve as descriptive art direction tokens in diffusion generation pipelines.
          </p>
        </SectionCard>
      )}

      {/* 13 — Props, effects, and additional elements */}
      {(!filterText || '13 props effects smoke particles flame jewellery watch'.includes(filterText.toLowerCase())) && (
        <SectionCard
          id="sec-13"
          number="13"
          title="Props, Effects & FX"
          description="Smoke plumes, atmospheric haze, jewellery, floating particles, reflections"
          isFilled={Boolean(config.propsEffects.items.length > 0 || config.propsEffects.customProps)}
          isOpen={openSections['sec-13'] ?? false}
          onToggle={() => onToggleSection('sec-13')}
          onClear={() => update('propsEffects', { items: [], customProps: '' })}
        >
          <MultiChipGroup
            label="Visual Elements & FX (Multi-select)"
            options={SECTION_OPTIONS.propsEffects}
            selected={config.propsEffects.items}
            onChange={(val) => update('propsEffects', { ...config.propsEffects, items: val })}
          />
          <CustomInput
            label="Custom Objects & Atmosphere Details"
            value={config.propsEffects.customProps}
            onChange={(val) => update('propsEffects', { ...config.propsEffects, customProps: val })}
            placeholder="e.g. Delicate swirling cyan vapor ribbons caught in rim light..."
          />
        </SectionCard>
      )}

      {/* 14 — Negative prompt */}
      {(!filterText || '14 negative exclusions watermark blurry bad anatomy'.includes(filterText.toLowerCase())) && (
        <SectionCard
          id="sec-14"
          number="14"
          title="Negative Prompt Exclusions"
          description="Select unwanted artifacts: blurry images, bad anatomy, unwanted text, watermarks"
          isFilled={Boolean(config.negativePrompt.enabled && (config.negativePrompt.exclusions.length > 0 || config.negativePrompt.customNegative))}
          isOpen={openSections['sec-14'] ?? false}
          onToggle={() => onToggleSection('sec-14')}
          onClear={() => update('negativePrompt', { exclusions: [], customNegative: '', enabled: false })}
        >
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs text-[#8CA0A8]">Exclude undesirable artifacts & distortion</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#F5F9FA]">
                {config.negativePrompt.enabled ? 'Enabled' : 'Disabled'}
              </span>
              <button
                type="button"
                onClick={() => update('negativePrompt', { ...config.negativePrompt, enabled: !config.negativePrompt.enabled })}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  config.negativePrompt.enabled ? 'bg-[#00E4FF]' : 'bg-[#156876]/40'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-[#000611] absolute top-0.5 transition-transform ${
                    config.negativePrompt.enabled ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {config.negativePrompt.enabled && (
            <div className="space-y-3 pt-2 border-t border-[#156876]/30">
              <MultiChipGroup
                label="Common Negative Exclusions"
                options={SECTION_OPTIONS.negativeExclusions}
                selected={config.negativePrompt.exclusions}
                onChange={(val) => update('negativePrompt', { ...config.negativePrompt, exclusions: val })}
              />
              <CustomInput
                label="Custom Negative Exclusions"
                value={config.negativePrompt.customNegative}
                onChange={(val) => update('negativePrompt', { ...config.negativePrompt, customNegative: val })}
                placeholder="e.g. oversaturated colors, 3d plastic skin, harsh shadow..."
              />
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
};
