import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitCourseIntakeForm } from '../services/courseIntake.service';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GameData {
  tempName: string;
  goal: string;
  userUnderstanding: string;
  positionInCourse: string[];
  desiredFeeling: string[];
  contentTopic: string;
  contentStyle: string[];
  contentDelivery: string[];
  techBase: string;
  template: string[];
  gameFunctions: string[];
  screens: string[];
  notes: string;
}

interface FormData {
  clientName: string;
  projectName: string;
  contactPerson: string;
  deadline: string;
  budget: string;
  courseGoal: string;
  targetAudience: string;
  learningStyle: string;
  logoStatus: string;
  designStyle: string[];
  preferredColors: string[];
  inspirations: string;
  fonts: string;
  generalNotes: string;
  games: GameData[];
}

type StepType =
  | 'client'
  | 'project-goal'
  | 'branding'
  | 'game-goal'
  | 'game-experience'
  | 'game-tech'
  | 'game-screens';

interface Step {
  type: StepType;
  gameIndex?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const createGame = (_index: number): GameData => ({
  tempName: '',
  goal: '',
  userUnderstanding: '',
  positionInCourse: [],
  desiredFeeling: [],
  contentTopic: '',
  contentStyle: [],
  contentDelivery: [],
  techBase: '',
  template: [],
  gameFunctions: [],
  screens: ['מסך פתיחה', 'מסך סיום'],
  notes: '',
});

const buildSteps = (numGames: number): Step[] => {
  const steps: Step[] = [
    { type: 'client' },
    { type: 'project-goal' },
    { type: 'branding' },
  ];
  for (let i = 0; i < numGames; i++) {
    steps.push(
      { type: 'game-goal', gameIndex: i },
      { type: 'game-experience', gameIndex: i },
      { type: 'game-tech', gameIndex: i },
      { type: 'game-screens', gameIndex: i },
    );
  }
  return steps;
};

const GAME_SCREENS_SUGGESTIONS = [
  'מסך הוראות',
  'מסך משחק ראשי',
  'מסך תוצאות ביניים',
  'מסך ניקוד',
  'מסך בחירת רמה',
  'מסך הצלחה / כישלון',
  'מסך המתנה',
  'מסך תוצאות סופיות',
];

// ─── Base UI ──────────────────────────────────────────────────────────────────

const TextInput = ({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) => (
  <input
    type={type}
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    dir="rtl"
    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition text-sm"
  />
);

const Textarea = ({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) => (
  <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    dir="rtl"
    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition resize-none text-sm"
  />
);

const Label = ({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) => (
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    {children}
    {required && <span className="text-primary mr-1">*</span>}
    {hint && <span className="font-normal text-gray-400 text-xs mr-2">({hint})</span>}
  </label>
);

const Field = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`mb-5 ${className}`}>{children}</div>;

const Pill = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`px-4 py-2 rounded-full text-sm font-medium transition-all border select-none ${
      checked
        ? 'bg-primary text-white border-primary shadow-sm'
        : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50 hover:text-primary'
    }`}
  >
    {label}
  </button>
);

const PillsGroup = ({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map(opt => (
      <Pill
        key={opt}
        label={opt}
        checked={selected.includes(opt)}
        onChange={checked =>
          onChange(checked ? [...selected, opt] : selected.filter(x => x !== opt))
        }
      />
    ))}
  </div>
);

const RadioCard = ({
  label,
  description,
  selected,
  onChange,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onChange: () => void;
}) => (
  <button
    type="button"
    onClick={onChange}
    className={`w-full text-right px-4 py-3 rounded-xl text-sm transition-all border ${
      selected
        ? 'bg-primary/5 text-primary border-primary ring-1 ring-primary/30 font-semibold'
        : 'bg-white text-gray-600 border-gray-200 hover:border-primary/40 hover:bg-gray-50'
    }`}
  >
    {label}
    {description && (
      <span className="block text-xs mt-0.5 font-normal text-gray-400">{description}</span>
    )}
  </button>
);

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const ProgressHeader = ({
  steps,
  currentStep,
  numGames,
}: {
  steps: Step[];
  currentStep: number;
  numGames: number;
}) => {
  const sections = useMemo(() => {
    const s: { label: string; stepRange: [number, number] }[] = [
      { label: 'כללי', stepRange: [0, 2] },
    ];
    for (let i = 0; i < numGames; i++) {
      const start = 3 + i * 4;
      s.push({ label: `משחק ${i + 1}`, stepRange: [start, start + 3] });
    }
    return s;
  }, [numGames]);

  const currentSection = sections.findIndex(
    s => currentStep >= s.stepRange[0] && currentStep <= s.stepRange[1],
  );

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center gap-1 mb-4 flex-wrap">
        {sections.map((section, idx) => {
          const isActive = idx === currentSection;
          const isDone = idx < currentSection;
          return (
            <React.Fragment key={idx}>
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : isDone
                    ? 'bg-primary/15 text-primary'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isDone && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {section.label}
              </div>
              {idx < sections.length - 1 && (
                <div
                  className={`h-px w-4 transition-all ${
                    idx < currentSection ? 'bg-primary/40' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step dots within current section */}
      {sections[currentSection] && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({
            length:
              sections[currentSection].stepRange[1] -
              sections[currentSection].stepRange[0] +
              1,
          }).map((_, i) => {
            const stepIdx = sections[currentSection].stepRange[0] + i;
            const isActive = stepIdx === currentStep;
            const isDone = stepIdx < currentStep;
            return (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  isActive
                    ? 'w-6 h-2 bg-primary'
                    : isDone
                    ? 'w-2 h-2 bg-primary/40'
                    : 'w-2 h-2 bg-gray-200'
                }`}
              />
            );
          })}
        </div>
      )}

      {/* Overall progress bar */}
      <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

// ─── Step components ──────────────────────────────────────────────────────────

const StepClient = ({
  data,
  update,
}: {
  data: FormData;
  update: (k: keyof FormData, v: string) => void;
}) => (
  <div>
    <Field>
      <Label required>שם לקוח</Label>
      <TextInput
        value={data.clientName}
        onChange={v => update('clientName', v)}
        placeholder="שם מלא של הלקוח / החברה"
      />
    </Field>
    <Field>
      <Label required>שם הפרויקט / הקורס</Label>
      <TextInput
        value={data.projectName}
        onChange={v => update('projectName', v)}
        placeholder="מה שם הקורס שלכם?"
      />
    </Field>
    <Field>
      <Label hint="אופציונלי">איש קשר</Label>
      <TextInput
        value={data.contactPerson}
        onChange={v => update('contactPerson', v)}
        placeholder="שם + טלפון / מייל"
      />
    </Field>
    <div className="grid grid-cols-2 gap-4">
      <Field>
        <Label hint="אופציונלי">תאריך יעד</Label>
        <TextInput
          type="date"
          value={data.deadline}
          onChange={v => update('deadline', v)}
        />
      </Field>
      <Field>
        <Label hint="אופציונלי">תקציב משוער</Label>
        <TextInput
          value={data.budget}
          onChange={v => update('budget', v)}
          placeholder="₪ / טווח / לא בטוח"
        />
      </Field>
    </div>
  </div>
);

const StepProjectGoal = ({
  data,
  update,
}: {
  data: FormData;
  update: (k: keyof FormData, v: string | string[]) => void;
}) => (
  <div>
    <Field>
      <Label>מה הקורס אמור להשיג?</Label>
      <Textarea
        value={data.courseGoal}
        onChange={v => update('courseGoal', v)}
        placeholder="תארו את המטרה העיקרית של הקורס..."
        rows={3}
      />
    </Field>
    <Field>
      <Label>למי הקורס מיועד?</Label>
      <Textarea
        value={data.targetAudience}
        onChange={v => update('targetAudience', v)}
        placeholder="גיל, תפקיד, רמת ידע, מאפיינים מיוחדים..."
        rows={2}
      />
    </Field>
    <Field>
      <Label hint="אופציונלי">סגנון למידה מועדף</Label>
      <PillsGroup
        options={['תיאורטי', 'מעשי', 'שילוב תיאוריה + תרגול', 'חקר עצמאי', 'שיתופי', 'גיימיפיקציה מלאה']}
        selected={data.learningStyle ? [data.learningStyle] : []}
        onChange={v => update('learningStyle', v[v.length - 1] ?? '')}
      />
    </Field>
  </div>
);

const ColorPicker = ({
  colors,
  onChange,
}: {
  colors: string[];
  onChange: (v: string[]) => void;
}) => {
  const MAX = 4;
  const slots = Array.from({ length: MAX });

  const handleChange = (index: number, value: string) => {
    const next = [...colors];
    if (index < next.length) {
      next[index] = value;
    } else {
      next.push(value);
    }
    onChange(next);
  };

  const handleRemove = (index: number) => {
    onChange(colors.filter((_, i) => i !== index));
  };

  return (
    <div className="flex gap-3 flex-wrap">
      {slots.map((_, i) => {
        const filled = i < colors.length;
        const color = colors[i] ?? '#6366f1';
        return (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <label className="relative cursor-pointer group">
              {filled ? (
                <span
                  className="block w-12 h-12 rounded-xl border-2 border-white shadow-md ring-1 ring-gray-200 transition group-hover:scale-105"
                  style={{ backgroundColor: color }}
                />
              ) : (
                <span className="flex items-center justify-center w-12 h-12 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-primary hover:text-primary transition text-xl">
                  +
                </span>
              )}
              <input
                type="color"
                value={filled ? color : '#6366f1'}
                onChange={e => handleChange(i, e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>
            {filled && (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xs text-gray-500 font-mono">{color}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="text-xs text-gray-300 hover:text-red-400 transition leading-none"
                >
                  הסר
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const StepBranding = ({
  data,
  update,
}: {
  data: FormData;
  update: (k: keyof FormData, v: string | string[]) => void;
}) => (
  <div>
    <Field>
      <Label>לוגו</Label>
      <div className="grid grid-cols-1 gap-2">
        {['יש לוגו קיים', 'צריך לוגו חדש', 'צריך התאמת לוגו לכל משחק', 'לא רלוונטי'].map(opt => (
          <RadioCard
            key={opt}
            label={opt}
            selected={data.logoStatus === opt}
            onChange={() => update('logoStatus', opt)}
          />
        ))}
      </div>
    </Field>
    <Field>
      <Label hint="בחרו כל מה שמתאים">קו עיצובי</Label>
      <PillsGroup
        options={['צעיר', 'מקצועי', 'יוקרתי', 'משחקי', 'נקי ומינימלי', 'צבעוני', 'קורפורייט', 'חם ואישי']}
        selected={data.designStyle}
        onChange={v => update('designStyle', v)}
      />
    </Field>
    <Field>
      <Label hint="עד 4 צבעים, אופציונלי">צבעים מועדפים</Label>
      <ColorPicker
        colors={data.preferredColors}
        onChange={v => update('preferredColors', v)}
      />
    </Field>
    <Field>
      <Label hint="אופציונלי">השראות / דוגמאות שאהבתם</Label>
      <Textarea
        value={data.inspirations}
        onChange={v => update('inspirations', v)}
        placeholder="קישורים, שמות מותגים, תיאור סגנון..."
        rows={2}
      />
    </Field>
    <Field>
      <Label hint="אופציונלי">פונטים / גופנים</Label>
      <TextInput
        value={data.fonts}
        onChange={v => update('fonts', v)}
        placeholder="אם יש העדפה..."
      />
    </Field>
    <Field>
      <Label hint="אופציונלי">הערות כלליות לפרויקט</Label>
      <Textarea
        value={data.generalNotes}
        onChange={v => update('generalNotes', v)}
        placeholder="כל מה שחשוב לדעת..."
        rows={2}
      />
    </Field>
  </div>
);

const StepGameGoal = ({
  game,
  gameNum,
  update,
}: {
  game: GameData;
  gameNum: number;
  update: (k: keyof GameData, v: string | string[]) => void;
}) => (
  <div>
    <Field>
      <Label required>שם זמני למשחק</Label>
      <TextInput
        value={game.tempName}
        onChange={v => update('tempName', v)}
        placeholder={`משחק ${gameNum}`}
      />
    </Field>
    <Field>
      <Label>מה מטרת המשחק?</Label>
      <Textarea
        value={game.goal}
        onChange={v => update('goal', v)}
        placeholder="מה הלומד אמור לעשות / לחוות במשחק?"
        rows={3}
      />
    </Field>
    <Field>
      <Label hint="אופציונלי">מה המשתמש צריך להבין / לדעת בסוף המשחק?</Label>
      <Textarea
        value={game.userUnderstanding}
        onChange={v => update('userUnderstanding', v)}
        placeholder="תוצאת הלמידה הרצויה..."
        rows={2}
      />
    </Field>
    <Field>
      <Label hint="בחרו הכל שרלוונטי">איפה המשחק נכנס בקורס?</Label>
      <PillsGroup
        options={['פתיחה', 'תרגול', 'חיזוק', 'מבחן', 'סיום', 'בונוס']}
        selected={game.positionInCourse}
        onChange={v => update('positionInCourse', v)}
      />
    </Field>
  </div>
);

const StepGameExperience = ({
  game,
  update,
}: {
  game: GameData;
  update: (k: keyof GameData, v: string | string[]) => void;
}) => (
  <div>
    <Field>
      <Label hint="בחרו הכל שמתאים">מה התחושה הרצויה?</Label>
      <PillsGroup
        options={['מהיר ואינטנסיבי', 'תחרותי', 'רגוע', 'מצחיק', 'הישגי', 'סקרן', 'דרמטי', 'חינוכי']}
        selected={game.desiredFeeling}
        onChange={v => update('desiredFeeling', v)}
      />
    </Field>
    <Field>
      <Label hint="אופציונלי">נושא המשחק</Label>
      <TextInput
        value={game.contentTopic}
        onChange={v => update('contentTopic', v)}
        placeholder="מה הנושא / התוכן שסביבו המשחק?"
      />
    </Field>
    <Field>
      <Label hint="בחרו הכל שרלוונטי">סגנון תוכן</Label>
      <PillsGroup
        options={['שאלות', 'משימות', 'סיפור', 'סימולציה', 'התאמות', 'קבלת החלטות']}
        selected={game.contentStyle}
        onChange={v => update('contentStyle', v)}
      />
    </Field>
    <Field>
      <Label hint="איך תספקו לנו את תוכן המשחק?">אספקת תוכן</Label>
      <PillsGroup
        options={['גוגל דוקס', 'אקסל', 'וורד', 'נשלח ידנית', 'נבנה יחד']}
        selected={game.contentDelivery}
        onChange={v => update('contentDelivery', v)}
      />
    </Field>
  </div>
);

const StepGameTech = ({
  game,
  update,
}: {
  game: GameData;
  update: (k: keyof GameData, v: string | string[]) => void;
}) => (
  <div>
    <Field>
      <Label>בסיס טכנולוגי</Label>
      <div className="grid grid-cols-1 gap-2">
        {[
          { label: 'תבנית קיימת', desc: 'לוקחים תבנית בדיוק כמו שהיא' },
          { label: 'תבנית קיימת + התאמות', desc: 'שינויי עיצוב / ניסוח' },
          { label: 'תבנית קיימת + פונקציה חדשה', desc: 'הוספת יכולת שלא קיימת' },
          { label: 'חדש מאפס', desc: 'בניה מלאה ממיקרו' },
        ].map(opt => (
          <RadioCard
            key={opt.label}
            label={opt.label}
            description={opt.desc}
            selected={game.techBase === opt.label}
            onChange={() => update('techBase', opt.label)}
          />
        ))}
      </div>
    </Field>
    <Field>
      <Label hint="בחרו הכל שמתאים">בחירת תבנית</Label>
      <PillsGroup
        options={['טריוויה', 'זיכרון', 'התאמות', 'גלגל מזל', 'מסלול שלבים', 'חדר בריחה', 'Drag & Drop', 'שאלון ניקוד', 'אחר']}
        selected={game.template}
        onChange={v => update('template', v)}
      />
    </Field>
    <Field>
      <Label hint="בחרו הכל שרלוונטי">פונקציות רצויות</Label>
      <PillsGroup
        options={['טיימר', 'ניקוד', 'מספר ניסיונות', 'לוח תוצאות', 'מעבר שלבים', 'סאונד', 'אנימציות', 'שמירת תוצאה', 'רנדומליות', 'תמיכה במובייל', 'הרשמה', 'סיסמה']}
        selected={game.gameFunctions}
        onChange={v => update('gameFunctions', v)}
      />
    </Field>
  </div>
);

const StepGameScreens = ({
  game,
  update,
}: {
  game: GameData;
  update: (k: keyof GameData, v: string | string[]) => void;
}) => {
  const [customInput, setCustomInput] = useState('');

  const addScreen = (screen: string) => {
    if (!screen.trim() || game.screens.includes(screen.trim())) return;
    update('screens', [...game.screens, screen.trim()]);
  };

  const removeScreen = (screen: string) => {
    update('screens', game.screens.filter(s => s !== screen));
  };

  const handleCustomAdd = () => {
    addScreen(customInput);
    setCustomInput('');
  };

  const suggestions = GAME_SCREENS_SUGGESTIONS.filter(s => !game.screens.includes(s));

  return (
    <div>
      <Field>
        <Label>מסכים במשחק</Label>

        {/* Current screens */}
        <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
          {game.screens.map(screen => {
            const isFixed = screen === 'מסך פתיחה' || screen === 'מסך סיום';
            return (
              <span
                key={screen}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                  isFixed
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {screen}
                {!isFixed && (
                  <button
                    type="button"
                    onClick={() => removeScreen(screen)}
                    className="hover:text-red-500 transition-colors text-gray-400"
                  >
                    ×
                  </button>
                )}
              </span>
            );
          })}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2">הוסיפו מסכים נפוצים:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addScreen(s)}
                  className="px-3 py-1.5 rounded-full text-xs border border-dashed border-gray-300 text-gray-500 hover:border-primary hover:text-primary transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom screen input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCustomAdd()}
            placeholder="הוסיפו מסך מותאם אישית..."
            dir="rtl"
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
          />
          <button
            type="button"
            onClick={handleCustomAdd}
            disabled={!customInput.trim()}
            className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            הוסף
          </button>
        </div>
      </Field>

      <Field>
        <Label hint="אופציונלי">הערות נוספות על המשחק</Label>
        <Textarea
          value={game.notes}
          onChange={v => update('notes', v)}
          placeholder="כל מה שחשוב לדעת על המשחק הזה..."
          rows={3}
        />
      </Field>
    </div>
  );
};

// ─── Step title metadata ──────────────────────────────────────────────────────

const STEP_META: Record<StepType, { title: string; subtitle: string; emoji: string }> = {
  'client': { title: 'פרטי לקוח', subtitle: 'נתחיל עם המידע הבסיסי', emoji: '👤' },
  'project-goal': { title: 'מטרת הפרויקט', subtitle: 'מה הקורס אמור להשיג?', emoji: '🎯' },
  'branding': { title: 'מיתוג ועיצוב', subtitle: 'הסגנון הויזואלי של הפרויקט', emoji: '🎨' },
  'game-goal': { title: 'מטרת המשחק', subtitle: 'מה המשחק עושה?', emoji: '🎮' },
  'game-experience': { title: 'חוויה ותוכן', subtitle: 'איך הלמידה תרגיש?', emoji: '✨' },
  'game-tech': { title: 'טכנולוגיה ותבנית', subtitle: 'הבסיס הטכני', emoji: '⚙️' },
  'game-screens': { title: 'מסכים במשחק', subtitle: 'מה יופיע במשחק?', emoji: '🖥️' },
};

// ─── Success Screen ───────────────────────────────────────────────────────────

const SuccessScreen = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-8"
  >
    <div className="text-6xl mb-6">🎉</div>
    <h2 className="text-2xl font-bold text-gray-900 mb-3">הטופס נשלח בהצלחה!</h2>
    <p className="text-gray-500 text-sm leading-relaxed max-w-sm mx-auto">
      קיבלנו את כל הפרטים. ניצור איתך קשר בהקדם עם מסמך האפיון המלא.
    </p>
    <div className="mt-6 p-4 bg-primary/5 rounded-2xl border border-primary/10 text-sm text-primary">
      📄 מסמך האפיון שלך נוצר ונשמר אוטומטית
    </div>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CourseIntakeForm() {
  const [formData, setFormData] = useState<FormData>({
    clientName: '',
    projectName: '',
    contactPerson: '',
    deadline: '',
    budget: '',
    courseGoal: '',
    targetAudience: '',
    learningStyle: '',
    logoStatus: '',
    designStyle: [],
    preferredColors: [],
    inspirations: '',
    fonts: '',
    generalNotes: '',
    games: [createGame(0)],
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = useMemo(() => buildSteps(formData.games.length), [formData.games.length]);
  const step = steps[currentStep];
  const meta = STEP_META[step.type];

  const isLastGameScreensStep =
    step.type === 'game-screens' &&
    step.gameIndex === formData.games.length - 1;

  const updateForm = (key: keyof FormData, value: string | string[] | GameData[]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const updateGame = (gameIndex: number, key: keyof GameData, value: string | string[]) => {
    setFormData(prev => {
      const games = [...prev.games];
      games[gameIndex] = { ...games[gameIndex], [key]: value };
      return { ...prev, games };
    });
  };

  const goNext = () => {
    setDirection(1);
    setCurrentStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrentStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addGame = () => {
    const newIndex = formData.games.length;
    setFormData(prev => ({ ...prev, games: [...prev.games, createGame(newIndex)] }));
    setDirection(1);
    // Move to game-goal step of new game (will be at currentStep+1 after state update)
    setCurrentStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await submitCourseIntakeForm(formData);
      setSubmitted(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`שגיאה בשליחה: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const canNext = (): boolean => {
    if (step.type === 'client') return !!formData.clientName.trim() && !!formData.projectName.trim();
    if (step.type === 'game-goal') {
      const g = formData.games[step.gameIndex!];
      return !!g.tempName.trim();
    }
    return true;
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4" dir="rtl">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-8">
          <SuccessScreen />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100 text-sm text-gray-500 mb-4">
            <span>🎓</span>
            <span>המפצחות – אפיון פרויקט משחקים</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 pb-0">
            <ProgressHeader
              steps={steps}
              currentStep={currentStep}
              numGames={formData.games.length}
            />
          </div>

          <div className="px-6 pb-6">
            {/* Step header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{meta.emoji}</span>
                <h2 className="text-lg font-bold text-gray-900">
                  {step.gameIndex !== undefined
                    ? `משחק ${step.gameIndex + 1} – ${meta.title}`
                    : meta.title}
                </h2>
              </div>
              <p className="text-gray-400 text-sm">{meta.subtitle}</p>
            </div>

            {/* Step content */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`${step.type}-${step.gameIndex ?? 0}`}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                {step.type === 'client' && (
                  <StepClient data={formData} update={updateForm as (k: keyof FormData, v: string) => void} />
                )}
                {step.type === 'project-goal' && (
                  <StepProjectGoal data={formData} update={updateForm as (k: keyof FormData, v: string | string[]) => void} />
                )}
                {step.type === 'branding' && (
                  <StepBranding data={formData} update={updateForm as (k: keyof FormData, v: string | string[]) => void} />
                )}
                {step.type === 'game-goal' && step.gameIndex !== undefined && (
                  <StepGameGoal
                    game={formData.games[step.gameIndex]}
                    gameNum={step.gameIndex + 1}
                    update={(k, v) => updateGame(step.gameIndex!, k, v)}
                  />
                )}
                {step.type === 'game-experience' && step.gameIndex !== undefined && (
                  <StepGameExperience
                    game={formData.games[step.gameIndex]}
                    update={(k, v) => updateGame(step.gameIndex!, k, v)}
                  />
                )}
                {step.type === 'game-tech' && step.gameIndex !== undefined && (
                  <StepGameTech
                    game={formData.games[step.gameIndex]}
                    update={(k, v) => updateGame(step.gameIndex!, k, v)}
                  />
                )}
                {step.type === 'game-screens' && step.gameIndex !== undefined && (
                  <StepGameScreens
                    game={formData.games[step.gameIndex]}
                    update={(k, v) => updateGame(step.gameIndex!, k, v)}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={goPrev}
                  className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
                >
                  ← חזרה
                </button>
              )}

              {isLastGameScreensStep ? (
                <div className="flex-1 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={addGame}
                    className="w-full py-3 rounded-2xl border-2 border-dashed border-primary/40 text-primary text-sm font-medium hover:bg-primary/5 transition"
                  >
                    + הוסף משחק נוסף
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-3 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                  >
                    {submitting ? 'שולח...' : '✓ שלח טופס'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canNext()}
                  className="flex-1 py-3 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-primary/20"
                >
                  המשך →
                </button>
              )}
            </div>

            {/* Optional note */}
            {step.type !== 'client' && step.type !== 'game-goal' && (
              <p className="text-center text-xs text-gray-300 mt-3">
                כל השדות אופציונליים — מלאו רק מה שידוע לכם
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
