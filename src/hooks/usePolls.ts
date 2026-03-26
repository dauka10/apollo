import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Poll, PollCategory, QuestionType } from '../types';

export function usePolls(userId?: string) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedPollIds, setVotedPollIds] = useState<Set<string>>(new Set());

  const fetchPolls = useCallback(async () => {
    setLoading(true);

    const { data: pollRows, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .order('created_at', { ascending: false });

    if (pollError || !pollRows) {
      console.error('Error fetching polls:', pollError);
      setLoading(false);
      return;
    }

    const pollIds = pollRows.map((p) => p.id);

    if (pollIds.length === 0) {
      setPolls([]);
      setLoading(false);
      return;
    }

    const [
      { data: questions },
      { data: options },
      { data: responseCounts },
    ] = await Promise.all([
      supabase
        .from('questions')
        .select('*')
        .in('poll_id', pollIds)
        .order('sort_order'),
      supabase
        .from('question_options')
        .select('*, question_id')
        .in('question_id', (await supabase
          .from('questions')
          .select('id')
          .in('poll_id', pollIds)
        ).data?.map((q) => q.id) ?? [])
        .order('sort_order'),
      supabase
        .from('responses')
        .select('poll_id, option_id, question_id, free_text, created_at'),
    ]);

    // Count votes per option
    const voteCounts: Record<string, number> = {};
    for (const r of responseCounts ?? []) {
      if (r.option_id) {
        voteCounts[r.option_id] = (voteCounts[r.option_id] ?? 0) + 1;
      }
    }

    // Collect free text responses per question
    const freeTextByQuestion: Record<string, { id: string; text: string; createdAt: number }[]> = {};
    for (const r of responseCounts ?? []) {
      if (r.free_text) {
        if (!freeTextByQuestion[r.question_id]) freeTextByQuestion[r.question_id] = [];
        freeTextByQuestion[r.question_id].push({
          id: r.question_id + '_' + freeTextByQuestion[r.question_id].length,
          text: r.free_text,
          createdAt: new Date(r.created_at).getTime(),
        });
      }
    }

    // Count responses per poll
    const pollResponseCounts: Record<string, number> = {};
    for (const r of responseCounts ?? []) {
      pollResponseCounts[r.poll_id] = (pollResponseCounts[r.poll_id] ?? 0) + 1;
    }

    const mappedPolls: Poll[] = pollRows.map((p) => {
      const pQuestions = (questions ?? []).filter((q) => q.poll_id === p.id);
      const questionsPerPoll = pQuestions.length || 1;
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category as PollCategory,
        userId: p.user_id,
        responses: Math.floor((pollResponseCounts[p.id] ?? 0) / questionsPerPoll),
        createdAt: new Date(p.created_at).getTime(),
        questions: pQuestions.map((q) => ({
          id: q.id,
          text: q.text,
          type: (q.type ?? 'multiple_choice') as QuestionType,
          options: (options ?? [])
            .filter((o) => o.question_id === q.id)
            .map((o) => ({
              id: o.id,
              text: o.text,
              votes: voteCounts[o.id] ?? 0,
            })),
          freeTextResponses: freeTextByQuestion[q.id] ?? [],
        })),
      };
    });

    // Fetch which polls the current user has already voted on
    if (userId) {
      const { data: userResponses } = await supabase
        .from('responses')
        .select('poll_id')
        .eq('user_id', userId);
      const voted = new Set((userResponses ?? []).map((r) => r.poll_id));
      setVotedPollIds(voted);
    }

    setPolls(mappedPolls);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const createPoll = async (
    userId: string,
    data: {
      title: string;
      description: string;
      category: PollCategory;
      questions: { text: string; type: QuestionType; options: string[] }[];
    }
  ) => {
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: data.title,
        description: data.description,
        category: data.category,
        user_id: userId,
      })
      .select()
      .single();

    if (pollError || !poll) {
      console.error('Error creating poll:', pollError);
      return { error: pollError };
    }

    for (let qi = 0; qi < data.questions.length; qi++) {
      const q = data.questions[qi];
      const { data: question, error: qError } = await supabase
        .from('questions')
        .insert({
          poll_id: poll.id,
          text: q.text,
          type: q.type,
          sort_order: qi,
        })
        .select()
        .single();

      if (qError || !question) {
        console.error('Error creating question:', qError);
        return { error: qError };
      }

      // Only insert options for multiple choice questions
      if (q.type === 'multiple_choice' && q.options.length > 0) {
        const optionInserts = q.options.map((text, oi) => ({
          question_id: question.id,
          text,
          sort_order: oi,
        }));

        const { error: oError } = await supabase
          .from('question_options')
          .insert(optionInserts);

        if (oError) {
          console.error('Error creating options:', oError);
          return { error: oError };
        }
      }
    }

    await fetchPolls();
    return { error: null };
  };

  const submitResponses = async (
    userId: string,
    pollId: string,
    answers: Record<string, string>, // questionId -> optionId (for multiple choice)
    freeTextAnswers: Record<string, string> = {} // questionId -> text (for free response)
  ) => {
    const mcInserts = Object.entries(answers).map(([questionId, optionId]) => ({
      poll_id: pollId,
      question_id: questionId,
      option_id: optionId,
      user_id: userId,
    }));

    const ftInserts = Object.entries(freeTextAnswers)
      .filter(([, text]) => text.trim())
      .map(([questionId, text]) => ({
        poll_id: pollId,
        question_id: questionId,
        free_text: text.trim(),
        user_id: userId,
      }));

    const allInserts = [...mcInserts, ...ftInserts];

    if (allInserts.length === 0) return { error: null };

    const { error } = await supabase.from('responses').insert(allInserts);

    if (error) {
      console.error('Error submitting responses:', error);
      return { error };
    }

    setVotedPollIds((prev) => new Set(prev).add(pollId));
    await fetchPolls();
    return { error: null };
  };

  return { polls, loading, votedPollIds, createPoll, submitResponses, refetch: fetchPolls };
}
