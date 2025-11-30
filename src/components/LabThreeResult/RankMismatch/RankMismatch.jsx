import { useState, useContext } from 'react';
import './RankMismatch.css';
import { SessionContext } from '../../../context/SessionContext';

const RankMismatch = ({ ranks, criterion }) => {
  const [permutationResults, setPermutationResults] = useState(null);
  const { originalPhones } = useContext(SessionContext) || {};

  function* generatePermutationsGenerator(arr) {
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

  const scorePermutation = (permutation) => {
    const n = permutation.length;
    const perExpertDiffs = ranks.map((expertRanks) => {
      const diffs = [];
      let sum = 0;
      for (let obj = 1; obj <= n; obj++) {
        const expertRank = Number(expertRanks[obj - 1]);
        const permRank = Number(permutation[obj - 1]);
        const diff =
          Number.isFinite(expertRank) && Number.isFinite(permRank)
            ? Math.abs(expertRank - permRank)
            : 0;
        diffs.push(diff);
        sum += diff;
      }
      return { diffs, sum };
    });

    const perExpert = perExpertDiffs.map((d) => d.sum);
    const total = perExpert.reduce((a, b) => a + b, 0);
    const max = perExpert.length ? Math.max(...perExpert) : 0;
    return { permutation, perExpert, perExpertDiffs, total, max };
  };

  const handleCalculate = () => {
    if (!Array.isArray(ranks) || ranks.length === 0 || !Array.isArray(ranks[0])) {
      setPermutationResults({ error: 'Немає валідних рангових даних (потрібен масив масивів).' });
      return;
    }

    const n = ranks[0].length;
    if (n <= 0) {
      setPermutationResults({ error: 'Немає елементів для перестановки.' });
      return;
    }

    const base = Array.from({ length: n }, (_, i) => i + 1);

    const TOP_K = 200;
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

    if (n <= 10) {
      const gen = generatePermutationsGenerator(base);
      const chunkSize = 2000;
      let best = [];

      const processChunk = async () => {
        let next = gen.next();
        let count = 0;
        const chunk = [];
        while (!next.done && count < chunkSize) {
          chunk.push(scorePermutation(next.value));
          count += 1;
          next = gen.next();
        }

        best.push(...chunk);
        best.sort(comparator);
        if (best.length > TOP_K) best.length = TOP_K;

        const minimal = best.length
          ? isMix
            ? Math.min(...best.map((r) => r.max))
            : Math.min(...best.map((r) => r.total))
          : undefined;

        setPermutationResults({
          n,
          scored: best.slice(),
          limited: false,
          minimal,
          mode: isMix ? 'minmax' : 'additivity'
        });

        if (!next.done) {
          await new Promise((res) => setTimeout(res, 0));
          return processChunk();
        }
      };

      processChunk();
      return;
    }

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
      for (let ei = 0; ei < ranks.length; ei++) {
        const v = Number(ranks[ei][obj - 1]);
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

    setPermutationResults({
      n,
      scored,
      limited: true,
      minimal,
      mode: isMix ? 'minmax' : 'additivity'
    });
  };

  return (
    <div className='rm-container'>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        <button className='export-button' onClick={handleCalculate}>
          Обчислити
        </button>
      </div>

      {ranks.map((rank, index) => (
        <div key={index} className='rm-expertCard'>
          <h2 className='rm-expertTitle'>Експерт №{index + 1}</h2>
          <div className='rm-ranksRow'>
            {Array.isArray(rank) && rank.length > 0 ? (
              rank.map((r, idx) => (
                <span className='rm-rankBadge' key={idx}>
                  {r}
                </span>
              ))
            ) : (
              <span className='rm-empty'>Немає рангових даних</span>
            )}
          </div>
        </div>
      ))}

      {permutationResults && permutationResults.error && (
        <div className='rm-empty'>{permutationResults.error}</div>
      )}

      {permutationResults &&
        permutationResults.scored &&
        (() => {
          const n = permutationResults.n;
          const phones = originalPhones || [];
          const phoneNames = Array.from({ length: n }).map((_, k) => {
            const p = phones.find((ph) => ph.id === k + 1);
            return p ? p.phone : `${k + 1}`;
          });

          return (
            <div style={{ overflowX: 'auto' }}>
              <table className='rm-table'>
                <thead>
                  <tr>
                    <th>Перестановка</th>
                    {ranks.map((_, ei) => (
                      <th key={ei} className='rm-expertHeader'>
                        Експерт {ei + 1} (Сума)
                      </th>
                    ))}
                    <th>СУМ</th>
                    <th>Макс</th>
                  </tr>
                </thead>
                <tbody>
                  {permutationResults.scored.map((row, i) => (
                    <tr key={i}>
                      <td>{row.permutation.join(' - ')}</td>
                      {row.perExpertDiffs.map((expertDiff, ei) => (
                        <td className='rm-expertSum' key={ei}>
                          <strong>{expertDiff.sum}</strong>
                        </td>
                      ))}
                      <td className='rm-total'>
                        <strong>{row.total}</strong>
                      </td>
                      <td className='rm-max'>
                        <strong>{row.max}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
    </div>
  );
};

export default RankMismatch;
