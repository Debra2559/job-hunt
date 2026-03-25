import { useState, useCallback, useRef } from 'react';
import { useScribe, CommitStrategy } from '@elevenlabs/react';
import { Mic, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

const LONG_PRESS_DURATION = 500;

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  const scribe = useScribe({
    modelId: 'scribe_v2_realtime',
    commitStrategy: CommitStrategy.VAD,
    languageCode: 'cmn',
    onPartialTranscript: (data) => {
      console.log('Partial transcript:', data.text);
    },
    onCommittedTranscript: (data) => {
      console.log('Committed transcript:', data.text);
      if (data.text) {
        onTranscript(data.text);
      }
    },
    onError: (error) => {
      console.error('Scribe error:', error);
      toast.error('语音识别出错');
    },
    onQuotaExceededError: () => {
      toast.error('语音识别配额已用尽');
    },
  });

  const startRecording = useCallback(async () => {
    if (scribe.isConnected) return;

    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-scribe-token');

      if (error || !data?.token) {
        console.error('Failed to get scribe token:', error);
        toast.error('无法启动语音识别，请稍后重试');
        return;
      }

      await scribe.connect({
        token: data.token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      toast.info('语音识别已启动，请开始说话...', { duration: 2000 });
    } catch (error) {
      console.error('Failed to start voice input:', error);
      toast.error('启动语音识别失败');
    } finally {
      setIsConnecting(false);
    }
  }, [scribe]);

  const stopRecording = useCallback(() => {
    if (scribe.isConnected) {
      scribe.disconnect();
    }
  }, [scribe]);

  // Long press handlers for mobile
  const handlePointerDown = useCallback(() => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      startRecording();
    }, LONG_PRESS_DURATION);
  }, [startRecording]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isLongPressRef.current) {
      stopRecording();
      isLongPressRef.current = false;
    }
  }, [stopRecording]);

  const handlePointerCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isLongPressRef.current) {
      stopRecording();
      isLongPressRef.current = false;
    }
  }, [stopRecording]);

  const handleClick = useCallback(() => {
    if (!isLongPressRef.current) {
      if (scribe.isConnected) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  }, [scribe.isConnected, startRecording, stopRecording]);

  const isActive = scribe.isConnected;

  return (
    <button
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onContextMenu={(e) => e.preventDefault()}
      disabled={disabled || isConnecting}
      className={cn(
        "relative p-2.5 rounded-xl transition-all duration-300 select-none touch-none",
        isActive
          ? "text-white"
          : "hover:bg-secondary/80 text-muted-foreground"
      )}
      title={isActive ? "停止语音输入" : "语音输入（点击切换 / 长按说话）"}
    >
      {isConnecting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isActive ? (
        <div className="relative flex items-center justify-center">
          <span className="absolute inset-[-4px] rounded-xl bg-gradient-to-br from-destructive via-destructive to-primary animate-pulse" />
          <span className="absolute inset-[-8px] rounded-xl bg-gradient-to-r from-destructive/40 to-primary/40 animate-ping" />
          <div className="relative z-10 flex items-center justify-center gap-[2px] w-4 h-4">
            <span className="w-[3px] h-2 bg-white rounded-full animate-soundwave" style={{ animationDelay: '0ms' }} />
            <span className="w-[3px] h-3 bg-white rounded-full animate-soundwave" style={{ animationDelay: '150ms' }} />
            <span className="w-[3px] h-2 bg-white rounded-full animate-soundwave" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
}
