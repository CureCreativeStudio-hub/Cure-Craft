import React from 'react';
import { PromptConfig } from '../types/prompt';
import { ExternalLink, CheckCircle, CircleDashed } from 'lucide-react';

interface LiveSummaryPanelProps {
  config: PromptConfig;
  onJumpToSection: (sectionId: string) => void;
}

export const LiveSummaryPanel: React.FC<LiveSummaryPanelProps> = ({
  config,
  onJumpToSection,
}) => {
  const isHumanOrCreature = config.subjectPerson.category === 'person' || config.subjectPerson.category === 'creature';

  const summaryItems = [
    {
      id: 'sec-01',
      number: '01',
      title: 'Render Style',
      value: config.renderStyle.selected || config.renderStyle.customDescription || null,
    },
    {
      id: 'sec-02',
      number: '02',
      title: 'Purpose & Concept',
      value: config.purpose.selected || config.purpose.customConcept || null,
    },
    {
      id: 'sec-03',
      number: '03',
      title: 'Brand Palette',
      value: config.brandIdentity.presetPalette || config.brandIdentity.customColors || (config.brandIdentity.hexCodes?.length ? config.brandIdentity.hexCodes.join(', ') : null),
    },
    {
      id: 'sec-04',
      number: '04',
      title: 'Typography',
      value: config.typography.style && config.typography.style !== 'No text or visual only'
        ? `${config.typography.style}${config.typography.exactWording ? ` ("${config.typography.exactWording}")` : ''}`
        : null,
    },
    {
      id: 'sec-05',
      number: '05',
      title: 'Subject',
      value: isHumanOrCreature
        ? [config.subjectPerson.gender, config.subjectPerson.ageRange, config.subjectPerson.skinTone, config.subjectPerson.customSubjectDescription].filter(Boolean).join(', ') || null
        : config.subjectPerson.customSubjectDescription || `${config.subjectPerson.category} focus`,
    },
    {
      id: 'sec-06',
      number: '06',
      title: 'Expression & Features',
      value: isHumanOrCreature
        ? [config.faceDetails.expression, config.faceDetails.hairstyle, config.faceDetails.eyewear !== 'None' ? config.faceDetails.eyewear : ''].filter(Boolean).join(' • ') || null
        : null,
      hide: !isHumanOrCreature,
    },
    {
      id: 'sec-07',
      number: '07',
      title: 'Pose & Stance',
      value: isHumanOrCreature
        ? config.pose.selected || config.pose.customPose || null
        : config.pose.customPose || null,
      hide: !isHumanOrCreature && !config.pose.customPose,
    },
    {
      id: 'sec-08',
      number: '08',
      title: 'Outfit & Styling',
      value: isHumanOrCreature
        ? (config.outfit.styles.length > 0 ? config.outfit.styles.join(', ') : config.outfit.customOutfitDescription || null)
        : null,
      hide: !isHumanOrCreature,
    },
    {
      id: 'sec-09',
      number: '09',
      title: 'Camera & Framing',
      value: [config.cameraComposition.cropShot, config.cameraComposition.angle, config.cameraComposition.lens, config.cameraComposition.aspectRatio ? `AR ${config.cameraComposition.aspectRatio}` : ''].filter(Boolean).join(' • ') || null,
    },
    {
      id: 'sec-10',
      number: '10',
      title: 'Background',
      value: config.background.preset || config.background.customBackground || null,
    },
    {
      id: 'sec-11',
      number: '11',
      title: 'Lighting & Mood',
      value: [config.lightingMood.lighting, config.lightingMood.mood].filter(Boolean).join(' • ') || config.lightingMood.customLightingMood || null,
    },
    {
      id: 'sec-12',
      number: '12',
      title: 'Quality & Aesthetics',
      value: config.quality.presets.length > 0 ? config.quality.presets.slice(0, 2).join(', ') : null,
    },
    {
      id: 'sec-13',
      number: '13',
      title: 'Props & Visual FX',
      value: config.propsEffects.items.length > 0 ? config.propsEffects.items.join(', ') : (config.propsEffects.customProps || null),
    },
    {
      id: 'sec-14',
      number: '14',
      title: 'Negative Exclusions',
      value: config.negativePrompt.enabled && config.negativePrompt.exclusions.length > 0
        ? `${config.negativePrompt.exclusions.length} exclusions active`
        : null,
    },
  ].filter(item => !item.hide);

  const filledCount = summaryItems.filter(i => i.value !== null).length;

  return (
    <div className="bg-[#081a24] border border-[#156876]/40 rounded-[28px] p-4 sm:p-5 shadow-2xl sticky top-6 w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#156876]/30">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5F9FA]">
            Live Prompt Specifications
          </h3>
          <p className="text-[11px] text-[#8CA0A8]">
            {filledCount} of {summaryItems.length} categories active
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#156876]/40 text-[#00E4FF] border border-[#00E4FF]/40 shadow-sm">
          {Math.round((filledCount / summaryItems.length) * 100)}%
        </span>
      </div>

      {/* Categories List */}
      <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
        {summaryItems.map((item) => {
          const isSpecified = Boolean(item.value);
          return (
            <div
              key={item.id}
              onClick={() => onJumpToSection(item.id)}
              className="group p-3 rounded-[18px] bg-[#040e15] hover:bg-[#156876]/35 border border-[#156876]/30 hover:border-[#00E4FF]/40 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between gap-1 text-[11px]">
                <div className="flex items-center gap-1.5 font-semibold text-[#8CA0A8] group-hover:text-[#00E4FF] transition-colors">
                  <span className="font-mono text-[10px] text-[#00E4FF] font-bold">{item.number}</span>
                  <span>{item.title}</span>
                </div>
                <div className="flex items-center gap-1">
                  {isSpecified ? (
                    <CheckCircle className="w-3.5 h-3.5 text-[#00E4FF]" />
                  ) : (
                    <CircleDashed className="w-3.5 h-3.5 text-[#156876]/60" />
                  )}
                  <ExternalLink className="w-2.5 h-2.5 text-[#8CA0A8] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="mt-1">
                {isSpecified ? (
                  <p className="text-xs text-[#F5F9FA] font-medium truncate">
                    {item.value}
                  </p>
                ) : (
                  <p className="text-[11px] text-[#8CA0A8]/50 italic">
                    Not specified
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
