// DOM Element Targets
const homePage = document.getElementById("homePage");
const favPage = document.getElementById("favPage");
const dietPage = document.getElementById("dietPage");
const storePage = document.getElementById("storePage");

const homeNav = document.getElementById("homeNav");
const favNav = document.getElementById("favNav");
const dietNav = document.getElementById("dietNav");
const storeNav = document.getElementById("storeNav");

const langBtn = document.getElementById("langBtn");
const darkBtn = document.getElementById("darkBtn");

const ingredientInput = document.getElementById("ingredientInput");
const qtyInput = document.getElementById("qtyInput");
const unitSelect = document.getElementById("unitSelect");

const addBtn = document.getElementById("addBtn");
const findBtn = document.getElementById("findBtn");

const selectedList = document.getElementById("selectedList");
const recipeResults = document.getElementById("recipeResults");

// Live Vercel Proxy URL (Replace with your actual deployed Vercel URL later)
const BACKEND_URL = "/api/get-recipe";

// Application Local Reactive States
let selectedIngredients = [];
let favourites = JSON.parse(localStorage.getItem("favorites") || "[]");
let currentLanguage = localStorage.getItem("language") || "en";

// CSV Data Parser Helper Function
function parseCSV(text) {
    let lines = text.split('\n');
    let result = [];
    if(lines.length === 0 || !lines[0]) return [];
    let headers = lines[0].replace(/"/g, '').split(',').map(h => h.trim());
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        let obj = {};
        let currentline = lines[i].replace(/"/g, '').split(',');
        headers.forEach((h, index) => {
            obj[h] = currentline[index] ? currentline[index].trim() : "";
        });
        result.push(obj);
    }
    return result;
}

// 🌐 Live Google Sheets Data Fetcher Engine
async function initGoogleSheetsData() {
    try {
        recipeResults.innerHTML = currentLanguage === "hi" ? "<p class='empty'>📡 डेटा लोड हो रहा है...</p>" : "<p class='empty'>📡 Synchronization in progress...</p>";
        
        const [rText, iText, uText, dText] = await Promise.all([
            fetch(googleSheets.recipes).then(res => res.text()),
            fetch(googleSheets.ingredients).then(res => res.text()),
            fetch(googleSheets.units).then(res => res.text()),
            fetch(googleSheets.dietPlans).then(res => res.text())
        ]);

        recipes = parseCSV(rText);
        ingredientsList = parseCSV(iText);
        unitsList = parseCSV(uText);
        dietPlans = parseCSV(dText);

        recipeResults.innerHTML = "";
        updateLanguage(); // App UI populate aur bhasha set karein
    } catch (error) {
        console.error("Google Sheets synchronization failed:", error);
        recipeResults.innerHTML = currentLanguage === "hi" ? "<p class='empty'>❌ क्लाउड डेटा लोड नहीं हो सका। ऑफ़लाइन उपयोग जारी रखें।</p>" : "<p class='empty'>❌ Unable to sync live cloud database.</p>";
    }
}

// Page Screen Routing Controller
function showPage(page) {
    homePage.style.display = "none";
    favPage.style.display = "none";
    dietPage.style.display = "none";
    storePage.style.display = "none";

    homeNav.classList.remove("active");
    favNav.classList.remove("active");
    dietNav.classList.remove("active");
    storeNav.classList.remove("active");

    page.style.display = "block";
}

homeNav.onclick = function () { showPage(homePage); homeNav.classList.add("active"); };
favNav.onclick = function () { showPage(favPage); favNav.classList.add("active"); loadFavorites(); };
dietNav.onclick = function () { showPage(dietPage); dietNav.classList.add("active"); loadDietPlans(); };
storeNav.onclick = function () { showPage(storePage); storeNav.classList.add("active"); loadStore(); };

// 🛠️ Full Language Translation Engine (Hindi/English Fix)
function updateLanguage() {
    const hi = currentLanguage === "hi";

    document.getElementById("appTitle").textContent = hi ? "रेसिपी मैचर" : "Recipe Matcher";
    document.getElementById("appSub").textContent = hi ? "आसानी से रेसिपी खोजें" : "Find Recipes Instantly";
    document.getElementById("ingTitle").textContent = hi ? "सामग्री चुनें" : "Select Ingredients";
    
    langBtn.textContent = hi ? "English" : "हिन्दी";

    ingredientInput.placeholder = hi ? "चावल, प्याज, टमाटर" : "Rice, Onion, Tomato";
    qtyInput.placeholder = hi ? "मात्रा" : "Quantity";
    addBtn.textContent = hi ? "➕ सामग्री जोड़ें" : "➕ Add Ingredient";
    findBtn.textContent = hi ? "🔍 रेसिपी खोजें" : "🔍 Find Matching Recipes";

    // Section Titles Translation
    const secTitle = document.querySelector(".sectionTitle");
    if(secTitle) secTitle.textContent = hi ? "🍚 श्रेणियां" : "🍚 Categories";
    
    document.querySelector("#favPage .pageTitle").textContent = hi ? "❤️ पसंदीदा रेसिपी" : "❤️ Favorites";
    document.querySelector("#dietPage .pageTitle").textContent = hi ? "👑 प्रीमियम डाइट प्लान" : "👑 Premium Diet Plans";
    document.querySelector("#storePage .pageTitle").textContent = hi ? "🛒 अफ़िलिएट स्टोर" : "🛒 Affiliate Store";

    // Bottom Navigation Icon Texts
    document.querySelector("#homeNav span").textContent = hi ? "होम" : "Home";
    document.querySelector("#favNav span").textContent = hi ? "पसंदीदा" : "Favorites";
    document.querySelector("#dietNav span").textContent = hi ? "डाइट" : "Diets";
    document.querySelector("#storeNav span").textContent = hi ? "स्टोर" : "Store";

    localStorage.setItem("language", currentLanguage);
    
    // Dynamic Dropdown Elements Reload
    renderUnitDropdown();

    // Category Chips Text Sync
    document.querySelectorAll(".cat").forEach(btn => {
        const catName = btn.dataset.cat;
        btn.textContent = hi ? (categoryHindiMap[catName] || catName) : catName;
    });

    // Content View Context Update
    renderIngredients();
    if(recipeResults.innerHTML !== "" && !recipeResults.querySelector('.empty')) {
        findBtn.click();
    }
    loadFavorites();
    loadDietPlans();
    loadStore();
}

langBtn.onclick = function () {
    currentLanguage = currentLanguage === "en" ? "hi" : "en";
    updateLanguage();
};

function renderUnitDropdown() {
    unitSelect.innerHTML = "";
    if(unitsList.length > 0) {
        unitsList.forEach(u => {
            let uName = currentLanguage === "hi" ? u.Hindi : u.English;
            unitSelect.innerHTML += `<option value="${u.English}">${uName}</option>`;
        });
    } else {
        unitSelect.innerHTML = `<option value="Kg">Kg</option><option value="Gm">Gm</option><option value="Piece">Piece</option>`;
    }
}

// Dark/Light Theme Manager
function updateTheme() {
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark");
        darkBtn.textContent = "☀️";
    } else {
        document.body.classList.remove("dark");
        darkBtn.textContent = "🌙";
    }
}

