export type CreateSessionPollPreview = Readonly<{
  id: string;
  text: string;
  type: 'multiple-choice' | 'open-ended' | 'single-choice';
}>;

export type CreateSessionDraft = Readonly<{
  lifecycle: 'draft';
  name: string;
  polls: readonly CreateSessionPollPreview[];
}>;

export const emptyCreateSessionDraft: CreateSessionDraft = {
  lifecycle: 'draft',
  name: '',
  polls: [],
};
