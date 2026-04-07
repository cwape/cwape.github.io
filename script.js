/* ==========================================
   1. 공통 기능 (다크모드 등)
   ========================================== */
const darkModeToggle = document.getElementById('darkModeToggle');

if (darkModeToggle) {
    // [1. 테마 적용 함수]
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            darkModeToggle.checked = false;
        }
    }

    // [2. 페이지 로드 시 실행]
    // 우선 로컬 저장소에 저장된 설정이 있는지 확인합니다.
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
        // 저장된 설정이 있다면 그 설정을 따릅니다.
        applyTheme(savedTheme);
    } else {
        // 저장된 게 없다면 시스템 설정을 확인합니다.
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
    }

    // [3. 사용자가 직접 스위치를 조작할 때]
    darkModeToggle.addEventListener('change', (e) => {
        const theme = e.target.checked ? 'dark' : 'light';
        applyTheme(theme);
        // 선택한 테마를 로컬 저장소에 'theme'이라는 이름으로 저장!
        localStorage.setItem('theme', theme);
    });
}

function toggleNavMenu() {
    const dropdown = document.getElementById('navDropdown');
    dropdown.classList.toggle('show');
}

// 메뉴 바깥 클릭 시 닫기 (안전장치)
window.addEventListener('click', (e) => {
    const dropdown = document.getElementById('navDropdown');
    const hamburger = document.querySelector('.hamburger-btn');

    if (dropdown.classList.contains('show')) {
        // 클릭한 대상이 햄버거 버튼도 아니고 드롭다운 내부도 아닐 때만 닫기
        if (!hamburger.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    }
});

/* ==========================================
   2. 능력치 계산기 전용 (statcalc.html)
   ========================================== */

// 계산 모드 상태 변수 및 토글 함수
let isHpBasedMode = false;

function toggleCalcMode() {
    const toggle = document.getElementById('calcModeToggle');
    const modeText = document.getElementById('modeText');

    isHpBasedMode = toggle.checked;

    if (isHpBasedMode) {
        modeText.innerText = "체력 기반";
        modeText.style.color = "#2196F3";
    } else {
        modeText.innerText = "공격 기반";
        modeText.style.color = "#4CAF50";
    }

    calculateStats();
}

function calculateStats() {
    console.log(isHpBasedMode);
    // [1. 입력값 가져오기]
    const maxPoints = Number(document.getElementById('maxPoints').value) || 0;
    const attackPoints = Number(document.getElementById('attackPoints').value) || 0;
    const critDamagePoints = Number(document.getElementById('critDamagePoints').value) || 0;
    const hpPoints = Number(document.getElementById('hpPoints').value) || 0;
    const fixedHpPoints = Number(document.getElementById('fixedHpPoints').value) || 0;

    const currentAttack = Number(document.getElementById('currentAttack').value) || 0;
    const currentCritDamage = Number(document.getElementById('currentCritDamage').value) || 0;
    const currentHp = Number(document.getElementById('currentHp').value) || 0;

    const attackMultiplier = Number(document.getElementById('attackMultiplier').value) || 0;
    const hpMultiplier = Number(document.getElementById('hpMultiplier').value) || 0;
    const attackScalingByHp = Number(document.getElementById('attackScalingByHp').value) || 0;

    // [2. 고정 상수 설정]
    const attackPerPoint = 700;
    const critDamagePerPoint = 7;
    const hpPerPoint = 7000;

    // 최종 포인트를 담을 변수 선언
    let finalAtkPoints, finalHpPoints, finalCritPoints;

    // 1) 체력 포인트를 모두 뺐을 때의 공격력
    const atkWithZeroHp = currentAttack - (hpPerPoint * (1 + hpMultiplier / 100) * hpPoints * (1 + attackMultiplier / 100) * (attackScalingByHp / 100));

    // 2) 체력 고정 수치를 반영했을 때의 공격력
    const atkWithFixedHp = atkWithZeroHp + (hpPerPoint * (1 + hpMultiplier / 100) * fixedHpPoints * (1 + attackMultiplier / 100) * (attackScalingByHp / 100));

    // 3) 고정 수치 제외 나머지를 치피에 투자했을 경우의 치명피해
    const critWithFixedHp = currentCritDamage + (critDamagePerPoint * (hpPoints - fixedHpPoints));

    // [3. 계산 모드 선택]
    if (isHpBasedMode) {
        // 분자 (Numerator)
        const hpNum = (hpPerPoint * (attackScalingByHp / 100) * (1 + hpMultiplier / 100) * (1 + attackMultiplier / 100) * (1 + critWithFixedHp / 100)) - (critDamagePerPoint / 100 * atkWithFixedHp);
        // 분모 (Denominator)
        const hpDen = 2 * (critDamagePerPoint / 100) * hpPerPoint * (1 + hpMultiplier / 100) * (attackScalingByHp / 100) * (1 + attackMultiplier / 100);

        const rawOptHpPoints = Math.round(hpNum / hpDen) - hpPoints;

        // 2) 범위 내 보정 (clampedHpPoints)
        let clampedHpPoints;
        if (rawOptHpPoints + hpPoints >= maxPoints) {
            // 최대 포인트 초과 시: 남은 포인트를 모두 체력에 (공격력 포인트는 0 가정)
            clampedHpPoints = maxPoints - hpPoints;
        } else if (rawOptHpPoints + hpPoints <= fixedHpPoints) {
            // 고정 체력 미달 시: 최소 고정 수치까지만 보정
            clampedHpPoints = fixedHpPoints - hpPoints;
        } else {
            clampedHpPoints = rawOptHpPoints;
        }

        // 3) 공통 변수에 결과 할당
        finalHpPoints = clampedHpPoints + hpPoints;
        finalAtkPoints = 0; // 체력 기반이므로 공격력 포인트는 투자하지 않음
        finalCritPoints = maxPoints - finalHpPoints - finalAtkPoints;

    } else {
        // ------------------------------------------
        // [기존 공격 기반 계산식 영역]
        // ------------------------------------------

        // [4. 최적화 스탯 계산 (JS의 Math.round 사용)]
        const numerator = (attackPerPoint * (1 + attackMultiplier / 100) * (1 + critWithFixedHp / 100)) - (critDamagePerPoint / 100 * atkWithFixedHp);
        const denominator = 2 * (critDamagePerPoint / 100) * attackPerPoint * (1 + attackMultiplier / 100);
        const rawOptAttackPoints = Math.round(numerator / denominator);

        // [5. 범위 내 보정 (JS의 Math.max/min으로 IF문 대체)]
        let clampedAttackPoints;
        if (rawOptAttackPoints + attackPoints >= maxPoints - fixedHpPoints) {
            clampedAttackPoints = maxPoints - fixedHpPoints - attackPoints;
        } else if (rawOptAttackPoints + attackPoints <= 0) {
            clampedAttackPoints = -attackPoints;
        } else {
            clampedAttackPoints = rawOptAttackPoints;
        }

        finalAtkPoints = clampedAttackPoints + attackPoints;
        finalHpPoints = fixedHpPoints;
        finalCritPoints = maxPoints - finalAtkPoints - finalHpPoints;
    }

    // [6. 최종 결과 도출]
    const finalSumPoints = finalAtkPoints + finalHpPoints + finalCritPoints;

    // 최종 스탯 계산 (공격력, 치피, 체력)
    const finalAtkStat = currentAttack + (attackPerPoint * (finalAtkPoints - attackPoints) + (hpPerPoint * (1 + hpMultiplier / 100) * (attackScalingByHp / 100) * (finalHpPoints - hpPoints))) * (1 + attackMultiplier / 100);
    const finalCritStat = currentCritDamage + (finalCritPoints - critDamagePoints) * critDamagePerPoint;
    const finalHpStat = currentHp + (finalHpPoints - hpPoints) * hpPerPoint * (1 + hpMultiplier / 100);

    // 데미지 증가율 계산
    const initialDamage = currentAttack * (currentCritDamage / 100);
    const finalDamage = finalAtkStat * (finalCritStat / 100);
    let finalDamageIncreaseRate = 0;
    if (initialDamage > 0) {
        finalDamageIncreaseRate = ((finalDamage / initialDamage) - 1) * 100;
    }

    // [7. 화면에 출력]
    document.getElementById('finalAtkPoints').innerText = finalAtkPoints.toLocaleString();
    document.getElementById('finalHpPoints').innerText = finalHpPoints.toLocaleString();
    document.getElementById('finalCritPoints').innerText = finalCritPoints.toLocaleString();
    document.getElementById('finalSumPoints').innerText = finalSumPoints.toLocaleString();

    document.getElementById('finalAtkStat').innerText = Math.floor(finalAtkStat).toLocaleString();
    document.getElementById('finalCritStat').innerText = finalCritStat.toLocaleString() + "%";
    document.getElementById('finalHpStat').innerText = Math.floor(finalHpStat).toLocaleString();

    const rateElement = document.getElementById('finalDamageIncreaseRate');
    const rateValue = finalDamageIncreaseRate.toFixed(1);

    if (finalDamageIncreaseRate > 0) {
        // 상승 시: + 기호와 red 클래스 적용
        rateElement.innerHTML = `<span class="stat-up">+${rateValue}%</span>`;
    } else if (finalDamageIncreaseRate < 0) {
        // 하락 시: - 기호(이미 포함됨)와 blue 클래스 적용
        rateElement.innerHTML = `<span class="stat-down">${rateValue}%</span>`;
    } else {
        // 변화 없을 시
        rateElement.innerHTML = `<span class="stat-none">0.0%</span>`;
    }
}

// 입력창의 값이 바뀔 때마다 실시간으로 계산 실행
document.addEventListener('input', (e) => {
    if (e.target.tagName === 'INPUT') {
        calculateStats();
    }
});

// statcalc 페이지에만 있는 요소가 존재하는지 확인
if (document.getElementById('maxPoints')) {
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('change', (e) => {
            let value = parseFloat(e.target.value);
            if (isNaN(value) || value < 0) {
                e.target.value = 0;
                return;
            }

            // statcalc 전용 ID 규칙에 따라 보정
            // 1. 포인트 관련 입력창 (정수만 허용)
            if (e.target.id.includes('Points')) {
                e.target.value = Math.floor(value);
            }
            // 2. 증폭/비율 관련 입력창 (소수점 첫째 자리까지 허용)
            else if (e.target.id.includes('Multiplier') || e.target.id.includes('Scaling')) {
                // 소수점 둘째 자리에서 반올림하여 첫째 자리까지 표시 (ex: 1.55 -> 1.6)
                e.target.value = Math.round(value * 10) / 10;
            }

            // 계산 함수 실행 (이 함수도 해당 페이지에 있을 때만 호출)
            // 보정 후 다시 계산 실행
            if (typeof calculateStats === "function") {
                calculateStats();
            }
        });
    });
}

