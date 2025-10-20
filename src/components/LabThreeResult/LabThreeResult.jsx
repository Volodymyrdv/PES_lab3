import { useNavigate } from 'react-router';
import RankMismatch from './RankMismatch/RankMismatch';
import HammingMetric from './HammingMetric/HammingMetric';
import { useContext, useState } from 'react';
import { SessionContext } from '../../context/SessionContext';
import './LabThreeResult.css';

const LabThreeResult = () => {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState('');
  const [selectedIndicator, setSelectedIndicator] = useState('');

  const { getRankfromExpertData, getMatrixFromExpertData } = useContext(SessionContext);
  return (
    <div>
      <select value={selectedMethod} onChange={(e) => setSelectedMethod(e.target.value)}>
        <option value=''>Select Metric</option>
        <option value='rank'>Rank Mismatch</option>
        <option value='hamming'>Hamming Metric</option>
      </select>
      <select value={selectedIndicator} onChange={(e) => setSelectedIndicator(e.target.value)}>
        <option value=''>Select Criterion</option>
        <option value='additivity'>Additivity</option>
        <option value='mixmax'>MixMax</option>
      </select>
      <button onClick={() => navigate('/')}>Go Back</button>
      {selectedMethod === 'rank' && (
        <RankMismatch ranks={getRankfromExpertData()} criterion={selectedIndicator} />
      )}
      {selectedMethod === 'hamming' && (
        <HammingMetric matrix={getMatrixFromExpertData()} criterion={selectedIndicator} />
      )}
    </div>
  );
};

export default LabThreeResult;
