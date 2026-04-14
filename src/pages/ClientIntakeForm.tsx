import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { submitIntakeForm } from '@/services/intakeForm.service';
import type { IntakeFormData } from '@/services/intakeForm.service';

// ─── Types ────────────────────────────────────────────────────────────────────

const STEPS = [
  'general', 'branding', 'gameType', 'content',
  'features', 'technical', 'modifications', 'deliverables', 'contact',
] as const;
type Step = typeof STEPS[number];

const INITIAL_DATA: IntakeFormData = {
  projectName: '', eventType: '', eventTypeOther: '', targetAgeRange: '',
  techLevel: '', participantsCount: '', eventDate: '', deadline: '', budget: '',
  hasExistingLogo: '', primaryColor: '', secondaryColor: '', designStyle: [],
  inspirationLinks: '', hasExistingAssets: '',
  gameTemplate: '', gameTemplateOther: '', stagesCount: '', hasScoringSystem: '',
  bonusPenalty: '', timePerQuestion: '', totalQuestions: '', difficultyProgression: '',
  questionTypes: [], contentProvider: '', mainTopic: '', subTopics: '',
  language: '', needsPersonalization: '', personalizationDetails: '',
  mobileSupport: '', multiplayerType: '', leaderboard: '',
  audioFeatures: [], animationLevel: '', feedbackType: [],
  platform: '', dataStorage: '', dataToSave: [], accessControl: '',
  startingFrom: '', templateName: '', requiredChanges: '', specialFeatures: '',
  deliverableFormats: [], needsPreviewDemo: '', needsDocumentation: '',
  eventDaySupport: '', correctionRounds: '', postLaunchSupport: '',
  contactName: '', contactPhone: '', contactEmail: '',
  specialRequests: '', likedExamples: '', dislikedExamples: '', successCriteria: '',
};

// ─── Step validation ──────────────────────────────────────────────────────────

function isStepValid(step: Step, data: IntakeFormData): boolean {
  switch (step) {
    case 'general':   return data.projectName.trim() !== '' && data.eventType !== '';
    case 'branding':  return true;
    case 'gameType':  return data.gameTemplate !== '';
    case 'content':   return data.mainTopic.trim() !== '' && data.contentProvider !== '';
    case 'features':  return data.mobileSupport !== '' && data.multiplayerType !== '';
    case 'technical': return data.platform !== '';
    case 'modifications': return data.startingFrom !== '';
    case 'deliverables': return data.correctionRounds !== '';
    case 'contact':   return data.contactName.trim() !== '' && data.contactEmail.trim() !== '';
    default: return true;
  }
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-foreground mb-1.5">
      {label}
      {required && <span className="text-destructive mr-1">*</span>}
    </label>
  );
}

function TextInput({
  value, onChange, placeholder, type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-muted rounded-xl px-4 py-3 text-sm border border-input
        placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
}

function Textarea({
  value, onChange, placeholder, rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-muted rounded-xl px-4 py-3 text-sm border border-input
        placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
    />
  );
}

function RadioGroup({
  options, value, onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`text-right px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all
            ${value === opt.value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-card hover:border-muted-foreground'
            }`}
        >
          {value === opt.value && <span className="ml-2">✓</span>}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function CheckboxGroup({
  options, value, onChange,
}: {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all
              ${selected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card hover:border-muted-foreground'
              }`}
          >
            {selected && <span className="ml-1">✓</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function YesNoGroup({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-3">
      {['yes', 'no'].map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all
            ${value === v
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-card hover:border-muted-foreground'
            }`}
        >
          {t(`intake.${v}`)}
        </button>
      ))}
    </div>
  );
}

// ─── Step components ──────────────────────────────────────────────────────────

