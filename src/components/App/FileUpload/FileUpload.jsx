import { useState, useContext } from 'react';
import './FileUpload.css';
import { SessionContext } from '../../../context/SessionContext';

const FileUpload = ({ onDataLoad }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [expertsCount, setExpertsCount] = useState(3);
  const session = useContext(SessionContext);

  const effectiveOnDataLoad = session?.handleDataLoad || onDataLoad;

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleExpertsCountChange = (event) => {
    setExpertsCount(parseInt(event.target.value));
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      console.log('Будь ласка, оберіть файл!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        effectiveOnDataLoad(data, expertsCount);
      } catch (error) {
        console.error('Error parsing JSON:', error);
        console.error('Помилка при читанні файлу. Перевірте формат JSON.');
      }
    };
    reader.readAsText(selectedFile);
  };

  return (
    <div className='file-upload-container'>
      <h1>Налаштування експертної системи</h1>

      <div className='upload-section'>
        <h3>1. Завантажити файл з телефонами</h3>
        <input
          type='file'
          onChange={handleFileChange}
          className='simple-file-input'
          accept='.json'
        />
        {selectedFile && <p className='file-selected'>Обрано файл: {selectedFile.name}</p>}
      </div>

      <div className='experts-section'>
        <h3>2. Оберіть кількість експертів</h3>
        <div className='experts-options'>
          {[2, 3, 4, 5].map((count) => (
            <label key={count} className='expert-option'>
              <input
                type='radio'
                name='expertsCount'
                value={count}
                checked={expertsCount === count}
                onChange={handleExpertsCountChange}
              />
              <span>{count} експерти</span>
            </label>
          ))}
        </div>
        <p className='experts-info'>
          Обрано експертів: <strong>{expertsCount}</strong>
        </p>
      </div>

      <button className='start-button' onClick={handleSubmit} disabled={!selectedFile}>
        Почати роботу з експертною системою
      </button>
    </div>
  );
};

export default FileUpload;
