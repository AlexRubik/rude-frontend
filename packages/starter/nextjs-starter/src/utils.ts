export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  

  export function formatTime(date: Date): string {
    return new Intl.DateTimeFormat('default', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Use hour12: true if you want 12-hour format instead
    }).format(date);
}

export function getUTCTime(): string {
  const now = new Date();
  return now.getUTCHours().toString().padStart(2, '0') + ':' + 
         now.getUTCMinutes().toString().padStart(2, '0');
}