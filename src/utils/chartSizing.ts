export const getChartDimensions = () => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const availableWidth = (viewportWidth - 64) / 2;
  const availableHeight = (viewportHeight - 150) / 2;

  const chartWidth = Math.max(200, Math.min(availableWidth - 40, 500));
  const chartHeight = Math.max(150, Math.min(availableHeight - 80, 300));

  return { width: chartWidth, height: chartHeight };
};
