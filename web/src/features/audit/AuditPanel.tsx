import { useEffect, useState } from 'react';
import { subscribeToAuditActivity } from './audit.service';
import type { AuditActivity } from './audit.types';
import './audit.css';

export function AuditPanel() {
  const [activities, setActivities] = useState<AuditActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    return subscribeToAuditActivity(
      (nextActivities) => {
        setActivities(nextActivities);
        setIsLoading(false);
      },
      () => {
        setHasError(true);
        setIsLoading(false);
      },
    );
  }, []);

  return (
    <section className="audit-section" id="audit" aria-labelledby="audit-title">
      <div className="audit-heading">
        <div>
          <p className="audit-kicker">Administrative accountability</p>
          <h2 id="audit-title">Operational audit trail</h2>
          <p>
            Review recent reservation decisions, inventory, payment, and physical equipment
            activity from their append-only operational records.
          </p>
        </div>
        <span className="audit-scope-note">Admin only</span>
      </div>

      {renderContent()}
    </section>
  );

  function renderContent() {
    if (isLoading) {
      return <AuditStatus message="Loading audit activity…" />;
    }

    if (hasError) {
      return <AuditStatus message="Audit activity could not be loaded." error />;
    }

    if (activities.length === 0) {
      return <AuditStatus message="Operational activity will appear here as records are created." />;
    }

    return (
      <ol className="audit-list">
        {activities.map((activity) => (
          <li key={activity.id} className={`audit-entry audit-entry-${activity.kind}`}>
            <div className="audit-entry-main">
              <strong>{activity.title}</strong>
              <p>{activity.detail}</p>
            </div>
            <div className="audit-entry-meta">
              <span>{activity.actorName}</span>
              <time dateTime={activity.createdAt.toISOString()}>
                {formatAuditTime(activity.createdAt)}
              </time>
            </div>
          </li>
        ))}
      </ol>
    );
  }
}

function AuditStatus({ message, error = false }: { message: string; error?: boolean }) {
  return (
    <div className={`audit-status ${error ? 'audit-status-error' : ''}`} role={error ? 'alert' : 'status'}>
      {message}
    </div>
  );
}

function formatAuditTime(date: Date): string {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
