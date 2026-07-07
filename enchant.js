let enchantData = [];
let globalTryCount = 0; // 💡 시뮬레이터 누적 시도 횟수 카운터 변수 추가

// 페이지 로드 시 JSON 데이터 불러오기
document.addEventListener("DOMContentLoaded", () => {
    fetch("./enchant.json")
        .then(res => res.json())
        .then(data => {
            enchantData = data;
            renderAll();
        })
        .catch(err => console.error("데이터 로드 실패:", err));
});

function renderAll() {
    renderList();
    initSimulatorOptions();
}

// 탭 전환 기능
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// 상단 리스트 그려주기 (룬 이름 대신 '대상 아이템 이름' 노출)
function renderList() {
    const listContainer = document.getElementById("enchant-item-list");
    listContainer.innerHTML = "";

    enchantData.forEach(set => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "enchant-list-item";
        itemDiv.onclick = () => showDetail(set.id, itemDiv);

        let displayName = "";

        if (set.has_multiple_runes) {
            const firstRune = set.runes[0];
            const targetItem = firstRune.items[0];
            displayName = targetItem.item_name;

            itemDiv.innerHTML = `
                <img src="${targetItem.item_image}" alt="${displayName}">
                <p class="enchant-item-name">${displayName}</p>
            `;
        }
        else if (set.items && set.items.length > 1) {
            displayName = "초월무기";
            let imgHTML = `<div class="item-multi-box">`;
            set.items.forEach(it => {
                imgHTML += `<img src="${it.item_image}" alt="${it.item_name}">`;
            });
            imgHTML += `</div><p class="enchant-item-name">${displayName}</p>`;
            itemDiv.innerHTML = imgHTML;
        }
        else if (set.items && set.items.length === 1) {
            const targetItem = set.items[0];
            displayName = targetItem.item_name;

            itemDiv.innerHTML = `
                <img src="${targetItem.item_image}" alt="${displayName}">
                <p class="enchant-item-name">${displayName}</p>
            `;
        }

        listContainer.appendChild(itemDiv);
    });
}

// 숫자와 % 강조 정규식
function highlightText(text) {
    if (!text) return "";
    return text.replace(/([0-9,]+(\.[0-9]+)?%?)/g, '<span class="highlight-num">$1</span>');
}