// 모바일 터치 대응: 툴팁을 터치했을 때 사라지지 않게 하거나 제어 (필요 시)
document.querySelectorAll('.info-icon').forEach(icon => {
    icon.addEventListener('touchstart', function () {
        this.classList.add('active');
    });
    icon.addEventListener('touchend', function () {
        setTimeout(() => this.classList.remove('active'), 2000); // 2초 뒤 자동 사라짐
    });
});

// 버튼 클릭 시 값 증감 함수
function stepUpdate(id, step) {
    const input = document.getElementById(id);
    const slider = document.querySelector(`input[type="range"][oninput*="${id}"]`);

    let currVal = parseFloat(input.value) || 0;
    const isDecimal = id.includes('Multiplier') || id.includes('Scaling');
    const finalStep = isDecimal ? (step * 0.1) : step;

    let nextVal = currVal + finalStep;

    // [추가] 최솟값 0 및 HTML에 설정된 max값 제한
    const minLimit = parseFloat(input.min) || 0;
    const maxLimit = parseFloat(input.max) || Infinity;

    if (nextVal < minLimit) nextVal = minLimit;
    if (nextVal > maxLimit) nextVal = maxLimit;

    const finalVal = isDecimal ? nextVal.toFixed(1) : Math.floor(nextVal);
    input.value = finalVal;

    if (slider) slider.value = finalVal;
    calculateStats();
}

