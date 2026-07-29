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

// Live Vercel Proxy URL
const BACKEND_URL = "/api/get-recipe";

// Application Local Reactive States
let selectedIngredients = [];
let favourites = JSON.parse(localStorage.getItem("favorites_data") || "[]");
let currentLanguage = localStorage.getItem("language") || "en";

// CSV Data Parser Helper Function
function parseCSV(text) {
    if (!text || text.includes("<!DOCTYPE html>")) return [];
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
        if (!googleSheets.recipes && !googleSheets.units) {
            updateLanguage();
            return;
        }

        recipeResults.innerHTML = currentLanguage === "hi" ? "<p class='empty'>📡 डेटा लोड हो रहा है...</p>" : "<p class='empty'>📡 Synchronization in progress...</p>";
        
        if (googleSheets.recipes) {
            const rText = await fetch(googleSheets.recipes).then(res => res.text());
            recipes = parseCSV(rText);
        }
        if (googleSheets.units) {
            const uText = await fetch(googleSheets.units).then(res => res.text());
            let parsedUnits = parseCSV(uText);
            if(parsedUnits.length > 0) unitsList = parsedUnits;
        }

        recipeResults.innerHTML = "";
        updateLanguage();
    } catch (error) {
        console.error("Google Sheets synchronization failed:", error);
        recipeResults.innerHTML = "";
        updateLanguage();
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
// 🛠️ Full Language Translation Engine
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

    const secTitle = document.querySelector(".sectionTitle");
    if(secTitle) secTitle.textContent = hi ? "🍚 श्रेणियां" : "🍚 Categories";
    
    document.querySelector("#favPage .pageTitle").textContent = hi ? "❤️ पसंदीदा रेसिपी" : "❤️ Favorites";
    document.querySelector("#dietPage .pageTitle").textContent = hi ? "👑 प्रीमियम डाइट प्लान" : "👑 Premium Diet Plans";
    document.querySelector("#storePage .pageTitle").textContent = hi ? "🛒 अफ़िलिएट स्टोर" : "🛒 Affiliate Store";

    document.querySelector("#homeNav span").textContent = hi ? "होम" : "Home";
    document.querySelector("#favNav span").textContent = hi ? "पसंदीदा" : "Favorites";
    document.querySelector("#dietNav span").textContent = hi ? "डाइट" : "Diets";
    document.querySelector("#storeNav span").textContent = hi ? "स्टोर" : "Store";

    localStorage.setItem("language", currentLanguage);
    renderUnitDropdown();

    document.querySelectorAll(".cat").forEach(btn => {
        const catName = btn.dataset.cat;
        btn.textContent = hi ? (categoryHindiMap[catName] || catName) : catName;
    });

    renderIngredients();
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
    unitsList.forEach(u => {
        let uName = currentLanguage === "hi" ? (u.hindiName || u.name) : (u.name || u.hindiName);
        let uVal = u.name || uName;
        unitSelect.innerHTML += `<option value="${uVal}">${uName}</option>`;
    });
}

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
findBtn.onclick = async function () {
    recipeResults.innerHTML = "";
    const names = selectedIngredients.map(item => item.name);

    if (names.length === 0) {
        recipeResults.innerHTML = `<p class='empty'>${currentLanguage === "hi" ? "कृपया पहले कुछ सामग्री जोड़ें।" : "Please add some ingredients first."}</p>`;
        return;
    }

    recipeResults.innerHTML = currentLanguage === "hi" ? "<p class='empty'>🔮 AI आपकी सामग्री से नई रेसिपी बना रहा है...</p>" : "<p class='empty'>🔮 AI is tailoring a personalized recipe...</p>";
    
    try {
        const aiRecipeData = await generateRecipeWithAI(names);
        recipeResults.innerHTML = "";
        
        const formattedRecipe = {
            id: "ai_" + Date.now(),
            name: names.join(" & ") + " Special Recipe",
            hindi: names.join(" और ") + " स्पेशल रेसिपी",
            ingredients: names,
            content: aiRecipeData.recipe
        };
        
        renderRecipe(formattedRecipe);
    } catch (error) {
        console.error(error);
        recipeResults.innerHTML = `<p class='empty'>${currentLanguage === "hi" ? "AI Recipe बनाने में कुछ दिक्कत आई। कृपया दोबारा प्रयास करें।" : "AI server timeout. Please try again."}</p>`;
    }
};

async function generateRecipeWithAI(ingredientList) {
    const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            ingredients: ingredientList,
            language: currentLanguage 
        })
    });

    if (!response.ok) throw new Error("Vercel Gateway Error");
    return await response.json();
}