// 상세 정보 창 출력
function showDetail(setId, element) {
    document.querySelectorAll('.enchant-list-item').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');

    const set = enchantData.find(s => s.id === setId);
    const detailContainer = document.getElementById("enchant-detail-card");

    let itemNames = "";
    let locationName = set.location;
    let titleName = "";

    if (set.has_multiple_runes) {
        itemNames = set.runes[0].items.map(it => it.item_name).join(", ");
        titleName = "드래곤의 봉인석 세트";
    } else {
        itemNames = set.items.map(it => it.item_name).join(", ");
        titleName = set.rune_name;
    }

    let html = `
        <h2 style="font-size: 1.5rem; margin-bottom: 12px; border-bottom: 2px solid var(--text); padding-bottom: 8px;">
            ${titleName}
        </h2>
        <p style="margin: 6px 0; font-size: 0.95rem;"><b>획득 위치 :</b> ${locationName}</p>
        <p style="margin: 6px 0; font-size: 0.95rem;"><b>대상 장비 :</b> <span style="color:var(--secondary); font-weight:bold;">${itemNames}</span></p>
    `;

    const runesToRender = set.has_multiple_runes ? set.runes : [set];

    runesToRender.forEach((rune) => {
        if (set.has_multiple_runes) {
            html += `<div class="rune-detail-block"><h3 style="font-size: 1.15rem; color: var(--primary);">- ${rune.rune_name}</h3>`;
        } else {
            html += `<div class="rune-detail-block">`;
        }

        html += `
            <div style="display:flex; gap:15px; align-items:center; margin-bottom:15px; margin-top: 10px;">
                <img src="${rune.rune_image}" style="width:45px; height:45px; object-fit:contain;">
                <div style="font-size: 0.9rem; line-height: 1.5;">
                    <div><b>인챈트 비용 :</b> ${rune.cost}</div>
                    <div><b>성공 확률 :</b> ${rune.success_rate}%</div>
                </div>
            </div>
            
            <h4 style="font-size: 1rem; margin: 15px 0 8px 0; font-weight: 600; color: var(--text);">▪ 인챈트 추가 능력치 범위</h4>
            <ul style="padding-left: 15px; margin: 0; line-height: 1.6; font-size: 0.95rem;">
        `;

        rune.stats.forEach(st => {
            html += `<li>${st.stat_name} : ${highlightText(st.min.toLocaleString())}${st.unit} ~ ${highlightText(st.max.toLocaleString())}${st.unit}</li>`;
        });
        html += `</ul>`;

        // 💡 [요청 반영] 능력치 범위와 스킬 정보 사이에 문구 한 줄만 정갈하게 노출
        if (set.has_multiple_runes && rune.type === "b") {
            html += `<p style="font-size: 0.95rem; margin: 15px 0 5px 4px; color: var(--text); font-weight: bold;">
                * '불안정한 드래곤의 봉인석' 제작 성공 시 일정 확률로 획득 가능
            </p>`;
        }

        if (rune.materials && rune.materials.length > 0) {
            const craftRateText = rune.craft_rate ? `<span style="font-size: 0.85rem; color: gray; margin-left: 6px; font-weight: normal;">(제작 확률: ${rune.craft_rate}%)</span>` : '';

            html += `<h4 style="font-size: 1rem; margin: 18px 0 8px 0; font-weight: 600; color: var(--text); display: flex; align-items: center;">
            ▪ 필요 제작 재료 ${craftRateText}
              </h4>
             <!-- 💡 flex-direction을 row로 바꾸고 flex-wrap: wrap을 주어 화면 크기에 맞춰 자동 정렬되게 만듭니다 -->
             <div class="mat-list" style="display: flex; flex-direction: row; flex-wrap: wrap; gap: 12px 20px; width: 100%; background: none !important; border: none !important; padding: 0 !important; margin-bottom: 15px;">`;

            rune.materials.forEach(mat => {
                html += `
                    <!-- 💡 min-width를 주어 PC에서는 가로로 배치되되 아이템끼리 너무 달라붙지 않게 조절합니다 -->
                    <div class="mat-item" style="display: flex; align-items: center; gap: 10px; min-width: 160px; background: none !important; border: none !important; padding: 0 !important; box-shadow: none !important;">
                        <img src="${mat.img}" style="width: 42px; height: 42px; object-fit: contain; border: 1px solid var(--border); border-radius: 4px; padding: 2px; background: rgba(0,0,0,0.02); flex-shrink: 0;"> 
                        <span style="font-size: 0.95rem; color: var(--text); white-space: nowrap;">${mat.name} x ${mat.count}</span>
                    </div>
                `;
            });
            html += `</div>`;
        }

        if (rune.skill_info && rune.skill_info.has_skill) {
            html += `<h4 style="font-size: 1rem; margin: 18px 0 8px 0; font-weight: 600; color: var(--text);">▪ 인챈트 부여 스킬 정보</h4>`;
            html += `<p style="font-size: 0.95rem; margin: 5px 0;"><b>스킬명 :</b> <span style="color:#e67e22; font-weight:bold;">${rune.skill_info.skill_name}</span> (Lv.1 ~ Lv.3)</p>`;

            const rateStrings = rune.skill_info.levels.map(lv => `Lv.${lv.level}: ${lv.rate}%`).join(", ");

            let desc = rune.skill_info.base_desc;

            if (desc.includes("$1")) {
                const valuesCount = rune.skill_info.levels[0].values.length;
                for (let i = 0; i < valuesCount; i++) {
                    const combinedVal = "(" + rune.skill_info.levels.map(lv => lv.values[i]).join(", ") + ")";
                    desc = desc.replace(`$${i + 1}`, combinedVal);
                }
            }

            html += `<p class="sim-skill-desc-box" style="margin-top: 8px;">
                <span style="color:var(--secondary); font-weight:bold;">[부여 확률]</span> ${rateStrings}<br><br>
                ${highlightText(desc)}
            </p>`;
        }

        html += `</div>`;
    });

    detailContainer.innerHTML = html;
}