// 모든 숫자 입력창(Number Input)에 입력이 발생할 때 실행
document.querySelectorAll('input[type="number"]').forEach(numInput => {
    numInput.addEventListener('input', (e) => {
        let val = parseFloat(e.target.value);
        const min = parseFloat(e.target.min) || 0;
        const max = parseFloat(e.target.max) || Infinity;

        // 범위를 벗어나면 강제로 교정
        if (val < min) e.target.value = min;
        if (val > max) e.target.value = max;

        const id = e.target.id;
        const slider = document.querySelector(`input[type="range"][oninput*="${id}"]`);
        if (slider) {
            slider.value = e.target.value;
        }
        calculateStats();
    });
});

/* ==========================================
   3. 영웅 강화
   ========================================== */



// 1. 모든 데이터를 하나의 배열에 정리 (나중에 계산기 로직에서도 사용 가능)
const upgradeData = [
    // 전설
    { rank: '전설', level: '1', material: '빛나는 영웅 강화석 1개', note: '', total: 1 },
    { rank: '전설', level: '2', material: '빛나는 영웅 강화석 2개', note: '', total: 1 },
    { rank: '전설', level: '3', material: '빛나는 영웅 강화석 3개', note: '', total: 1 },
    { rank: '전설', level: '4', material: '찬란한 영웅 강화석 1개', note: '', total: 1 },
    { rank: '전설', level: '5', material: '찬란한 영웅 강화석 2개', note: '', total: 1 },
    { rank: '전설', level: '6', material: '찬란한 영웅 강화석 3개', note: '', total: 1 },
    { rank: '전설', level: '7', material: '전설+0 × 1', note: '', total: 2 },
    { rank: '전설', level: '8', material: '전설+0 × 1', note: '', total: 3 },
    { rank: '전설', level: '9', material: '전설+0 × 1', note: '', total: 4 },
    // 신화
    { rank: '신화', level: '0', material: '전설+9×1 + 전설+0×6', note: '신화 등급 소환', total: 10 },
    { rank: '신화', level: '1', material: '전설+0 × 1', note: '', total: 11 },
    { rank: '신화', level: '2', material: '전설+0 × 1', note: '', total: 12 },
    { rank: '신화', level: '3', material: '전설+0 × 1', note: '', total: 13 },
    { rank: '신화', level: '4', material: '전설+0 × 1', note: '', total: 14 },
    { rank: '신화', level: '5', material: '전설+0 × 1', note: '', total: 15 },
    { rank: '신화', level: '6', material: '전설+0 × 1', note: '', total: 16 },
    { rank: '신화', level: '7', material: '전설+7 × 1', note: '', total: 18 },
    { rank: '신화', level: '8', material: '전설+8 × 1', note: '', total: 21 },
    { rank: '신화', level: '9', material: '전설+9 × 1', note: '궁극스킬 활성화', total: 25 },
    { rank: '신화', level: '10', material: '전설+9 + 전설+0×2', note: '', total: 31 },
    { rank: '신화', level: '11', material: '신화+0 × 1', note: '', total: 41 },
    { rank: '신화', level: '12', material: '신화+9 × 1', note: '기본/특수 스킬 강화', total: 66 },
    // 유일
    { rank: '유일', level: '0', material: '신화+12 × 2', note: '유일 소환', total: 132 },
    { rank: '유일', level: '1', material: '전설+9 × 1', note: '', total: 136 },
    { rank: '유일', level: '2', material: '전설+9 × 1', note: '', total: 140 },
    { rank: '유일', level: '3', material: '전설+9×1 + 전설+0×2', note: '', total: 146 },
    { rank: '유일', level: '4', material: '전설+9 × 2', note: '', total: 154 },
    { rank: '유일', level: '5', material: '전설+9 × 2', note: '', total: 162 },
    { rank: '유일', level: '6', material: '신화+0 × 2', note: '기본/특수 스킬 강화', total: 182 },
    { rank: '유일', level: '7', material: '신화+0 × 1', note: '', total: 192 },
    { rank: '유일', level: '8', material: '신화+0×2 + 전설+9×2', note: '', total: 220 },
    { rank: '유일', level: '9', material: '신화+11 × 1', note: '궁극 스킬 활성화', total: 261 },
    { rank: '유일', level: '10', material: '신화+0 × 1', note: '', total: 271 },
    { rank: '유일', level: '11', material: '신화+9 × 1', note: '', total: 296 },
    { rank: '유일', level: '12', material: '신화+12 × 1', note: '기본/특수 스킬 강화', total: 362 }
];

