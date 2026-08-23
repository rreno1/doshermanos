import { StyleSheet, Text, View } from 'react-native';
import type { ReservationRecord, ReservationStatus } from './reservation.types';

const statusLabels: Record<ReservationStatus, string> = {
  pending_review: 'Pending review',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

const eventDateFormatter = new Intl.DateTimeFormat('en-PH', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

export function ReservationCard({ reservation }: { reservation: ReservationRecord }) {
  const eventDates = formatEventDates(reservation);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeading}>
        <Text selectable style={styles.cardTitle}>
          {reservation.package.packageName}
        </Text>
        <View style={[styles.statusPill, getStatusStyle(reservation.status)]}>
          <Text selectable style={[styles.statusText, getStatusTextStyle(reservation.status)]}>
            {statusLabels[reservation.status]}
          </Text>
        </View>
      </View>

      <Text selectable style={styles.mutedText}>
        {eventDates}
      </Text>
      <Text selectable style={styles.mutedText}>
        {reservation.event.guestCount.toLocaleString('en-PH')} guests ·{' '}
        {reservation.event.location}
      </Text>

      {reservation.event.serviceRequirements ? (
        <Text selectable style={styles.requirements}>
          {reservation.event.serviceRequirements}
        </Text>
      ) : null}
    </View>
  );
}

function formatEventDates(reservation: ReservationRecord) {
  const startDate = reservation.event.startDate;
  const endDate = reservation.event.endDate;
  const startLabel = eventDateFormatter.format(startDate);

  if (startDate.getTime() === endDate.getTime()) {
    return startLabel;
  }

  return `${startLabel} to ${eventDateFormatter.format(endDate)}`;
}

function getStatusStyle(status: ReservationStatus) {
  if (status === 'confirmed' || status === 'completed') {
    return styles.statusPositive;
  }

  if (status === 'rejected' || status === 'cancelled') {
    return styles.statusNegative;
  }

  return styles.statusPending;
}

function getStatusTextStyle(status: ReservationStatus) {
  if (status === 'confirmed' || status === 'completed') {
    return styles.statusPositiveText;
  }

  if (status === 'rejected' || status === 'cancelled') {
    return styles.statusNegativeText;
  }

  return styles.statusPendingText;
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DDE5E1',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    color: '#17211F',
    fontSize: 18,
    fontWeight: '700',
  },
  mutedText: {
    color: '#64716D',
    fontSize: 15,
    lineHeight: 22,
  },
  requirements: {
    color: '#40514C',
    fontSize: 14,
    lineHeight: 21,
    paddingTop: 4,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusPending: {
    backgroundColor: '#F4EFD9',
  },
  statusPendingText: {
    color: '#6B5715',
  },
  statusPositive: {
    backgroundColor: '#E5F3EF',
  },
  statusPositiveText: {
    color: '#0E5144',
  },
  statusNegative: {
    backgroundColor: '#F8EAEA',
  },
  statusNegativeText: {
    color: '#843838',
  },
});
