// Google Sheets ke Exported CSV Links
const googleSheets = {
    recipes: "",
    ingredients: "",
    units: "",
    dietPlans: ""
};

// Global Memory Base Arrays
let recipes = [];
let ingredientsList = [];

// Default Static Units List (Fixes Undefined Bug)
let unitsList = [
    { name: "Gm", hindiName: "ग्राम" },
    { name: "Kg", hindiName: "किलोग्राम" },
    { name: "Ml", hindiName: "एमएल" },
    { name: "Litre", hindiName: "लीटर" },
    { name: "Teaspoon", hindiName: "छोटी चम्मच (tsp)" },
    { name: "Tablespoon", hindiName: "बड़ी चम्मच (tbsp)" },
    { name: "Cup", hindiName: "कप" },
    { name: "Piece", hindiName: "पीस / नग" },
    { name: "Pinch", hindiName: "चुटकी" },
    { name: "Bowl", hindiName: "कटोरी" },
    { name: "Slice", hindiName: "स्लाइस" },
    { name: "To taste", hindiName: "स्वादानुसार" }
];

let dietPlans = [];

// Categories List for Filter Tabs
const categories = ["All", "Rice", "Vegetable", "Paneer", "Dal", "Breakfast", "Egg", "NonVeg", "Healthy", "Drink"];

// Categories Hindi Translation Map
const categoryHindiMap = {
    "All": "सभी",
    "Rice": "चावल",
    "Vegetable": "सब्जी",
    "Paneer": "पनीर",
    "Dal": "दाल",
    "Breakfast": "नाश्ता",
    "Egg": "अंडा",
    "NonVeg": "मांसाहारी",
    "Healthy": "स्वस्थ",
    "Drink": "पेय पदार्थ"
};

// Static Affiliate Products
const affiliateProducts = [
    { id: 1, name: "Protein Powder", hindiName: "प्रोटीन पाउडर", price: "₹999", link: "YOUR_AFFILIATE_LINK" },
    { id: 2, name: "Kitchen Knife", hindiName: "रसोई का चाकू", price: "₹499", link: "YOUR_AFFILIATE_LINK" },
    { id: 3, name: "Non Stick Pan", hindiName: "नॉन स्टिक पैन", price: "₹799", link: "YOUR_AFFILIATE_LINK" },
    { id: 4, name: "Mixer Blender", hindiName: "मिक्सर ब्लेंडर", price: "₹1499", link: "YOUR_AFFILIATE_LINK" }
];

// App General Configuration
const appConfig = {
    phoneNumber: "910000000000",
    upiId: "yourupi@upi",
    whatsappNumber: "910000000000"
};