// 페이지 로드 시 실행되는 함수
window.onload = () => {
    // 페이지 로드 시 '계산기' 버튼을 찾아서 클릭한 것과 동일한 효과를 줍니다.
    const calcBtn = document.querySelector('.calc-tab');
    if (calcBtn) {
        changeTab('계산', calcBtn);
    }
};

// renderTable 함수 내 보더 색상에 초록색 추가
function renderTable(rank) {
    const tbody = document.getElementById('upgrade-tbody');
    const table = document.querySelector('.upgrade-table');

    // 계산 탭 컬러를 포함한 테마 설정
    const colors = {
        '전설': '#FFA000',
        '신화': '#D32F2F',
        '유일': '#FDD835',
        '계산': '#4CAF50'
    };

    table.style.borderTop = `6px solid ${colors[rank]}`;

    tbody.innerHTML = upgradeData
        .filter(item => item.rank === rank)
        .map(item => `
            <tr>
                <td style="color: ${colors[rank] === '#FDD835' ? '#B7950B' : colors[rank]}; font-weight: bold;">+${item.level}</td>
                <td>${item.material}</td>
                <td class="note-cell">${item.note}</td>
            </tr>
        `).join('');
}

// 3. 탭 변경 함수
function changeTab(rank, btn) {
    const tableView = document.getElementById('table-view');
    const calcView = document.getElementById('calc-view');

    // 모든 탭 버튼 비활성화 후 현재 버튼 활성화
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (rank === '계산') {
        tableView.style.display = 'none';
        calcView.style.display = 'block';
        // 계산기 탭 클릭 시 드롭다운 초기화
        updateLevels('curr');
        updateLevels('target');
    } else {
        tableView.style.display = 'block';
        calcView.style.display = 'none';
        renderTable(rank);
    }
}

