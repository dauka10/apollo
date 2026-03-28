export type PollCategory = 'Homework' | 'Research' | 'Else';
export type QuestionType = 'multiple_choice' | 'free_response';

export interface QuestionOption {
  id: string;
  text: string;
  votes: number;
}

export interface FreeTextResponse {
  id: string;
  text: string;
  createdAt: number;
}

export interface DynamicVote {
  optionId: string;
  avgPct: number;
  count: number;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  allowOther: boolean;
  allowMultiple: boolean;
  maxSelections: number;
  allowDynamic: boolean;
  options: QuestionOption[];
  freeTextResponses: FreeTextResponse[];
  otherResponses: FreeTextResponse[];
  dynamicResults: DynamicVote[];
  dynamicVoterCount: number;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  category: PollCategory;
  userId: string;
  authorEmail?: string;
  authorAvatar?: string;
  thumbnailUrl?: string;
  questions: Question[];
  responses: number;
  createdAt: number;
}

export type TabFilter = 'All' | PollCategory;