darkBtn.onclick = function () {
    if (document.body.classList.contains("dark")) {
        document.body.classList.remove("dark");
        localStorage.setItem("theme", "light");
    } else {
        document.body.classList.add("dark");
        localStorage.setItem("theme", "dark");
    }
    updateTheme();
};

// Add Ingredient Handler
addBtn.onclick = function () {
    const name = ingredientInput.value.trim();
    const qty = qtyInput.value.trim();
    const unit = unitSelect.value;

    if (name === "") {
        alert(currentLanguage === "hi" ? "सामग्री का नाम दर्ज करें" : "Enter Ingredient");
        return;
    }

    selectedIngredients.push({ name: name, qty: qty, unit: unit });
    ingredientInput.value = "";
    qtyInput.value = "";
    renderIngredients();
};

function renderIngredients() {
    selectedList.innerHTML = "";
    selectedIngredients.forEach((item, index) => {
        selectedList.innerHTML += `
        <div class="item">
            ${item.name} (${item.qty} ${item.unit})
            <span onclick="removeIngredient(${index})">×</span>
        </div>`;
    });
    document.getElementById("count").textContent = selectedIngredients.length;
}

function removeIngredient(index) {
    selectedIngredients.splice(index, 1);
    renderIngredients();
}

// 🔍 Recipe Finder Engine (Google Sheets + Dynamic AI Vercel Proxy Routing)
findBtn.onclick = async function () {
    recipeResults.innerHTML = "";
    const names = selectedIngredients.map(item => item.name.toLowerCase());

    if (names.length === 0) {
        recipeResults.innerHTML = `<p class='empty'>${currentLanguage === "hi" ? "कृपया पहले कुछ सामग्री जोड़ें।" : "Please add some ingredients first."}</p>`;
        return;
    }

    // 2. Fallback: Sheets me na milne par automatic secure Vercel AI Proxy Engine chalaein
    recipeResults.innerHTML = currentLanguage === "hi" ? "<p class='empty'>🔮 AI आपकी सामग्री से नई रेसिपी बना रहा है...</p>" : "<p class='empty'>🔮 AI is tailoring a personalized recipe...</p>";
    
    try {
        const aiRecipe = await generateRecipeWithAI(names);
        recipeResults.innerHTML = "";
        renderRecipe(aiRecipe);
    } catch (error) {
        console.error(error);
        recipeResults.innerHTML = `<p class='empty'>${currentLanguage === "hi" ? "AI Recipe बनाने में कुछ दिक्कत आई। कृपया दोबारा प्रयास करें।" : "AI server timeout. Please try again."}</p>`;
    }
};