// 등급별 가능한 강화 수치 정의
const rankLevels = {
    "없음": ["0"],
    "전설": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
    "신화": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    "유일": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
};

// 선택한 등급에 따라 강화 드롭다운 업데이트
function updateLevels(type) {
    const rank = document.getElementById(type + 'Rank').value;
    const levelSelect = document.getElementById(type + 'Level');
    levelSelect.innerHTML = rankLevels[rank].map(lv => `<option value="${lv}">${lv}강</option>`).join('');
}

// 탭 전환 함수 수정
function changeTab(rank, btn) {
    const tableView = document.getElementById('table-view');
    const calcView = document.getElementById('calc-view');

    // 버튼 효과
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (rank === '계산') {
        tableView.style.display = 'none';
        calcView.style.display = 'block';
        updateLevels('curr');
        updateLevels('target');
    } else {
        tableView.style.display = 'block';
        calcView.style.display = 'none';
        renderTable(rank);
    }
}

/* --- 영웅 추가 기능 관련 자바스크립트 --- */

// 1. 새로운 입력 칸 추가 (삭제 버튼 포함)
function addHeroInput() {
    const list = document.getElementById('curr-hero-list');
    const heroCount = list.getElementsByClassName('curr-hero-item').length + 1;

    const newHero = document.createElement('div');
    newHero.className = 'select-group curr-hero-item';
    newHero.innerHTML = `
        <div class="hero-header" style="display: flex; justify-content: space-between; align-items: center;">
            <label>보유 영웅 ${heroCount}</label>
            <button type="button" class="remove-hero-btn" onclick="removeHeroInput(this)" style="background:none; border:none; color:#ff4444; cursor:pointer; font-weight:bold;">삭제</button>
        </div>
        <div class="select-row">
            <select class="currRank" onchange="updateLevelsByElement(this)">
                <option value="없음">없음</option>
                <option value="전설">전설</option>
                <option value="신화">신화</option>
                <option value="유일">유일</option>
            </select>
            <select class="currLevel"></select>
        </div>
    `;
    list.appendChild(newHero);
    updateLevelsByElement(newHero.querySelector('.currRank'));
}