function StepGeneral({ data, set }: { data: IntakeFormData; set: <K extends keyof IntakeFormData>(k: K, v: IntakeFormData[K]) => void }) {
  const { t } = useTranslation();
  const s = (k: string) => t(`intake.general.${k}`);

  const eventTypes = Object.entries(
    t('intake.general.eventTypes', { returnObjects: true }) as Record<string, string>
  ).map(([value, label]) => ({ value, label }));

  const budgets = Object.entries(
    t('intake.general.budgets', { returnObjects: true }) as Record<string, string>
  ).map(([value, label]) => ({ value, label }));

  const techLevels = Object.entries(
    t('intake.general.techLevels', { returnObjects: true }) as Record<string, string>
  ).map(([value, label]) => ({ value, label }));

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel label={s('projectName')} required />
        <TextInput value={data.projectName} onChange={(v) => set('projectName', v)} placeholder={s('projectNamePlaceholder')} />
      </div>
      <div>
        <FieldLabel label={s('eventType')} required />
        <RadioGroup options={eventTypes} value={data.eventType} onChange={(v) => set('eventType', v)} />
        {data.eventType === 'other' && (
          <div className="mt-2">
            <TextInput value={data.eventTypeOther} onChange={(v) => set('eventTypeOther', v)} placeholder={t('intake.otherPlaceholder')} />
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel label={s('targetAgeRange')} />
          <TextInput value={data.targetAgeRange} onChange={(v) => set('targetAgeRange', v)} placeholder={s('targetAgeRangePlaceholder')} />
        </div>
        <div>
          <FieldLabel label={s('participantsCount')} />
          <TextInput value={data.participantsCount} onChange={(v) => set('participantsCount', v)} placeholder={s('participantsCountPlaceholder')} type="number" />
        </div>
      </div>
      <div>
        <FieldLabel label={s('techLevel')} />
        <RadioGroup options={techLevels} value={data.techLevel} onChange={(v) => set('techLevel', v)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel label={s('eventDate')} />
          <TextInput value={data.eventDate} onChange={(v) => set('eventDate', v)} type="date" />
        </div>
        <div>
          <FieldLabel label={s('deadline')} />
          <TextInput value={data.deadline} onChange={(v) => set('deadline', v)} type="date" />
        </div>
      </div>
      <div>
        <FieldLabel label={s('budget')} />
        <RadioGroup options={budgets} value={data.budget} onChange={(v) => set('budget', v)} />
      </div>
    </div>
  );
}

function StepBranding({ data, set }: { data: IntakeFormData; set: <K extends keyof IntakeFormData>(k: K, v: IntakeFormData[K]) => void }) {
  const { t } = useTranslation();
  const s = (k: string) => t(`intake.branding.${k}`);

  const designStyles = Object.entries(
    t('intake.branding.designStyles', { returnObjects: true }) as Record<string, string>
  ).map(([value, label]) => ({ value, label }));

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel label={s('hasExistingLogo')} />
        <YesNoGroup value={data.hasExistingLogo} onChange={(v) => set('hasExistingLogo', v)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel label={s('primaryColor')} />
          <TextInput value={data.primaryColor} onChange={(v) => set('primaryColor', v)} placeholder={s('primaryColorPlaceholder')} />
        </div>
        <div>
          <FieldLabel label={s('secondaryColor')} />
          <TextInput value={data.secondaryColor} onChange={(v) => set('secondaryColor', v)} placeholder={s('secondaryColorPlaceholder')} />
        </div>
      </div>
      <div>
        <FieldLabel label={s('designStyle')} />
        <CheckboxGroup options={designStyles} value={data.designStyle} onChange={(v) => set('designStyle', v)} />
      </div>
      <div>
        <FieldLabel label={s('inspirationLinks')} />
        <Textarea value={data.inspirationLinks} onChange={(v) => set('inspirationLinks', v)} placeholder={s('inspirationLinksPlaceholder')} rows={3} />
      </div>
      <div>
        <FieldLabel label={s('hasExistingAssets')} />
        <YesNoGroup value={data.hasExistingAssets} onChange={(v) => set('hasExistingAssets', v)} />
      </div>
    </div>
  );
}

function StepGameType({ data, set }: { data: IntakeFormData; set: <K extends keyof IntakeFormData>(k: K, v: IntakeFormData[K]) => void }) {
  const { t } = useTranslation();
  const s = (k: string) => t(`intake.gameType.${k}`);

  const gameTemplates = Object.entries(
    t('intake.gameType.gameTemplates', { returnObjects: true }) as Record<string, string>
  ).map(([value, label]) => ({ value, label }));

  const timesPerQuestion = Object.entries(
    t('intake.gameType.timesPerQuestion', { returnObjects: true }) as Record<string, string>
  ).map(([value, label]) => ({ value, label }));

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel label={s('gameTemplate')} required />
        <RadioGroup options={gameTemplates} value={data.gameTemplate} onChange={(v) => set('gameTemplate', v)} />
        {data.gameTemplate === 'other' && (
          <div className="mt-2">
            <TextInput value={data.gameTemplateOther} onChange={(v) => set('gameTemplateOther', v)} placeholder={t('intake.otherPlaceholder')} />
          </div>
        )}
      </div>
      <div>
        <FieldLabel label={s('totalQuestions')} />
        <TextInput value={data.totalQuestions} onChange={(v) => set('totalQuestions', v)} placeholder={s('totalQuestionsPlaceholder')} />
      </div>
      <div>
        <FieldLabel label={s('stagesCount')} />
        <TextInput value={data.stagesCount} onChange={(v) => set('stagesCount', v)} placeholder={s('stagesCountPlaceholder')} />
      </div>
      <div>
        <FieldLabel label={s('timePerQuestion')} />
        <RadioGroup options={timesPerQuestion} value={data.timePerQuestion} onChange={(v) => set('timePerQuestion', v)} />
      </div>
      <div>
        <FieldLabel label={s('hasScoringSystem')} />
        <YesNoGroup value={data.hasScoringSystem} onChange={(v) => set('hasScoringSystem', v)} />
      </div>
      {data.hasScoringSystem === 'yes' && (
        <div>
          <FieldLabel label={s('bonusPenalty')} />
          <Textarea value={data.bonusPenalty} onChange={(v) => set('bonusPenalty', v)} placeholder={s('bonusPenaltyPlaceholder')} rows={2} />
        </div>
      )}
      <div>
        <FieldLabel label={s('difficultyProgression')} />
        <YesNoGroup value={data.difficultyProgression} onChange={(v) => set('difficultyProgression', v)} />
      </div>
    </div>
  );
}

function StepContent({ data, set }: { data: IntakeFormData; set: <K extends keyof IntakeFormData>(k: K, v: IntakeFormData[K]) => void }) {
  const { t } = useTranslation();
  const s = (k: string) => t(`intake.content.${k}`);

  const questionTypes = Object.entries(
    t('intake.content.questionTypesList', { returnObjects: true }) as Record<string, string>
  ).map(([value, label]) => ({ value, label }));

  const contentProviders = Object.entries(
    t('intake.content.contentProviders', { returnObjects: true }) as Record<string, string>
  ).map(([value, label]) => ({ value, label }));

  const languages = Object.entries(
    t('intake.content.languages', { returnObjects: true }) as Record<string, string>
  ).map(([value, label]) => ({ value, label }));

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel label={s('mainTopic')} required />
        <TextInput value={data.mainTopic} onChange={(v) => set('mainTopic', v)} placeholder={s('mainTopicPlaceholder')} />
      </div>
      <div>
        <FieldLabel label={s('subTopics')} />
        <Textarea value={data.subTopics} onChange={(v) => set('subTopics', v)} placeholder={s('subTopicsPlaceholder')} rows={2} />
      </div>
      <div>
        <FieldLabel label={s('contentProvider')} required />
        <RadioGroup options={contentProviders} value={data.contentProvider} onChange={(v) => set('contentProvider', v)} />
      </div>
      <div>
        <FieldLabel label={s('questionTypes')} />
        <CheckboxGroup options={questionTypes} value={data.questionTypes} onChange={(v) => set('questionTypes', v)} />
      </div>
      <div>
        <FieldLabel label={s('language')} />
        <RadioGroup options={languages} value={data.language} onChange={(v) => set('language', v)} />
      </div>
      <div>
        <FieldLabel label={s('needsPersonalization')} />
        <YesNoGroup value={data.needsPersonalization} onChange={(v) => set('needsPersonalization', v)} />
      </div>
      {data.needsPersonalization === 'yes' && (
        <div>
          <FieldLabel label={s('personalizationDetails')} />
          <Textarea value={data.personalizationDetails} onChange={(v) => set('personalizationDetails', v)} placeholder={s('personalizationDetailsPlaceholder')} rows={2} />
        </div>
      )}
    </div>
  );
}

