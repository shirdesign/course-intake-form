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
  preferredColors: string;
  inspirations: string;
  fonts: string;
  generalNotes: string;
  games: GameData[];
}

export async function submitCourseIntakeForm(data: CourseIntakeFormData): Promise<void> {
  const url = import.meta.env.VITE_COURSE_INTAKE_SCRIPT_URL;
  if (!url) throw new Error('VITE_COURSE_INTAKE_SCRIPT_URL is not set');

  const payload = { ...data, submittedAt: new Date().toISOString() };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Server responded with ${res.status}`);
}
