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
let favourites = JSON.parse(localStorage.getItem("favorites") || "[]").map(String);
let savedFavoriteRecipes = JSON.parse(localStorage.getItem("favoriteRecipeData") || "{}");
let displayedRecipes = [];
let recipeCache = {};
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
    const setText = (selector, en, hindi) => {
        const el = document.querySelector(selector);
        if (el) el.textContent = hi ? hindi : en;
    };
    const setPlaceholder = (selector, en, hindi) => {
        const el = document.querySelector(selector);
        if (el) el.placeholder = hi ? hindi : en;
    };

    setText("#appTitle", "Recipe Matcher", "रेसिपी मैचर");
    setText("#appSub", "Find Recipes Instantly", "आसानी से रेसिपी खोजें");
    setText("#ingTitle", "Select Ingredients", "सामग्री चुनें");
    if (langBtn) langBtn.textContent = hi ? "English" : "हिन्दी";
    setPlaceholder("#ingredientInput", "Rice, Onion, Tomato", "चावल, प्याज, टमाटर");
    setPlaceholder("#qtyInput", "Quantity", "मात्रा");
    setText("#addBtn", "➕ Add Ingredient", "➕ सामग्री जोड़ें");
    setText("#findBtn", "🔍 Find Matching Recipes", "🔍 मिलती-जुलती रेसिपी खोजें");
    setText("#nutritionShortcut", "🔥 Nutrition Information", "🔥 पोषण जानकारी");
    setText("#nutritionTitle", "🔥 Nutrition Information", "🔥 पोषण जानकारी");
    setText("#nutritionIntro", "Approximate nutrition per serving. Actual values depend on portion size and cooking method.", "प्रति सर्विंग अनुमानित पोषण। वास्तविक मात्रा परोसने के आकार और पकाने के तरीके पर निर्भर करती है।");

    setText(".riseHero .heroBrand small", "Your AI Cooking Assistant", "आपका AI कुकिंग असिस्टेंट");
    setText(".riseHero h2", "Find the Perfect Recipe Instantly", "अपनी पसंद की रेसिपी तुरंत खोजें");
    setText(".riseHero > p", "Scan · Search · Cook · Enjoy", "स्कैन करें · खोजें · पकाएं · आनंद लें");
    setText("#scanCard .scanCopy b", "Scan Ingredients", "सामग्री स्कैन करें");
    setText("#scanCard .scanCopy small", "Take photo or choose from gallery", "फोटो लें या गैलरी से चुनें");

    const quick = document.querySelectorAll(".quickActions .quickAction span");
    const quickEn = ["Voice Input", "Smart Recipes", "Diet Plans", "Shop More"];
    const quickHi = ["आवाज़ से सामग्री जोड़ें", "स्मार्ट रेसिपी", "डाइट प्लान", "और खरीदें"];
    quick.forEach((el, i) => { if (quickEn[i]) el.textContent = hi ? quickHi[i] : quickEn[i]; });
    setText("#adBox h3", "📢 Sponsored", "📢 प्रायोजित");
    setText("#adBox p", "Advertisement Space", "विज्ञापन स्थान");
    setText(".sectionTitle", "🍚 Categories", "🍚 श्रेणियां");

    setText("#favPage .pageTitle", "❤️ Favorites", "❤️ पसंदीदा रेसिपी");
    setText("#dietPage .pageTitle", "👑 Premium Diet Plans", "👑 प्रीमियम डाइट प्लान");
    setText("#storePage .pageTitle", "🛒 Affiliate Store", "🛒 एफिलिएट स्टोर");
    setText("#homeNav span", "Home", "होम");
    setText("#favNav span", "Favorites", "पसंदीदा");
    setText("#dietNav span", "Diets", "डाइट");
    setText("#storeNav span", "Store", "स्टोर");
    setText("#riseLoginBtn", "Login", "लॉग इन");

    // Camera dialog labels
    setText("#cameraTitle", "Scan Ingredients", "सामग्री स्कैन करें");
    const cameraDesc = document.querySelector(".cameraTop p");
    if (cameraDesc) cameraDesc.textContent = hi ? "सामग्री को फ्रेम के अंदर रखें" : "Place your ingredients inside the frame";
    setText("#cameraGallery", "Choose from gallery", "गैलरी से चुनें");
    setText("#cameraRetake", "Retake", "दोबारा फोटो लें");
    setText("#cameraUse", "Use Photo", "फोटो इस्तेमाल करें");
    setText("#cameraHint", "Camera access is required. Allow permission when your browser asks.", "कैमरा इस्तेमाल करने के लिए अनुमति दें। ब्राउज़र पूछे तो Allow चुनें।");

    localStorage.setItem("language", currentLanguage);
    renderUnitDropdown();

    document.querySelectorAll(".cat").forEach(btn => {
        const catName = btn.dataset.cat;
        if (catName === "All") btn.textContent = hi ? "सभी" : "All";
        else btn.textContent = hi ? (categoryHindiMap[catName] || catName) : catName;
    });

    // Re-render visible app content without issuing a new AI recipe request.
    renderIngredients();
    renderDisplayedRecipes();
    loadFavorites();
    loadDietPlans();
    loadStore();
}

