export type EditorPollType = 'multiple-choice' | 'open-ended' | 'single-choice';

export type EditorPollStatus = 'closed' | 'configured' | 'open';

export type EditorPoll = Readonly<{
  id: string;
  options: readonly string[];
  hasResponses: boolean;
  status: EditorPollStatus;
  text: string;
  type: EditorPollType;
}>;

export type SessionEditorSession = Readonly<{
  id: string;
  lifecycle: 'draft' | 'ended' | 'live';
  name: string;
  polls: readonly EditorPoll[];
}>;
