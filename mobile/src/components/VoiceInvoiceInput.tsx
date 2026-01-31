import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles/theme';
import { useLanguage } from '../context/LanguageContext';
import { parseVoiceCommand, VoiceCommandResult, isKannadaCommand } from '../core/utils/voiceParser';

interface VoiceInvoiceInputProps {
  onResult: (result: VoiceCommandResult) => void;
  isProcessing?: boolean;
}

export const VoiceInvoiceInput: React.FC<VoiceInvoiceInputProps> = ({ onResult, isProcessing = false }) => {
  const { t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [partialResult, setPartialResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<'kn-IN' | 'en-US'>('kn-IN'); // Default to Kannada

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value && e.value.length > 0) {
      const text = e.value[0];
      setPartialResult(text);
      // Auto-stop if silence logic fails or just for feedback
    }
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    console.error('Speech error:', e);
    setError(e.error?.message || 'Voice recognition error');
    setIsListening(false);
  };

  const startListening = async () => {
    setError(null);
    setPartialResult('');
    try {
      await Voice.start(detectedLanguage);
      setIsListening(true);
    } catch (e) {
      console.error(e);
      setError('Could not start microphone');
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
      
      if (partialResult) {
         // Process final result
         const parsed = parseVoiceCommand(partialResult);
         onResult(parsed);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleLanguage = () => {
    setDetectedLanguage(prev => prev === 'kn-IN' ? 'en-US' : 'kn-IN');
  };

  return (
    <View style={styles.container}>
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {!isListening ? (
        <View style={styles.controls}>
             <TouchableOpacity style={styles.langButton} onPress={toggleLanguage}>
                <Text style={styles.langButtonText}>
                  {detectedLanguage === 'kn-IN' ? 'ಕನ್ನಡ (Kannada)' : 'English'}
                </Text>
             </TouchableOpacity>

            <TouchableOpacity 
              style={styles.micButton} 
              onPress={startListening}
              disabled={isProcessing}
            >
              <MaterialIcons name="mic" size={32} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.hintText}>
              {detectedLanguage === 'kn-IN' 
                ? 'ಟ್ಯಾಪ್ ಮಾಡಿ ಮತ್ತು ಹೇಳಿ: "ಗ್ರಾಹಕ ರವಿ ಫೋನ್ 9900..."' 
                : 'Tap to speak: "Customer Ravi Phone 9900..."'}
            </Text>
        </View>
      ) : (
        <View style={styles.listeningContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.listeningText}>
            {detectedLanguage === 'kn-IN' ? 'ಆಲಿಸಲಾಗುತ್ತಿದೆ...' : 'Listening...'}
          </Text>
          <Text style={styles.partialText}>{partialResult}</Text>
          <TouchableOpacity style={styles.stopButton} onPress={stopListening}>
            <MaterialIcons name="stop" size={32} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  controls: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  hintText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  listeningContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  listeningText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
  },
  partialText: {
    ...typography.body,
    fontStyle: 'italic',
    color: colors.text,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  stopButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  langButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  langButtonText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
  }
});
