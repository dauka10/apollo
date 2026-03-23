import { useState } from 'react';
import type { PollCategory, QuestionType } from '../types';
import './CreatePollModal.css';

interface QuestionDraft {
  text: string;
  type: QuestionType;
  options: string[];
}

interface CreatePollModalProps {
  onClose: () => void;
  onCreate: (poll: {
    title: string;
    description: string;
    category: PollCategory;
    questions: QuestionDraft[];
  }) => void;
}

const emptyQuestion = (): QuestionDraft => ({ text: '', type: 'multiple_choice', options: ['', ''] });

export function CreatePollModal({ onClose, onCreate }: CreatePollModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PollCategory>('Research');
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);

  const addQuestion = () => {
    setQuestions([...questions, emptyQuestion()]);
  };

  const removeQuestion = (qIndex: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== qIndex));
    }
  };

  const updateQuestionText = (qIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex] = { ...updated[qIndex], text };
    setQuestions(updated);
  };

  const updateQuestionType = (qIndex: number, type: QuestionType) => {
    const updated = [...questions];
    updated[qIndex] = { ...updated[qIndex], type };
    setQuestions(updated);
  };

  const addOption = (qIndex: number) => {
    if (questions[qIndex].options.length < 6) {
      const updated = [...questions];
      updated[qIndex] = { ...updated[qIndex], options: [...updated[qIndex].options, ''] };
      setQuestions(updated);
    }
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    if (questions[qIndex].options.length > 2) {
      const updated = [...questions];
      updated[qIndex] = {
        ...updated[qIndex],
        options: updated[qIndex].options.filter((_, i) => i !== oIndex),
      };
      setQuestions(updated);
    }
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    const opts = [...updated[qIndex].options];
    opts[oIndex] = value;
    updated[qIndex] = { ...updated[qIndex], options: opts };
    setQuestions(updated);
  };

  const canSubmit =
    title.trim() &&
    description.trim() &&
    questions.every(
      (q) =>
        q.text.trim() &&
        (q.type === 'free_response' || q.options.filter((o) => o.trim()).length >= 2)
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onCreate({
      title: title.trim(),
      description: description.trim(),
      category,
      questions: questions.map((q) => ({
        text: q.text.trim(),
        type: q.type,
        options: q.type === 'multiple_choice' ? q.options.filter((o) => o.trim()) : [],
      })),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Survey</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Survey Title</label>
            <input
              type="text"
              placeholder="Name your survey..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="What is this survey about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <div className="category-select">
              {(['Homework', 'Research', 'Else'] as PollCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-btn ${cat.toLowerCase()} ${category === cat ? 'active' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="questions-section">
            <div className="questions-section-header">
              <label>Questions</label>
              <button type="button" className="add-question-btn" onClick={addQuestion}>
                + Add Question
              </button>
            </div>

            {questions.map((q, qIndex) => (
              <div key={qIndex} className="question-block">
                <div className="question-block-header">
                  <span className="question-label">Question {qIndex + 1}</span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      className="remove-question"
                      onClick={() => removeQuestion(qIndex)}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="question-type-toggle">
                  <button
                    type="button"
                    className={`type-btn ${q.type === 'multiple_choice' ? 'active' : ''}`}
                    onClick={() => updateQuestionType(qIndex, 'multiple_choice')}
                  >
                    Multiple Choice
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${q.type === 'free_response' ? 'active' : ''}`}
                    onClick={() => updateQuestionType(qIndex, 'free_response')}
                  >
                    Free Response
                  </button>
                </div>

                <input
                  type="text"
                  className="question-input"
                  placeholder="Enter your question..."
                  value={q.text}
                  onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                />

                {q.type === 'multiple_choice' ? (
                  <>
                    <div className="options-list">
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="option-input-row">
                          <input
                            type="text"
                            placeholder={`Option ${oIndex + 1}`}
                            value={opt}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          />
                          {q.options.length > 2 && (
                            <button
                              type="button"
                              className="remove-option"
                              onClick={() => removeOption(qIndex, oIndex)}
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {q.options.length < 6 && (
                      <button type="button" className="add-option" onClick={() => addOption(qIndex)}>
                        + Add option
                      </button>
                    )}
                  </>
                ) : (
                  <div className="free-response-hint">
                    Respondents will type their own answer in a text box.
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-create" disabled={!canSubmit}>
              Create Survey
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
