import { KnowledgeSource } from '@/types/chat';

type ChatMessage = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

// Convert file to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Read text file content
async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export async function streamChat({
  messages,
  files,
  onDelta,
  onDone,
  onError,
  onSources,
}: {
  messages: ChatMessage[];
  files?: File[];
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  onSources?: (sources: KnowledgeSource[]) => void;
}) {
  try {
    // Process files if any
    let fileContents: Array<{ name: string; type: string; content: string }> = [];
    
    if (files && files.length > 0) {
      for (const file of files) {
        const isImage = file.type.startsWith('image/');
        const isText = file.type.startsWith('text/') || 
                       file.name.endsWith('.txt') || 
                       file.name.endsWith('.md') ||
                       file.name.endsWith('.json');
        
        if (isImage) {
          const base64 = await fileToBase64(file);
          fileContents.push({
            name: file.name,
            type: 'image',
            content: base64,
          });
        } else if (isText) {
          const text = await readTextFile(file);
          fileContents.push({
            name: file.name,
            type: 'text',
            content: text,
          });
        } else {
          // For other files, just send the name as placeholder
          fileContents.push({
            name: file.name,
            type: 'file',
            content: `[文件: ${file.name}, 类型: ${file.type}, 大小: ${(file.size / 1024).toFixed(1)}KB]`,
          });
        }
      }
    }

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ 
        messages,
        files: fileContents.length > 0 ? fileContents : undefined,
      }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      const errorMessage = errorData.error || "AI服务暂时不可用";
      onError(errorMessage);
      return;
    }

    if (!resp.body) {
      onError("无法建立连接");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      // Process line-by-line as data arrives
      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          
          // Check for sources data
          if (parsed.sources && onSources) {
            onSources(parsed.sources);
            continue;
          }
          
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          // Incomplete JSON split across chunks: put it back and wait for more data
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush in case remaining buffered lines arrived without trailing newline
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          
          // Check for sources data
          if (parsed.sources && onSources) {
            onSources(parsed.sources);
            continue;
          }
          
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          /* ignore partial leftovers */
        }
      }
    }

    onDone();
  } catch (error) {
    console.error("Stream chat error:", error);
    onError("网络连接失败，请检查网络后重试");
  }
}