/* ==================== 시뮬레이터 로직 ==================== */
function initSimulatorOptions() {
    const select = document.getElementById("sim-target-select");
    if (!select) return;
    select.innerHTML = "";

    enchantData.forEach(set => {
        if (set.has_multiple_runes) {
            set.runes.forEach(r => {
                const typeText = r.type === "a" ? "불안정" : "찬란";
                const itemName = r.items[0].item_name;
                select.innerHTML += `<option value="${set.id}-${r.type}">${itemName} (${typeText})</option>`;
            });
        }
        else if (set.items && set.items.length > 1) {
            select.innerHTML += `<option value="${set.id}-single">초월무기</option>`;
        }
        else {
            const itemName = set.items[0].item_name;
            select.innerHTML += `<option value="${set.id}-single">${itemName}</option>`;
        }
    });
    initSimulator();
}

// 대상 아이템 변경 시 횟수 초기화 기능 포함
function initSimulator() {
    globalTryCount = 0;
    const select = document.getElementById("sim-target-select");
    if (!select || !select.value) return;

    const [setId, type] = select.value.split("-");
    const set = enchantData.find(s => s.id == setId);
    const rune = set.has_multiple_runes ? set.runes.find(r => r.type === type) : set;

    const matDisplay = document.getElementById("sim-materials-display");
    if (!matDisplay) return;

    // 💡 배경색(background)을 아예 제거하고, 테두리(border)로만 구역을 구분하여 다크모드/라이트모드 상관없이 100% 보이게 합니다.
    let html = `
        <div style="border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-bottom: 15px;">
            <h4 style="margin: 0 0 10px 0; font-size: 1rem; color: var(--text); border-left: 4px solid var(--primary); padding-left: 10px;">
                인챈트 옵션 범위
            </h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                <tbody>`;

    rune.stats.forEach(st => {
        html += `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 8px 0; font-weight: 600; color: var(--secondary);">${st.stat_name}</td>
                <td style="padding: 8px 0; text-align: right; color: var(--text);">${st.min.toLocaleString()}${st.unit} ~ ${st.max.toLocaleString()}${st.unit}</td>
            </tr>`;
    });

    html += `   </tbody>
            </table>
        </div>`;
    matDisplay.innerHTML = html;

    const resultDisplay = document.getElementById("sim-result-display");
    if (resultDisplay) {
        resultDisplay.innerHTML = `<p class="placeholder-text" style="color: gray; font-size: 0.95rem;">인챈트 버튼을 누르면 랜덤 옵션 결과가 표시됩니다.</p>`;
    }
}

// 페이지 로드 시 JSON 데이터 불러오기 및 리스너 등록
document.addEventListener("DOMContentLoaded", () => {
    fetch("./enchant.json")
        .then(res => res.json())
        .then(data => {
            enchantData = data;
            renderAll();
            initToggleListener(); // 💡 실시간 토글 리스너 함수 호출
        })
        .catch(err => console.error("데이터 로드 실패:", err));
});

// 💡 실시간 스위칭을 위한 토글 리스너 추가
function initToggleListener() {
    const toggle = document.getElementById("sim-effect-toggle");
    if (!toggle) return;

    toggle.addEventListener("change", () => {
        const resultDisplay = document.getElementById("sim-result-display");
        if (!resultDisplay) return;

        // 사용자가 언제든 스위치를 켜고 끌 때 클래스를 즉시 반영합니다.
        if (toggle.checked) {
            resultDisplay.classList.add("effects-on");
        } else {
            resultDisplay.classList.remove("effects-on");
        }
    });
}

