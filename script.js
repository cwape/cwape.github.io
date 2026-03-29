/* ==========================================
   1. 공통 기능 (다크모드 등)
   ========================================== */
const darkModeToggle = document.getElementById('darkModeToggle');

// 스위치가 화면에 존재할 때만 실행하도록 안전 장치 추가
if (darkModeToggle) {
    // 1. 시스템 설정 확인 함수
    function checkSystemTheme() {
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
        }
    }

    // 2. 페이지 로드 시 실행
    checkSystemTheme();

    // 3. 사용자가 직접 스위치를 조작할 때
    darkModeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    });
}

/* ==========================================
   2. 능력치 계산기 전용 (statcalc.html)
   ========================================== */
function calculateStats() {
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

    // [3. 중간 계산 단계]
    // 1) 체력 포인트를 모두 뺐을 때의 공격력
    const atkWithZeroHp = currentAttack - (hpPerPoint * (1 + hpMultiplier / 100) * hpPoints * (1 + attackMultiplier / 100) * (attackScalingByHp / 100));

    // 2) 체력 고정 수치를 반영했을 때의 공격력
    const atkWithFixedHp = atkWithZeroHp + (hpPerPoint * (1 + hpMultiplier / 100) * fixedHpPoints * (1 + attackMultiplier / 100) * (attackScalingByHp / 100));

    // 3) 고정 수치 제외 나머지를 치피에 투자했을 경우의 치명피해
    const critWithFixedHp = currentCritDamage + (critDamagePerPoint * (hpPoints - fixedHpPoints));

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

    // [6. 최종 결과 도출]
    const finalAtkPoints = clampedAttackPoints + attackPoints;
    const finalHpPoints = fixedHpPoints;
    const finalCritPoints = maxPoints - finalAtkPoints - finalHpPoints;

    const finalAtkStat = currentAttack + (attackPerPoint * (finalAtkPoints - attackPoints) + (hpPerPoint * (1 + hpMultiplier / 100) * (attackScalingByHp / 100) * (finalHpPoints - hpPoints))) * (1 + attackMultiplier / 100);
    const finalCritStat = currentCritDamage + (finalCritPoints - critDamagePoints) * critDamagePerPoint;
    const finalHpStat = currentHp + (finalHpPoints - hpPoints) * hpPerPoint * (1 + hpMultiplier / 100);

    // [7. 화면에 출력]
    document.getElementById('finalAtkPoints').innerText = finalAtkPoints.toLocaleString();
    document.getElementById('finalHpPoints').innerText = finalHpPoints.toLocaleString();
    document.getElementById('finalCritPoints').innerText = finalCritPoints.toLocaleString();

    document.getElementById('finalAtkStat').innerText = Math.floor(finalAtkStat).toLocaleString();
    document.getElementById('finalCritStat').innerText = finalCritStat.toLocaleString() + "%";
    document.getElementById('finalHpStat').innerText = Math.floor(finalHpStat).toLocaleString();
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
    let currVal = parseFloat(input.value) || 0;
    
    // 소수점 입력창(Multiplier 등)은 0.1씩, 나머지는 1씩 증감하고 싶다면?
    const isDecimal = id.includes('Multiplier') || id.includes('Scaling');
    const finalStep = isDecimal ? (step * 0.1) : step;

    let nextVal = currVal + finalStep;
    
    // 최소값 0 보정
    if (nextVal < 0) nextVal = 0;
    
    // 소수점 한자리 고정 (부동소수점 오류 방지)
    input.value = isDecimal ? nextVal.toFixed(1) : Math.floor(nextVal);
    
    // 계산 함수 호출
    calculateStats();
}

// 모든 숫자 입력창(Number Input)에 입력이 발생할 때 실행
document.querySelectorAll('input[type="number"]').forEach(numInput => {
    numInput.addEventListener('input', (e) => {
        const id = e.target.id;
        // 현재 인풋과 연결된 슬라이더(Range)를 찾음 
        // (oninput 속성에 해당 ID가 포함된 슬라이더를 타겟팅)
        const slider = document.querySelector(`input[type="range"][oninput*="${id}"]`);
        
        if (slider) {
            // 인풋의 값이 바뀌면 슬라이더의 값도 동일하게 맞춤
            slider.value = e.target.value;
        }
        
        // 계산 함수 실행 (실시간 반영)
        calculateStats();
    });
});

/* ==========================================
   3. 
   ========================================== */