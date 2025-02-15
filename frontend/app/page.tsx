'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { VerificationResponse } from './types';

interface ChatMessage {
  type: 'user' | 'assistant';
  content: string;
  verificationResult?: VerificationResponse;
}

const ChatMessage = ({ msg, isThinking }: { msg: ChatMessage; isThinking: boolean }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={`flex flex-col gap-4 ${msg.type === 'user' ? 'bg-primary text-primary-foreground px-3 py-2 rounded-xl' : ''}`}>
      {msg.content ? (
        <div>
          <p className={`mb-4 text-base ${
            msg.content?.split('\n\n')[0].startsWith('Statement TRUE:') 
              ? 'text-green-600 font-medium'
              : msg.content?.split('\n\n')[0].startsWith('Statement FALSE:')
                ? 'text-red-600 font-medium'
                : ''
          }`}>
            {msg.content.split('\n\n')[0]}
          </p>
          {msg.type === 'assistant' && msg.content.split('\n\n').length > 1 && (
            <div className="text-xs space-y-2">
              {/* Section FACT CHECK STATEMENT */}
              <div className="font-semibold border-b pb-2">
                {msg.content.split('\n\n')[1].split('\n').slice(0, 2).join('\n')}
              </div>
              
              {/* Section DEBUG EXTRACT */}
              <div className="bg-muted/30 p-2 rounded">
                {msg.content.split('\n\n')[1].split('\n').slice(2, 3).join('\n')}
              </div>
              
              {/* Section DEBUG Relations */}
              <div className="bg-muted/30 p-2 rounded">
                {msg.content.split('\n\n')[1].split('\n').slice(3, 4).join('\n')}
              </div>
              
              {/* Bouton pour afficher/masquer les détails */}
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showDetails ? '▼ Masquer les détails' : '▶ Voir les détails'}
              </button>
              
              {/* Sections détaillées (masquées par défaut) */}
              {showDetails && (
                <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                  {/* Section DEBUG URLs et Response */}
                  <div className="space-y-1 pl-2">
                    {msg.content.split('\n\n')[1].split('\n').slice(4, 8).map((line, i) => (
                      <div key={i} className="text-muted-foreground">
                        {line}
                      </div>
                    ))}
                  </div>
                  
                  {/* Section DEBUG Candidates */}
                  <div className="bg-muted/30 p-2 rounded space-y-1 mt-2">
                    {msg.content.split('\n\n')[1].split('\n').slice(8).map((line, i) => (
                      <div key={i}>
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        isThinking && <span className="text-muted-foreground text-sm">Thinking...</span>
      )}
      {msg.verificationResult && msg.verificationResult.result && (
        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            {msg.verificationResult.result.message}
            {msg.verificationResult.result.extracted_triplet && (
              <>
                <br />
                Extracted: {msg.verificationResult.result.extracted_triplet.join(' ')}
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

const Page: React.FC = () => {
  const [message, setMessage] = React.useState('');
  const [showContent, setShowContent] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isThinking, setIsThinking] = React.useState(false);
  const [displayedResponse, setDisplayedResponse] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = React.useState<string>('');
  const [verificationResult, setVerificationResult] = React.useState<VerificationResponse | null>(null);
  const [sampleQuestions, setSampleQuestions] = React.useState<string[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Fonction pour obtenir de nouvelles suggestions
  const getSuggestions = async () => {
    try {
      const response = await fetch('http://localhost:5000/get_suggestions');
      const data = await response.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setSampleQuestions(data.suggestions);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  // Chargement initial des suggestions
  React.useEffect(() => {
    getSuggestions();
  }, []);

  const handleQuestionClick = (question: string) => {
    setMessage(question);
  };

  const simulateTypingEffect = async (text: string) => {
    setIsThinking(false);
    let displayText = '';
    const words = text.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      displayText += words[i] + ' ';
      setChatHistory(prev => {
        const newHistory = [...prev];
        if (newHistory.length > 0) {
          newHistory[newHistory.length - 1] = {
            type: 'assistant',
            content: displayText.trim(),
            verificationResult
          };
        }
        return newHistory;
      });
      await new Promise(resolve => setTimeout(resolve, 20));
    }

    // Une fois la réponse complètement affichée, on attend un peu et on rafraîchit les suggestions
    setTimeout(async () => {
      await getSuggestions();
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message.trim();
    setShowContent(false);
    setIsLoading(true);
    setMessage('');
    setIsThinking(true);
    setDisplayedResponse('');
    setVerificationResult(null);

    // Add user message to history
    setChatHistory(prev => [...prev, { type: 'user', content: userMessage }]);

    try {
      const response = await fetch('http://localhost:5000/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: userMessage }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log("=== DEBUG FRONTEND: Données reçues du backend:", data);  // Log de debug
      setVerificationResult(data);
      
      // Format the response with a clear verification status and debug info
      const verificationStatus = data.result.found 
        ? "Statement TRUE: " + data.result.message
        : "Statement FALSE: " + data.result.message;

      // Créer la réponse complète avec tous les détails de debug
      const formattedResponse = `${verificationStatus}\n\n${data.debug}`;
      
      setChatHistory(prev => [...prev, { 
        type: 'assistant', 
        content: formattedResponse,
        verificationResult: data 
      }]);
      
      await simulateTypingEffect(formattedResponse);
      
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll when chat history changes
  React.useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  return (
    <div className="flex min-h-screen flex-col items-center">
      {showContent && (
        <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl mt-16">
          <div className="grid_block hero_cell hero_authorCell flex justify-center" data-grid-cell="">
            <div className="stack_stack stack" data-version="v1">
              <div className="author-avatar-group_avatars" style={{ '--avatar-size': '32px' } as React.CSSProperties}>
                <div className="avatar-container">
                  <button type="submit" aria-label="Open authors menu" className="button_base reset_reset author-avatar-group_mobile-button" data-geist-button="" data-prefix="false" data-suffix="false" data-version="v1" style={{ '--geist-icon-size': '16px' } as React.CSSProperties}>
                    <span className="button_content" />
                  </button>
                  <h2 className="geist-sr-only">Authors</h2>
                  <span className="text-white text-sm">By</span>
                  <a className="link_link">
                    <div className="context-card_contextCardTrigger">
                      <span aria-hidden="true" aria-label="Avatar for Simon" className="avatar_avatar" data-geist-avatar="" data-mask="true" data-resolved="true" data-version="v1" role="img" style={{ '--size': '32px' } as React.CSSProperties}>
                        <Image src="/sim.svg" alt="Simon Calarn" width={32} height={32} className="image_intrinsic" />
                      </span>
                      <div className="hover-card">
                        <div className="context-card_contextCardRoot">
                          <div className="context-card_contextCardContent">
                            <div className="context-card_contextCardContentVisibility">
                              <div className="card-content">
                                <div className="name-role">
                                  <span className="text-white">Simon Calarn - Ing3 DAI</span>
                                </div>
                                <div className="inline-group">
                                  <div className="logo-role-wrapper">
                                    <Image src="/logo.png" alt="EFREI Logo" width={24} height={24} style={{ color: 'var(--ds-gray-900)' }} />
                                    <span className="card-role">Dev NLP</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="card-tip">
                              <svg height="10" viewBox="0 0 14 10" width="14" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.00009 8.11236L1.46893 0H12.5312L7.00009 8.11236Z" fill="hsla(0,0%,4%,1)" />
                                <path d="M0.94043 1L7.00009 9.8875L13.0597 1H11.8494L7.00009 8.11236L2.15075 1H0.94043Z" fill="#333" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                  <a className="link_link">
                    <div className="context-card_contextCardTrigger">
                      <span aria-hidden="true" aria-label="Avatar for Mederic" className="avatar_avatar" data-geist-avatar="" data-mask="true" data-resolved="true" data-version="v1" role="img" style={{ '--size': '32px' } as React.CSSProperties}>
                        <Image src="/med.svg" alt="Mederic Zhou Sun" width={32} height={32} className="image_intrinsic" />
                      </span>
                      <div className="hover-card">
                        <div className="context-card_contextCardRoot">
                          <div className="context-card_contextCardContent">
                            <div className="context-card_contextCardContentVisibility">
                              <div className="card-content">
                                <div className="name-role">
                                  <span className="text-white">Mederic Zhou Sun - Ing3 DAI</span>
                                </div>
                                <div className="inline-group">
                                  <div className="logo-role-wrapper">
                                    <Image src="/logo.png" alt="EFREI Logo" width={24} height={24} style={{ color: 'var(--ds-gray-900)' }} />
                                    <span className="card-role">Dev NLP</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="card-tip">
                              <svg height="10" viewBox="0 0 14 10" width="14" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.00009 8.11236L1.46893 0H12.5312L7.00009 8.11236Z" fill="hsla(0,0%,4%,1)" />
                                <path d="M0.94043 1L7.00009 9.8875L13.0597 1H11.8494L7.00009 8.11236L2.15075 1H0.94043Z" fill="#333" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-center text-text-base text-[2.5rem] font-[600] leading-[3rem] tracking-[-.96px] mb-8">
            Automated Fact Checking
          </h1>
          <div className="text-[24px] font-[500] leading-[32px] tracking-[-.96px] text-balance text-text-base">
            <p>
              This <span style={{ color: 'oklch(0.717 0.1648 250.794)' }} className="font-[600]">personal</span>{' '}
              chatbot uses{' '}
              <span style={{ color: 'oklch(0.6987 0.2037 309.51)' }} className="font-[600]">DBpedia</span>{' '}
              knowledge base to verify factual statements. Simply enter a statement, and our system will{' '}
              <b style={{ color: 'oklch(0.717 0.1648 250.794)' }} className="font-[600]">analyze</b>{' '}
              it by{' '}
              <span style={{ color: 'oklch(0.6987 0.2037 309.51)' }} className="font-[600]">extracting key relationships</span>{' '}
              and validating them against{' '}
              <span style={{ color: 'oklch(0.717 0.1648 250.794)' }} className="font-[600]">verified facts</span>.
            </p>
          </div>
        </div>
      )}

      {!showContent && (
        <div className="flex flex-col min-w-0 gap-6 flex-1 w-full max-w-3xl px-4 mt-8 pb-32 overflow-y-auto scrollbar-hide">
          {chatHistory.map((msg, index) => (
            <div key={index} className="w-full mx-auto max-w-3xl px-4 group/message" data-role={msg.type}>
              <div className={`flex gap-4 w-full ${msg.type === 'user' ? 'group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:w-fit' : ''}`}>
                {msg.type === 'assistant' && (
                  <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
                    <div className="translate-y-px">
                      <svg height="14" strokeLinejoin="round" viewBox="0 0 16 16" width="14" style={{ color: 'currentcolor' }}>
                        <path d="M2.5 0.5V0H3.5V0.5C3.5 1.60457 4.39543 2.5 5.5 2.5H6V3V3.5H5.5C4.39543 3.5 3.5 4.39543 3.5 5.5V6H3H2.5V5.5C2.5 4.39543 1.60457 3.5 0.5 3.5H0V3V2.5H0.5C1.60457 2.5 2.5 1.60457 2.5 0.5Z" fill="currentColor"></path>
                        <path d="M14.5 4.5V5H13.5V4.5C13.5 3.94772 13.0523 3.5 12.5 3.5H12V3V2.5H12.5C13.0523 2.5 13.5 2.05228 13.5 1.5V1H14H14.5V1.5C14.5 2.05228 14.9477 2.5 15.5 2.5H16V3V3.5H15.5C14.9477 3.5 14.5 3.94772 14.5 4.5Z" fill="currentColor"></path>
                        <path d="M8.70711 4.92939L8.5 4H9.5L9.59294 4.92939C9.82973 7.29734 11.7027 9.17027 14.0706 9.40706L15 9.5V10.5L14.0706 10.5929C11.7027 10.8297 9.82973 12.7027 9.59294 15.0706L9.5 16H8.5L8.40706 15.0706C8.17027 12.7027 6.29734 10.8297 3.92939 10.5929L3 10.5V9.5L3.92939 9.40706C6.29734 9.17027 8.17027 7.29734 8.40706 4.92939Z" fill="currentColor"></path>
                      </svg>
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex flex-row gap-2 items-start">
                    <ChatMessage msg={msg} isThinking={isThinking} />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="fixed bottom-0 w-full max-w-3xl bg-background">
        <div className="w-full h-8 bg-gradient-to-t from-background to-transparent" />
        
        <div className="flex flex-col items-center gap-4 mb-4 w-full px-4 relative z-10">
          <div className="grid sm:grid-cols-2 gap-4 w-full">
            {sampleQuestions.map((question, index) => (
              <div key={index} className="block relative z-20" style={{ opacity: 1, transform: 'none' }}>
                <button
                  className="inline-flex whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground text-left border border-muted rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start bg-background"
                  onClick={(e) => {
                    e.preventDefault();
                    handleQuestionClick(question);
                  }}
                >
                  {question}
                </button>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex mx-auto px-4 pb-4 md:pb-6 gap-2 w-full">
          <div className="relative w-full flex flex-col gap-4">
            <div className="relative">
              <textarea
                className="flex w-full border border-muted px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-muted pb-10"
                placeholder="Send a message..."
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                autoFocus
              />
              <div className="absolute bottom-0 p-2 w-fit flex flex-row justify-start">
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:text-accent-foreground rounded-md p-[7px] h-fit hover:bg-muted"
                  type="submit"
                  aria-label="Send message"
                  disabled={!message}
                >
                  <svg height="14" strokeLinejoin="round" viewBox="0 0 16 16" width="14" style={{ color: 'currentcolor' }}>
                    <path fillRule="evenodd" clipRule="evenodd" d="M8.70711 1.39644C8.31659 1.00592 7.68342 1.00592 7.2929 1.39644L2.21968 6.46966L1.68935 6.99999L2.75001 8.06065L3.28034 7.53032L7.25001 3.56065V14.25V15H8.75001V14.25V3.56065L12.7197 7.53032L13.25 8.06065L14.3107 6.99999L13.7803 6.46966L8.70711 1.39644Z" fill="currentColor"/>
                  </svg>
                </button>
              </div>

              <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
                <button
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-1.5 h-fit border border-muted"
                  type="submit"
                  aria-label="Send message"
                  disabled={!message}
                >
                  <svg
                    width="16"
                    height="14"
                    viewBox="0 0 16 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M1.39644 7.2929C1.00592 7.68342 1.00592 8.31659 1.39644 8.70711L6.46967 13.7803L6.99999 14.3107L8.06066 13.25L7.53033 12.7197L3.56066 8.75H14.25H15V7.25H14.25H3.56066L7.53033 3.28033L8.06066 2.75L6.99999 1.68934L6.46967 2.21967L1.39644 7.2929Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Page;
