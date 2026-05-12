export const shortenProductsTitle = (title: string, max = 45, min = 40) => {
  const text = title.trim();

  if (text.length <= max) return text;

  const slicedText = text.slice(0, max);

  const lastSpaceIndex = slicedText.lastIndexOf(" ");

  if (lastSpaceIndex < min) return slicedText.slice(0, min) + "...";
  return slicedText.slice(0, lastSpaceIndex) + "...";
};
