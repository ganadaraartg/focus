// chart.js (서버 사용량 합산 기반 버전)

const ctx = document.getElementById('myChart').getContext('2d');

window.chartData = {
  labels: ['1월', '2월', '3월', '4월', '5월', '6월'],
  datasets: []
};

window.myChart = new Chart(ctx, {
  type: 'line',
  data: window.chartData,
  options: {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});

const fixedColorMap = {
  '케첩': 'rgba(220, 20, 60, 1)',
  '머스타드': 'rgba(255, 215, 0, 1)',
  '데리야끼': 'rgba(139, 69, 19, 1)'
};

function hashColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const r = (hash >> 16) & 0xff;
  const g = (hash >> 8) & 0xff;
  const b = hash & 0xff;
  return `rgba(${r % 200}, ${g % 200}, ${b % 200}, 1)`;
}

window.updateChart = function (data) {
  if (!data || !data.kinds || !data.uses) return;

  const kinds = data.kinds;
  const uses = data.uses;
  const newDatasets = [];

  for (let i = 0; i < kinds.length; i++) {
    const name = kinds[i];
    const useEntry = uses[i];
    if (!name || !useEntry) continue;

    // 합산 처리
    let totalWeight = 0;
    if (typeof useEntry === 'object') {
      Object.values(useEntry).forEach(weight => {
        if (typeof weight === 'number') {
          totalWeight += weight;
        }
      });
    } else if (typeof useEntry === 'number') {
      totalWeight += useEntry;
    }

    const monthly = [0, 0, 0, 0, 0, totalWeight];
    const color = fixedColorMap[name] || hashColor(name);

    newDatasets.push({
      label: name,
      data: monthly,
      borderColor: color,
      backgroundColor: 'rgba(0,0,0,0.1)',
      tension: 0.3
    });
  }

  window.chartData.datasets = newDatasets;
  window.myChart.update();
};
