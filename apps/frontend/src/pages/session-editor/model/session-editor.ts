export type EditorPollType = 'multiple-choice' | 'open-ended' | 'single-choice';

export type EditorPollStatus = 'closed' | 'configured' | 'open';

export type EditorPoll = Readonly<{
  id: string;
  options: readonly string[];
  responses: number;
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

export const fixtureSessionEditorSession: SessionEditorSession = {
  id: 'session-team-offsite',
  lifecycle: 'draft',
  name: 'Team offsite - June 2025',
  polls: [
    {
      id: 'poll-time',
      options: ['Deep work', 'Team connection', 'Learning time'],
      responses: 0,
      status: 'configured',
      text: 'What should we make more time for?',
      type: 'single-choice',
    },
    {
      id: 'poll-format',
      options: ['A short workshop', 'Open discussion', 'Time to focus'],
      responses: 0,
      status: 'configured',
      text: 'Which format helps you learn best?',
      type: 'multiple-choice',
    },
    {
      id: 'poll-takeaway',
      options: [],
      responses: 0,
      status: 'configured',
      text: 'What is one thing you want to leave with?',
      type: 'open-ended',
    },
  ],
};
