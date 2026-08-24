import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { CateringPackage } from '../packages/package.types';
import { createReservationRequest } from './reservation.service';
import { validateReservationForm } from './reservation.validation';
import { ReservationDateFields } from './ReservationDateFields';

type ReservationFormProps = {
  customerId: string;
  cateringPackage: CateringPackage;
  onSubmitted: () => void;
};

export function ReservationForm({
  customerId,
  cateringPackage,
  onSubmitted,
}: ReservationFormProps) {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [location, setLocation] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [menuRequest, setMenuRequest] = useState('');
  const [foodQuantityRequest, setFoodQuantityRequest] = useState('');
  const [supplyRequest, setSupplyRequest] = useState('');
  const [serviceRequirements, setServiceRequirements] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleStartDateChange(date: Date) {
    setStartDate(date);

    if (date.getTime() > endDate.getTime()) {
      setEndDate(date);
    }

    setErrorMessage(null);
  }

  async function handleSubmit() {
    const validation = validateReservationForm({
      startDate: formatDateOnly(startDate),
      endDate: formatDateOnly(endDate),
      location,
      guestCount,
      serviceRequirements,
      menuRequest,
      foodQuantityRequest,
      supplyRequest,
    });

    if (!validation.value) {
      setErrorMessage(validation.message);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await createReservationRequest(customerId, cateringPackage, validation.value);
      onSubmitted();
    } catch {
      setErrorMessage('We could not send your reservation request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.form}>
      <ReservationDateFields
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={(date) => {
          setEndDate(date);
          setErrorMessage(null);
        }}
      />

      <FormField label="Event location">
        <TextInput
          accessibilityLabel="Event location"
          value={location}
          onChangeText={(value) => {
            setLocation(value);
            setErrorMessage(null);
          }}
          placeholder="Venue or complete event location"
          maxLength={300}
          autoCapitalize="words"
          style={styles.input}
        />
      </FormField>

      <FormField label="Guest count">
        <TextInput
          accessibilityLabel="Guest count"
          value={guestCount}
          onChangeText={(value) => {
            setGuestCount(value);
            setErrorMessage(null);
          }}
          placeholder="Expected number of guests"
          keyboardType="number-pad"
          maxLength={5}
          style={styles.input}
        />
      </FormField>

      <FormField label="Requested menu choices or changes" optional>
        <TextInput
          accessibilityLabel="Requested menu choices or changes, optional"
          value={menuRequest}
          onChangeText={(value) => {
            setMenuRequest(value);
            setErrorMessage(null);
          }}
          placeholder="Menu choices, substitutions, or additions to review"
          maxLength={1000}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.textArea]}
        />
      </FormField>

      <FormField label="Food quantity requirements" optional>
        <TextInput
          accessibilityLabel="Food quantity requirements, optional"
          value={foodQuantityRequest}
          onChangeText={(value) => {
            setFoodQuantityRequest(value);
            setErrorMessage(null);
          }}
          placeholder="Serving or food quantity adjustments to review"
          maxLength={1000}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.textArea]}
        />
      </FormField>

      <FormField label="Needed supplies" optional>
        <TextInput
          accessibilityLabel="Needed supplies, optional"
          value={supplyRequest}
          onChangeText={(value) => {
            setSupplyRequest(value);
            setErrorMessage(null);
          }}
          placeholder="Serving supplies, tables, linens, or other needs"
          maxLength={1000}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.textArea]}
        />
      </FormField>

      <FormField label="Service requirements" optional>
        <TextInput
          accessibilityLabel="Service requirements, optional"
          value={serviceRequirements}
          onChangeText={(value) => {
            setServiceRequirements(value);
            setErrorMessage(null);
          }}
          placeholder="Setup, service, dietary, or other event requirements"
          maxLength={1000}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.textArea]}
        />
      </FormField>

      <Text selectable style={styles.note}>
        Customization details are requests for review. The displayed package amount is the base package price, not an approved customized total. Dos Hermanos still needs to review pricing and confirm the event.
      </Text>

      {errorMessage ? (
        <Text selectable accessibilityLiveRegion="assertive" style={styles.errorText}>
          {errorMessage}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Send reservation request"
        disabled={isSubmitting}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && !isSubmitting && styles.buttonPressed,
          isSubmitting && styles.buttonDisabled,
        ]}
        onPress={() => void handleSubmit()}
      >
        <Text style={styles.primaryButtonText}>
          {isSubmitting ? 'Sending request…' : 'Send reservation request'}
        </Text>
      </Pressable>
    </View>
  );
}

function FormField({
  label,
  optional = false,
  children,
}: {
  label: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {optional ? <Text style={styles.optional}>Optional</Text> : null}
      </View>
      {children}
    </View>
  );
}

function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
  form: {
    gap: 18,
  },
  field: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    color: '#263732',
    fontSize: 14,
    fontWeight: '700',
  },
  optional: {
    color: '#586762',
    fontSize: 12,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#D8E0DC',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    color: '#17211F',
    fontSize: 15,
  },
  textArea: {
    minHeight: 112,
    paddingTop: 14,
  },
  note: {
    color: '#586762',
    fontSize: 13,
    lineHeight: 20,
  },
  errorText: {
    color: '#8A3232',
    fontSize: 14,
    lineHeight: 21,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#176B5B',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonPressed: {
    backgroundColor: '#0E5144',
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});
