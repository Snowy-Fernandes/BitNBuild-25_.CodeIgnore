// src/services/voiceService.ts
import Voice from '@react-native-voice/voice';
import { Platform, PermissionsAndroid } from 'react-native';

export interface VoiceRecognitionResult {
  text: string;
  isFinal: boolean;
  error?: string;
}

class VoiceService {
  private isListening = false;

  constructor() {
    this.setupVoiceHandlers();
  }

  private setupVoiceHandlers() {
    Voice.onSpeechStart = this.onSpeechStart.bind(this);
    Voice.onSpeechEnd = this.onSpeechEnd.bind(this);
    Voice.onSpeechResults = this.onSpeechResults.bind(this);
    Voice.onSpeechError = this.onSpeechError.bind(this);
  }

  private onSpeechStart(e: any) {
    console.log('Speech started', e);
    this.isListening = true;
  }

  private onSpeechEnd(e: any) {
    console.log('Speech ended', e);
    this.isListening = false;
  }

  private onSpeechResults(e: any) {
    console.log('Speech results', e);
    if (e.value && e.value.length > 0) {
      const result = e.value[0];
      if (this.onResultCallback) {
        this.onResultCallback({
          text: result,
          isFinal: true
        });
      }
    }
  }

  private onSpeechError(e: any) {
    console.error('Speech error', e);
    this.isListening = false;
    if (this.onErrorCallback) {
      this.onErrorCallback(e.error?.message || 'Speech recognition failed');
    }
  }

  private onResultCallback?: (result: VoiceRecognitionResult) => void;
  private onErrorCallback?: (error: string) => void;

  async startListening(
    onResult: (result: VoiceRecognitionResult) => void,
    onError: (error: string) => void
  ): Promise<boolean> {
    try {
      // Request permissions
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Recipe Creator needs access to your microphone',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          throw new Error('Microphone permission denied');
        }
      }
if (Platform.OS === 'web') {
  console.warn('Voice recognition is not supported on Web');
  onError('Voice recognition is not supported on Web');
  return false;
}

await Voice.start('en-US');

      this.onResultCallback = onResult;
      this.onErrorCallback = onError;

      await Voice.start('en-US');
      return true;
    } catch (error) {
      console.error('Start listening error:', error);
      onError(error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  async stopListening(): Promise<void> {
    try {
      await Voice.stop();
      await Voice.destroy();
      this.isListening = false;
    } catch (error) {
      console.error('Stop listening error:', error);
    }
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  // Cleanup
  destroy() {
    Voice.destroy();
    Voice.removeAllListeners();
  }
}

export const voiceService = new VoiceService();