langBtn.onclick = function () {
    currentLanguage = currentLanguage === "en" ? "hi" : "en";
    updateLanguage();
};

function renderUnitDropdown() {
    const previous = unitSelect.value;
    unitSelect.innerHTML = "";
    if (Array.isArray(unitsList) && unitsList.length > 0) {
        unitsList.forEach(u => {
            const english = u.English || u.Unit || u.unit || "";
            const hindi = u.Hindi || english;
            if (!english) return;
            const option = document.createElement("option");
            option.value = english;
            option.textContent = currentLanguage === "hi" ? hindi : english;
            unitSelect.appendChild(option);
        });
    } else {
        unitSelect.innerHTML = `<option value="Piece">Piece</option><option value="Gm">Gm</option><option value="Kg">Kg</option><option value="ml">ml</option><option value="Liter">Liter</option>`;
    }
    if (previous && [...unitSelect.options].some(option => option.value === previous)) unitSelect.value = previous;
    if (ingredientInput.value.trim()) autoSelectUnit();
}

function suggestedUnitForIngredient(value) {
    const name = String(value || "").toLowerCase().trim();
    const pieceWords = ["onion","tomato","potato","lemon","egg","banana","apple","chilli","chili","capsicum","cucumber","carrot","प्याज","टमाटर","आलू","नींबू","अंडा","केला","मिर्च","खीरा","गाजर"];
    const liquidWords = ["milk","water","oil","juice","vinegar","दूध","पानी","तेल","जूस","सिरका"];
    if (pieceWords.some(word => name === word || name.includes(word))) return "piece";
    if (liquidWords.some(word => name === word || name.includes(word))) return "ml";
    return "gm";
}

function autoSelectUnit() {
    if (!unitSelect || !unitSelect.options.length) return;
    const suggested = suggestedUnitForIngredient(ingredientInput.value);
    const options = [...unitSelect.options];
    const match = options.find(option => {
        const value = `${option.value} ${option.textContent}`.toLowerCase();
        if (suggested === "piece") return value.includes("piece") || value.includes("pcs") || value.includes("नग");
        if (suggested === "ml") return value.includes("ml") || value.includes("liter") || value.includes("litre") || value.includes("लीटर");
        return value.includes("gm") || value.includes("gram") || value.includes("kg") || value.includes("ग्राम") || value.includes("किलो");
    });
    if (match) unitSelect.value = match.value;
}

ingredientInput.addEventListener("input", autoSelectUnit);

