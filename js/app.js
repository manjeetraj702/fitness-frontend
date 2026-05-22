// 🎯 DYNAMIC CLOUD INTERCEPTOR: Pointing to your live, production Java Backend Gateway
const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:8080"
    : "https://fitness-backend-b8r0.onrender.com";
let macroChartInstance = null;

// ============================================================
// 1. SESSION ACCESS GATEKEEPER PROTECTION
// ============================================================
// 🎯 FIXED KEY: Explicitly pin global token reference using the correct storage key
const token = localStorage.getItem('jwtToken');
if (!token) { 
    window.location.href = 'index.html'; 
}

try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    document.getElementById('userDisplay').textContent = payload.sub; // Inject Email ID
} catch(e) { 
    localStorage.clear();
    window.location.href = 'index.html'; 
}

// User Disconnect Execution
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear(); 
    window.location.href = 'index.html';
});

// ============================================================
// 2. MICRO-INTERACTION TOAST ENGINE
// ============================================================
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container'; 
        container.className = 'fixed bottom-5 right-5 space-y-3 z-50';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `${type === 'success' ? 'bg-emerald-600 border-emerald-500' : 'bg-red-600 border-red-500'} text-white px-5 py-3 rounded-xl shadow-2xl border flex items-center space-x-3 transform translate-y-10 opacity-0 transition-all duration-300 max-w-sm`;
    toast.innerHTML = `<span class="text-sm font-semibold">${type === 'success' ? '✅' : '❌'} ${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-y-10', 'opacity-0'), 10);
    setTimeout(() => { toast.classList.add('opacity-0', 'translate-y-2'); setTimeout(() => toast.remove(), 300); }, 3500);
}

// ============================================================
// 3. GAMIFICATION STREAK COUNTER INITIALIZATION
// ============================================================
function handleStreakCalculation() {
    const today = new Date().toDateString();
    let lastLogin = localStorage.getItem('lastLoginDate');
    let streak = parseInt(localStorage.getItem('healthStreak')) || 0;

    if (lastLogin !== today) {
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        if (lastLogin === yesterday.toDateString()) { streak++; } 
        else if (lastLogin === null || new Date(lastLogin) < yesterday) { streak = 1; }
        localStorage.setItem('healthStreak', streak); 
        localStorage.setItem('lastLoginDate', today);
    }
    let tag = streak >= 7 ? "Iron Discipline ⚡" : (streak >= 3 ? "Consistent Warrior 🔥" : "FitTrack Novice 🌱");
    document.getElementById('streakDisplay').innerHTML = `<div class="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-1.5 rounded-lg text-xs font-black text-white shadow-lg tracking-wider animate-pulse uppercase">🔥 ${streak} DAY STREAK - ${tag}</div>`;
}
handleStreakCalculation();

// ============================================================
// 4. TAB CONTROLLER ROUTING PANEL
// ============================================================
function bindNavigationTab(elementId, viewId, callback = null) {
    const targetElement = document.getElementById(elementId);
    if (!targetElement) return;
    
    targetElement.addEventListener('click', (e) => {
        document.querySelectorAll('.view-panel').forEach(p => p.classList.add('hidden'));
        document.getElementById(viewId).classList.remove('hidden');
        document.querySelectorAll('aside nav button').forEach(b => b.className = "w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-700 rounded text-left text-sm font-semibold text-gray-400 hover:text-white transition duration-150");
        e.currentTarget.className = "w-full flex items-center space-x-3 px-4 py-3 bg-blue-600 rounded text-left text-sm font-semibold text-white transition duration-150 shadow-lg shadow-blue-600/10";
        if(callback) callback();
    });
}
bindNavigationTab('navBiometrics', 'biometricsView');
bindNavigationTab('navWorkout', 'workoutView');
bindNavigationTab('navMeals', 'mealsView');
bindNavigationTab('navNutrition', 'nutritionView');

// ============================================================
// 5. ML PREDICTIONS PIPELINE SUBMISSION INTERCEPTOR
// ============================================================
document.getElementById('metricsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.textContent = 'Processing Vector...';
    submitBtn.disabled = true;

    const goalValue = document.getElementById('goal').value;
    const payload = {
        age: parseInt(document.getElementById('age').value),
        weightKg: parseFloat(document.getElementById('weight').value),
        heightCm: parseFloat(document.getElementById('height').value),
        optimizationGoal: goalValue
    };

    try {
        // 🎯 FIXED TOKEN REFERENCE PATHWAYS HERE
        const response = await fetch(`${API_BASE_URL}/api/v1/analytics/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error(`HTTP Session Error: ${response.status}`);
        const data = await response.json();
        const pred = data.analyticalPredictions;

        // View Visibility Alternations
        document.getElementById('placeholderState').classList.add('hidden');
        document.getElementById('resultsDashboard').classList.remove('hidden');

        document.getElementById('caloricOutput').innerHTML = `${pred.dailyCalories} <span class="text-sm font-normal text-gray-400">kcal / day</span>`;
        document.getElementById('algoOutput').textContent = pred.algorithmUsed || "Random Forest Regressor";
        document.getElementById('pOutput').textContent = `${pred.macros.protein}g`;
        document.getElementById('cOutput').textContent = `${pred.macros.carbs}g`;
        document.getElementById('fOutput').textContent = `${pred.macros.fats}g`;

        // Dynamic visual color themes based on goals
        if(goalValue.toLowerCase() === 'cut') { 
            submitBtn.className = "w-full bg-red-600 text-white font-bold py-2.5 rounded shadow-lg shadow-red-600/10"; 
            document.getElementById('caloricOutput').className="text-2xl font-black text-red-400 mt-1"; 
        } else if(goalValue.toLowerCase() === 'bulk') { 
            submitBtn.className = "w-full bg-indigo-600 text-white font-bold py-2.5 rounded shadow-lg shadow-indigo-600/10"; 
            document.getElementById('caloricOutput').className="text-2xl font-black text-indigo-400 mt-1"; 
        } else { 
            submitBtn.className = "w-full bg-emerald-600 text-white font-bold py-2.5 rounded shadow-lg shadow-emerald-600/10"; 
            document.getElementById('caloricOutput').className="text-2xl font-black text-emerald-400 mt-1"; 
        }

        // Render Doughnut Chart Macro Allocation
        if (macroChartInstance) macroChartInstance.destroy();
        macroChartInstance = new Chart(document.getElementById('macroChart').getContext('2d'), {
            type: 'doughnut', 
            data: { datasets: [{ data: [pred.macros.protein, pred.macros.carbs, pred.macros.fats], backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'], borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '80%', plugins: { legend: { display: false } } }
        });

        // Render workouts and meals plans
        renderWorkoutRoutine(pred.workoutPlan);
        renderMealPlan(pred.mealPlan);

        showToast("Biometric ML predictions compiled successfully!");
    } catch (err) { 
        console.error(err);
        showToast(err.message || "Java Server connection refused.", "error"); 
    } finally { 
        submitBtn.textContent = 'Execute Pipeline'; 
        submitBtn.disabled = false;
    }
});

