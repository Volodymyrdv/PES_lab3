import React, { createContext, useState } from 'react';

export const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  const [originalPhones, setOriginalPhones] = useState([]);
  const [currentExpert, setCurrentExpert] = useState('expert1');
  const [expertsCount, setExpertsCount] = useState(3);
  const [expertsData, setExpertsData] = useState({});

  const handleDataLoad = (data, expertsCountParam) => {
    setOriginalPhones(data);
    setExpertsCount(expertsCountParam);
    setCurrentExpert('expert1');

    const updatedExpertsData = {};
    for (let i = 1; i <= expertsCountParam; i++) {
      const expertKey = `expert${i}`;
      updatedExpertsData[expertKey] = {
        phones: [...data],
        protocol: []
      };
    }
    setExpertsData(updatedExpertsData);
  };

  const handleExpertChange = (expertId) => {
    setCurrentExpert(expertId);
  };

  const getCurrentExpertData = () => {
    return expertsData[currentExpert] || { phones: [], protocol: [] };
  };

  const handlePhoneReorder = (reorderedPhones, movedPhone, oldPosition, newPosition) => {
    const protocolEntry = `${movedPhone.phone} переміщений з позиції ${
      oldPosition + 1
    } на позицію ${newPosition + 1}`;

    setExpertsData((prevData) => ({
      ...prevData,
      [currentExpert]: {
        ...prevData[currentExpert],
        phones: reorderedPhones,
        protocol: [...prevData[currentExpert].protocol, protocolEntry]
      }
    }));
  };

  const handlePhoneRemove = (phoneToRemove) => {
    const currentData = expertsData[currentExpert];
    if (!currentData) return;

    const removedPosition =
      currentData.phones.findIndex((phone) => phone.id === phoneToRemove.id) + 1;
    const updatedPhones = currentData.phones.filter((phone) => phone.id !== phoneToRemove.id);
    const protocolEntry = `${phoneToRemove.phone} видалений з позиції ${removedPosition}`;

    setExpertsData((prevData) => ({
      ...prevData,
      [currentExpert]: {
        ...prevData[currentExpert],
        phones: updatedPhones,
        protocol: [...prevData[currentExpert].protocol, protocolEntry]
      }
    }));
  };

  const exportRankingsToCSV = () => {
    if (Object.keys(expertsData).length === 0 || originalPhones.length === 0) {
      console.log('Немає даних для експорту');
      return;
    }

    try {
      const headers = ['id'];
      for (let i = 1; i <= expertsCount; i++) {
        headers.push(i.toString());
      }

      const rows = [headers.join(',')];

      const activePhones = originalPhones.filter((originalPhone) => {
        return Object.keys(expertsData).every((expertKey) => {
          const expertData = expertsData[expertKey];
          return (
            expertData &&
            expertData.phones &&
            expertData.phones.some((phone) => phone.id === originalPhone.id)
          );
        });
      });

      activePhones.forEach((originalPhone) => {
        const row = [originalPhone.phone];

        for (let i = 1; i <= expertsCount; i++) {
          const expertKey = `expert${i}`;
          const expertData = expertsData[expertKey];

          if (expertData && expertData.phones) {
            const expertActivePhones = expertData.phones.filter((phone) =>
              activePhones.some((activePhone) => activePhone.id === phone.id)
            );

            const position = expertActivePhones.findIndex((phone) => phone.id === originalPhone.id);
            const rank = position !== -1 ? position + 1 : 'N/A';
            row.push(rank.toString());
          } else {
            row.push('N/A');
          }
        }

        rows.push(row.join(','));
      });

      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'expert_rankings_results.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log(
          `✅ Результати ранжування експортовано!\n\nФайл: expert_rankings_results.csv\nЕкспертів: ${expertsCount}\nАктивних телефонів: ${activePhones.length}`
        );
      }
    } catch (error) {
      console.error('Помилка при експорті:', error);
      console.error('❌ Помилка при експорті файлу. Спробуйте ще раз.');
    }
  };

  return (
    <SessionContext.Provider
      value={{
        originalPhones,
        currentExpert,
        expertsCount,
        expertsData,
        handleDataLoad,
        handleExpertChange,
        getCurrentExpertData,
        handlePhoneReorder,
        handlePhoneRemove,
        exportRankingsToCSV
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export default SessionProvider;
