const firebaseConfig = {
    apiKey: "AIzaSyAUVSpDLXhU8Xu47q9KMoXlI8f8ozWtKNo",
    authDomain: "cus-be8f0.firebaseapp.com",
    databaseURL: "https://cus-be8f0-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "cus-be8f0",
    storageBucket: "cus-be8f0.firebasestorage.app",
    messagingSenderId: "322803967928",
    appId: "1:322803967928:web:f6130455c7ddb49e4d114d",
    measurementId: "G-H3K3ZHKDV7"
  };

  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();
  const sourcesRef = database.ref('/');
  
  
  // 기존 실시간 데이터 렌더링 부분 수정 포함
  sourcesRef.on('value', snapshot => {
    const data = snapshot.val();
  
    if (data) {
      renderBottles(data);
      renderSources(data);
      window.updateChart(data);
    } else {
      bottleList.innerHTML = "<p>데이터가 없습니다.</p>";
      sourceList.innerHTML = "<p>데이터가 없습니다.</p>";
      chartData.datasets = [];
      myChart.update();
    }
  });
  
  
  
    const bottleList = document.getElementById('bottle-list');
  
  function renderBottles(data) {
    bottleList.innerHTML = "";
  
    Object.keys(data).forEach(key => {
      const item = data[key];
  
      if (item && typeof item.uid !== 'undefined' && typeof item.weight !== 'undefined') {
        const div = document.createElement('div');
        div.style.backgroundColor = '#f0f0f0';
        div.style.padding = '10px';
        div.style.marginBottom = '10px';
        div.style.borderRadius = '8px';
        div.style.fontSize = '22px';
        div.style.cursor = 'pointer';
  
        const displayName = item.name && item.name.trim() !== ''
          ? `<strong>${item.name}</strong>`
          : `<strong>${key}번 소스통</strong>`;
  
        div.innerHTML = `
          <div>${displayName}</div>
          <div style="color: #555; font-size: 18px;">Max-Weight: ${item.weight}g</div>
        `;
  
        div.onclick = () => {
          openModal(key, item.name || '');
        };
  
        bottleList.appendChild(div);
      }
    });
  }

const sourceList = document.getElementById('source-list');




function renderSources(data) {
  sourceList.innerHTML = "";

  const kindGroups = {};
  const individualSources = [];

  Object.keys(data).forEach(key => {
    const item = data[key];

    if (item && typeof item.uid !== 'undefined' && typeof item.weight !== 'undefined') {
      if (typeof item.kind === 'undefined') {
        individualSources.push({ key, item });
      } else {
        if (!kindGroups[item.kind]) {
          kindGroups[item.kind] = [];
        }
        kindGroups[item.kind].push({ key, item });
      }
    }
  });

  // kind 없는 항목은 개별 표시
  individualSources.forEach(({ key, item }) => {
    renderSourceCard(key, item, false); // 병합 아님
  });

  // kind별 병합 표시
  Object.keys(kindGroups).forEach(kind => {
    const group = kindGroups[kind];
    const kindName = kindNameMap[kind] || `종류 ${kind}`;
    const bottleNames = group.map(({ item }) =>
      item.name && item.name.trim() !== '' ? item.name : '(이름 없음)'
    ).join(', ');

    const mergedItem = {
      kindName,
      bottleNames
    };

    renderSourceCard(group[0].key, mergedItem, true); // 병합 true
  });
}





function renderSourceCard(key, item, isMerged) {
  const div = document.createElement('div');
  div.style.backgroundColor = '#f0f0f0';
  div.style.padding = '10px';
  div.style.marginBottom = '10px';
  div.style.borderRadius = '8px';
  div.style.fontSize = '22px';
  div.style.cursor = 'pointer';

  let titleHtml = '';
  let detailHtml = '';

  if (isMerged) {
    titleHtml = `<strong>${item.kindName}</strong>`;
    detailHtml = `<div style="color: #555; font-size: 18px;">${item.bottleNames}</div>`;
  } else {
    const kindName = item.kind !== undefined && kindNameMap[item.kind]
      ? kindNameMap[item.kind]
      : `종류 ${item.kind ?? '-'}`;
    const displayName = item.name && item.name.trim() !== ''
      ? `${item.name} / ${kindName}`
      : `${key} / ${kindName}`;

    titleHtml = `<strong>${displayName}</strong>`;
    detailHtml = `<div style="color: #555; font-size: 18px;">Max-Weight: ${item.weight}g</div>`;
  }

  div.innerHTML = `
    <div>${titleHtml}</div>
    ${detailHtml}
  `;

  div.onclick = () => {
    openKindModal(key);
  };

  sourceList.appendChild(div);
}






sourcesRef.on('value', snapshot => {
  const data = snapshot.val();

  if (data) {
    renderBottles(data); // 기존 왼쪽
    renderSources(data); // 추가: 오른쪽
  } else {
    bottleList.innerHTML = "<p>데이터가 없습니다.</p>";
    sourceList.innerHTML = "<p>데이터가 없습니다.</p>"; // 추가
  }
});

let currentEditKey = null; // 현재 수정 중인 UID

function openModal(key, currentName = '') {
  currentEditKey = key;
  const modal = document.getElementById('modal');
  const input = document.getElementById('sourceNameInput');

  input.value = currentName || '';
  modal.style.display = 'block';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  currentEditKey = null;
}

