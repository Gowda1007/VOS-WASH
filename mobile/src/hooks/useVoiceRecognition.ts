import { useState, useEffect, useCallback } from 'react';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';

interface UseVoiceRecognitionReturn {
    isListening: boolean;
    transcript: string;
    error: string | null;
    startListening: () => Promise<void>;
    stopListening: () => Promise<void>;
    resetTranscript: () => void;
}

export const useVoiceRecognition = (): UseVoiceRecognitionReturn => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Voice.onSpeechStart = onSpeechStart;
        Voice.onSpeechEnd = onSpeechEnd;
        Voice.onSpeechError = onSpeechError;
        Voice.onSpeechResults = onSpeechResults;

        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, []);

    const onSpeechStart = (e: any) => {
        setIsListening(true);
        setError(null);
    };

    const onSpeechEnd = (e: any) => {
        setIsListening(false);
    };

    const onSpeechError = (e: SpeechErrorEvent) => {
        setIsListening(false);
        setError(e.error?.message || 'Unknown voice error');
        console.error('Voice Error:', e.error);
    };

    const onSpeechResults = (e: SpeechResultsEvent) => {
        if (e.value && e.value.length > 0) {
            setTranscript(e.value[0]);
        }
    };

    const startListening = useCallback(async () => {
        try {
            setTranscript('');
            setError(null);
            await Voice.start('en-IN'); // Default to English (India)
        } catch (e) {
            console.error(e);
            setError('Failed to start listening');
        }
    }, []);

    const stopListening = useCallback(async () => {
        try {
            await Voice.stop();
            setIsListening(false);
        } catch (e) {
            console.error(e);
        }
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setError(null);
    }, []);

    return {
        isListening,
        transcript,
        error,
        startListening,
        stopListening,
        resetTranscript,
    };
};