// ============================================================
// 6. DOM ROUTINE RENDERING ENGINES
// ============================================================
function renderWorkoutRoutine(plan) {
    document.getElementById("wkFocus").textContent = `Focus: ${plan.focus}`;
    document.getElementById("wkFrequency").textContent = plan.frequency;
    document.getElementById("workoutPlaceholder").classList.add("hidden");
    const container = document.getElementById("workoutRoutineContainer");
    document.getElementById("workoutMainWorkspace").classList.remove("hidden");
    container.innerHTML = "";

    const exerciseImages = {
        "bench press": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600&auto=format&fit=crop",
        "incline dumbbell": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop",
        "flyes": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600&auto=format&fit=crop",
        "lat pulldown": "https://images.unsplash.com/photo-1598971639058-aba3c7f09a7d?q=80&w=600&auto=format&fit=crop",
        "cable rows": "https://images.unsplash.com/photo-1605296867424-35fc25c9212a?q=80&w=600&auto=format&fit=crop",
        "bicep curls": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600&auto=format&fit=crop"
    };

    plan.days.forEach((day, idx) => {
        const dayCard = document.createElement('div');
        dayCard.className = "bg-gray-850 rounded-xl border border-gray-800 shadow-xl overflow-hidden flex flex-col hover:border-blue-500/30 transition duration-300";
        
        dayCard.innerHTML = `
            <div class="bg-gray-800 border-b border-gray-750 px-5 py-3.5 flex justify-between items-center">
                <h3 class="text-xs font-black text-white uppercase tracking-wider">${day.name}</h3>
                <span class="text-[9px] bg-blue-900/40 text-blue-400 border border-blue-800/30 px-2 py-0.5 rounded font-mono font-bold uppercase">View Logs</span>
            </div>
            <div class="p-4 space-y-2 flex-1" id="list-container-${idx}"></div>
        `;
        container.appendChild(dayCard);
        
        const listTarget = document.getElementById(`list-container-${idx}`);

        day.routines.forEach(ex => {
            const exRow = document.createElement('div');
            exRow.className = "flex items-center space-x-2.5 text-xs text-gray-200 bg-gray-900/60 hover:bg-blue-950/80 border border-gray-850 hover:border-blue-900 p-3 rounded-lg font-mono cursor-pointer transition duration-150 select-none";
            exRow.innerHTML = `<span class="text-blue-500 font-bold">🏋️‍♂️</span> <span class="font-sans font-medium">${ex}</span>`;
            
            let matchUrl = "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop";
            const exLower = ex.toLowerCase();
            
            for (const [key, url] of Object.entries(exerciseImages)) {
                if (exLower.includes(key)) { matchUrl = url; break; }
            }

            exRow.addEventListener('mouseenter', () => {
                document.getElementById('liveGuideTitle').textContent = ex.split(':')[0];
                document.getElementById('liveGuideImage').src = matchUrl;
            });

            if (listTarget) listTarget.appendChild(exRow);
        });
    });
}