// 3. 삭제 후 "보유 영웅 1, 2..." 번호 다시 매기기
function reorderHeroLabels() {
    const items = document.getElementsByClassName('curr-hero-item');
    Array.from(items).forEach((item, index) => {
        item.querySelector('label').innerText = `보유 영웅 ${index + 1}`;
    });
}

// 2. 입력 칸 삭제 함수
function removeHeroInput(btn) {
    const item = btn.closest('.curr-hero-item');
    const list = document.getElementById('curr-hero-list');

    // 최소 1개는 남겨두기
    if (list.getElementsByClassName('curr-hero-item').length > 1) {
        item.remove();
        reorderHeroLabels(); // 번호 재정렬
    } else {
        alert("최소 한 명의 영웅 상태는 입력해야 합니다.");
    }
}

// 2. 동적 생성된 드롭다운의 레벨 업데이트
function updateLevelsByElement(rankSelect) {
    const rank = rankSelect.value;
    const levelSelect = rankSelect.nextElementSibling; // 바로 옆의 currLevel 선택

    if (rankLevels[rank]) {
        levelSelect.innerHTML = rankLevels[rank].map(lv => `<option value="${lv}">${lv}강</option>`).join('');
    }
}

// 3. 계산 함수 (모든 보유 영웅 가치 합산)
function calculateNeed() {
    const currRanks = document.getElementsByClassName('currRank');
    const currLevels = document.getElementsByClassName('currLevel');
    const targetR = document.getElementById('targetRank').value;
    const targetL = document.getElementById('targetLevel').value;

    const getVal = (r, l) => {
        if (r === "없음") return 0;
        // l값에 '강'이 붙어있을 경우를 대비해 숫자만 추출
        const cleanL = String(l).replace('강', '');
        const found = upgradeData.find(d => d.rank === r && d.level === cleanL);
        return found ? found.total : 0;
    };

    // 모든 보유 영웅의 total값 더하기
    let totalCurrValue = 0;
    for (let i = 0; i < currRanks.length; i++) {
        totalCurrValue += getVal(currRanks[i].value, currLevels[i].value);
    }

    const targetTotal = getVal(targetR, targetL);
    const diff = targetTotal - totalCurrValue;

    const resDiv = document.getElementById('calc-result');
    if (diff <= 0) {
        resDiv.innerHTML = "이미 목표 등급을 달성하고도 남습니다!";
    } else {
        resDiv.innerHTML = `목표 <b>${targetR}+${targetL}</b>까지<br>
                            추가로 필요한 전설 영웅은 <span class="highlight">${diff}</span>명 입니다.`;
    }
}

// 4. 페이지 로드 시 초기화 (window.onload 안에 추가)
// 기존 window.onload가 있다면 그 안에 이 내용을 넣어주세요.
window.onload = () => {
    // 첫 번째 보유 영웅 드롭다운 초기화
    const firstRank = document.querySelector('.currRank');
    if (firstRank) updateLevelsByElement(firstRank);

    // 목표 상태 드롭다운 초기화
    updateLevels('target');

    // 기본 탭 설정
    const calcBtn = document.querySelector('.calc-tab');
    if (calcBtn) changeTab('계산', calcBtn);
};


/* ==========================================
   4. 유일 레벨업
   ========================================== */

/* ==========================================
   유일 레벨업 (one-level.html) 최종 로직
   ========================================== */