// Dark/Light Theme Manager (persistent, predictable)
function updateTheme() {
    const isDark = localStorage.getItem("theme") === "dark";
    document.body.classList.toggle("dark", isDark);
    if (darkBtn) {
        darkBtn.textContent = isDark ? "☀️" : "🌙";
        darkBtn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
        darkBtn.title = isDark ? "Light mode" : "Dark mode";
    }
}
darkBtn.onclick = function () {
    const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
    localStorage.setItem("theme", nextTheme);
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
    displayedRecipes = [];
    const names = selectedIngredients.map(item => item.name.toLowerCase());

    if (names.length === 0) {
        recipeResults.innerHTML = `<p class='empty'>${currentLanguage === "hi" ? "कृपया पहले कुछ सामग्री जोड़ें।" : "Please add some ingredients first."}</p>`;
        return;
    }

    // 1. Google Sheets Locally Filter Search
    let matched = [];
    if(recipes.length > 0) {
        matched = recipes.filter(recipe => {
            if(!recipe.Ingredients) return false;
            let sheetIngs = recipe.Ingredients.split(',').map(x => x.trim().toLowerCase());
            return sheetIngs.every(ing => names.includes(ing));
        });
    }

    if (matched.length > 0) {
        matched.forEach(recipe => {
            renderRecipe({
                id: recipe.RecipeName || Date.now(),
                name: recipe.RecipeName,
                hindi: recipe.HindiName,
                ingredients: recipe.Ingredients.split(','),
                steps: (recipe.Steps || "").split('>'),
                image: recipe.ImageURL || recipe.Image || recipe.image || ""
            });
        });
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

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Recipe API error (${response.status})`);
    return data;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
}

function recipeKey(recipe) {
    return String(recipe.id || recipe.name || `recipe-${Date.now()}`);
}

function rememberRecipe(recipe) {
    const key = recipeKey(recipe);
    recipe.id = key;
    recipeCache[key] = recipe;
    return key;
}

function renderRecipe(recipe, track = true) {
    const key = rememberRecipe(recipe);
    if (track && !displayedRecipes.some(item => recipeKey(item) === key)) {
        displayedRecipes.push(recipe);
    }

    const hi = currentLanguage === "hi";
    const fav = favourites.includes(key);
    const ingredients = (recipe.ingredients || []).map(escapeHTML).join(", ");
    const steps = (recipe.steps || []).map(step => `<li>${escapeHTML(String(step).trim())}</li>`).join("");
    const title = escapeHTML(hi ? (recipe.hindi || recipe.name) : recipe.name);
    const safeName = escapeHTML(recipe.name || "Recipe");

    recipeResults.insertAdjacentHTML("beforeend", `
    <div class="recipeCard" data-recipe-id="${escapeHTML(key)}">
        <button type="button" class="favorite" data-favorite-id="${escapeHTML(key)}" aria-label="${fav ? "Remove from favorites" : "Add to favorites"}">${fav ? "❤️" : "🤍"}</button>
        <div class="recipeImageWrap" data-recipe-image="${escapeHTML(key)}">
          ${recipe.image ? `<img class="recipeImage" src="${escapeHTML(recipe.image)}" alt="${title}" loading="lazy">` : `<div class="recipeImagePlaceholder" aria-label="Recipe image">🍲</div>`}
        </div>
        <h3>${title}</h3>
        <p><b>${hi ? "सामग्री" : "Ingredients"}:</b> ${ingredients}</p>
        <ol>${steps}</ol>
        <div class="recipeActions">
          <button type="button" class="nutritionBtn" data-nutrition-id="${escapeHTML(key)}">🔥 ${hi ? "पोषण जानकारी" : "Nutrition information"}</button>
          <button type="button" data-share-id="${escapeHTML(key)}">📤 ${hi ? "शेयर करें" : "Share"}</button>
        </div>
    </div>`);

    if (!recipe.image) loadFreeRecipeImage(recipe);
}

function renderDisplayedRecipes() {
    if (!displayedRecipes.length) return;
    recipeResults.innerHTML = "";
    const copy = [...displayedRecipes];
    displayedRecipes = [];
    copy.forEach(recipe => renderRecipe(recipe, true));
}

// Free best-effort food photo lookup. Results are cached locally to avoid repeated requests.
async function loadFreeRecipeImage(recipe) {
    const key = recipeKey(recipe);
    const cacheKey = `rise_recipe_image_${key}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        recipe.image = cached;
        const holder = recipeResults.querySelector(`[data-recipe-image="${CSS.escape(key)}"]`);
        if (holder) holder.innerHTML = `<img class="recipeImage" src="${escapeHTML(cached)}" alt="${escapeHTML(recipe.name)}" loading="lazy">`;
        return;
    }
    try {
        const query = String(recipe.name || "").trim();
        if (!query) return;
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
        if (!response.ok) return;
        const data = await response.json();
        const image = data.meals?.[0]?.strMealThumb;
        if (!image) return;
        recipe.image = image;
        try { localStorage.setItem(cacheKey, image); } catch (_) {}
        const holder = recipeResults.querySelector(`[data-recipe-image="${CSS.escape(key)}"]`);
        if (holder) holder.innerHTML = `<img class="recipeImage" src="${escapeHTML(image)}" alt="${escapeHTML(recipe.name)}" loading="lazy">`;
    } catch (error) {
        console.info("Free recipe photo lookup unavailable:", error?.message || error);
    }
}

