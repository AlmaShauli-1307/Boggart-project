import React from 'react';
import './ScaleLegend.css';

const ScaleLegend = ({scale}) => {
    const keys = Object.keys(scale).map(Number).sort((a, b) => a - b);

    return (
        <div className="scale-legend">
            <table className="scale-table">
                <thead>
                <tr>
                    {keys.map(key => (
                        <th key={`header-${key}`}>{scale[key]}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                <tr>
                    {keys.map(key => (
                        <td key={`value-${key}`}>{key}</td>
                    ))}
                </tr>
                </tbody>
            </table>
        </div>
    );
}
export default ScaleLegend;