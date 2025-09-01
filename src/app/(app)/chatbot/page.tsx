
import { ChatInterface } from "@/components/chat-interface";
import { withAuth } from "@/hooks/use-auth";

function ChatbotPage() {
  return (
    <div className="h-[calc(100vh-theme(spacing.28))] flex flex-col">
       <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">AI Chatbot Assistant</h1>
        <p className="text-muted-foreground">
          Your personal guide for Canadian immigration queries.
        </p>
      </header>
      <ChatInterface />
    </div>
  );
}

export default withAuth(ChatbotPage);
