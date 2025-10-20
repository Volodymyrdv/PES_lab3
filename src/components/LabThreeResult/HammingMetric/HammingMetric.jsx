const HammingMetric = ({ matrix, criterion }) => {
  return (
    <div>
      <h1>Метрика Хемінга</h1>
      <p>{JSON.stringify(matrix)}</p>
      <p>Критерії: {JSON.stringify(criterion)}</p>
    </div>
  );
};

export default HammingMetric;