// Vercel Serverless Post Secure Connect
async function generateRecipeWithAI(ingredientList) {
    const ingredientsString = ingredientList.join(", ");
    
    const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            ingredients: ingredientsString,
            lang: currentLanguage 
        })
    });

    if (!response.ok) throw new Error("Vercel Gateway Error");
    return await response.json();
}

function renderRecipe(recipe) {
    const hi = currentLanguage === "hi";
    const fav = favourites.includes(recipe.id);
    const ingredients = recipe.ingredients.join(", ");
    const steps = recipe.steps.map(step => `<li>${step.trim()}</li>`).join("");

    recipeResults.innerHTML += `
    <div class="recipeCard">
        <span class="favorite" onclick="toggleFavorite('${recipe.id}')">
            ${fav ? "❤️" : "🤍"}
        </span>
        <h3>${hi ? (recipe.hindi || recipe.name) : recipe.name}</h3>
        <p><b>${hi ? "सामग्री" : "Ingredients"}:</b> ${ingredients}</p>
        <ol>${steps}</ol>
        <button onclick="shareRecipe('${recipe.name}')" style="background:var(--green); color:#fff; border:none; padding:10px 15px; border-radius:10px; margin-top:12px; cursor:pointer;">
            📤 ${hi ? "शेयर करें" : "Share"}
        </button>
    </div>`;
}

function toggleFavorite(id) {
    const index = favourites.indexOf(id);
    if (index === -1) {
        favourites.push(id);
    } else {
        favourites.splice(index, 1);
    }
    localStorage.setItem("favorites", JSON.stringify(favourites));
    
    if (favPage.style.display !== "none") loadFavorites();
    if (homePage.style.display !== "none" && recipeResults.innerHTML !== "") findBtn.click();
}

function loadFavorites() {
    const box = document.getElementById("favoriteRecipes");
    box.innerHTML = "";
    const hi = currentLanguage === "hi";

    let favList = [];
    if(recipes.length > 0) {
        let sheetFavs = recipes.filter(r => favourites.includes(r.RecipeName));
        sheetFavs.forEach(rf => {
            favList.push({ id: rf.RecipeName, name: rf.RecipeName, hindi: rf.HindiName, ingredients: rf.Ingredients.split(',') });
        });
    }

    if (favList.length === 0) {
        box.innerHTML = `<p class='empty'>${hi ? "कोई पसंदीदा रेसिपी नहीं है।" : "No favorite recipes yet."}</p>`;
        return;
    }

    favList.forEach(recipe => {
        box.innerHTML += `
        <div class="recipeCard">
            <span class="favorite" onclick="toggleFavorite('${recipe.id}')">❤️</span>
            <h3>${hi ? (recipe.hindi || recipe.name) : recipe.name}</h3>
            <p>${recipe.ingredients.join(", ")}</p>
        </div>`;
    });
}

