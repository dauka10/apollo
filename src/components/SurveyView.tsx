import { useState } from 'react';
import type { Poll } from '../types';
import './SurveyView.css';

interface SurveyViewProps {
  poll: Poll;
  onBack: () => void;
  onVote: (pollId: string, answers: Record<string, string>, freeTextAnswers: Record<string, string>, otherTextAnswers: Record<string, string>, dynamicAnswers: Record<string, Record<string, number>>, multiAnswers: Record<string, string[]>) => void | Promise<void>;
  hasVoted?: boolean;
}

export function SurveyView({ poll, onBack, onVote, hasVoted }: SurveyViewProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [freeTextAnswers, setFreeTextAnswers] = useState<Record<string, string>>({});
  const [otherTextAnswers, setOtherTextAnswers] = useState<Record<string, string>>({});
  const [otherSelected, setOtherSelected] = useState<Record<string, boolean>>({});
  const [multiAnswers, setMultiAnswers] = useState<Record<string, string[]>>({});
  // dynamicAnswers: questionId -> { optionId: percentage }
  const [dynamicAnswers, setDynamicAnswers] = useState<Record<string, Record<string, number>>>({});
  const [dynamicMode, setDynamicMode] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(hasVoted ?? false);
  const [submitting, setSubmitting] = useState(false);

  const getDynamicSum = (questionId: string) => {
    const pcts = dynamicAnswers[questionId] ?? {};
    return Object.values(pcts).reduce((s, v) => s + v, 0);
  };

  const allAnswered = poll.questions.every((q) => {
    if (q.type === 'free_response') {
      return (freeTextAnswers[q.id] ?? '').trim().length > 0;
    }
    if (dynamicMode[q.id]) {
      const sum = getDynamicSum(q.id);
      return sum === 100;
    }
    if (otherSelected[q.id]) {
      return (otherTextAnswers[q.id] ?? '').trim().length > 0;
    }
    if (q.allowMultiple) {
      return (multiAnswers[q.id] ?? []).length >= 1;
    }
    return !!answers[q.id];
  });

  const handleSubmit = async () => {
    if (allAnswered && !submitting) {
      setSubmitting(true);
      try {
        await onVote(poll.id, answers, freeTextAnswers, otherTextAnswers, dynamicAnswers, multiAnswers);
        setSubmitted(true);
      } catch (err) {
        console.error('Vote submission failed:', err);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const categoryClass = poll.category.toLowerCase();

  return (
    <div className="survey-view">
      <button className="back-btn" onClick={onBack}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to polls
      </button>

      <div className="survey-header">
        <span className={`poll-tag ${categoryClass}`}>{poll.category}</span>
        {poll.thumbnailUrl && (
          <div className="survey-thumbnail">
            <img src={poll.thumbnailUrl} alt="" />
          </div>
        )}
        <h2 className="survey-title">{poll.title}</h2>
        <p className="survey-description">{poll.description}</p>
        <span className="survey-response-count">{poll.responses} responses so far</span>
      </div>

      <div className="survey-questions">
        {poll.questions.map((question, qIndex) => {
          if (question.type === 'free_response') {
            return (
              <div key={question.id} className="survey-question">
                <h3 className="question-number">Question {qIndex + 1}</h3>
                <p className="question-text">{question.text}</p>
                <span className="question-type-badge free">Free Response</span>

                {!submitted ? (
                  <textarea
                    className="free-response-input"
                    placeholder="Type your answer..."
                    value={freeTextAnswers[question.id] ?? ''}
                    onChange={(e) =>
                      setFreeTextAnswers({ ...freeTextAnswers, [question.id]: e.target.value })
                    }
                    rows={3}
                  />
                ) : (
                  <div className="free-response-results">
                    <div className="your-response">
                      <span className="your-response-label">Your answer:</span>
                      <p>{freeTextAnswers[question.id]}</p>
                    </div>
                    {question.freeTextResponses.length > 0 && (
                      <div className="other-responses">
                        <span className="other-responses-label">
                          {question.freeTextResponses.length} other response{question.freeTextResponses.length !== 1 ? 's' : ''}
                        </span>
                        <div className="responses-list">
                          {question.freeTextResponses.map((r) => (
                            <div key={r.id} className="response-bubble">
                              {r.text}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }

          const otherCount = question.otherResponses.length;
          const totalVotes = question.options.reduce((s, o) => s + o.votes, 0) + otherCount;
          const isOther = otherSelected[question.id];
          const isDynamic = dynamicMode[question.id];
          const dynamicSum = getDynamicSum(question.id);

          return (
            <div key={question.id} className="survey-question">
              <h3 className="question-number">Question {qIndex + 1}</h3>
              <p className="question-text">{question.text}</p>

              {/* Mode toggle: single pick vs dynamic distribution */}
              {question.allowDynamic && !submitted && (
                <div className="answer-mode-toggle">
                  <button
                    className={`mode-btn ${!isDynamic ? 'active' : ''}`}
                    onClick={() => {
                      setDynamicMode({ ...dynamicMode, [question.id]: false });
                      const { [question.id]: _, ...rest } = dynamicAnswers;
                      setDynamicAnswers(rest);
                    }}
                  >
                    Pick one
                  </button>
                  <button
                    className={`mode-btn ${isDynamic ? 'active' : ''}`}
                    onClick={() => {
                      setDynamicMode({ ...dynamicMode, [question.id]: true });
                      // Clear single-pick answer for this question
                      const { [question.id]: _, ...restA } = answers;
                      setAnswers(restA);
                      setOtherSelected({ ...otherSelected, [question.id]: false });
                    }}
                  >
                    Distribute %
                  </button>
                </div>
              )}

              {/* Dynamic percentage inputs */}
              {isDynamic && !submitted && (
                <div className="dynamic-inputs">
                  {question.options.map((option) => {
                    const val = dynamicAnswers[question.id]?.[option.id] ?? 0;
                    return (
                      <div key={option.id} className="dynamic-input-row">
                        <span className="dynamic-input-label">{option.text}</span>
                        <input
                          type="number"
                          className="dynamic-input"
                          min={0}
                          max={100}
                          value={val || ''}
                          placeholder="0"
                          onChange={(e) => {
                            const num = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                            setDynamicAnswers({
                              ...dynamicAnswers,
                              [question.id]: {
                                ...(dynamicAnswers[question.id] ?? {}),
                                [option.id]: num,
                              },
                            });
                          }}
                        />
                        <span className="dynamic-input-pct">%</span>
                      </div>
                    );
                  })}
                  <div className={`dynamic-sum ${dynamicSum === 100 ? 'valid' : dynamicSum > 100 ? 'over' : ''}`}>
                    Total: {dynamicSum}% {dynamicSum === 100 ? '' : dynamicSum > 100 ? '' : `(${100 - dynamicSum}% remaining)`}
                  </div>
                </div>
              )}

              {/* Dynamic results (radial bar only) — shown when submitted and question has dynamic data */}
              {submitted && question.dynamicResults.length > 0 && (
                <div className="dynamic-results">
                  <span className="dynamic-results-label">
                    Average distribution ({question.dynamicVoterCount} voter{question.dynamicVoterCount !== 1 ? 's' : ''})
                  </span>
                  <div className="dynamic-radial-wrap">
                    <svg viewBox="0 0 200 200" className="chart-svg dynamic-radial-svg">
                      {question.options.map((option, i) => {
                        const dbResult = question.dynamicResults.find((d) => d.optionId === option.id);
                        const avgPct = dbResult ? dbResult.avgPct : 0;
                        const r = 88 - i * 18;
                        if (r <= 10) return null;
                        const circumference = 2 * Math.PI * r;
                        const filled = circumference * (avgPct / 100);
                        const colors = ['#ca641f', '#5ba4cf', '#7c6fe0', '#5bbd72', '#e07c6f', '#e0c56f'];
                        return (
                          <g key={option.id}>
                            <circle cx={100} cy={100} r={r} fill="none" stroke="var(--border)" strokeWidth={14} opacity={0.3} />
                            <circle
                              cx={100} cy={100} r={r}
                              fill="none"
                              stroke={colors[i % colors.length]}
                              strokeWidth={14}
                              strokeDasharray={`${filled} ${circumference - filled}`}
                              strokeDashoffset={circumference / 4}
                              strokeLinecap="round"
                            />
                          </g>
                        );
                      })}
                    </svg>
                    <div className="dynamic-radial-legend">
                      {question.options.map((option, i) => {
                        const dbResult = question.dynamicResults.find((d) => d.optionId === option.id);
                        const avgPct = dbResult ? dbResult.avgPct : 0;
                        const colors = ['#ca641f', '#5ba4cf', '#7c6fe0', '#5bbd72', '#e07c6f', '#e0c56f'];
                        return (
                          <div key={option.id} className="chart-legend-item">
                            <span className="chart-legend-dot" style={{ background: colors[i % colors.length] }} />
                            <span className="chart-legend-label">{option.text}</span>
                            <span className="chart-legend-value">{Math.round(avgPct)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Standard options (single-pick or multi-select) */}
              {!isDynamic && (
                <div className="question-options">
                  {question.allowMultiple && !submitted && (
                    <span className="multi-select-hint">
                      Select up to {question.maxSelections} options
                    </span>
                  )}
                  {question.options.map((option) => {
                    const isMulti = question.allowMultiple;
                    const selectedMulti = multiAnswers[question.id] ?? [];
                    const isSelected = isMulti
                      ? selectedMulti.includes(option.id)
                      : (!isOther && answers[question.id] === option.id);
                    const pct = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                    const atMax = isMulti && selectedMulti.length >= question.maxSelections && !isSelected;

                    return (
                      <button
                        key={option.id}
                        className={`survey-option ${isSelected ? 'selected' : ''} ${submitted ? 'voted' : ''} ${atMax ? 'disabled' : ''}`}
                        onClick={() => {
                          if (submitted || atMax) return;
                          if (isMulti) {
                            const current = multiAnswers[question.id] ?? [];
                            const updated = current.includes(option.id)
                              ? current.filter((id) => id !== option.id)
                              : [...current, option.id];
                            setMultiAnswers({ ...multiAnswers, [question.id]: updated });
                          } else {
                            setAnswers({ ...answers, [question.id]: option.id });
                            setOtherSelected({ ...otherSelected, [question.id]: false });
                          }
                        }}
                        disabled={submitted}
                      >
                        {submitted && (
                          <div className="survey-option-bar" style={{ width: `${pct}%` }} />
                        )}
                        {isMulti && !submitted && (
                          <span className={`multi-check ${isSelected ? 'checked' : ''}`}>
                            {isSelected ? '✓' : ''}
                          </span>
                        )}
                        <span className="survey-option-text">{option.text}</span>
                        {submitted && (
                          <span className="survey-option-pct">{Math.round(pct)}%</span>
                        )}
                      </button>
                    );
                  })}

                  {question.allowOther && !submitted && (
                    <>
                      <button
                        className={`survey-option ${isOther ? 'selected' : ''}`}
                        onClick={() => {
                          setOtherSelected({ ...otherSelected, [question.id]: true });
                          const { [question.id]: _, ...rest } = answers;
                          setAnswers(rest);
                        }}
                      >
                        <span className="survey-option-text">Other</span>
                      </button>
                      {isOther && (
                        <input
                          type="text"
                          className="other-text-input"
                          placeholder="Type your answer..."
                          value={otherTextAnswers[question.id] ?? ''}
                          onChange={(e) =>
                            setOtherTextAnswers({ ...otherTextAnswers, [question.id]: e.target.value })
                          }
                          autoFocus
                        />
                      )}
                    </>
                  )}

                  {question.allowOther && submitted && (
                    (() => {
                      const pct = totalVotes > 0 ? (otherCount / totalVotes) * 100 : 0;
                      return (
                        <>
                          <button className={`survey-option ${isOther ? 'selected' : ''} voted`} disabled>
                            <div className="survey-option-bar" style={{ width: `${pct}%` }} />
                            <span className="survey-option-text">Other</span>
                            <span className="survey-option-pct">{Math.round(pct)}%</span>
                          </button>
                          {(question.otherResponses.length > 0 || isOther) && (
                            <div className="other-answers-section">
                              <span className="other-answers-label">Other answers</span>
                              <div className="responses-list">
                                {isOther && otherTextAnswers[question.id]?.trim() && (
                                  <div className="response-bubble your-other">
                                    {otherTextAnswers[question.id]}
                                  </div>
                                )}
                                {question.otherResponses.map((r) => (
                                  <div key={r.id} className="response-bubble">
                                    {r.text}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <div className="survey-submit-area">
          <span className="survey-progress">
            {Object.keys(answers).length + Object.keys(multiAnswers).filter((k) => (multiAnswers[k] ?? []).length >= 1).length + Object.keys(freeTextAnswers).filter((k) => freeTextAnswers[k]?.trim()).length + Object.keys(otherTextAnswers).filter((k) => otherSelected[k] && otherTextAnswers[k]?.trim()).length + Object.keys(dynamicAnswers).filter((k) => getDynamicSum(k) === 100).length} of {poll.questions.length} answered
          </span>
          <button
            className="survey-submit-btn"
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Responses'}
          </button>
        </div>
      )}

      {submitted && (
        <div className="survey-submitted">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p>Thank you for your responses!</p>
        </div>
      )}

    </div>
  );
}
