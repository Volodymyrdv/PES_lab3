import React, { useContext, useState } from 'react';
import './HammingMetric.css';
import { SessionContext } from '../../../context/SessionContext';

const HammingMetric = ({ matrix, criterion }) => {
  const getPhoneNames = (n) => {
    return Array.from({ length: n }).map((_, k) => {
      const p = Array.isArray(originalPhones) ? originalPhones.find((ph) => ph.id === k + 1) : null;
      return p ? p.phone : `${k + 1}`;
    });
  };

  const colorClassFor = (cell) => {
    if (cell === 1) return 'hm-cell-green';
    if (cell === -1) return 'hm-cell-red';
    return 'hm-cell-white';
  };

  const getUpperTriangular = (mat) => {
    const nRows = mat.length;
    const upperTriangular = [];
    for (let i = 0; i < nRows; i++) {
      for (let j = i + 1; j < nRows; j++) {
        upperTriangular.push(mat[i][j]);
      }
    }
    return upperTriangular;
  };

  const calculateHammingDistanceSum = (expertTriangular, permutationTriangular) => {
    let sum = 0;
    for (let i = 0; i < expertTriangular.length; i++) {
      sum += Math.abs(expertTriangular[i] - permutationTriangular[i]);
    }
    return sum;
  };

  const matrixUpdate = (arr) => {
    const n = arr.length;
    const m = [];
    for (let i = 0; i < n; i++) {
      const row = [];
      for (let j = 0; j < n; j++) {
        row.push(i === j ? 0 : 1);
      }
      m.push(row);
    }
    for (let i = 0; i < n; i++) {
      for (let k = i; k > 0; k--) {
        const from = arr[i].id - 1;
        const to = arr[k - 1].id - 1;
        m[from][to] = -1;
      }
    }
    return m;
  };

  const renderMatrixWithHeaders = (mat, colorize = false) => {
    if (!Array.isArray(mat) || mat.length === 0) return null;
    const nRows = mat.length;
    const nCols = Array.isArray(mat[0]) ? mat[0].length : 0;
    const colNames = getPhoneNames(nCols);
    const rowNames = getPhoneNames(nRows);

    return (
      <table className='hm-table'>
        <thead>
          <tr>
            <th className='hm-corner' />
            {colNames.map((cn, ci) => (
              <th key={ci} className='hm-colHeader'>
                {cn}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mat.map((row, ri) => (
            <tr key={ri}>
              <th className='hm-rowHeader'>{rowNames[ri]}</th>
              {Array.isArray(row)
                ? row.map((cell, ci) => (
                    <td key={ci} className={colorize ? colorClassFor(cell) : 'hm-cell'}>
                      {String(cell)}
                    </td>
                  ))
                : Object.values(row).map((cell, ci) => (
                    <td key={ci} className='hm-cell'>
                      {String(cell)}
                    </td>
                  ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const { originalPhones } = useContext(SessionContext) || {};
  const [results, setResults] = useState(null);

  function* generatePermutations(arr) {
    // simple Heap's algorithm generator
    const n = arr.length;
    const a = arr.slice();
    const c = Array(n).fill(0);
    yield a.slice();
    let i = 0;
    while (i < n) {
      if (c[i] < i) {
        if (i % 2 === 0) {
          [a[0], a[i]] = [a[i], a[0]];
        } else {
          [a[c[i]], a[i]] = [a[i], a[c[i]]];
        }
        yield a.slice();
        c[i] += 1;
        i = 0;
      } else {
        c[i] = 0;
        i += 1;
      }
    }
  }

  const handleCalculate = () => {
    if (!Array.isArray(matrix) || matrix.length === 0 || !Array.isArray(matrix[0])) {
      setResults({ error: 'Немає валідних матриць експертів.' });
      return;
    }
    const n = matrix[0].length;
    if (n <= 0) {
      setResults({ error: 'Немає елементів для перестановки.' });
      return;
    }

    const base = Array.from({ length: n }, (_, i) => i + 1);
    const gen = generatePermutations(base);
    const scored = [];

    for (const perm of gen) {
      // perm is array like [1,2,3...]
      // build permutation phone objects expected by matrixUpdate: need objects with id property
      const permPhones = perm.map((val) => ({ id: val }));

      const permMatrix = matrixUpdate(permPhones);
      const permTri = getUpperTriangular(permMatrix);
      // for each expert compute their upper-triangular and sum
      const expertTris = matrix.map((expertMat) => getUpperTriangular(expertMat));
      const perExpertSums = expertTris.map((expertTri) =>
        calculateHammingDistanceSum(expertTri, permTri)
      );
      const total = perExpertSums.reduce((a, b) => a + b, 0);
      const max = perExpertSums.length ? Math.max(...perExpertSums) : 0;
      scored.push({ permutation: perm.slice(), permTri, expertTris, perExpertSums, total, max });
    }

    // sort according to selected criterion: additivity -> by total, minmax/mixmax -> by max
    const crit = String(criterion || '').toLowerCase();
    const isMinMax = crit.includes('mix') || crit.includes('minmax');
    if (isMinMax) scored.sort((a, b) => a.max - b.max || a.total - b.total);
    else scored.sort((a, b) => a.total - b.total || a.max - b.max);
    setResults({ n, scored });
  };

  const isArray = Array.isArray(matrix);
  const isArrayOfMatrices = isArray && matrix.every((m) => Array.isArray(m) && Array.isArray(m[0]));
  const is2D = isArray && Array.isArray(matrix[0]);

  return (
    <div className='hm-container'>
      <div style={{ marginBottom: 12 }}>
        <button className='export-button' onClick={handleCalculate}>
          Обчислити перестановки
        </button>
      </div>

      <div className='hm-matrixWrapper'>
        {isArrayOfMatrices ? (
          matrix.map((expertMatrix, ei) => (
            <div key={ei} className='hm-expertBlock'>
              <h3>Експерт №{ei + 1}</h3>
              {renderMatrixWithHeaders(expertMatrix, true)}
            </div>
          ))
        ) : is2D ? (
          renderMatrixWithHeaders(matrix, true)
        ) : (
          <pre className='hm-pre'>{JSON.stringify(matrix, null, 2)}</pre>
        )}
      </div>

      {results && results.scored && (
        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <table className='rm-table'>
            <thead>
              <tr>
                <th>Перестановка</th>
                <th>Perm upper-tri</th>
                {matrix.map((_, ei) => (
                  <th key={ei} className='rm-expertHeader'>
                    Експерт {ei + 1}
                  </th>
                ))}
                <th>СУМ</th>
                <th>Макс</th>
              </tr>
            </thead>
            <tbody>
              {results.scored.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ whiteSpace: 'nowrap' }}>{row.permutation.join(' - ')}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {Array.isArray(row.permTri) ? row.permTri.join(',') : ''}
                  </td>
                  {row.perExpertSums.map((s, i) => (
                    <td key={i}>
                      <strong>{s}</strong>
                    </td>
                  ))}
                  <td>
                    <strong>{row.total}</strong>
                  </td>
                  <td>
                    <strong>{row.max}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HammingMetric;