function runSimulation() {
    const select = document.getElementById("sim-target-select");
    if (!select) return;

    const [setId, type] = select.value.split("-");
    const set = enchantData.find(s => s.id == setId);
    const rune = set.has_multiple_runes ? set.runes.find(r => r.type === type) : set;
    const resultDisplay = document.getElementById("sim-result-display");

    if (!rune) return;

    globalTryCount++;

    // 💡 주입하던 <style> 코드는 완전히 들어내고 순수 HTML 레이아웃만 남깁니다.
    let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
            <h2 style="font-size: 1.3rem; margin: 0; color: var(--text);">인챈트 결과</h2>
            <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 0.95rem; background: var(--primary); color: white; padding: 4px 10px; border-radius: 20px; font-weight: bold;">
                    누적 시도 : ${globalTryCount}회
                </span>
                <button onclick="resetSimulationCount()" title="시도 횟수 초기화" 
                        style="background: none; border: none; color: var(--text); font-size: 1.2rem; cursor: pointer; padding: 0 4px; display: flex; align-items: center; transition: transform 0.2s;"
                        onmouseover="this.style.transform='rotate(-45deg)'" onmouseout="this.style.transform='rotate(0deg)'">
                    ↻
                </button>
            </div>
        </div>
    `;

    html += `<h4 style="font-size: 1rem; margin: 12px 0 6px 0;">▪ 부여된 인챈트 옵션</h4><ul style="padding-left: 15px; margin: 0; line-height: 1.6;">`;

    let isJackpot = true;
    let hasStatsOrSkill = false;

    // 1. 스탯 옵션 계산
    rune.stats.forEach(st => {
        hasStatsOrSkill = true;
        let finalValNum = 0;
        let score = 0;

        if (st.stat_name === "공격력") {
            let step = 1;
            if (set.id === 4) step = 1000;
            else if (set.id === 2) step = 100;

            const minStep = Math.ceil(st.min / step);
            const maxStep = Math.floor(st.max / step);
            const randomStep = Math.floor(Math.random() * (maxStep - minStep + 1) + minStep);
            finalValNum = randomStep * step;

            if (maxStep === minStep) score = 100;
            else score = Math.floor(((randomStep - minStep) / (maxStep - minStep)) * 100);
        } else {
            finalValNum = Math.floor(Math.random() * (st.max - st.min + 1) + st.min);
            if (st.max === st.min) score = 100;
            else score = Math.floor(((finalValNum - st.min) / (st.max - st.min)) * 100);
        }

        let effClass = "";
        if (score === 100) {
            effClass = "eff-max";
        } else if (score >= 90) {
            effClass = "eff-red";
        } else if (score >= 80) {
            effClass = "eff-green";
        }

        // 👑 잭팟 판정: 90% 미만(초록색 이하)이 하나라도 나오면 잭팟 탈락!
        if (score < 90) {
            isJackpot = false;
        }

        let displayVal = highlightText(finalValNum.toLocaleString() + st.unit);
        if (effClass !== "") {
            displayVal = `<span class="${effClass}">${displayVal}</span>`;
        }

        html += `<li><b>${st.stat_name} :</b> ${displayVal}</li>`;
    });
    html += `</ul>`;

    // 2. 스킬 옵션 계산
    if (rune.skill_info && rune.skill_info.has_skill) {
        hasStatsOrSkill = true;
        html += `<h4 style="font-size: 1rem; margin-top: 15px; margin-bottom: 6px;">▪ 부여된 스킬</h4>`;

        const dice = Math.random() * 100;
        let currentWeight = 0;
        let selectedLv = rune.skill_info.levels[0];

        for (let lv of rune.skill_info.levels) {
            currentWeight += lv.rate;
            if (dice <= currentWeight) {
                selectedLv = lv;
                break;
            }
        }

        let skillEffClass = "";
        if (selectedLv.level === 3) {
            skillEffClass = "eff-max";
        } else {
            isJackpot = false;
        }

        let skillText = `[${rune.skill_info.skill_name} Lv.${selectedLv.level}]`;
        if (skillEffClass !== "") {
            skillText = `<span class="${skillEffClass}">${skillText}</span>`;
        }

        html += `<p style="margin: 4px 0 0 4px; font-size: 0.95rem;">
            <b>${skillText}</b> <span style="color: gray; font-size: 0.85rem;">(확률: ${selectedLv.rate}%)</span>
        </p>`;
    }

    // 3. 잭팟 클래스 판단 및 적용
    if (isJackpot && hasStatsOrSkill) {
        resultDisplay.classList.add("eff-jackpot");
    } else {
        resultDisplay.classList.remove("eff-jackpot");
    }

    resultDisplay.innerHTML = html;

    // 4. 인챈트 실행 직후에도 현재 스위치 상태를 반영해 줍니다.
    if (document.getElementById("sim-effect-toggle").checked) {
        resultDisplay.classList.add("effects-on");
    } else {
        resultDisplay.classList.remove("effects-on");
    }
}

// 💡 버튼을 눌렀을 때 횟수를 0으로 밀고 결과창을 초기 상태로 돌려놓는 함수 추가
function resetSimulationCount() {
    globalTryCount = 0;
    const resultDisplay = document.getElementById("sim-result-display");
    if (resultDisplay) {
        resultDisplay.innerHTML = `<p class="placeholder-text" style="color: gray; font-size: 0.95rem;">인챈트 버튼을 누르면 랜덤 옵션 결과가 표시됩니다.</p>`;
    }
}