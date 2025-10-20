import { useContext } from 'react';
import { useNavigate } from 'react-router';
import FileUpload from './FileUpload/FileUpload';
import PhoneList from './PhoneList/PhoneList';
import ExpertProtocol from './ExpertProtocol/ExpertProtocol';
import ExpertList from './ExpertList/ExpertList';
import './App.css';
import { SessionContext } from '../../context/SessionContext';

const App = () => {
  const navigate = useNavigate();
  const {
    originalPhones,
    currentExpert,
    expertsCount,
    handleDataLoad,
    handleExpertChange,
    getCurrentExpertData,
    handlePhoneReorder,
    handlePhoneRemove,
    exportRankingsToCSV
  } = useContext(SessionContext);

  const goToLab3 = () => {
    navigate('/lab3');
  };

  return (
    <div>
      {originalPhones.length === 0 ? (
        <FileUpload onDataLoad={handleDataLoad} />
      ) : (
        <div className='content'>
          <div className='expert-section'>
            <ExpertList
              currentExpert={currentExpert}
              onExpertChange={handleExpertChange}
              expertsCount={expertsCount}
            />
            <ExpertProtocol protocol={getCurrentExpertData().protocol} />
            <div className='export-section'>
              <button className='export-button' onClick={exportRankingsToCSV}>
                📋 Експортувати результати ранжування в CSV
              </button>
              <button className='export-button' onClick={goToLab3}>
                📊 Перейти до результатів лаб3
              </button>
            </div>
          </div>
          <PhoneList
            phones={getCurrentExpertData().phones}
            onPhoneReorder={handlePhoneReorder}
            onPhoneRemove={handlePhoneRemove}
          />
        </div>
      )}
    </div>
  );
};

export default App;