function renderRecipe(recipe) {
    const hi = currentLanguage === "hi";
    const isFav = favourites.some(f => f.id === recipe.id || f.name === recipe.name);

    let htmlContent = recipe.content ? `<div style="white-space: pre-wrap; margin:10px 0;">${recipe.content}</div>` : '';

    recipeResults.innerHTML = `
    <div class="recipeCard">
        <span class="favorite" onclick='toggleFavorite(${JSON.stringify(recipe).replace(/'/g, "&apos;")})'>
            ${isFav ? "❤️" : "🤍"}
        </span>
        <h3>${hi ? (recipe.hindi || recipe.name) : recipe.name}</h3>
        <p><b>${hi ? "सामग्री" : "Ingredients"}:</b> ${recipe.ingredients ? recipe.ingredients.join(", ") : ""}</p>
        ${htmlContent}
        <button onclick="shareRecipe('${recipe.name}')" style="background:var(--green); color:#fff; border:none; padding:10px 15px; border-radius:10px; margin-top:12px; cursor:pointer;">
            📤 ${hi ? "शेयर करें" : "Share"}
        </button>
    </div>`;
}

function toggleFavorite(recipeObj) {
    const index = favourites.findIndex(f => f.id === recipeObj.id || f.name === recipeObj.name);
    if (index === -1) {
        favourites.push(recipeObj);
    } else {
        favourites.splice(index, 1);
    }
    localStorage.setItem("favorites_data", JSON.stringify(favourites));
    
    if (favPage.style.display !== "none") loadFavorites();
    if (homePage.style.display !== "none" && recipeResults.innerHTML !== "") renderRecipe(recipeObj);
}

function loadFavorites() {
    const box = document.getElementById("favoriteRecipes");
    box.innerHTML = "";
    const hi = currentLanguage === "hi";

    if (favourites.length === 0) {
        box.innerHTML = `<p class='empty'>${hi ? "कोई पसंदीदा रेसिपी नहीं है।" : "No favorite recipes yet."}</p>`;
        return;
    }

    favourites.forEach(recipe => {
        let htmlContent = recipe.content ? `<div style="white-space: pre-wrap; margin:10px 0; font-size:14px; color:var(--text);">${recipe.content}</div>` : '';
        
        box.innerHTML += `
        <div class="recipeCard" style="margin-bottom:15px;">
            <span class="favorite" onclick='toggleFavorite(${JSON.stringify(recipe).replace(/'/g, "&apos;")})'>❤️</span>
            <h3>${hi ? (recipe.hindi || recipe.name) : recipe.name}</h3>
            <p><b>${hi ? "सामग्री" : "Ingredients"}:</b> ${recipe.ingredients ? recipe.ingredients.join(", ") : ""}</p>
            ${htmlContent}
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
function loadDietPlans() {
    const box = document.getElementById("dietPlans");
    box.innerHTML = "";
    const hi = currentLanguage === "hi";

    if(dietPlans.length === 0) {
        box.innerHTML = `<p class='empty'>${hi ? "डाइट प्लान उपलब्ध नहीं हैं।" : "No premium diet plans online."}</p>`;
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
                <button class="buyBtn" onclick="phonePePay('${price}')">💜 PhonePe</button>
                <button class="whatsappBtn" onclick="buyWhatsapp('${name}', '${price}')">💬 WhatsApp</button>
                <button class="upiBtn" onclick="upiPay('${price}', '${name}')">💳 UPI</button>
            </div>
        </div>`;
    });
}

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

function phonePePay(price) {
    window.location.href = `phonepe://pay?pa=${appConfig.upiId}&pn=Recipe%20Matcher&am=${price}&cu=INR`;
}

function upiPay(price, planName) {
    window.location.href = `upi://pay?pa=${appConfig.upiId}&pn=Recipe%20Matcher&am=${price}&tn=${encodeURIComponent(planName)}&cu=INR`;
}

function buyWhatsapp(plan, price) {
    const msg = encodeURIComponent(`Hello, I want to purchase the Diet Plan: ${plan} for ₹${price}. Please share transaction details.`);
    window.open(`https://wa.me/${appConfig.whatsappNumber}?text=${msg}`, '_blank');
}

window.onload = function () {
    updateTheme();
    showPage(homePage);
    homeNav.classList.add("active");
    initGoogleSheetsData();
};

if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
        navigator.serviceWorker.register("service-worker.js");
    });
}
