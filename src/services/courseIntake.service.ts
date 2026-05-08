export interface GameData {
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

interface FileData {
  name: string;
  type: string;
  data: string; // base64 data URL
}

export interface CourseIntakeFormData {
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
  logoFileData?: FileData | null;
  generalFilesData?: FileData[];
  inspirations: string;
  fonts: string;
  generalNotes: string;
  games: GameData[];
  // runtime-only, excluded from payload
  logoFile?: File | null;
  generalFiles?: File[];
}

export async function submitCourseIntakeForm(data: CourseIntakeFormData): Promise<void> {
  const url = import.meta.env.VITE_COURSE_INTAKE_SCRIPT_URL;
  if (!url) throw new Error('VITE_COURSE_INTAKE_SCRIPT_URL is not set');

  const { logoFile: _lf, generalFiles: _gf, ...rest } = data;
  const payload = { ...rest, submittedAt: new Date().toISOString() };

  await fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
  });
  // no-cors returns an opaque response — if fetch didn't throw, the request was sent
}