function StepFeatures({ data, set }: { data: IntakeFormData; set: <K extends keyof IntakeFormData>(k: K, v: IntakeFormData[K]) => void }) {
  const { t } = useTranslation();
  const s = (k: string) => t(`intake.features.${k}`);

  const mobileSupportOptions = Object.entries(
    t('intake.features.mobileSupportOptions', { returnObjects: true }) as Record<string, string>
  ).map(([value, label]) => ({ value, label }));

  const multiplayerTypes = Object.entries(
    t('intake.features.multiplayerTypes', { returnObjects: true }) as Record<string, string>
  ).map(([value, label]) => ({ value, label }));

  const leaderboardOptions = Object.entries(
    t('intake.features.leaderboardOptions', { returnObjects: true }) as Record<string, string>
  ).map(([value, label]) => ({ value, label }));

  const audioFeaturesList = Object.entries(
    t('intake.features.audioFeaturesList', { returnObjects: true }) as Record<string, string>
  ).map(([value, label]) => ({ value, label }));

  const animationLevels = Object.entries(
    t('intake.features.animationLevels', { returnObjects: true }) as Record<string, string>
  ).map(([value, label]) => ({ value, label }));

  const feedbackTypes = Object.entries(
    t('intake.features.feedbackTypes', { returnObjects: true }) as Record<string, string>
  ).map(([value, label]) => ({ value, label }));

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel label={s('mobileSupport')} required />
        <RadioGroup options={mobileSupportOptions} value={data.mobileSupport} onChange={(v) => set('mobileSupport', v)} />
      </div>
      <div>
        <FieldLabel label={s('multiplayerType')} required />
        <RadioGroup options={multiplayerTypes} value={data.multiplayerType} onChange={(v) => set('multiplayerType', v)} />
      </div>
      <div>
        <FieldLabel label={s('leaderboard')} />
        <RadioGroup options={leaderboardOptions} value={data.leaderboard} onChange={(v) => set('leaderboard', v)} />
      </div>
      <div>
        <FieldLabel label={s('audioFeatures')} />
        <CheckboxGroup options={audioFeaturesList} value={data.audioFeatures} onChange={(v) => set('audioFeatures', v)} />
      </div>
      <div>
        <FieldLabel label={s('animationLevel')} />
        <RadioGroup options={animationLevels} value={data.animationLevel} onChange={(v) => set('animationLevel', v)} />
      </div>
      <div>
        <FieldLabel label={s('feedbackType')} />
        <CheckboxGroup options={feedbackTypes} value={data.feedbackType} onChange={(v) => set('feedbackType', v)} />
      </div>
    </div>
  );
}