function toggleFavorite(id) {
    id = String(id);
    const index = favourites.indexOf(id);
    if (index === -1) {
        favourites.push(id);
        if (recipeCache[id]) savedFavoriteRecipes[id] = recipeCache[id];
    } else {
        favourites.splice(index, 1);
        delete savedFavoriteRecipes[id];
    }
    localStorage.setItem("favorites", JSON.stringify(favourites));
    localStorage.setItem("favoriteRecipeData", JSON.stringify(savedFavoriteRecipes));

    // Update only the heart icon; never trigger a recipe search here.
    document.querySelectorAll(`[data-favorite-id="${CSS.escape(id)}"]`).forEach(button => {
        const active = favourites.includes(id);
        button.textContent = active ? "❤️" : "🤍";
        button.setAttribute("aria-label", active ? "Remove from favorites" : "Add to favorites");
    });
    if (favPage.style.display !== "none") loadFavorites();
}

function loadFavorites() {
    const box = document.getElementById("favoriteRecipes");
    box.innerHTML = "";
    const hi = currentLanguage === "hi";
    const favList = [];
    const seen = new Set();

    // Generated recipes saved on this device.
    favourites.forEach(id => {
        const recipe = savedFavoriteRecipes[id] || recipeCache[id];
        if (recipe && !seen.has(String(id))) {
            favList.push(recipe);
            seen.add(String(id));
        }
    });

    // Recipes from the Google Sheets catalogue.
    if (Array.isArray(recipes)) {
        recipes.forEach(row => {
            const id = String(row.RecipeName || "");
            if (favourites.includes(id) && !seen.has(id)) {
                favList.push({
                    id,
                    name: row.RecipeName,
                    hindi: row.HindiName,
                    ingredients: (row.Ingredients || "").split(","),
                    steps: (row.Steps || "").split(">"),
                    image: row.ImageURL || row.Image || ""
                });
                seen.add(id);
            }
        });
    }

    if (!favList.length) {
        box.innerHTML = `<p class='empty'>${hi ? "कोई पसंदीदा रेसिपी नहीं है।" : "No favorite recipes yet."}</p>`;
        return;
    }

    favList.forEach(recipe => {
        const id = rememberRecipe(recipe);
        const title = escapeHTML(hi ? (recipe.hindi || recipe.name) : recipe.name);
        const image = recipe.image
            ? `<img class="recipeImage" src="${escapeHTML(recipe.image)}" alt="${title}" loading="lazy">`
            : `<div class="recipeImagePlaceholder">🍲</div>`;
        box.insertAdjacentHTML("beforeend", `
          <div class="recipeCard">
            <button type="button" class="favorite" data-favorite-id="${escapeHTML(id)}" aria-label="Remove from favorites">❤️</button>
            <div class="recipeImageWrap">${image}</div>
            <h3>${title}</h3>
            <p>${(recipe.ingredients || []).map(escapeHTML).join(", ")}</p>
            <ol>${(recipe.steps || []).map(step => `<li>${escapeHTML(step)}</li>`).join("")}</ol>
            <button type="button" class="nutritionBtn" data-nutrition-id="${escapeHTML(id)}">🔥 ${hi ? "पोषण जानकारी" : "Nutrition information"}</button>
            <div class="nutritionInline" data-nutrition-output="${escapeHTML(id)}" hidden aria-live="polite"></div>
          </div>`);
        if (!recipe.image) loadFreeRecipeImage(recipe);
    });
}

