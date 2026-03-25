import { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

// Check for browser SpeechRecognition support
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const hasResultRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, []);

  const startRecording = useCallback(() => {
    if (!SpeechRecognition) {
      toast.error('您的浏览器不支持语音识别，请使用 Chrome 或 Safari');
      return;
    }

    if (isListening) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN';
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        hasResultRef.current = false;
        toast.info('正在录音，请说话...', { duration: 2000, id: 'voice-status' });
      };

      recognition.onresult = (event: any) => {
        const results = event.results;
        let transcript = '';
        for (let i = event.resultIndex; i < results.length; i++) {
          if (results[i].isFinal) {
            transcript += results[i][0].transcript;
          }
        }
        if (transcript) {
          hasResultRef.current = true;
          onTranscript(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        recognitionRef.current = null;

        switch (event.error) {
          case 'not-allowed':
            toast.error('请允许麦克风权限后重试', { id: 'voice-status' });
            break;
          case 'no-speech':
            toast('未检测到语音，请再试一次', { id: 'voice-status' });
            break;
          case 'network':
            toast.error('网络错误，请检查网络连接', { id: 'voice-status' });
            break;
          case 'aborted':
            // User cancelled, no need to show error
            break;
          default:
            toast.error('语音识别出错，请重试', { id: 'voice-status' });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
        if (hasResultRef.current) {
          toast.success('语音输入完成', { duration: 1500, id: 'voice-status' });
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      toast.error('启动语音识别失败', { id: 'voice-status' });
      setIsListening(false);
    }
  }, [isListening, onTranscript]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  }, []);

  const handleClick = useCallback(() => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isListening, startRecording, stopRecording]);

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "relative p-2.5 rounded-xl transition-all duration-300 select-none",
        isListening
          ? "text-destructive"
          : "hover:bg-secondary/80 text-muted-foreground"
      )}
      title={isListening ? "停止录音" : "语音输入"}
    >
      {isListening ? (
        <div className="relative flex items-center justify-center">
          <span className="absolute inset-[-6px] rounded-xl bg-destructive/15 animate-pulse" />
          <MicOff className="w-4 h-4 relative z-10" />
        </div>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
}