function StepTechnical({ data, set }: { data: IntakeFormData; set: <K extends keyof IntakeFormData>(k: K, v: IntakeFormData[K]) => void }) {
  const { t } = useTranslation();
  const s = (k: string) => t(`intake.technical.${k}`);

  const platforms = Object.entries(
    t('intake.technical.platforms', { returnObjects: true }) as Record<string, string>
  ).map(([value, label]) => ({ value, label }));

  const dataStorageOptions = Object.entries(
    t('intake.technical.dataStorageOptions', { returnObjects: true }) as Record<string, string>
  ).map(([value, label]) => ({ value, label }));

  const dataToSaveList = Object.entries(
    t('intake.technical.dataToSaveList', { returnObjects: true }) as Record<string, string>
  ).map(([value, label]) => ({ value, label }));

  const accessControlOptions = Object.entries(
    t('intake.technical.accessControlOptions', { returnObjects: true }) as Record<string, string>
  ).map(([value, label]) => ({ value, label }));

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel label={s('platform')} required />
        <RadioGroup options={platforms} value={data.platform} onChange={(v) => set('platform', v)} />
      </div>
      <div>
        <FieldLabel label={s('dataStorage')} />
        <RadioGroup options={dataStorageOptions} value={data.dataStorage} onChange={(v) => set('dataStorage', v)} />
      </div>
      <div>
        <FieldLabel label={s('dataToSave')} />
        <CheckboxGroup options={dataToSaveList} value={data.dataToSave} onChange={(v) => set('dataToSave', v)} />
      </div>
      <div>
        <FieldLabel label={s('accessControl')} />
        <RadioGroup options={accessControlOptions} value={data.accessControl} onChange={(v) => set('accessControl', v)} />
      </div>
    </div>
  );
}