async function showNutrition(recipe, targetOutput = null) {
    const panel = targetOutput ? null : document.getElementById("nutritionPanel");
    const output = targetOutput || document.getElementById("nutritionResults");
    const hi = currentLanguage === "hi";

    if (panel) {
        panel.hidden = false;
        panel.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (targetOutput) {
        targetOutput.hidden = false;
    }

    output.innerHTML = `<p>${hi ? "पोषण की गणना हो रही है..." : "Calculating nutrition..."}</p>`;
    const payload = recipe
        ? { query: recipe.name || "Recipe", ingredients: (recipe.ingredients || []).join(", "), servings: 1, lang: currentLanguage }
        : { query: "", ingredients: selectedIngredients.map(item => item.name).join(", "), servings: 1, lang: currentLanguage };

    if (!payload.query && !payload.ingredients) {
        output.innerHTML = `<p>${hi ? "पहले सामग्री जोड़ें या रेसिपी चुनें।" : "Add ingredients or select a recipe first."}</p>`;
        return;
    }

    try {
        const response = await fetch("/api/nutrition", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `Nutrition API error (${response.status})`);
        const per = data.perServing || {};
        output.innerHTML = `
          <p><b>${escapeHTML(data.food || recipe?.name || (hi ? "आपकी सामग्री" : "Your ingredients"))}</b> · ${hi ? "प्रति सर्विंग" : "per serving"}</p>
          <div class="nutritionGrid">
            <span>🔥 ${hi ? "कैलोरी" : "Calories"}<br><b>${Number(per.calories || 0)} kcal</b></span>
            <span>💪 ${hi ? "प्रोटीन" : "Protein"}<br><b>${Number(per.protein_g || 0)} g</b></span>
            <span>🌾 ${hi ? "कार्ब्स" : "Carbs"}<br><b>${Number(per.carbs_g || 0)} g</b></span>
            <span>🥑 ${hi ? "फैट" : "Fat"}<br><b>${Number(per.fat_g || 0)} g</b></span>
          </div>
          <small>${escapeHTML(data.note || (hi ? "ये अनुमानित मान हैं।" : "These are estimated values."))}</small>`;
    } catch (error) {
        console.error("Nutrition request failed:", error);
        output.innerHTML = `<p>${escapeHTML(error.message || (hi ? "पोषण जानकारी उपलब्ध नहीं है।" : "Nutrition information is unavailable."))}</p>`;
    }
}
// Event delegation keeps recipe actions working after cards are re-rendered.
recipeResults.addEventListener("click", event => {
    const favoriteButton = event.target.closest("[data-favorite-id]");
    const nutritionButton = event.target.closest("[data-nutrition-id]");
    const shareButton = event.target.closest("[data-share-id]");
    if (favoriteButton) toggleFavorite(favoriteButton.dataset.favoriteId);
    if (nutritionButton) showNutrition(recipeCache[nutritionButton.dataset.nutritionId]);
    if (shareButton) shareRecipe(recipeCache[shareButton.dataset.shareId]?.name || "Recipe");
});
document.getElementById("favoriteRecipes").addEventListener("click", event => {
    const favoriteButton = event.target.closest("[data-favorite-id]");
    const nutritionButton = event.target.closest("[data-nutrition-id]");
    if (favoriteButton) toggleFavorite(favoriteButton.dataset.favoriteId);
    if (nutritionButton) {
        const card = nutritionButton.closest(".recipeCard");
        const output = card?.querySelector("[data-nutrition-output]");
        showNutrition(recipeCache[nutritionButton.dataset.nutritionId], output || null);
    }
});

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
    window.location.href = `phonepe://pay?pa=${appConfig.upiId}&pn=Recipe%20Matcher&am=${price}&cu=INR`;
}

function upiPay(price, planName) {
    window.location.href = `upi://pay?pa=${appConfig.upiId}&pn=Recipe%20Matcher&am=${price}&tn=${encodeURIComponent(planName)}&cu=INR`;
}

function buyWhatsapp(plan, price) {
    const msg = encodeURIComponent(`Hello, I want to purchase the Diet Plan: ${plan} for ₹${price}. Please share transaction details.`);
    window.open(`https://wa.me/${appConfig.whatsappNumber}?text=${msg}`, '_blank');
}

// Category Chips Filtration Event Listeners
document.querySelectorAll(".cat").forEach(btn => {
    btn.onclick = function () {
        document.querySelectorAll(".cat").forEach(c => c.classList.remove('active'));
        this.classList.add("active");

        const category = this.dataset.cat;
        recipeResults.innerHTML = "";
        displayedRecipes = [];

        let list = [];
        if(recipes.length > 0) {
            list = category === "All" ? recipes : recipes.filter(r => (r.Category || "").trim().toLowerCase() === category.toLowerCase());
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
                steps: (recipe.Steps || "").split('>'),
                image: recipe.ImageURL || recipe.Image || ""
            });
        });
    };
});


