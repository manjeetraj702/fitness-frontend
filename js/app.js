const API_BASE_URL = "https://fitness-backend-b8r0.onrender.com";
let macroChartInstance = null;

// ============================================================
// 1. SESSION ACCESS GATEKEEPER PROTECTION
// ============================================================
const token = localStorage.getItem('jwtToken');
if (!token) { 
    window.location.href = 'index.html'; 
}

try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    document.getElementById('userDisplay').textContent = payload.sub;
} catch(e) { 
    localStorage.clear();
    window.location.href = 'index.html'; 
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear(); 
    window.location.href = 'index.html';
});

// ============================================================
// 2. CALORIE COUNTER
// ============================================================
const calorieCalculatorForm = document.getElementById('calorieCalculatorForm');

if (calorieCalculatorForm) {
    calorieCalculatorForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const calcBtn = document.getElementById("calcBtn");
        calcBtn.textContent = "Logging Item...";
        calcBtn.disabled = true;

        const foodPayload = {
            foodKey: document.getElementById("foodKey").value,
            quantityAmount: parseFloat(document.getElementById("quantityAmount").value)
        };

        try {
            const response = await fetch(
                "https://fitness-backend-b8r0.onrender.com/api/v1/features/calculate-food",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": token ? `Bearer ${token}` : ""
                    },
                    body: JSON.stringify(foodPayload)
                }
            );

            if (!response.ok) {
                throw new Error("Calorie service connection dropped.");
            }

            const data = await response.json();

            document.getElementById("loggedFoodName").textContent = data.itemName;
            document.getElementById("loggedServingSize").textContent = data.servingLogged;

            document.getElementById("calcCal").textContent = data.computedMetrics.calories;
            document.getElementById("calcProt").textContent = data.computedMetrics.protein;
            document.getElementById("calcCarb").textContent = data.computedMetrics.carbs;
            document.getElementById("calcFat").textContent = data.computedMetrics.fats;

        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            calcBtn.textContent = "Log to Daily Summary";
            calcBtn.disabled = false;
        }
    });
}

// ============================================================
// 3. TOAST ENGINE
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

    toast.className = `
        ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}
        text-white px-5 py-3 rounded-xl shadow-2xl
    `;

    toast.innerHTML = `
        <span class="text-sm font-semibold">
            ${type === 'success' ? '✅' : '❌'} ${message}
        </span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}

// ============================================================
// 4. NAVIGATION
// ============================================================
function bindNavigationTab(elementId, viewId) {

    document.getElementById(elementId).addEventListener('click', (e) => {

        document.querySelectorAll('.view-panel').forEach(panel => {
            panel.classList.add('hidden');
        });

        document.getElementById(viewId).classList.remove('hidden');
    });
}

bindNavigationTab('navBiometrics', 'biometricsView');
bindNavigationTab('navWorkout', 'workoutView');
bindNavigationTab('navNutrition', 'nutritionView');

// ============================================================
// 5. FITNESS PREDICTION
// ============================================================
document.getElementById('metricsForm').addEventListener('submit', async (e) => {

    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;

    const payload = {
        age: parseInt(document.getElementById('age').value),
        weightKg: parseFloat(document.getElementById('weight').value),
        heightCm: parseFloat(document.getElementById('height').value),
        optimizationGoal: document.getElementById('goal').value
    };

    try {

        const response = await fetch(
            "https://fitness-backend-b8r0.onrender.com/api/v1/analytics/predict",
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            }
        );

        if (!response.ok) {
            throw new Error("Server connection failed.");
        }

        const data = await response.json();
        const pred = data.analyticalPredictions;

        document.getElementById('placeholderState').classList.add('hidden');
        document.getElementById('resultsDashboard').classList.remove('hidden');

        document.getElementById('caloricOutput').innerHTML =
            `${pred.dailyCalories} kcal/day`;

        document.getElementById('algoOutput').textContent =
            pred.algorithmUsed;

        document.getElementById('pOutput').textContent =
            `${pred.macros.protein}g`;

        document.getElementById('cOutput').textContent =
            `${pred.macros.carbs}g`;

        document.getElementById('fOutput').textContent =
            `${pred.macros.fats}g`;

        // Chart
        if (macroChartInstance) {
            macroChartInstance.destroy();
        }

        macroChartInstance = new Chart(
            document.getElementById('macroChart').getContext('2d'),
            {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [
                            pred.macros.protein,
                            pred.macros.carbs,
                            pred.macros.fats
                        ],
                        backgroundColor: [
                            '#ef4444',
                            '#f59e0b',
                            '#3b82f6'
                        ]
                    }]
                }
            }
        );

        showToast("Prediction generated successfully!");

    } catch (err) {

        showToast("Backend connection failed.", "error");

    } finally {

        submitBtn.textContent = 'Execute Pipeline';
        submitBtn.disabled = false;
    }
});