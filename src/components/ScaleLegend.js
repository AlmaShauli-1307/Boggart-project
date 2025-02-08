// src/components/ScaleLegend.js
const ScaleLegend = ({ labels }) => {
    return (
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        {labels.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>
    );
  };
  
  export default ScaleLegend;
  