// Quick action cards: connect them to real app destinations/actions
document.querySelectorAll(".quickAction").forEach((action, index) => {
    action.setAttribute("role", "button");
    action.setAttribute("tabindex", "0");
    const run = () => {
        if (index === 0) startVoiceInput();
        if (index === 1) { ingredientInput.focus(); document.querySelector(".card")?.scrollIntoView({behavior:"smooth"}); }
        if (index === 2) { showPage(dietPage); dietNav.classList.add("active"); loadDietPlans(); }
        if (index === 3) { showPage(storePage); storeNav.classList.add("active"); loadStore(); }
    };
    action.addEventListener("click", run);
    action.addEventListener("keydown", e => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); run(); } });
});

// Voice ingredient input (Chrome Android / Web Speech API).
let activeVoiceRecognition = null;

function setVoiceStatus(message, isError = false) {
    const status = document.getElementById("voiceStatus");
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("error", isError);
    status.hidden = !message;
}

function startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!window.isSecureContext) {
        setVoiceStatus(currentLanguage === "hi" ? "Voice Input के लिए HTTPS वेबसाइट खोलें।" : "Voice Input requires the secure HTTPS website.", true);
        return;
    }
    if (!SpeechRecognition) {
        setVoiceStatus(currentLanguage === "hi"
            ? "इस ब्राउज़र में Voice Recognition उपलब्ध नहीं है। Chrome में खोलें या keyboard का mic इस्तेमाल करें।"
            : "Voice recognition is unavailable in this browser. Open in Chrome or use your keyboard microphone.", true);
        ingredientInput.focus();
        return;
    }
    try {
        if (activeVoiceRecognition) {
            activeVoiceRecognition.abort();
            activeVoiceRecognition = null;
        }
        const recognition = new SpeechRecognition();
        activeVoiceRecognition = recognition;
        recognition.lang = currentLanguage === "hi" ? "hi-IN" : "en-IN";
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onstart = () => setVoiceStatus(currentLanguage === "hi" ? "🎙️ सुन रहा हूँ... अब सामग्री बोलें।" : "🎙️ Listening... Say your ingredients now.");
        recognition.onresult = event => {
            const transcript = event.results?.[0]?.[0]?.transcript?.trim();
            if (!transcript) {
                setVoiceStatus(currentLanguage === "hi" ? "आवाज़ समझ नहीं आई। फिर कोशिश करें।" : "No speech was detected. Please try again.", true);
                return;
            }
            ingredientInput.value = transcript;
            autoSelectUnit();
            ingredientInput.focus();
            setVoiceStatus((currentLanguage === "hi" ? "पहचाना गया: " : "Recognized: ") + transcript);
        };
        recognition.onerror = event => {
            const messages = {
                "not-allowed": currentLanguage === "hi" ? "Microphone permission बंद है। Chrome Settings में Microphone allow करें।" : "Microphone permission is blocked. Allow it in Chrome site settings.",
                "service-not-allowed": currentLanguage === "hi" ? "Voice service उपलब्ध नहीं है।" : "The browser speech service is unavailable.",
                "network": currentLanguage === "hi" ? "Voice recognition के लिए internet connection चाहिए।" : "Voice recognition needs an internet connection.",
                "no-speech": currentLanguage === "hi" ? "कोई आवाज़ नहीं मिली। दोबारा बोलें।" : "No speech detected. Please try again."
            };
            setVoiceStatus(messages[event.error] || ((currentLanguage === "hi" ? "Voice error: " : "Voice error: ") + event.error), true);
        };
        recognition.onend = () => {
            if (activeVoiceRecognition === recognition) activeVoiceRecognition = null;
        };
        recognition.start();
    } catch (error) {
        activeVoiceRecognition = null;
        setVoiceStatus((currentLanguage === "hi" ? "Voice शुरू नहीं हुआ: " : "Could not start voice input: ") + (error.message || "Please try again."), true);
    }
}
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


