import { useState } from 'react';
import type { Poll } from '../types';
import './SurveyView.css';

interface SurveyViewProps {
  poll: Poll;
  onBack: () => void;
  onVote: (pollId: string, answers: Record<string, string>, freeTextAnswers: Record<string, string>) => void | Promise<void>;
  hasVoted?: boolean;
}

export function SurveyView({ poll, onBack, onVote, hasVoted }: SurveyViewProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [freeTextAnswers, setFreeTextAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(hasVoted ?? false);
  const [submitting, setSubmitting] = useState(false);

  const allAnswered = poll.questions.every((q) =>
    q.type === 'free_response'
      ? (freeTextAnswers[q.id] ?? '').trim().length > 0
      : !!answers[q.id]
  );

  const handleSubmit = async () => {
    if (allAnswered && !submitting) {
      setSubmitting(true);
      await onVote(poll.id, answers, freeTextAnswers);
      setSubmitted(true);
      setSubmitting(false);
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

          const totalVotes = question.options.reduce((s, o) => s + o.votes, 0);

          return (
            <div key={question.id} className="survey-question">
              <h3 className="question-number">Question {qIndex + 1}</h3>
              <p className="question-text">{question.text}</p>
              <div className="question-options">
                {question.options.map((option) => {
                  const isSelected = answers[question.id] === option.id;
                  const votes = option.votes + (submitted && isSelected ? 1 : 0);
                  const adjustedTotal = totalVotes + (submitted ? 1 : 0);
                  const pct = adjustedTotal > 0 ? (votes / adjustedTotal) * 100 : 0;

                  return (
                    <button
                      key={option.id}
                      className={`survey-option ${isSelected ? 'selected' : ''} ${submitted ? 'voted' : ''}`}
                      onClick={() => !submitted && setAnswers({ ...answers, [question.id]: option.id })}
                      disabled={submitted}
                    >
                      {submitted && (
                        <div className="survey-option-bar" style={{ width: `${pct}%` }} />
                      )}
                      <span className="survey-option-text">{option.text}</span>
                      {submitted && (
                        <span className="survey-option-pct">{Math.round(pct)}%</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {!submitted && (
        <div className="survey-submit-area">
          <span className="survey-progress">
            {Object.keys(answers).length + Object.keys(freeTextAnswers).filter((k) => freeTextAnswers[k]?.trim()).length} of {poll.questions.length} answered
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
