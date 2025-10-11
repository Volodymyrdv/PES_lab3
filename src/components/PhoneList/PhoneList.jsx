import { useState } from 'react';
import './PhoneList.css';

const PhoneList = ({ phones, onPhoneReorder, onPhoneRemove }) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  if (!phones || phones.length === 0) {
    return (
      <div className='phone-list-container'>
        <h3>Ранжування мобільних телефонів</h3>
        <p className='empty-list'>Всі телефони видалені з ранжування цього експерта</p>
      </div>
    );
  }

  const handleRemovePhone = (phone, index, e) => {
    e.stopPropagation();
    console.log(`Видалення телефону "${phone.phone}" з ранжування`);
    onPhoneRemove(phone);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedIndex === null || draggedIndex === index) {
      return;
    }

    setDragOverIndex(index);
  };

  const handleDragLeave = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newPhones = [...phones];
    const draggedPhone = newPhones[draggedIndex];
    const oldPosition = draggedIndex;
    const newPosition = dropIndex;

    newPhones.splice(draggedIndex, 1);
    newPhones.splice(dropIndex, 0, draggedPhone);

    onPhoneReorder(newPhones, draggedPhone, oldPosition, newPosition);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className='phone-list-container'>
      <h3>Ранжування мобільних телефонів</h3>
      <ul className='phone-list'>
        {phones.map((phone, index) => (
          <li
            key={phone.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`phone-item ${draggedIndex === index ? 'dragging' : ''} ${
              dragOverIndex === index ? 'drag-over' : ''
            }`}
          >
            <span className='drag-handle'>⋮⋮</span>
            <span className='phone-content'>
              {index + 1}. {phone.phone}
            </span>
            <button
              className='remove-button'
              onClick={(e) => handleRemovePhone(phone, index, e)}
              title={`Видалити ${phone.phone} з ранжування`}
            >
              X
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PhoneList;
