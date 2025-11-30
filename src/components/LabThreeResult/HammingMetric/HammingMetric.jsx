import { useContext, useState, useRef } from 'react';
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

  const renderPermUpperTri = (perm) => {
    // compute pos map and then upper-triangular vector as sequence of 1/-1
    if (!Array.isArray(perm) || perm.length === 0) return '';
    const n = perm.length;
    const pos = new Array(n);
    for (let i = 0; i < n; i++) pos[perm[i] - 1] = i;
    const out = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        out.push(pos[i] > pos[j] ? -1 : 1);
      }
    }
    return out.join(',');
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
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const cancelRef = useRef(false);

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

    const TOP_K = 300;
    const RANDOM_TRIES = 300;
    const LOCAL_IMPROVE_SWAPS = 500;

    const crit = String(criterion || '')
      .toLowerCase()
      .trim();
    const isMix = crit.includes('mix') || crit.includes('minmax') || crit === 'minmax';
    const cmpAdd = (a, b) => a.total - b.total || a.max - b.max;
    const cmpMix = (a, b) => a.max - b.max || a.total - b.total;
    const comparator = isMix ? cmpMix : cmpAdd;
    const objective = (row) => (isMix ? row.max : row.total);

    const base = Array.from({ length: n }, (_, i) => i + 1);

    const expertTris = matrix.map((expertMat) => getUpperTriangular(expertMat));

    const scorePermutation = (perm) => {
      const permPhones = perm.map((val) => ({ id: val }));
      const permMatrix = matrixUpdate(permPhones);
      const permTri = getUpperTriangular(permMatrix);
      const perExpertDiffs = expertTris.map((expertTri) => {
        let sum = 0;
        for (let i = 0; i < expertTri.length; i++) {
          sum += Math.abs(expertTri[i] - permTri[i]);
        }
        return sum;
      });
      const total = perExpertDiffs.reduce((a, b) => a + b, 0);
      const max = perExpertDiffs.length ? Math.max(...perExpertDiffs) : 0;
      return { permutation: perm.slice(), perExpertSums: perExpertDiffs, total, max, permTri };
    };

    if (n <= 10) {
      const gen = generatePermutations(base);
      const chunkSize = 2000;
      const totalPerms = (() => {
        let f = 1;
        for (let i = 2; i <= n; i++) f *= i;
        return f;
      })();
      let best = [];
      cancelRef.current = false;
      setRunning(true);
      setProgress(0);

      const insertBest = (arr, item) => {
        // binary insert
        let lo = 0,
          hi = arr.length;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (comparator(item, arr[mid]) < 0) hi = mid;
          else lo = mid + 1;
        }
        arr.splice(lo, 0, item);
        if (arr.length > TOP_K) arr.length = TOP_K;
      };

      const pairIndices = [];
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairIndices.push([i, j]);

      const processChunk = async () => {
        let next = gen.next();
        let count = 0;
        let processed = 0;
        while (!next.done && !cancelRef.current) {
          count = 0;
          while (!next.done && count < chunkSize && !cancelRef.current) {
            const perm = next.value;
            // build position map: pos[id-1] = index in perm
            const pos = new Array(n);
            for (let idx = 0; idx < n; idx++) pos[perm[idx] - 1] = idx;

            // compute per-expert sums by iterating pairs
            const perExpertSums = expertTris.map(() => 0);
            for (let p = 0; p < pairIndices.length; p++) {
              const [a, b] = pairIndices[p];
              const permVal = pos[a] > pos[b] ? -1 : 1;
              for (let ei = 0; ei < expertTris.length; ei++) {
                const ev = expertTris[ei][p];
                perExpertSums[ei] += Math.abs(ev - permVal);
              }
            }
            const total = perExpertSums.reduce((x, y) => x + y, 0);
            const max = perExpertSums.length ? Math.max(...perExpertSums) : 0;
            const item = { permutation: perm.slice(), perExpertSums, total, max };
            insertBest(best, item);

            count += 1;
            processed += 1;
            next = gen.next();
          }

          // update UI progress
          const doneSoFar = best && best._processed ? best._processed + processed : processed;
          setProgress(Math.min(1, doneSoFar / totalPerms));
          setResults((prev) => ({
            n,
            scored: best.slice(),
            limited: false,
            minimal: best.length
              ? isMix
                ? Math.min(...best.map((r) => r.max))
                : Math.min(...best.map((r) => r.total))
              : undefined,
            mode: isMix ? 'minmax' : 'additivity'
          }));

          // yield to UI
          await new Promise((res) => setTimeout(res, 0));
        }

        setRunning(false);
      };

      processChunk();
      return;
    }

    // large n: build candidate set then score them (like RankMismatch)
    const candidates = [];
    const seen = new Set();
    const pushCandidate = (p) => {
      const key = p.join(',');
      if (!seen.has(key)) {
        seen.add(key);
        candidates.push(p.slice());
      }
    };

    pushCandidate(base.slice());

    const avg = [];
    for (let obj = 1; obj <= n; obj++) {
      let sum = 0;
      let count = 0;
      for (let ei = 0; ei < matrix.length; ei++) {
        const v = Number(matrix[ei][obj - 1]);
        if (Number.isFinite(v)) {
          sum += v;
          count++;
        }
      }
      avg.push({ id: obj, avg: count ? sum / count : Number.POSITIVE_INFINITY });
    }
    const consensus = avg
      .slice()
      .sort((a, b) => a.avg - b.avg)
      .map((x) => x.id);
    pushCandidate(consensus);
    pushCandidate(consensus.slice().reverse());

    const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
    for (let t = 0; t < RANDOM_TRIES; t++) {
      const p = base.slice();
      for (let i = p.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
      }

      let bestP = p.slice();
      let bestScore = objective(scorePermutation(bestP));
      for (let iter = 0; iter < LOCAL_IMPROVE_SWAPS; iter++) {
        const i = rand(0, n - 1);
        const j = rand(0, n - 1);
        if (i === j) continue;
        [bestP[i], bestP[j]] = [bestP[j], bestP[i]];
        const row = scorePermutation(bestP);
        const val = objective(row);
        if (val < bestScore) {
          bestScore = val;
        } else {
          [bestP[i], bestP[j]] = [bestP[j], bestP[i]];
        }
      }

      pushCandidate(bestP);
    }

    const scoredAll = candidates.map((p) => scorePermutation(p));
    const scored = scoredAll.slice().sort(comparator).slice(0, TOP_K);

    const minimal = scored.length
      ? isMix
        ? Math.min(...scored.map((r) => r.max))
        : Math.min(...scored.map((r) => r.total))
      : undefined;

    setResults({ n, scored, limited: true, minimal, mode: isMix ? 'minmax' : 'additivity' });
  };

  const isArray = Array.isArray(matrix);
  const isArrayOfMatrices = isArray && matrix.every((m) => Array.isArray(m) && Array.isArray(m[0]));
  const is2D = isArray && Array.isArray(matrix[0]);

  return (
    <div className='hm-container'>
      <div style={{ marginBottom: 12 }}>
        <button className='export-button' onClick={handleCalculate}>
          Обчислити
        </button>
        {running && (
          <button
            className='export-button'
            style={{ marginLeft: 8, backgroundColor: '#e57373' }}
            onClick={() => {
              cancelRef.current = true;
              setRunning(false);
            }}
          >
            Stop
          </button>
        )}
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
          {running && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ width: '100%', background: '#eee', height: 8, borderRadius: 4 }}>
                <div
                  style={{
                    width: `${Math.round(progress * 100)}%`,
                    background: '#4caf50',
                    height: 8,
                    borderRadius: 4
                  }}
                />
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                {Math.round(progress * 100)}% processed
              </div>
            </div>
          )}

          <table className='rm-table'>
            <thead>
              <tr>
                <th>Перестановка</th>
                {matrix.map((_, ei) => (
                  <th key={ei} className='rm-expertHeader'>
                    Експерт {ei + 1} (Сума)
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
                  {row.perExpertSums.map((s, i) => (
                    <td key={i} className='rm-expertSum'>
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
