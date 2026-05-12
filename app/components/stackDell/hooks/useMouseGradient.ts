export const useMouseGradient = (evt: React.MouseEvent<HTMLDivElement>) => {
  const rect = evt.currentTarget.getBoundingClientRect();
  evt.currentTarget.style.setProperty("--x", `${evt.clientX - rect.left}px`);
  evt.currentTarget.style.setProperty("--y", `${evt.clientY - rect.top}px`);
};