function renderMealPlan(plan) {
    const dietStrategyLabel = document.getElementById("dietStrategyLabel");
    if (dietStrategyLabel) dietStrategyLabel.textContent = `Strategy: ${plan.strategy}`;

    const mealsPlaceholder = document.getElementById("mealsPlaceholder");
    if (mealsPlaceholder) mealsPlaceholder.classList.add("hidden");

    const container = document.getElementById("mealsRoutineContainer");
    const mealsMainWorkspace = document.getElementById("mealsMainWorkspace");
    
    if (mealsMainWorkspace) mealsMainWorkspace.classList.remove("hidden");
    if (!container) return;
    container.innerHTML = "";

    plan.days.forEach((meal, index) => {
        const card = document.createElement("div");
        card.className = "bg-gray-900/40 p-5 rounded-2xl border border-gray-900 shadow-md cursor-pointer hover:border-amber-500/40 hover:bg-gray-900/80 transform hover:-translate-y-0.5 transition duration-200 group";
        
        card.onmouseenter = () => {
            updateFoodPresentationGuide(meal.dish, meal.details, meal.dish);
        };

        card.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="text-[9px] font-black text-amber-500 uppercase tracking-widest font-mono bg-amber-500/5 px-2.5 py-1 rounded-md border border-amber-500/10">${meal.time}</span>
                <span class="text-[10px] text-gray-600 font-mono group-hover:text-amber-500/60 transition duration-150">Slot #0${index + 1}</span>
            </div>
            <h4 class="text-sm font-black text-white uppercase tracking-tight mt-3 group-hover:text-amber-400 transition duration-150">${meal.dish}</h4>
            <p class="text-[11px] text-gray-400 mt-1.5 leading-relaxed font-medium">${meal.details}</p>
        `;
        container.appendChild(card);
    });

    if (plan.days.length > 0) {
        updateFoodPresentationGuide(plan.days[0].dish, plan.days[0].details, plan.days[0].dish);
    }
}

function updateFoodPresentationGuide(title, description, keyword) {
    const guideTitle = document.getElementById("foodGuideTitle");
    const guideDetails = document.getElementById("foodGuideDetails");
    const guideImage = document.getElementById("foodGuideImage");

    if (guideTitle) guideTitle.textContent = title;
    if (guideDetails) guideDetails.textContent = description;
    
    if (guideImage) {
        const cleanKey = keyword.toLowerCase().trim();
        let fallbackUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop";

        if (cleanKey.includes("omelette") || cleanKey.includes("egg")) {
            fallbackUrl = "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=600&auto=format&fit=crop";
        } else if (cleanKey.includes("tikka") || cleanKey.includes("chicken") || cleanKey.includes("biryani")) {
            fallbackUrl = "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=600&auto=format&fit=crop";
        } else if (cleanKey.includes("paneer") || cleanKey.includes("bhurji") || cleanKey.includes("pulao")) {
            fallbackUrl = "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=600&auto=format&fit=crop";
        } else if (cleanKey.includes("shake") || cleanKey.includes("oats")) {
            fallbackUrl = "https://images.unsplash.com/photo-1517809058567-3050e27768e7?q=80&w=600&auto=format&fit=crop";
        }

        guideImage.style.opacity = "0.1";
        setTimeout(() => {
            guideImage.src = fallbackUrl;
            guideImage.style.opacity = "0.4";
        }, 150);
    }
}

// ============================================================
// 7. CALORIE COUNTER METRICS TRACKING LOADER
// ============================================================
let currentJournalLogs = JSON.parse(localStorage.getItem('calorieJournalData')) || [];

function renderDailyLogJournal() {
    const box = document.getElementById('calorieJournalContainer');
    if(!box) return; 
    box.innerHTML = "";
    
    if(currentJournalLogs.length === 0) {
        box.innerHTML = `<span class="text-gray-500 italic text-center block py-4">No diet entries tracked in today's active session logs.</span>`;
        return;
    }

    currentJournalLogs.forEach((log) => {
        const itemRow = document.createElement('div');
        itemRow.className = "flex justify-between items-center bg-gray-800 p-2.5 border border-gray-700 rounded font-mono text-[11px]";
        itemRow.innerHTML = `
            <span>🍽️ <b>${log.name}</b> (${log.serving})</span>
            <span class="text-blue-400 font-bold">+ ${log.cals} kcal | P: ${log.p}g | C: ${log.c}g | F: ${log.f}g</span>
        `;
        box.appendChild(itemRow);
    });
}

function clearDailyLogJournal() {
    currentJournalLogs = [];
    localStorage.removeItem('calorieJournalData');
    renderDailyLogJournal();
    showToast("Session calorie log journal cleared.");
}

setTimeout(renderDailyLogJournal, 200);

document.getElementById('calorieCalculatorForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const calcBtn = document.getElementById('calcBtn');
    calcBtn.textContent = "Calculating Scaling Coefficients...";
    calcBtn.disabled = true;

    const payload = {
        foodKey: document.getElementById('foodKey').value,
        quantityAmount: parseFloat(document.getElementById('quantityAmount').value)
    };

    try {
        // 🎯 FIXED TOKEN REFERENCE PATHWAYS HERE AS WELL
        const response = await fetch(`${API_BASE_URL}/api/v1/features/calculate-food`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        if(!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();
        const metrics = data.computedMetrics;

        document.getElementById('loggedFoodName').textContent = data.itemName;
        document.getElementById('loggedServingSize').textContent = data.servingLogged;
        document.getElementById('calcCal').textContent = metrics.calories;
        document.getElementById('calcProt').textContent = metrics.protein;
        document.getElementById('calcCarb').textContent = metrics.carbs;
        document.getElementById('calcFat').textContent = metrics.fats;

        currentJournalLogs.push({
            name: data.itemName,
            serving: data.servingLogged,
            cals: metrics.calories,
            p: metrics.protein,
            c: metrics.carbs,
            f: metrics.fats
        });

        localStorage.setItem('calorieJournalData', JSON.stringify(currentJournalLogs));
        renderDailyLogJournal();
        showToast(`Calculated metrics successfully logged for ${data.itemName}!`);
    } catch(err) {
        showToast("Linear coefficient matrix calculator offline.", "error");
    } finally {
        calcBtn.textContent = "Log to Daily Summary";
        calcBtn.disabled = false;
        document.getElementById('quantityAmount').value = ""; 
    }
});