// 1. 유일 레벨 데이터 (보내주신 텍스트 표와 100% 일치 확인)
const oneLevelData = [
    // 301 ~ 320 구간
    { lv: 301, stone: 100, gold: 90000, p: 10, type: 'normal' },
    { lv: 302, stone: 105, gold: 90810, p: 10, type: 'normal' },
    { lv: 303, stone: 110, gold: 91627, p: 10, type: 'normal' },
    { lv: 304, stone: 116, gold: 92451, p: 10, type: 'normal' },
    { lv: 305, stone: 122, gold: 93283, p: 10, type: 'normal' },
    { lv: 306, stone: 128, gold: 94122, p: 10, type: 'normal' },
    { lv: 307, stone: 135, gold: 94969, p: 10, type: 'normal' },
    { lv: 308, stone: 142, gold: 95823, p: 10, type: 'normal' },
    { lv: 309, stone: 149, gold: 96685, p: 10, type: 'normal' },
    { lv: 310, stone: 157, gold: 97555, p: 10, type: 'normal' },
    { lv: 311, stone: 165, gold: 98432, p: 10, type: 'normal' },
    { lv: 312, stone: 174, gold: 99317, p: 10, type: 'normal' },
    { lv: 313, stone: 183, gold: 100210, p: 10, type: 'normal' },
    { lv: 314, stone: 193, gold: 101111, p: 10, type: 'normal' },
    { lv: 315, stone: 203, gold: 102020, p: 10, type: 'normal' },
    { lv: 316, stone: 214, gold: 102938, p: 10, type: 'normal' },
    { lv: 317, stone: 225, gold: 103864, p: 10, type: 'normal' },
    { lv: 318, stone: 237, gold: 104798, p: 10, type: 'normal' },
    { lv: 319, stone: 250, gold: 105741, p: 10, type: 'normal' },
    { lv: 320, stone: 263, gold: 106692, p: 10, type: 'normal' },
    // 321 ~ 340 구간
    { lv: 321, stone: 175, gold: 107652, p: 7, type: 'superior' },
    { lv: 322, stone: 181, gold: 200000, p: 7, type: 'superior' },
    { lv: 323, stone: 193, gold: 201800, p: 7, type: 'superior' },
    { lv: 324, stone: 211, gold: 203616, p: 7, type: 'superior' },
    { lv: 325, stone: 235, gold: 205448, p: 7, type: 'superior' },
    { lv: 326, stone: 265, gold: 207297, p: 7, type: 'superior' },
    { lv: 327, stone: 301, gold: 209162, p: 7, type: 'superior' },
    { lv: 328, stone: 343, gold: 211044, p: 7, type: 'superior' },
    { lv: 329, stone: 391, gold: 212943, p: 7, type: 'superior' },
    { lv: 330, stone: 445, gold: 214859, p: 7, type: 'superior' },
    { lv: 331, stone: 505, gold: 216792, p: 7, type: 'superior' },
    { lv: 332, stone: 571, gold: 218743, p: 7, type: 'superior' },
    { lv: 333, stone: 643, gold: 220711, p: 7, type: 'superior' },
    { lv: 334, stone: 721, gold: 222697, p: 7, type: 'superior' },
    { lv: 335, stone: 805, gold: 224701, p: 7, type: 'superior' },
    { lv: 336, stone: 895, gold: 226723, p: 7, type: 'superior' },
    { lv: 337, stone: 991, gold: 228763, p: 7, type: 'superior' },
    { lv: 338, stone: 1093, gold: 230821, p: 7, type: 'superior' },
    { lv: 339, stone: 1201, gold: 232898, p: 7, type: 'superior' },
    { lv: 340, stone: 1315, gold: 234994, p: 7, type: 'superior' }
];

// 2. 단위 변환 (90000 -> 9억)
function formatGold(val10k) {
    const man = val10k;
    if (man >= 10000) {
        const eok = Math.floor(man / 10000);
        const remain = man % 10000;
        return remain === 0 ? `${eok}억` : `${eok}억 ${remain.toLocaleString()}만`;
    }
    return `${man.toLocaleString()}만`;
}

// 3. 실시간 동기화 및 계산
function syncOneLv(type) {
    const currS = document.getElementById('sliderCurr');
    const targetS = document.getElementById('sliderTarget');
    if (parseInt(currS.value) > parseInt(targetS.value)) {
        if (type === 'curr') targetS.value = currS.value;
        else currS.value = targetS.value;
    }
    document.getElementById('displayCurr').innerText = currS.value;
    document.getElementById('displayTarget').innerText = targetS.value;
    calculateOneLevel();
}

function adjustOneLv(type, val) {
    const slider = document.getElementById(type === 'curr' ? 'sliderCurr' : 'sliderTarget');
    let newValue = parseInt(slider.value) + val;
    if (newValue >= 300 && newValue <= 340) {
        slider.value = newValue;
        syncOneLv(type);
    }
}

