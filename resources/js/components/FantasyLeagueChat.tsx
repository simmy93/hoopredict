import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import '@/echo'; // Initialize Echo
import axios from 'axios';
import { Loader2, MessageCircle, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface User {
    id: number;
    name: string;
}

interface Message {
    id: number;
    user_id: number;
    message: string;
    is_system: boolean;
    created_at: string;
    user: User;
}

interface Props {
    leagueId: number;
    currentUserId: number;
}

export default function FantasyLeagueChat({ leagueId, currentUserId }: Props) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Load messages
    useEffect(() => {
        loadMessages();
    }, [leagueId]);

    // Subscribe to real-time updates
    useEffect(() => {
        console.log('📡 Subscribing to fantasy-league channel:', leagueId);
        const channel = window.Echo.private(`fantasy-league.${leagueId}`);

        channel.listen('.message.sent', (event: any) => {
            console.log('💬 Received message via broadcast:', event.message);
            setMessages((prev) => {
                // Avoid duplicates - check if message already exists
                if (prev.some((m) => m.id === event.message.id)) {
                    console.log('⚠️ Message already exists, skipping');
                    return prev;
                }
                return [...prev, event.message];
            });
            scrollToBottom();
        });

        return () => {
            console.log('🔌 Unsubscribing from fantasy-league channel:', leagueId);
            channel.stopListening('.message.sent');
            window.Echo.leave(`fantasy-league.${leagueId}`);
        };
    }, [leagueId]);

    // Auto-scroll when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => scrollToBottom(), 50);
        }
    }, [isOpen]);

    const loadMessages = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`/fantasy/leagues/${leagueId}/chat`);
            setMessages(response.data);
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        try {
            setIsSending(true);
            console.log('📤 Sending message...');
            const response = await axios.post(`/fantasy/leagues/${leagueId}/chat`, {
                message: newMessage.trim(),
            });
            console.log('✅ Message sent:', response.data);
            setMessages((prev) => [...prev, response.data]);
            setNewMessage('');
            inputRef.current?.focus();
            scrollToBottom();
        } catch (error) {
            console.error('❌ Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 24) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) {
        return (
            <Button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg" size="icon">
                <MessageCircle className="h-6 w-6" />
            </Button>
        );
    }

    return (
        <div className="fixed bottom-4 left-0 right-0 z-50 mx-auto w-full max-w-sm px-2 sm:max-w-md md:left-auto md:right-6 md:mx-0 md:w-96">
            <Card className="rounded-2xl shadow-2xl">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <MessageCircle className="h-5 w-5" />
                            League Chat
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 w-8 p-0">
                            <X />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {/* Messages */}
                    <div className="h-[60vh] space-y-3 overflow-y-auto rounded-b-xl bg-muted/20 p-3 sm:h-96">
                        {isLoading ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                                <MessageCircle className="mb-2 h-10 w-10 opacity-50" />
                                <p className="text-sm">No messages yet</p>
                                <p className="text-xs">Be the first to say something!</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className={`flex flex-col ${msg.user_id === currentUserId ? 'items-end' : 'items-start'}`}>
                                    {msg.is_system ? (
                                        <div className="w-full text-center">
                                            <span className="rounded-full bg-muted px-3 py-1 text-xs italic text-muted-foreground">
                                                {msg.message}
                                            </span>
                                        </div>
                                    ) : (
                                        <>
                                            <div
                                                className={`max-w-[85%] rounded-lg px-3 py-2 sm:max-w-[80%] ${
                                                    msg.user_id === currentUserId ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                                }`}
                                            >
                                                {msg.user_id !== currentUserId && <p className="mb-1 text-xs font-semibold">{msg.user.name}</p>}
                                                <p className="break-words text-sm">{msg.message}</p>
                                            </div>
                                            <span className="mt-1 text-[10px] text-muted-foreground sm:text-xs">{formatTime(msg.created_at)}</span>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={sendMessage} className="rounded-b-2xl border-t bg-background p-3">
                        <div className="flex gap-2">
                            <Input
                                ref={inputRef}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                disabled={isSending}
                                maxLength={1000}
                                className="flex-1 text-sm"
                            />
                            <Button type="submit" disabled={!newMessage.trim() || isSending} size="icon" className="shrink-0">
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
