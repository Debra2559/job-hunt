import { useState, useCallback } from 'react';
import { useScribe, CommitStrategy } from '@elevenlabs/react';
import { Mic, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const scribe = useScribe({
    modelId: 'scribe_v2_realtime',
    commitStrategy: CommitStrategy.VAD, // Voice Activity Detection for automatic commits
    languageCode: 'cmn', // Mandarin Chinese
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

  const handleToggle = useCallback(async () => {
    if (scribe.isConnected) {
      scribe.disconnect();
      return;
    }

    setIsConnecting(true);
    try {
      // Get token from edge function
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

  const isActive = scribe.isConnected;

  return (
    <button
      onClick={handleToggle}
      disabled={disabled || isConnecting}
      className={cn(
        "relative p-2 rounded-full transition-all duration-300",
        isActive
          ? "text-white"
          : "hover:bg-secondary/80 text-muted-foreground"
      )}
      title={isActive ? "停止语音输入" : "语音输入"}
    >
      {isConnecting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isActive ? (
        <div className="relative flex items-center justify-center">
          {/* Animated gradient background */}
          <span className="absolute inset-[-4px] rounded-full bg-gradient-to-br from-destructive via-destructive to-primary animate-pulse" />
          {/* Outer pulsing ring */}
          <span className="absolute inset-[-8px] rounded-full bg-gradient-to-r from-destructive/40 to-primary/40 animate-ping" />
          {/* Sound wave bars */}
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