function handleOneDcCheck(chk) {
    document.querySelectorAll('.dc-check').forEach(c => { if (c !== chk) c.checked = false; });
    calculateOneLevel();
}

// 4. 메인 계산
function calculateOneLevel() {
    const curr = parseInt(document.getElementById('sliderCurr').value);
    const target = parseInt(document.getElementById('sliderTarget').value);
    const dcRate = document.querySelector('.dc-check:checked') ? parseFloat(document.querySelector('.dc-check:checked').value) : 0;
    const resDiv = document.getElementById('one-calc-result');

    if (curr >= target) {
        resDiv.innerHTML = `<p style="color:#888;">목표 레벨을 높여주세요.</p>`;
        return;
    }

    let goldSum = 0, normalSum = 0, superiorSum = 0, pointSum = 0;
    let unlockAlerts = [];

    for (let l = curr + 1; l <= target; l++) {
        if (l === 311) unlockAlerts.push("🔓 310 해금: 태초 3만 + 팔라딘 사원 퀘스트");
        if (l === 321) unlockAlerts.push("🔓 320 해금: 태초 3.5만");
        if (l === 331) unlockAlerts.push("🔓 330 해금: 태초 4만");

        const data = oneLevelData.find(d => d.lv === l);
        if (data) {
            goldSum += data.gold;
            pointSum += data.p;
            const cost = Math.ceil(data.stone * (1 - dcRate));
            if (data.type === 'normal') normalSum += cost;
            else superiorSum += cost;
        }
    }

    resDiv.innerHTML = `
        <div style="text-align: left; line-height: 1.6;">
            <p><b>총 골드:</b> <span style="color:#e67e22; font-weight:bold;">${formatGold(goldSum)}</span></p>
            <p><b>금빛 마정석:</b> <span style="color:#d32f2f; font-weight:bold;">${normalSum.toLocaleString()}</span>개</p>
            <p><b>상급 금빛마정석:</b> <span style="color:#d32f2f; font-weight:bold;">${superiorSum.toLocaleString()}</span>개</p>
            <p><b>포인트:</b> <span style="color:#2980b9; font-weight:bold;">${pointSum.toLocaleString()}</span> P</p>
            ${unlockAlerts.length > 0 ? `<div style="margin-top:10px; font-size:0.85rem; color:#d32f2f; background:#f9f9f9; padding:8px; border-radius:5px;">${unlockAlerts.join('<br>')}</div>` : ''}
        </div>
    `;
}

/* 유일 레벨 데이터 및 로직 생략 (이전과 동일) */

function renderOneTable(startLv) {
    const head = document.getElementById('one-table-head');
    const body = document.getElementById('one-table-body');
    const isNormal = startLv === '300';

    // 헤더 정렬 (포인트라고 명확히 기재)
    head.innerHTML = `
        <th>레벨</th>
        <th>${isNormal ? '금빛마정석' : '상급 금빛마정석'}</th>
        <th>골드</th>
        <th>포인트</th>
    `;

    const filtered = oneLevelData.filter(d => isNormal ? d.lv <= 320 : d.lv > 320);

    body.innerHTML = filtered.map(d => `
        <tr>
            <td>${d.lv}</td>
            <td>${d.stone.toLocaleString()}</td>
            <td>${formatGold(d.gold)}</td>
            <td>${d.p}P</td>
        </tr>
    `).join('');
}

// 탭 전환 시에도 .one-tab 클래스 유지 확인
function changeOneTab(type, btn) {
    // 다른 페이지 탭은 건드리지 않고 .one-tab-btn만 찾아 지웁니다.
    document.querySelectorAll('.one-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const calcView = document.getElementById('one-calc-view');
    const tableView = document.getElementById('one-table-view');

    if (type === '계산') {
        calcView.style.display = 'block';
        tableView.style.display = 'none';
    } else {
        calcView.style.display = 'block'; // wrapper 레이아웃 유지를 위해 block 권장
        calcView.style.display = 'none';
        tableView.style.display = 'block';
        renderOneTable(type);
    }
}

document.addEventListener('DOMContentLoaded', () => { if (document.getElementById('sliderCurr')) calculateOneLevel(); });

/* ==========================================
   5.
   ========================================== */