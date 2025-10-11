import { useState } from 'react';
import './ExpertList.css';

const ExpertList = ({ currentExpert, onExpertChange, expertsCount }) => {
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

  const experts = generateExperts(expertsCount || 3);

  const handleChange = (e) => {
    onExpertChange(e.target.value);
  };

  return (
    <div className='expert-selector'>
      <h3>Оберіть експерта:</h3>
      <select id='expert' value={currentExpert} onChange={handleChange} className='expert-select'>
        {experts.map((expert) => (
          <option key={expert.id} value={expert.id}>
            {expert.name}
          </option>
        ))}
      </select>
      <div className='current-expert-info'>
        <span>
          Поточний експерт: <strong>{experts.find((e) => e.id === currentExpert)?.name}</strong>
        </span>
      </div>
      <div className='experts-count-info'>
        <span>
          Загальна кількість експертів: <strong>{expertsCount}</strong>
        </span>
      </div>
    </div>
  );
};

export default ExpertList;