function saveModalName() {
  const newName = document.getElementById('sourceNameInput').value.trim();

  if (newName && currentEditKey) {
    const itemRef = database.ref(`/${currentEditKey}`);
    itemRef.update({ name: newName })
      .then(() => {
        alert('저장되었습니다.');
        closeModal();
      })
      .catch(error => {
        console.error('저장 실패:', error);
        alert('저장에 실패했습니다.');
      });
  } else {
    alert('이름을 입력해주세요.');
  }
}

function deleteSource() {
    if (!currentEditKey) {
      alert('삭제할 항목이 없습니다.');
      return;
    }
  
    const confirmDelete = confirm(`정말로 UID "${currentEditKey}"의 소스통을 삭제하시겠습니까?`);
  
    if (confirmDelete) {
      database.ref(`/${currentEditKey}`).remove()
        .then(() => {
          alert('삭제되었습니다.');
          closeModal();
        })
        .catch(error => {
          console.error('삭제 실패:', error);
          alert('삭제에 실패했습니다.');
        });
    }
  }

let currentKindKey = null;

function openKindModal(key) {
  currentKindKey = key;
  const modal = document.getElementById('kindModal');
  const select = document.getElementById('kindSelect');
  const input = document.getElementById('kindNameInput');

  // 초기화
  select.innerHTML = `<option value="">-- 번호 선택 --</option>`;
  input.value = '';

  database.ref('/kinds').once('value').then(snapshot => {
    const data = snapshot.val() || {};

    // 기존 kinds 옵션 구성
    Object.keys(data).forEach(kindKey => {
      const option = document.createElement('option');
      option.value = kindKey;
      option.textContent = `${kindKey} - ${data[kindKey]}`;
      select.appendChild(option);
    });

    // 새로운 항목 옵션 추가
    const newOption = document.createElement('option');
    newOption.value = '__new__';
    newOption.textContent = '+ 새로운 항목 추가';
    select.appendChild(newOption);

    // 자동 채우기 로직
    select.onchange = function () {
  const selected = this.value;

  if (selected && selected !== '__new__' && kindNameMap[selected]) {
    input.value = kindNameMap[selected];
    document.getElementById('deleteKindBtn').disabled = false; // ✅ 삭제 버튼 활성화
  } else {
    input.value = '';
    document.getElementById('deleteKindBtn').disabled = true; // ✅ 삭제 버튼 비활성화
  }
};

    modal.style.display = 'block';
  });
}

function closeKindModal() {
  document.getElementById('kindModal').style.display = 'none';
  currentKindKey = null;
}





function saveKind() {
  const selectedKind = document.getElementById('kindSelect').value;
  const kindName = document.getElementById('kindNameInput').value.trim();

  if (!kindName) {
    alert('소스 이름을 입력해주세요.');
    return;
  }

  // 새로운 항목 추가일 경우
  if (selectedKind === '__new__') {
    database.ref('/kinds').once('value').then(kindsSnap => {
      const kinds = kindsSnap.val() || {};
      const kindNumbers = Object.keys(kinds).map(Number);
      
      let newKindNum = 1;
      while (kindNumbers.includes(newKindNum)) {
        newKindNum++;
      }

      const updates = {};
      updates[`/kinds/${newKindNum}`] = kindName;
      updates[`/${currentKindKey}/kind`] = newKindNum;

      return database.ref().update(updates);
    }).then(() => {
      alert('새로운 소스 종류가 추가되었습니다.');
      closeKindModal();
    }).catch(error => {
      console.error('추가 실패:', error);
      alert('저장에 실패했습니다.');
    });

  } else if (selectedKind && currentKindKey) {
    // 기존 kind 선택한 경우
    const updates = {};
    updates[`/${currentKindKey}/kind`] = Number(selectedKind);
    updates[`/kinds/${selectedKind}`] = kindName;

    database.ref().update(updates)
      .then(() => {
        alert('소스 종류가 저장되었습니다.');
        closeKindModal();
      })
      .catch(error => {
        console.error('저장 실패:', error);
        alert('저장에 실패했습니다.');
      });
  } else {
    alert('소스 종류를 선택해주세요.');
  }
}









let kindNameMap = {};

database.ref('/kinds').on('value', snapshot => {
  kindNameMap = snapshot.val() || {};
});



document.getElementById('deleteKindBtn').onclick = function () {
    const selectedKind = document.getElementById('kindSelect').value;
  
    if (!selectedKind || selectedKind === '__new__') {
      alert('삭제할 종류를 선택해주세요.');
      return;
    }
  
    const confirmDelete = confirm(`정말로 "${kindNameMap[selectedKind]}" (${selectedKind}) 소스 종류를 삭제하시겠습니까?\n※ 이 종류를 사용 중인 소스들은 표시되지 않을 수 있습니다.`);
  
    if (confirmDelete) {
      const updates = {};
      updates[`/kinds/${selectedKind}`] = null; // 삭제
      updates[`/uses/${selectedKind}`] = null;  // ✅ uses에서도 삭제
  
      database.ref().update(updates)
        .then(() => {
          alert('삭제되었습니다.');
          closeKindModal();
        })
        .catch(error => {
          console.error('삭제 실패:', error);
          alert('삭제에 실패했습니다.');
        });
    }
  };