function StepModifications({ data, set }: { data: IntakeFormData; set: <K extends keyof IntakeFormData>(k: K, v: IntakeFormData[K]) => void }) {
  const { t } = useTranslation();
  const s = (k: string) => t(`intake.modifications.${k}`);

  const startingFromOptions = Object.entries(
    t('intake.modifications.startingFromOptions', { returnObjects: true }) as Record<string, string>
  ).map(([value, label]) => ({ value, label }));

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel label={s('startingFrom')} required />
        <RadioGroup options={startingFromOptions} value={data.startingFrom} onChange={(v) => set('startingFrom', v)} />
      </div>
      {data.startingFrom === 'template' && (
        <div>
          <FieldLabel label={s('templateName')} />
          <TextInput value={data.templateName} onChange={(v) => set('templateName', v)} placeholder={s('templateNamePlaceholder')} />
        </div>
      )}
      <div>
        <FieldLabel label={s('requiredChanges')} />
        <Textarea value={data.requiredChanges} onChange={(v) => set('requiredChanges', v)} placeholder={s('requiredChangesPlaceholder')} rows={4} />
      </div>
      <div>
        <FieldLabel label={s('specialFeatures')} />
        <Textarea value={data.specialFeatures} onChange={(v) => set('specialFeatures', v)} placeholder={s('specialFeaturesPlaceholder')} rows={4} />
      </div>
    </div>
  );
}