// RISE AI Ingredient Scanner: sends the captured photo to the existing Vercel API.
window.riseScanIngredients = async function (imageBlob) {
    const scanCard = document.getElementById("scanCard");
    let status = document.getElementById("scanStatus");
    if (!status) {
        status = document.createElement("small");
        status.id = "scanStatus";
        status.className = "scanStatus";
        scanCard.appendChild(status);
    }

    const hi = currentLanguage === "hi";
    status.textContent = hi ? "🔎 AI सामग्री पहचान रहा है..." : "🔎 AI is identifying ingredients...";
    status.style.display = "block";

    try {
        if (!(imageBlob instanceof Blob) || !imageBlob.type.startsWith("image/")) {
            throw new Error(hi ? "कृपया सही फोटो चुनें।" : "Please choose a valid image.");
        }

        // Compress large camera/gallery photos before sending (Vercel API body limit: 5 MB).
        const bitmap = await createImageBitmap(imageBlob);
        const maxSide = 1280;
        const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close?.();

        const compressedBlob = await new Promise(resolve =>
            canvas.toBlob(resolve, "image/jpeg", 0.76)
        );
        if (!compressedBlob) throw new Error("Could not process the photo.");

        const imageData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error("Could not read the photo."));
            reader.readAsDataURL(compressedBlob);
        });

        const response = await fetch("/api/scan-ingredients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: imageData, lang: currentLanguage })
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.error || `Scanner API error (${response.status})`);
        }

        const names = Array.isArray(result.ingredients)
            ? result.ingredients.map(name => String(name).trim()).filter(Boolean)
            : [];

        if (!names.length) {
            throw new Error(hi
                ? "कोई स्पष्ट सामग्री नहीं मिली। साफ फोटो लेकर दोबारा कोशिश करें।"
                : "No clear ingredients found. Try another well-lit photo.");
        }

        // Editable review panel: users can correct the AI list before adding it.
        let panel = document.getElementById("scanReviewPanel");
        if (!panel) {
            panel = document.createElement("div");
            panel.id = "scanReviewPanel";
            panel.className = "scanReviewPanel";
            scanCard.insertAdjacentElement("afterend", panel);
        }

        panel.innerHTML = `
            <h3>${hi ? "पहचानी गई सामग्री जाँचें" : "Review detected ingredients"}</h3>
            <p>${hi ? "नाम बदल सकते हैं या हटाकर फिर जोड़ सकते हैं।" : "Edit the names or remove anything that is incorrect."}</p>
            <textarea id="scanReviewInput" rows="3" aria-label="${hi ? "सामग्री के नाम" : "Ingredient names"}"></textarea>
            <div class="scanReviewActions">
                <button type="button" id="scanAddDetected">${hi ? "सूची में जोड़ें" : "Add to ingredient list"}</button>
                <button type="button" id="scanCancelDetected">${hi ? "रद्द करें" : "Cancel"}</button>
            </div>
        `;
        const reviewInput = document.getElementById("scanReviewInput");
        reviewInput.value = names.join(", ");

        document.getElementById("scanAddDetected").onclick = () => {
            const editedNames = reviewInput.value
                .split(",")
                .map(name => name.trim())
                .filter(Boolean);

            if (!editedNames.length) {
                alert(hi ? "कम से कम एक सामग्री का नाम रखें।" : "Keep at least one ingredient name.");
                return;
            }

            const defaultUnit = unitSelect.value || "Piece";
            let added = 0;
            editedNames.forEach(name => {
                const exists = selectedIngredients.some(item =>
                    item.name.toLowerCase() === name.toLowerCase()
                );
                if (!exists) {
                    selectedIngredients.push({ name, qty: "", unit: defaultUnit });
                    added++;
                }
            });
            renderIngredients();
            panel.remove();
            status.textContent = hi
                ? `${added} सामग्री सूची में जोड़ दी गई।`
                : `${added} ingredient${added === 1 ? "" : "s"} added to your list.`;
            document.getElementById("selectedList").scrollIntoView({ behavior: "smooth", block: "center" });
        };

        document.getElementById("scanCancelDetected").onclick = () => {
            panel.remove();
            status.textContent = hi ? "स्कैन रद्द किया गया।" : "Scan review cancelled.";
        };

        status.textContent = hi
            ? `${names.length} सामग्री पहचानी गई। नीचे जाँचें।`
            : `${names.length} ingredient${names.length === 1 ? "" : "s"} detected. Review below.`;
        panel.scrollIntoView({ behavior: "smooth", block: "center" });
        return names;
    } catch (error) {
        console.error("RISE ingredient scan failed:", error);
        status.textContent = (hi ? "स्कैन नहीं हो सका: " : "Scan failed: ") + error.message;
        return [];
    }
};