function shareRecipe(name) {
    if (navigator.share) {
        navigator.share({ title: "Recipe Matcher", text: "Try this recipe: " + name, url: location.href });
    } else {
        navigator.clipboard.writeText(name);
        alert(currentLanguage === "hi" ? "रेसिपी नाम कॉपी हो गया है!" : "Recipe copied to clipboard.");
    }
}

// Diet Plans Render
function loadDietPlans() {
    const box = document.getElementById("dietPlans");
    box.innerHTML = "";
    const hi = currentLanguage === "hi";

    if(dietPlans.length === 0) {
        box.innerHTML = `<p class='empty'>\${hi ? "डाइट प्लान उपलब्ध नहीं हैं।" : "No premium diet plans online."}</p>`;
        return;
    }

    dietPlans.forEach(plan => {
        let name = plan['Plan Name'] || plan.PlanName || "";
        let hindiName = plan['Hindi Name'] || plan.HindiName || name;
        let price = plan.Price || "0";
        let duration = plan.Duration || "";
        let description = plan.Description || "";

        box.innerHTML += `
        <div class="dietCard">
            <h3>${hi ? hindiName : name}</h3>
            <p>${hi ? "अवधि" : "Duration"}: ${duration}<p>
            <p><b>₹${price}</b></p>
            <p>${description}</p>
            <div style="display:flex; flex-direction:column; gap:5px;">
                <button class="buyBtn" onclick="phonePePay('\${price}')">💜 PhonePe</button>
                <button class="whatsappBtn" onclick="buyWhatsapp('\${name}', '\${price}')">💬 WhatsApp</button>
                <button class="upiBtn" onclick="upiPay('\${price}', '\${name}')">💳 UPI</button>
            </div>
        </div>`;
    });
}

// Affiliate Store Render
function loadStore() {
    const box = document.getElementById("affiliateProducts");
    box.innerHTML = "";
    const hi = currentLanguage === "hi";

    affiliateProducts.forEach(item => {
        box.innerHTML += `
        <div class="affCard">
            <h3>${hi ? item.hindiName : item.name}</h3>
            <p>${item.price}<p>
            <a href="${item.link}" target="_blank">
                <button class="btn">🛒 ${hi ? "अभी खरीदें" : "Buy Now"}</button>
            </a>
        </div>`;
    });
}

// Payment Methods Redirection Automation
function phonePePay(price) {
    window.location.href = `phonepe://pay?pa=\${appConfig.upiId}&pn=Recipe%20Matcher&am=\${price}&cu=INR`;
}

function upiPay(price, planName) {
    window.location.href = `upi://pay?pa=\${appConfig.upiId}&pn=Recipe%20Matcher&am=\${price}&tn=\${encodeURIComponent(planName)}&cu=INR`;
}

function buyWhatsapp(plan, price) {
    const msg = encodeURIComponent(`Hello, I want to purchase the Diet Plan: \${plan} for ₹\${price}. Please share transaction details.`);
    window.open(`https://wa.me/\${appConfig.whatsappNumber}?text=\${msg}`, '_blank');
}

// Category Chips Filtration Event Listeners
document.querySelectorAll(".cat").forEach(btn => {
    btn.onclick = function () {
        document.querySelectorAll(".cat").forEach(c => c.classList.remove('active'));
        this.classList.add("active");

        const category = this.dataset.cat;
        recipeResults.innerHTML = "";

        let list = [];
        if(recipes.length > 0) {
            list = category === "All" ? recipes : recipes.filter(r => r.Category === category);
        }

        if (list.length === 0) {
            recipeResults.innerHTML = `<p class='empty'>${currentLanguage === "hi" ? "इस केटेगरी में कोई रेसिपी नहीं है।" : "No recipes found in this category."}</p>`;
            return;
        }

        list.forEach(recipe => {
            renderRecipe({
                id: recipe.RecipeName || Date.now(),
                name: recipe.RecipeName,
                hindi: recipe.HindiName,
                ingredients: recipe.Ingredients.split(','),
                steps: recipe.Steps.split('>')
            });
        });
    };
});

// App Lifecycle Initializer
window.onload = function () {
    updateTheme();
    showPage(homePage);
    homeNav.classList.add("active");
    initGoogleSheetsData(); // Sheets sync run karein
};

if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
        navigator.serviceWorker.register("service-worker.js");
    });
}
