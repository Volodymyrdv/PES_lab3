import './ComparisonMatrix.css';

const ComparisonMatrix = ({ matrix }) => {
  const getCellClass = (value) => {
    if (value === 1) return 'positive';
    if (value === -1) return 'negative';
    return 'neutral';
  };

  const downloadCSV = () => {
    if (!matrix || matrix.length === 0) {
      return;
    }

    let csvContent = '';

    csvContent += 'ID,' + Array.from({ length: matrix.length }, (_, i) => i + 1).join(',') + '\n';

    matrix.forEach((row, i) => {
      csvContent += `${i + 1},` + row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'comparison_matrix.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className='comparison-matrix'>
      <div className='matrix-header'>
        <h3>Матриця порівнянь</h3>
        {matrix && matrix.length > 0 && (
          <button className='download-button' onClick={downloadCSV}>
            📥 Завантажити CSV
          </button>
        )}
      </div>
      <table>
        <thead>
          <tr>
            <th className='header-corner'>ID</th>
            {matrix.map((phone, index) => (
              <th key={index} className='column-header'>
                {index + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td className='row-header'>{i + 1}</td>
              {row.map((cell, j) => (
                <td key={j} className={`matrix-cell ${getCellClass(cell)}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ComparisonMatrix;
