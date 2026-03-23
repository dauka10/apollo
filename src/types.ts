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

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: QuestionOption[];
  freeTextResponses: FreeTextResponse[];
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  category: PollCategory;
  userId: string;
  questions: Question[];
  responses: number;
  createdAt: number;
}

export type TabFilter = 'All' | PollCategory;