function StepDeliverables({ data, set }: { data: IntakeFormData; set: <K extends keyof IntakeFormData>(k: K, v: IntakeFormData[K]) => void }) {
  const { t } = useTranslation();
  const s = (k: string) => t(`intake.deliverables.${k}`);

  const deliverableFormatsList = Object.entries(
    t('intake.deliverables.deliverableFormatsList', { returnObjects: true }) as Record<string, string>
  ).map(([value, label]) => ({ value, label }));

  const correctionRoundsOptions = Object.entries(
    t('intake.deliverables.correctionRoundsOptions', { returnObjects: true }) as Record<string, string>
  ).map(([value, label]) => ({ value, label }));

  const postLaunchSupportOptions = Object.entries(
    t('intake.deliverables.postLaunchSupportOptions', { returnObjects: true }) as Record<string, string>
  ).map(([value, label]) => ({ value, label }));

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel label={s('deliverableFormats')} />
        <CheckboxGroup options={deliverableFormatsList} value={data.deliverableFormats} onChange={(v) => set('deliverableFormats', v)} />
      </div>
      <div>
        <FieldLabel label={s('needsPreviewDemo')} />
        <YesNoGroup value={data.needsPreviewDemo} onChange={(v) => set('needsPreviewDemo', v)} />
      </div>
      <div>
        <FieldLabel label={s('needsDocumentation')} />
        <YesNoGroup value={data.needsDocumentation} onChange={(v) => set('needsDocumentation', v)} />
      </div>
      <div>
        <FieldLabel label={s('eventDaySupport')} />
        <YesNoGroup value={data.eventDaySupport} onChange={(v) => set('eventDaySupport', v)} />
      </div>
      <div>
        <FieldLabel label={s('correctionRounds')} required />
        <RadioGroup options={correctionRoundsOptions} value={data.correctionRounds} onChange={(v) => set('correctionRounds', v)} />
      </div>
      <div>
        <FieldLabel label={s('postLaunchSupport')} />
        <RadioGroup options={postLaunchSupportOptions} value={data.postLaunchSupport} onChange={(v) => set('postLaunchSupport', v)} />
      </div>
    </div>
  );
}

function StepContact({ data, set }: { data: IntakeFormData; set: <K extends keyof IntakeFormData>(k: K, v: IntakeFormData[K]) => void }) {
  const { t } = useTranslation();
  const s = (k: string) => t(`intake.contact.${k}`);

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel label={s('contactName')} required />
        <TextInput value={data.contactName} onChange={(v) => set('contactName', v)} placeholder={s('contactNamePlaceholder')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel label={s('contactPhone')} />
          <TextInput value={data.contactPhone} onChange={(v) => set('contactPhone', v)} placeholder={s('contactPhonePlaceholder')} type="tel" />
        </div>
        <div>
          <FieldLabel label={s('contactEmail')} required />
          <TextInput value={data.contactEmail} onChange={(v) => set('contactEmail', v)} placeholder={s('contactEmailPlaceholder')} type="email" />
        </div>
      </div>
      <div>
        <FieldLabel label={s('specialRequests')} />
        <Textarea value={data.specialRequests} onChange={(v) => set('specialRequests', v)} placeholder={s('specialRequestsPlaceholder')} rows={3} />
      </div>
      <div>
        <FieldLabel label={s('likedExamples')} />
        <Textarea value={data.likedExamples} onChange={(v) => set('likedExamples', v)} placeholder={s('likedExamplesPlaceholder')} rows={2} />
      </div>
      <div>
        <FieldLabel label={s('dislikedExamples')} />
        <Textarea value={data.dislikedExamples} onChange={(v) => set('dislikedExamples', v)} placeholder={s('dislikedExamplesPlaceholder')} rows={2} />
      </div>
      <div>
        <FieldLabel label={s('successCriteria')} />
        <Textarea value={data.successCriteria} onChange={(v) => set('successCriteria', v)} placeholder={s('successCriteriaPlaceholder')} rows={3} />
      </div>
    </div>
  );
}

// ─── Step renderer ────────────────────────────────────────────────────────────

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

// ─── Main component ───────────────────────────────────────────────────────────

const ClientIntakeForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [stepIdx, setStepIdx]     = useState(0);
  const [animDir, setAnimDir]     = useState(1);
  const [data, setData]           = useState<IntakeFormData>(INITIAL_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState('');

  const currentStep = STEPS[stepIdx];
  const canNext = isStepValid(currentStep, data);
  const isLastStep = stepIdx === STEPS.length - 1;

  function set<K extends keyof IntakeFormData>(key: K, value: IntakeFormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  const goNext = () => { setAnimDir(1); setStepIdx((i) => Math.min(i + 1, STEPS.length - 1)); };
  const goBack = () => { setAnimDir(-1); setStepIdx((i) => Math.max(i - 1, 0)); };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await submitIntakeForm(data);
      setSubmitted(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.includes('VITE_INTAKE_SCRIPT_URL')
        ? t('intake.errorMissingUrl')
        : t('intake.errorGeneral'));
    } finally {
      setSubmitting(false);
    }
  };

  const progressPct = ((stepIdx + 1) / STEPS.length) * 100;

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4" dir="rtl">
        <motion.div
          className="text-center space-y-6 max-w-md"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <motion.div
            className="text-7xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
          >
            🎉
          </motion.div>
          <h1 className="text-3xl font-bold">{t('intake.successTitle')}</h1>
          <p className="text-muted-foreground leading-relaxed">{t('intake.successDesc')}</p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity"
          >
            {t('intake.successBack')}
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">

      {/* Header */}
      <div className="px-6 py-5 border-b border-border">
        <div className="max-w-xl mx-auto">
          <h1 className="text-xl font-bold">{t('intake.pageTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('intake.pageSubtitle')}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="px-6 pt-4 pb-2 max-w-xl mx-auto w-full">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${progressPct}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
        {/* Step labels — compact scroll row */}
        <div className="flex gap-3 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`text-xs whitespace-nowrap font-medium shrink-0 transition-colors ${
                i < stepIdx
                  ? 'text-primary'
                  : i === stepIdx
                  ? 'text-foreground font-bold'
                  : 'text-muted-foreground'
              }`}
            >
              {i < stepIdx ? '✓ ' : i === stepIdx ? '● ' : `${i + 1}. `}
              {t(`intake.steps.${s}`)}
            </span>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 py-6 max-w-xl mx-auto w-full overflow-hidden">
        <AnimatePresence mode="wait" custom={animDir}>
          <motion.div
            key={currentStep}
            custom={animDir}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Step header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold">
                {t(`intake.${currentStep}.title`)}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {t(`intake.${currentStep}.subtitle`)}
              </p>
            </div>

            {/* Step fields */}
            {currentStep === 'general'       && <StepGeneral data={data} set={set} />}
            {currentStep === 'branding'      && <StepBranding data={data} set={set} />}
            {currentStep === 'gameType'      && <StepGameType data={data} set={set} />}
            {currentStep === 'content'       && <StepContent data={data} set={set} />}
            {currentStep === 'features'      && <StepFeatures data={data} set={set} />}
            {currentStep === 'technical'     && <StepTechnical data={data} set={set} />}
            {currentStep === 'modifications' && <StepModifications data={data} set={set} />}
            {currentStep === 'deliverables'  && <StepDeliverables data={data} set={set} />}
            {currentStep === 'contact'       && <StepContact data={data} set={set} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4 max-w-xl mx-auto w-full">
        {error && (
          <p className="text-destructive text-sm text-center mb-3">{error}</p>
        )}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIdx === 0}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all border border-border"
          >
            {t('intake.back')} →
          </button>

          {/* Dot indicators */}
          <div className="flex gap-1.5 flex-wrap justify-center">
            {STEPS.map((_, i) => (
              <motion.div
                key={i}
                className={`h-2 rounded-full transition-colors ${i === stepIdx ? 'bg-primary' : i < stepIdx ? 'bg-primary/40' : 'bg-muted'}`}
                animate={{ width: i === stepIdx ? 20 : 8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            ))}
          </div>

          {isLastStep ? (
            <motion.button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!canNext || submitting}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 transition-all"
              whileHover={{ scale: canNext ? 1.03 : 1 }}
              whileTap={{ scale: canNext ? 0.97 : 1 }}
            >
              {submitting ? t('intake.submitting') : t('intake.submit')}
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={goNext}
              disabled={!canNext}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 transition-all"
              whileHover={{ scale: canNext ? 1.03 : 1 }}
              whileTap={{ scale: canNext ? 0.97 : 1 }}
            >
              ← {t('intake.next')}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientIntakeForm;
