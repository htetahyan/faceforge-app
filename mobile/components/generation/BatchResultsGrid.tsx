import React from 'react';
import CarouselPreview from './CarouselPreview';

interface BatchResultsGridProps {
  urls: string[];
  templateTitle?: string;
  onClose: () => void;
}

export const BatchResultsGrid: React.FC<BatchResultsGridProps> = ({
  urls,
  templateTitle = 'Instagram Studio',
  onClose,
}) => {
  return <CarouselPreview urls={urls} templateTitle={templateTitle} onClose={onClose} />;
};

BatchResultsGrid.displayName = 'BatchResultsGrid';
export default BatchResultsGrid;
