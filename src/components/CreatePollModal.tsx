import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { PollCategory, QuestionType } from '../types';
import './CreatePollModal.css';

interface QuestionDraft {
  text: string;
  type: QuestionType;
  options: string[];
  allowOther: boolean;
  allowMultiple: boolean;
  maxSelections: number;
  allowDynamic: boolean;
}

interface CreatePollModalProps {
  onClose: () => void;
  onCreate: (poll: {
    title: string;
    description: string;
    category: PollCategory;
    thumbnailUrl?: string;
    questions: { text: string; type: QuestionType; options: string[]; allowOther: boolean; allowMultiple: boolean; maxSelections: number; allowDynamic: boolean }[];
  }) => void | Promise<void>;
}

const emptyQuestion = (): QuestionDraft => ({ text: '', type: 'multiple_choice', options: ['', ''], allowOther: false, allowMultiple: false, maxSelections: 2, allowDynamic: false });

export function CreatePollModal({ onClose, onCreate }: CreatePollModalProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getFullYear()).slice(-2)}`;
  });
  const [hashtags, setHashtags] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PollCategory>('Research');
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const removeThumbnail = () => {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

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
    date.trim() &&
    questions.every(
      (q) =>
        q.text.trim() &&
        (q.type === 'free_response' || q.options.filter((o) => o.trim()).length >= 2)
    );

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);

    let thumbnailUrl: string | undefined;
    if (thumbnailFile) {
      const ext = thumbnailFile.name.split('.').pop() ?? 'png';
      const path = `thumbnails/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('poll-assets')
        .upload(path, thumbnailFile, { contentType: thumbnailFile.type });
      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('poll-assets')
          .getPublicUrl(path);
        thumbnailUrl = urlData.publicUrl;
      }
    }

    const meta = [date.trim(), hashtags.trim()].filter(Boolean).join(' ');
    const fullDescription = [meta, description.trim()].filter(Boolean).join(' | ');
    await onCreate({
      title: title.trim(),
      description: fullDescription,
      category,
      thumbnailUrl,
      questions: questions.map((q) => ({
        text: q.text.trim(),
        type: q.type,
        options: q.type === 'multiple_choice' ? q.options.filter((o) => o.trim()) : [],
        allowOther: q.type === 'multiple_choice' ? q.allowOther : false,
        allowMultiple: q.type === 'multiple_choice' ? q.allowMultiple : false,
        maxSelections: q.type === 'multiple_choice' ? q.maxSelections : 2,
        allowDynamic: q.type === 'multiple_choice' ? q.allowDynamic : false,
      })),
    });
    setSubmitting(false);
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
          <div className="form-row">
            <div className="form-group form-group-date">
              <label>Date</label>
              <input
                type="text"
                placeholder="DD.MM.YY"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                maxLength={8}
              />
            </div>
            <div className="form-group form-group-tags">
              <label>Hashtags</label>
              <input
                type="text"
                placeholder="#math #homework #chapter5"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
              />
            </div>
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
            <label>Thumbnail (optional)</label>
            {thumbnailPreview ? (
              <div className="thumbnail-preview">
                <img src={thumbnailPreview} alt="Thumbnail preview" />
                <button type="button" className="thumbnail-remove" onClick={removeThumbnail}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ) : (
              <label className="thumbnail-upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailSelect}
                  hidden
                />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span>Click to upload an image</span>
              </label>
            )}
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
                    <label className="allow-other-toggle">
                      <input
                        type="checkbox"
                        checked={q.allowOther}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[qIndex] = { ...updated[qIndex], allowOther: e.target.checked };
                          setQuestions(updated);
                        }}
                      />
                      <span>Allow "Other" answer (students write their own)</span>
                    </label>
                    <label className="allow-other-toggle">
                      <input
                        type="checkbox"
                        checked={q.allowMultiple}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[qIndex] = { ...updated[qIndex], allowMultiple: e.target.checked };
                          setQuestions(updated);
                        }}
                      />
                      <span>Allow multiple choice (students can select more than one)</span>
                    </label>
                    {q.allowMultiple && (
                      <div className="max-selections-row">
                        <label>Max selections:</label>
                        <input
                          type="number"
                          className="max-selections-input"
                          min={2}
                          max={q.options.length || 6}
                          value={q.maxSelections}
                          onChange={(e) => {
                            const updated = [...questions];
                            updated[qIndex] = { ...updated[qIndex], maxSelections: Math.max(2, Math.min(q.options.length || 6, parseInt(e.target.value) || 2)) };
                            setQuestions(updated);
                          }}
                        />
                      </div>
                    )}
                    <label className="allow-other-toggle">
                      <input
                        type="checkbox"
                        checked={q.allowDynamic}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[qIndex] = { ...updated[qIndex], allowDynamic: e.target.checked };
                          setQuestions(updated);
                        }}
                      />
                      <span>Allow dynamic multiple answers (students distribute % across options)</span>
                    </label>
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
            <button type="submit" className="btn-create" disabled={!canSubmit || submitting}>
              {submitting ? 'Creating...' : 'Create Survey'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
