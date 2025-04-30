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

interface ChatHelpProps {
  slideTitle: string;
  slideContent: string;
  tenantId: string;
}

interface TenantDetails {
  details: {
    presidingOfficerEmail: string;
    poshCommitteeEmail: string;
    hrContactName: string;
    hrContactEmail: string;
    hrContactPhone: string;
  }
}

interface CourseMaterial {
  materialUrl: string;
}

const ChatHelp = ({ slideTitle, slideContent, tenantId }: ChatHelpProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tenantDetails, setTenantDetails] = useState<TenantDetails | null>(null);
  const [courseMaterial, setCourseMaterial] = useState<CourseMaterial | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(1);
  const audioContextRef = useRef<AudioContext | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem('token');

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
        // Initialize Web Audio API
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          console.log('Audio context initialized successfully');
        }

        // Initialize Speech Synthesis
        if (!speechSynthesisRef.current) {
          speechSynthesisRef.current = window.speechSynthesis;
          console.log('Speech synthesis initialized successfully');
        }
      } catch (error) {
        console.error('Failed to initialize audio systems:', error);
        toast.error('Audio system initialization failed');
      }
    };

    // Initialize on first user interaction
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
    if (!audioContextRef.current) {
      console.error('Audio context not initialized');
      toast.error('Audio system not ready. Please try again.');
      return;
    }

    try {
      setIsSpeaking(true);

      // First try using Web Speech API
      if (speechSynthesisRef.current) {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure voice
        const voices = speechSynthesisRef.current.getVoices();
        const voice = voices.find(v => v.lang.includes('en')) || voices[0];
        if (voice) utterance.voice = voice;
        
        // Configure speech
        utterance.volume = volume;
        utterance.rate = 1;
        utterance.pitch = 1;

        // Add event listeners
        utterance.onstart = () => {
          console.log('Speech started');
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          console.log('Speech ended');
          setIsSpeaking(false);
        };

        utterance.onerror = (event) => {
          console.error('Speech error:', event);
          toast.error('Error during speech playback');
          setIsSpeaking(false);
        };

        // Cancel any ongoing speech
        speechSynthesisRef.current.cancel();
        speechSynthesisRef.current.speak(utterance);
        return;
      }

      // Fallback: Play a simple tone
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.setValueAtTime(440, audioContextRef.current.currentTime);
      gainNode.gain.setValueAtTime(0.1 * volume, audioContextRef.current.currentTime);
      
      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.2);

      // Show text in toast
      toast.info('Speaking: ' + text.substring(0, 50) + '...');
      
      // Simulate speech duration
      await new Promise(resolve => setTimeout(resolve, text.length * 50));
      
      setIsSpeaking(false);
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error('Failed to play audio');
      setIsSpeaking(false);
    }
  };

  const handleSpeakResponse = async (text: string) => {
    console.log('Attempting to speak:', { text, isSpeaking });
    
    if (isSpeaking) {
      // Stop current speech
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    // Clean the text (remove markdown and extra spaces)
    const cleanText = text
      .replace(/\*\*/g, '') // Remove bold markers
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

    await playTextAudio(cleanText);
  };

  // Fetch tenant details and course material when component mounts
  useEffect(() => {
    const fetchRequiredData = async () => {
      try {
        // Fetch tenant details
        const tenantResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tenants/${tenantId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        if (!tenantResponse.ok) {
          throw new Error('Failed to fetch tenant details');
        }
        
        const tenantData = await tenantResponse.json();
        setTenantDetails(tenantData);

        // Get courseId from URL
        const courseId = window.location.pathname.split('/course/')[1]?.split('/')[0];
        if (!courseId) {
          throw new Error('Course ID not found in URL');
        }

        // Check if we already have the material URL in localStorage
        const storedMaterialUrl = localStorage.getItem(`course_material_${courseId}`);
        
        if (!storedMaterialUrl) {
          // Fetch course material URL if not in localStorage
          const materialResponse = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/courses/${courseId}/chatbot-material?tenantId=${tenantId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              }
            }
          );

          if (!materialResponse.ok) {
            throw new Error('Failed to fetch course material');
          }

          const materialData = await materialResponse.json();
          // Store the material URL in localStorage
          localStorage.setItem(`course_material_${courseId}`, materialData.materialUrl);
          setCourseMaterial({ materialUrl: materialData.materialUrl });
        } else {
          // Use the stored material URL
          setCourseMaterial({ materialUrl: storedMaterialUrl });
        }
      } catch (error) {
        console.error('Error fetching required data:', error);
        toast.error('Failed to load chat data');
      }
    };

    if (tenantId && token) {
      fetchRequiredData();
    }
  }, [tenantId, token]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startListening = () => {
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
    if (transcript) {
      setInput(transcript);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !tenantDetails || !courseMaterial) return;

    // Stop any ongoing speech
    if (isSpeaking) {
      setIsSpeaking(false);
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    resetTranscript();
    setIsLoading(true);

    try {
      console.log('Sending request to chatbot with:', {
        chatHistory: [...messages, userMessage],
        presentation_url: courseMaterial.materialUrl,
        emergency_details: {
          presiding_officer_email: tenantDetails.details.presidingOfficerEmail,
          posh_committee_email: tenantDetails.details.poshCommitteeEmail,
          hr_contact_name: tenantDetails.details.hrContactName,
          hr_contact_email: tenantDetails.details.hrContactEmail,
          hr_contact_phone: tenantDetails.details.hrContactPhone
        }
      });

      const response = await fetch('http://localhost:8000/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatHistory: [...messages, userMessage],
          presentation_url: courseMaterial.materialUrl,
          emergency_details: {
            presiding_officer_email: tenantDetails.details.presidingOfficerEmail,
            posh_committee_email: tenantDetails.details.poshCommitteeEmail,
            hr_contact_name: tenantDetails.details.hrContactName,
            hr_contact_email: tenantDetails.details.hrContactEmail,
            hr_contact_phone: tenantDetails.details.hrContactPhone
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Chatbot response:', data);
      
      const botReply = typeof data.response === 'object' && data.response.response ? data.response.response : data.response;
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: botReply
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Automatically speak the response
      await handleSpeakResponse(botReply);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to get response from AI service');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Chat Help</h3>
        <p className="text-sm text-gray-500">Ask questions about: {slideTitle}</p>
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
            disabled={isLoading || !tenantDetails || !courseMaterial || isSpeaking}
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
          disabled={isLoading || !input.trim() || !tenantDetails || !courseMaterial || isSpeaking}
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

export default ChatHelp;
