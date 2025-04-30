import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useSpeechSynthesis } from 'react-speech-kit';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface GeneralChatbotProps {
  tenantId: string;
}

const GeneralChatbot = ({ tenantId }: GeneralChatbotProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(1);
  const audioContextRef = useRef<AudioContext | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Speech recognition setup
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Initialize audio systems
  useEffect(() => {
    const initAudio = () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (!speechSynthesisRef.current) {
          speechSynthesisRef.current = window.speechSynthesis;
        }
      } catch (error) {
        toast.error('Audio system initialization failed');
      }
    };
    const handleFirstInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleFirstInteraction);
    };
    document.addEventListener('click', handleFirstInteraction);
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
    };
  }, []);

  const playTextAudio = async (text: string) => {
    if (!audioContextRef.current) return;
    try {
      setIsSpeaking(true);
      if (speechSynthesisRef.current) {
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = speechSynthesisRef.current.getVoices();
        const voice = voices.find(v => v.lang.includes('en')) || voices[0];
        if (voice) utterance.voice = voice;
        utterance.volume = volume;
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        speechSynthesisRef.current.cancel();
        speechSynthesisRef.current.speak(utterance);
        return;
      }
      setIsSpeaking(false);
    } catch (error) {
      toast.error('Failed to play audio');
      setIsSpeaking(false);
    }
  };

  const handleSpeakResponse = async (text: string) => {
    if (isSpeaking) {
      if (speechSynthesisRef.current) speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
      return;
    }
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    await playTextAudio(cleanText);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startListening = () => {
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
    if (transcript) setInput(transcript);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !tenantId) return;
    if (isSpeaking) setIsSpeaking(false);
    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    resetTranscript();
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/courses/general-chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, chatHistory: [...messages, userMessage] })
      });
      if (!response.ok) {
        throw new Error('Failed to get response from general chatbot');
      }
      const data = await response.json();
      const botReply = typeof data.response === 'object' && data.response.response ? data.response.response : data.response;
      const assistantMessage: ChatMessage = { role: 'assistant', content: botReply };
      setMessages(prev => [...prev, assistantMessage]);
      await handleSpeakResponse(botReply);
    } catch (error) {
      toast.error('Failed to get response from general chatbot');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <div className="p-4 border-b">
        <h3 className="font-semibold">General Chatbot</h3>
        <p className="text-sm text-gray-500">Ask any general compliance or company-related question.</p>
      </div>
      <ScrollArea className="h-[400px] p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex flex-col gap-2">
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.content}
                </div>
                {message.role === 'assistant' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="self-start hover:bg-muted/50"
                    onClick={() => handleSpeakResponse(message.content)}
                    title={isSpeaking ? 'Stop Speaking' : 'Play Speech'}
                  >
                    {isSpeaking ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="p-4 border-t flex gap-2">
        <div className="flex-1 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={listening ? 'Listening...' : 'Type your question...'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading || isSpeaking}
          />
          {browserSupportsSpeechRecognition && (
            <Button
              variant="outline"
              size="icon"
              onClick={listening ? stopListening : startListening}
              disabled={isLoading}
            >
              {listening ? (
                <MicOff className="h-4 w-4 text-red-500" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        <Button
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim() || isSpeaking}
          size="icon"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Card>
  );
};

export default GeneralChatbot; 