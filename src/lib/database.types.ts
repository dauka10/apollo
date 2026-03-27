export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          avatar: string;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          avatar?: string;
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          avatar?: string;
          display_name?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      polls: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: 'Homework' | 'Research' | 'Else';
          user_id: string;
          author_email: string | null;
          thumbnail_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: 'Homework' | 'Research' | 'Else';
          user_id: string;
          author_email?: string | null;
          thumbnail_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: 'Homework' | 'Research' | 'Else';
          user_id?: string;
          author_email?: string | null;
          thumbnail_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'polls_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      questions: {
        Row: {
          id: string;
          poll_id: string;
          text: string;
          type: 'multiple_choice' | 'free_response';
          allow_other: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          poll_id: string;
          text: string;
          type?: 'multiple_choice' | 'free_response';
          allow_other?: boolean;
          sort_order: number;
        };
        Update: {
          id?: string;
          poll_id?: string;
          text?: string;
          type?: 'multiple_choice' | 'free_response';
          allow_other?: boolean;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'questions_poll_id_fkey';
            columns: ['poll_id'];
            isOneToOne: false;
            referencedRelation: 'polls';
            referencedColumns: ['id'];
          }
        ];
      };
      question_options: {
        Row: {
          id: string;
          question_id: string;
          text: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          question_id: string;
          text: string;
          sort_order: number;
        };
        Update: {
          id?: string;
          question_id?: string;
          text?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'question_options_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'questions';
            referencedColumns: ['id'];
          }
        ];
      };
      responses: {
        Row: {
          id: string;
          poll_id: string;
          question_id: string;
          option_id: string | null;
          free_text: string | null;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          poll_id: string;
          question_id: string;
          option_id?: string | null;
          free_text?: string | null;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          poll_id?: string;
          question_id?: string;
          option_id?: string | null;
          free_text?: string | null;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'responses_poll_id_fkey';
            columns: ['poll_id'];
            isOneToOne: false;
            referencedRelation: 'polls';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'responses_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'responses_option_id_fkey';
            columns: ['option_id'];
            isOneToOne: false;
            referencedRelation: 'question_options';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'responses_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Views: {};
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Functions: {};
  };
}
