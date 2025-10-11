import { useNavigate } from 'react-router';
import { useContext } from 'react';
import { SessionContext } from '../../context/SessionContext';

const LabThreeResult = () => {
  const navigate = useNavigate();
  const { expertsData } = useContext(SessionContext);
  return (
    <div>
      <p>{JSON.stringify(expertsData)}</p>
      <button onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );
};

export default LabThreeResult;
