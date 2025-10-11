import { useContext } from 'react';
import './ExpertList.css';
import { SessionContext } from '../../../context/SessionContext';

const ExpertList = ({ currentExpert, onExpertChange, expertsCount }) => {
  const session = useContext(SessionContext);

  const effectiveCurrentExpert = session?.currentExpert || currentExpert;
  const effectiveOnExpertChange = session?.handleExpertChange || onExpertChange;
  const effectiveExpertsCount = session?.expertsCount || expertsCount;
  const generateExperts = (count) => {
    const experts = [];
    for (let i = 1; i <= count; i++) {
      experts.push({
        id: `expert${i}`,
        name: `Експерт ${i}`
      });
    }
    return experts;
  };

  const experts = generateExperts(effectiveExpertsCount || 3);

  const handleChange = (e) => {
    effectiveOnExpertChange(e.target.value);
  };

  return (
    <div className='expert-selector'>
      <h3>Оберіть експерта:</h3>
      <select
        id='expert'
        value={effectiveCurrentExpert}
        onChange={handleChange}
        className='expert-select'
      >
        {experts.map((expert) => (
          <option key={expert.id} value={expert.id}>
            {expert.name}
          </option>
        ))}
      </select>
      <div className='current-expert-info'>
        <span>
          Поточний експерт:{' '}
          <strong>{experts.find((e) => e.id === effectiveCurrentExpert)?.name}</strong>
        </span>
      </div>
      <div className='experts-count-info'>
        <span>
          Загальна кількість експертів: <strong>{effectiveExpertsCount}</strong>
        </span>
      </div>
    </div>
  );
};

export default ExpertList;
