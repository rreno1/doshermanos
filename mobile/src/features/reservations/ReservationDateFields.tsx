import { useState } from 'react';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type DateField = 'start' | 'end';

type ReservationDateFieldsProps = {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
};

const displayDateFormatter = new Intl.DateTimeFormat('en-PH', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

export function ReservationDateFields({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: ReservationDateFieldsProps) {
  const [activeField, setActiveField] = useState<DateField | null>(null);
  const activeDate = activeField === 'start' ? startDate : endDate;

  function handleDateChange(date: Date) {
    if (activeField === 'start') {
      onStartDateChange(date);
    }

    if (activeField === 'end') {
      onEndDateChange(date);
    }

    if (process.env.EXPO_OS === 'android') {
      setActiveField(null);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Event dates</Text>
      <View style={styles.dateRow}>
        <DateButton
          label="Start"
          date={startDate}
          isActive={activeField === 'start'}
          onPress={() => setActiveField('start')}
        />
        <DateButton
          label="End"
          date={endDate}
          isActive={activeField === 'end'}
          onPress={() => setActiveField('end')}
        />
      </View>

      {activeField ? (
        <View style={styles.pickerBox}>
          <DateTimePicker
            value={activeDate}
            mode="date"
            presentation={process.env.EXPO_OS === 'android' ? 'dialog' : 'inline'}
            onValueChange={(_, date) => handleDateChange(date)}
            onDismiss={() => setActiveField(null)}
          />
          {process.env.EXPO_OS !== 'android' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Finish choosing event date"
              onPress={() => setActiveField(null)}
              style={({ pressed }) => [styles.doneButton, pressed && styles.doneButtonPressed]}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function DateButton({
  label,
  date,
  isActive,
  onPress,
}: {
  label: string;
  date: Date;
  isActive: boolean;
  onPress: () => void;
}) {
  const formattedDate = displayDateFormatter.format(date);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} date, ${formattedDate}`}
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.dateButton,
        isActive && styles.dateButtonActive,
        pressed && styles.dateButtonPressed,
      ]}
    >
      <Text style={styles.dateButtonLabel}>{label}</Text>
      <Text selectable style={styles.dateButtonValue}>
        {formattedDate}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  label: {
    color: '#263732',
    fontSize: 14,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateButton: {
    flex: 1,
    gap: 5,
    borderWidth: 1,
    borderColor: '#D8E0DC',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  dateButtonActive: {
    borderColor: '#176B5B',
    backgroundColor: '#F0F8F5',
  },
  dateButtonPressed: {
    transform: [{ scale: 0.99 }],
  },
  dateButtonLabel: {
    color: '#64716D',
    fontSize: 12,
    fontWeight: '700',
  },
  dateButtonValue: {
    color: '#17211F',
    fontSize: 15,
    fontWeight: '700',
  },
  pickerBox: {
    gap: 10,
    borderWidth: 1,
    borderColor: '#DDE5E1',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  doneButton: {
    alignSelf: 'flex-end',
    borderRadius: 999,
    backgroundColor: '#E5F3EF',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  doneButtonPressed: {
    backgroundColor: '#D8ECE6',
  },
  doneButtonText: {
    color: '#0E5144',
    fontSize: 14,
    fontWeight: '700',
  },
});
