import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Share2, Link2, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  videoId: string;
  videoTitle: string;
  currentTime?: number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export default function ShareButton({
  videoId,
  videoTitle,
  currentTime = 0,
  variant = 'outline',
  size = 'default',
  showLabel = true,
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const videoUrl = `${window.location.origin}/video/${videoId}`;
  const timestampUrl = `${videoUrl}?t=${Math.floor(currentTime)}`;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl);
      toast.success('✅ Link Copied');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleCopyTimestamp = async () => {
    try {
      await navigator.clipboard.writeText(timestampUrl);
      toast.success('✅ Link Copied with Timestamp');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Share2 className="h-4 w-4" />
        {showLabel && <span>Share</span>}
      </Button>

      {isOpen && (
        <Card
          className="absolute right-0 top-full z-50 mt-2 w-64 animate-in fade-in slide-in-from-top-2 border-primary/20 shadow-xl"
          style={{
            background: 'var(--background)',
          }}
        >
          <CardContent className="p-3">
            <div className="space-y-1">
              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-accent"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#7b61ff] to-[#ae6fff]">
                  <Link2 className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium">Copy Link</span>
              </button>

              {/* Share from Timestamp */}
              <button
                onClick={handleCopyTimestamp}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-accent"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#7b61ff] to-[#ae6fff]">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium">Share from Timestamp</span>
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
