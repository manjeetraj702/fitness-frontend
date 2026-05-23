const API_BASE_URL = "https://fitness-backend-b8r0.onrender.com";
let macroChartInstance = null;
const token = localStorage.getItem('jwtToken');

const isLandingPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';

if (!isLandingPage) {
    if (!token) { 
        window.location.href = 'index.html'; 
    } else {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            const userDisplayNode = document.getElementById('userDisplay');
            if (userDisplayNode) userDisplayNode.textContent = payload.sub;
        } catch(e) { 
            localStorage.clear();
            window.location.href = 'index.html'; 
        }
    }
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.clear(); 
        window.location.href = 'index.html';
    });
}

const metricsForm = document.getElementById('metricsForm');
if (metricsForm) {
    metricsForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('submitBtn');
        submitBtn.textContent = 'Processing Matrix...';
        submitBtn.disabled = true;

        const payload = {
            age: parseInt(document.getElementById('age').value),
            weightKg: parseFloat(document.getElementById('weight').value),
            heightCm: parseFloat(document.getElementById('height').value),
            optimizationGoal: document.getElementById('goal').value
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/analytics/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Inference pipeline returned a server exception.");

            const data = await response.json();
            const pred = data.analyticalPredictions;

            document.getElementById('placeholderState').classList.add('hidden');
            document.getElementById('resultsDashboard').classList.remove('hidden');

            document.getElementById('caloricOutput').innerHTML = `${pred.dailyCalories} <span class="text-sm font-normal text-gray-400">kcal/day</span>`;
            document.getElementById('algoOutput').textContent = pred.algorithmUsed || "Random Forest Regressor";
            document.getElementById('pOutput').textContent = `${pred.macros.protein}g`;
            document.getElementById('cOutput').textContent = `${pred.macros.carbs}g`;
            document.getElementById('fOutput').textContent = `${pred.macros.fats}g`;

            if (pred.workoutPlan) {
                document.getElementById('workoutPlaceholder').classList.add('hidden');
                document.getElementById('workoutMainWorkspace').classList.remove('hidden');
                document.getElementById('wkFocus').textContent = pred.workoutPlan.focus;
                document.getElementById('wkFrequency').textContent = pred.workoutPlan.frequency;
                document.getElementById('workoutProTip').textContent = pred.workoutPlan.proTipWarning || "";

                const routineContainer = document.getElementById('workoutRoutineContainer');
                routineContainer.innerHTML = '';
                pred.workoutPlan.days.forEach(day => {
                    const routinesList = day.routines.map(r => `<li class="text-xs text-gray-400 font-mono mt-1">⚡ ${r}</li>`).join('');
                    routineContainer.innerHTML += `
                        <div class="bg-gray-950 p-4 rounded-xl border border-gray-850">
                            <h4 class="text-xs font-black text-white uppercase tracking-wider">${day.name}</h4>
                            <ul class="mt-2 space-y-1">${routinesList}</ul>
                        </div>`;
                });
            }

            if (pred.mealPlan) {
                document.getElementById('mealsPlaceholder').classList.add('hidden');
                document.getElementById('mealsMainWorkspace').classList.remove('hidden');
                document.getElementById('dietStrategyLabel').textContent = pred.mealPlan.strategy;

                const mealsContainer = document.getElementById('mealsRoutineContainer');
                mealsContainer.innerHTML = '';
                
                pred.mealPlan.days.forEach((meal, index) => {
                    const escapedDetails = meal.details.replace(/"/g, '&quot;');
                    mealsContainer.innerHTML += `
                        <div onclick="updateDietPresentationHub('${meal.time}', '${meal.dish}', '${escapedDetails}')" 
                             class="bg-gray-950 p-4 rounded-xl border border-gray-850 hover:border-amber-500/40 transition duration-150 cursor-pointer">
                            <span class="text-[10px] font-bold text-amber-500 uppercase tracking-widest block font-mono">${meal.time}</span>
                            <h4 class="text-sm font-black text-white mt-1">${meal.dish}</h4>
                            <p class="text-xs text-gray-500 mt-1 line-clamp-1">${meal.details}</p>
                        </div>`;
                    if (index === 0) updateDietPresentationHub(meal.time, meal.dish, meal.details);
                });
            }

            if (macroChartInstance) macroChartInstance.destroy();
            const chartCtx = document.getElementById('macroChart');
            if (chartCtx) {
                macroChartInstance = new Chart(chartCtx.getContext('2d'), {
                    type: 'doughnut',
                    data: {
                        datasets: [{
                            data: [pred.macros.protein, pred.macros.carbs, pred.macros.fats],
                            backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
                            borderWidth: 0
                        }]
                    },
                    options: { responsive: true, cutout: '80%', plugins: { legend: { display: false } } }
                });
            }
            showToast("Pipeline targets generated successfully!");
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            submitBtn.textContent = 'Execute Pipeline';
            submitBtn.disabled = false;
        }
    });
}

