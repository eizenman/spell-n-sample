import PadCard from './PadCard';

export default function PadGrid({ pads, onTextChange, onGenerate, showLocators, onRangeChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {pads.map((pad, index) => (
        <PadCard
          key={index}
          index={index}
          pad={pad}
          onTextChange={onTextChange}
          onGenerate={onGenerate}
          showLocators={showLocators}
          onRangeChange={onRangeChange}
        />
      ))}
    </div>
  );
}