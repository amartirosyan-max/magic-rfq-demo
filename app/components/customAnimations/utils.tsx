// Utility to wrap each character of a text string in a span for animation
export function spanifyText(text: string): React.ReactNode[] {
  const words = text.split(" ");
  const result: React.ReactNode[] = [];

  words.forEach((word, wi) => {
    const letters = Array.from(word).map((ch, li) => (
      <span key={`w${wi}l${li}`} className="letter inline-block opacity-0">
        {ch}
      </span>
    ));

    result.push(
      <span key={`word-${wi}`} className="word inline-block whitespace-nowrap">
        {letters}
      </span>,
    );

    if (wi < words.length - 1) {
      result.push(
        <span key={`space-${wi}`} className="inline-block">
          &nbsp;
        </span>,
      );
    }
  });

  return result;
}
