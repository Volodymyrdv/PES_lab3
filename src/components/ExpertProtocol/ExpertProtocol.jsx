import './ExpertProtocol.css';

const ExpertProtocol = ({ protocol }) => {
  return (
    <div className='expert-protocol'>
      <h3>Експертний протокол</h3>
      <div className='protocol-content'>
        {protocol && protocol.length > 0 ? (
          <ul className='protocol-list'>
            {protocol.map((item, index) => (
              <li key={index} className='protocol-item'>
                <span className='protocol-number'>{index + 1}.</span>
                <span className='protocol-text'>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className='empty-protocol'>
            Протокол поки що порожній. Спробуйте перемістити телефон у списку.
          </p>
        )}
      </div>
    </div>
  );
};

export default ExpertProtocol;
