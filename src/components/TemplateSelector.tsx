import React from 'react';
import { TemplateId } from '../types/collage';

interface TemplateSelectorProps {
  selectedTemplate: TemplateId;
  onSelectTemplate: (templateId: TemplateId) => void;
}

interface TemplateOption {
  id: TemplateId;
  label: string;
  subtitle: string;
}

const TEMPLATES: TemplateOption[] = [
  {
    id: 'editorial-wall',
    label: 'Maximalism Wall',
    subtitle: 'Top serif · Staggered',
  },
  {
    id: 'quad-center-bar',
    label: 'Quad · Clean Bar',
    subtitle: '2×2 · White center bar',
  },
  {
    id: 'quad-center-badge',
    label: 'Quad · Bold Badge',
    subtitle: '2×2 · 01 pill badge',
  },
  {
    id: 'top-bottom-center',
    label: 'Top & Down',
    subtitle: 'Top/bottom · Center text',
  },
  {
    id: 'left-right-center',
    label: 'Left & Right',
    subtitle: 'Side-by-side · Center text',
  },
];

function TemplateWireframe({ id, active }: { id: TemplateId; active: boolean }) {
  const accent = active ? '#A90D18' : '#334155';
  const fillSoft = active ? '#F1F5F9' : '#F8FAFC';
  const blockFill = active ? '#CBD5E1' : '#E2E8F0';
  const blockAlt = active ? '#94A3B8' : '#CBD5E1';

  if (id === 'editorial-wall') {
    return (
      <svg viewBox="0 0 64 64" className="w-9 h-9 lg:w-11 lg:h-11 shrink-0" aria-hidden="true">
        <rect x="2" y="2" width="60" height="60" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
        <rect x="17" y="7" width="30" height="4" rx="1" fill={accent} />
        <rect x="8" y="18" width="14" height="17" fill={blockFill} />
        <rect x="8" y="37" width="14" height="18" fill={blockAlt} />
        <rect x="24" y="14" width="16" height="18" fill={blockAlt} />
        <rect x="24" y="34" width="16" height="18" fill={blockFill} />
        <rect x="42" y="19" width="14" height="17" fill={blockFill} />
        <rect x="42" y="38" width="14" height="17" fill={blockAlt} />
      </svg>
    );
  }

  if (id === 'quad-center-bar') {
    return (
      <svg viewBox="0 0 64 64" className="w-9 h-9 lg:w-11 lg:h-11 shrink-0" aria-hidden="true">
        <rect x="2" y="2" width="60" height="60" rx="6" fill={fillSoft} stroke="#E2E8F0" strokeWidth="1.5" />
        <rect x="4" y="4" width="27" height="27" rx="2" fill={blockFill} />
        <rect x="33" y="4" width="27" height="27" rx="2" fill={blockAlt} />
        <rect x="4" y="33" width="27" height="27" rx="2" fill={blockAlt} />
        <rect x="33" y="33" width="27" height="27" rx="2" fill={blockFill} />
        <rect x="10" y="27" width="44" height="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
        <rect x="15" y="31" width="34" height="2.2" rx="1" fill="#0F172A" />
      </svg>
    );
  }

  if (id === 'quad-center-badge') {
    return (
      <svg viewBox="0 0 64 64" className="w-9 h-9 lg:w-11 lg:h-11 shrink-0" aria-hidden="true">
        <rect x="2" y="2" width="60" height="60" rx="6" fill={fillSoft} stroke="#E2E8F0" strokeWidth="1.5" />
        <rect x="4" y="4" width="27" height="27" rx="2" fill={blockAlt} />
        <rect x="33" y="4" width="27" height="27" rx="2" fill={blockFill} />
        <rect x="4" y="33" width="27" height="27" rx="2" fill={blockFill} />
        <rect x="33" y="33" width="27" height="27" rx="2" fill={blockAlt} />
        <rect x="9" y="26" width="46" height="12" rx="6" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.8" />
        <circle cx="15.5" cy="32" r="3.6" fill={accent} />
        <rect x="22" y="30.6" width="28" height="2.8" rx="1" fill="#0F172A" />
      </svg>
    );
  }

  if (id === 'top-bottom-center') {
    return (
      <svg viewBox="0 0 64 64" className="w-9 h-9 lg:w-11 lg:h-11 shrink-0" aria-hidden="true">
        <rect x="2" y="2" width="60" height="60" rx="6" fill={fillSoft} stroke="#E2E8F0" strokeWidth="1.5" />
        <rect x="4" y="4" width="56" height="27" rx="2" fill={blockFill} />
        <rect x="4" y="33" width="56" height="27" rx="2" fill={blockAlt} />
        <rect x="11" y="27" width="42" height="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
        <rect x="16" y="31" width="32" height="2.2" rx="1" fill="#0F172A" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" className="w-9 h-9 lg:w-11 lg:h-11 shrink-0" aria-hidden="true">
      <rect x="2" y="2" width="60" height="60" rx="6" fill={fillSoft} stroke="#E2E8F0" strokeWidth="1.5" />
      <rect x="4" y="4" width="27" height="56" rx="2" fill={blockFill} />
      <rect x="33" y="4" width="27" height="56" rx="2" fill={blockAlt} />
      <rect x="11" y="27" width="42" height="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
      <rect x="16" y="31" width="32" height="2.2" rx="1" fill="#0F172A" />
    </svg>
  );
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onSelectTemplate,
}) => {
  return (
    <section
      id="templates-section"
      aria-label="Collage Templates"
      className="w-full bg-white border border-slate-200 rounded-xl p-3.5 lg:p-4 lg:mb-6"
    >
      <div className="flex items-center justify-between gap-4 mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Templates</h2>
          <p className="text-xs text-slate-500">
            Pick a layout style — works with any number of photos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-2.5">
        {TEMPLATES.map((tpl) => {
          const active = selectedTemplate === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelectTemplate(tpl.id)}
              className={`min-h-[56px] flex items-center gap-2.5 lg:gap-3 p-2.5 rounded-lg border text-left transition-all cursor-pointer active:scale-[0.98] ${
                active
                  ? 'border-[#A90D18] bg-[#A90D18]/[0.04] ring-1 ring-[#A90D18]'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              <TemplateWireframe id={tpl.id} active={active} />
              <div className="min-w-0 flex-1">
                <div className={`text-xs font-semibold truncate ${active ? 'text-[#A90D18]' : 'text-slate-900'}`}>
                  {tpl.label}
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">{tpl.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
