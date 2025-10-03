
"use client";

import { useState, useEffect, useRef } from 'react';
import { cn } from "@/lib/utils"

interface TypedTextProps {
  strings: string[];
  typeSpeed?: number;
  deleteSpeed?: number;
  delayAfterTyping?: number;
  loop?: boolean;
}

export const TypedText = ({
  strings,
  typeSpeed = 100,
  deleteSpeed = 50,
  delayAfterTyping = 1500,
  loop = true,
}: TypedTextProps) => {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleTyping = () => {
      const currentString = strings[loopNum % strings.length];
      
      if (isDeleting) {
        // Deleting logic
        if (charIndex > 0) {
          setText(currentString.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
          typingTimeoutRef.current = setTimeout(handleTyping, deleteSpeed);
        } else {
          setIsDeleting(false);
          setLoopNum(loopNum + 1);
          typingTimeoutRef.current = setTimeout(handleTyping, 500); // pause before typing next string
        }
      } else {
        // Typing logic
        if (charIndex < currentString.length) {
          setText(currentString.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
          typingTimeoutRef.current = setTimeout(handleTyping, typeSpeed);
        } else {
          setIsDeleting(true);
          typingTimeoutRef.current = setTimeout(handleTyping, delayAfterTyping);
        }
      }
    };
    
    typingTimeoutRef.current = setTimeout(handleTyping, isDeleting ? deleteSpeed : typeSpeed);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [text, isDeleting, charIndex, loopNum, strings, typeSpeed, deleteSpeed, delayAfterTyping, loop]);

  return (
    <span className="text-muted-foreground relative">
        {text}
        <span className="animate-blink-caret border-l-2 border-primary-foreground absolute right-[-2px] top-0 h-full"></span>
    </span>
  );
};
