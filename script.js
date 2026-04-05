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
    document.getElementById('finalDamageIncreaseRate').innerText = finalDamageIncreaseRate.toFixed(1) + "%";
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
    icon.addEventListener('touchstart', function() {
        this.classList.add('active');
    });
    icon.addEventListener('touchend', function() {
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
   3. 
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
    "전설": ["0","1","2","3","4","5","6","7","8","9"],
    "신화": ["0","1","2","3","4","5","6","7","8","9","10","11","12"],
    "유일": ["0","1","2","3","4","5","6","7","8","9","10","11","12"]
};

// 선택한 등급에 따라 강화 드롭다운 업데이트
function updateLevels(type) {
    const rank = document.getElementById(type + 'Rank').value;
    const levelSelect = document.getElementById(type + 'Level');
    levelSelect.innerHTML = rankLevels[rank].map(lv => `<option value="${lv}">${lv}강</option>`).join('');
}

function calculateNeed() {
    const currR = document.getElementById('currRank').value;
    const currL = document.getElementById('currLevel').value;
    const targetR = document.getElementById('targetRank').value;
    const targetL = document.getElementById('targetLevel').value;

    // 없음인 경우 total 0 처리
    const getVal = (r, l) => {
        if (r === "없음") return 0;
        const found = upgradeData.find(d => d.rank === r && d.level === l);
        return found ? found.total : 0;
    };

    const currTotal = getVal(currR, currL);
    const targetTotal = getVal(targetR, targetL);
    const diff = targetTotal - currTotal;

    const resDiv = document.getElementById('calc-result');
    if (diff <= 0) {
        resDiv.innerHTML = "이미 목표 등급이거나 그 이상입니다! 😎";
    } else {
        resDiv.innerHTML = `${currR}+${currL}</b>에서 ${targetR}+${targetL}</b>까지<br>
                            필요한 전설 영웅은 ${diff}명 입니다.`;
    }
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