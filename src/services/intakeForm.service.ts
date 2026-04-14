export interface IntakeFormData {
  // Step 1: General
  projectName: string;
  eventType: string;
  eventTypeOther: string;
  targetAgeRange: string;
  techLevel: string;
  participantsCount: string;
  eventDate: string;
  deadline: string;
  budget: string;

  // Step 2: Branding
  hasExistingLogo: string;
  primaryColor: string;
  secondaryColor: string;
  designStyle: string[];
  inspirationLinks: string;
  hasExistingAssets: string;

  // Step 3: Game Type & Mechanics
  gameTemplate: string;
  gameTemplateOther: string;
  stagesCount: string;
  hasScoringSystem: string;
  bonusPenalty: string;
  timePerQuestion: string;
  totalQuestions: string;
  difficultyProgression: string;

  // Step 4: Content
  questionTypes: string[];
  contentProvider: string;
  mainTopic: string;
  subTopics: string;
  language: string;
  needsPersonalization: string;
  personalizationDetails: string;

  // Step 5: Features & Interactivity
  mobileSupport: string;
  multiplayerType: string;
  leaderboard: string;
  audioFeatures: string[];
  animationLevel: string;
  feedbackType: string[];

  // Step 6: Technical
  platform: string;
  dataStorage: string;
  dataToSave: string[];
  accessControl: string;

  // Step 7: Template Modifications
  startingFrom: string;
  templateName: string;
  requiredChanges: string;
  specialFeatures: string;

  // Step 8: Deliverables & Support
  deliverableFormats: string[];
  needsPreviewDemo: string;
  needsDocumentation: string;
  eventDaySupport: string;
  correctionRounds: string;
  postLaunchSupport: string;

  // Step 9: Contact & Notes
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  specialRequests: string;
  likedExamples: string;
  dislikedExamples: string;
  successCriteria: string;
}

export async function submitIntakeForm(data: IntakeFormData): Promise<void> {
  const scriptUrl = import.meta.env.VITE_INTAKE_SCRIPT_URL as string | undefined;
  if (!scriptUrl) {
    throw new Error('VITE_INTAKE_SCRIPT_URL is not configured');
  }

  // Send as plain text to avoid CORS preflight — Apps Script handles the JSON parsing
  const response = await fetch(scriptUrl, {
    method: 'POST',
    body: JSON.stringify({ ...data, submittedAt: new Date().toISOString() }),
  });

  if (!response.ok) {
    throw new Error(`Submission failed: ${response.status}`);
  }
}