window.updateDietPresentationHub = function(time, dish, details) {
    const titleNode = document.getElementById('foodGuideTitle');
    const descNode = document.getElementById('foodGuideDetails');
    const imageNode = document.getElementById('foodGuideImage');
    if (titleNode && descNode) {
        titleNode.textContent = `${time}: ${dish}`;
        descNode.textContent = details;
        if (imageNode) { imageNode.classList.remove('opacity-40'); imageNode.classList.add('opacity-80'); }
    }
};

const calorieCalculatorForm = document.getElementById('calorieCalculatorForm');
if (calorieCalculatorForm) {
    calorieCalculatorForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const calcBtn = document.getElementById("calcBtn");
        calcBtn.textContent = "Logging Item...";
        calcBtn.disabled = true;

        const foodKey = document.getElementById("foodKey").value;
        const quantityAmount = parseFloat(document.getElementById("quantityAmount").value);

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/features/calculate-food`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ foodKey, quantityAmount })
            });

            if (!response.ok) throw new Error("Food log engine connection broken.");
            const data = await response.json();

            document.getElementById("loggedFoodName").textContent = data.itemName;
            document.getElementById("loggedServingSize").textContent = data.servingLogged;
            document.getElementById("calcCal").textContent = data.computedMetrics.calories;
            document.getElementById("calcProt").textContent = data.computedMetrics.protein;
            document.getElementById("calcCarb").textContent = data.computedMetrics.carbs;
            document.getElementById("calcFat").textContent = data.computedMetrics.fats;

            const journalContainer = document.getElementById('calorieJournalContainer');
            if (journalContainer) {
                const logEntry = document.createElement('div');
                logEntry.className = "flex justify-between items-center bg-gray-950 p-3 rounded-xl border border-gray-850 text-xs mt-2";
                logEntry.innerHTML = `
                    <div class="flex items-center space-x-2">
                        <span class="text-amber-500">🔥</span>
                        <div><span class="font-bold text-white block">${data.itemName}</span><span class="text-[10px] text-gray-500 font-mono">${data.servingLogged}</span></div>
                    </div>
                    <div class="text-right">
                        <span class="font-black text-amber-400 block">${data.computedMetrics.calories} kcal</span>
                        <span class="text-[9px] text-gray-500 font-mono">P: ${data.computedMetrics.protein}g | C: ${data.computedMetrics.carbs}g</span>
                    </div>`;
                journalContainer.insertBefore(logEntry, journalContainer.firstChild);
            }
            showToast(`Registered ${data.itemName} to ledger.`);
            calorieCalculatorForm.reset();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            calcBtn.textContent = "Log to Daily Summary";
            calcBtn.disabled = false;
        }
    });
}

window.clearDailyLogJournal = function() {
    const journalContainer = document.getElementById('calorieJournalContainer');
    if (journalContainer) {
        journalContainer.innerHTML = '';
        showToast("Active intake log session cleared.");
        document.getElementById("loggedFoodName").textContent = "-";
        document.getElementById("loggedServingSize").textContent = "-";
        document.getElementById("calcCal").textContent = "0";
        document.getElementById("calcProt").textContent = "0";
        document.getElementById("calcCarb").textContent = "0";
        document.getElementById("calcFat").textContent = "0";
    }
};

function bindNavigationTab(elementId, viewId) {
    const triggerBtn = document.getElementById(elementId);
    if (!triggerBtn) return;
    triggerBtn.addEventListener('click', () => {
        document.querySelectorAll('.view-panel').forEach(p => p.classList.add('hidden'));
        const targetView = document.getElementById(viewId);
        if (targetView) targetView.classList.remove('hidden');
    });
}
bindNavigationTab('navBiometrics', 'biometricsView');
bindNavigationTab('navWorkout', 'workoutView');
bindNavigationTab('navMeals', 'mealsView');
bindNavigationTab('navNutrition', 'nutritionView');

function showToast(msg, type = 'success') {
    let container = document.getElementById('toast-container') || document.createElement('div');
    if (!container.id) { container.id = 'toast-container'; container.className = 'fixed bottom-5 right-5 space-y-3 z-50'; document.body.appendChild(container); }
    const toast = document.createElement('div');
    toast.className = `${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'} text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold`;
    toast.textContent = `${type === 'success' ? '✅' : '❌'} ${msg}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}