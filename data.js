// Google Sheets ke Exported CSV Links (Aapke project brief ke mutabik)
const googleSheets = {
    recipes: "https://docs.google.com/spreadsheets/d/1etNiYXBtS859Ajt5b5aZbOSryl9z7E26JM4HWPkYANA/export?format=csv",
    ingredients: "https://docs.google.com/spreadsheets/d/11ZM4FX-Z5-cM3bbmVN1pu9LF87IM0U5HzJ0kUqyBA2I/export?format=csv",
    units: "https://docs.google.com/spreadsheets/d/1BTSbd8MgN3St_sOJ0DYYIMxZHJiiEzngUD3B9rVXeXE/export?format=csv",
    dietPlans: "https://docs.google.com/spreadsheets/d/1HMEgxv8QV__f6xBwWI4iizMCJuREv09Xiey79_DrIjY/export?format=csv"
};

// Global Memory Base Arrays (Isme Sheets ka data live load hoga)
let recipes = [];
let ingredientsList = [];
let unitsList = [];
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

// Static Affiliate Products (Hindi support ke sath)
const affiliateProducts = [
    { id: 1, name: "Protein Powder", hindiName: "प्रोटीन पाउडर", price: "₹999", link: "YOUR_AFFILIATE_LINK" },
    { id: 2, name: "Kitchen Knife", hindiName: "रसोई का चाकू", price: "₹499", link: "YOUR_AFFILIATE_LINK" },
    { id: 3, name: "Non Stick Pan", hindiName: "नॉन स्टिक पैन", price: "₹799", link: "YOUR_AFFILIATE_LINK" },
    { id: 4, name: "Mixer Blender", hindiName: "मिक्सर ब्लेंडर", price: "₹1499", link: "YOUR_AFFILIATE_LINK" }
];

// App General Configuration
const appConfig = {
    phoneNumber: "YOUR_PHONE_NUMBER", // Replace with your real number
    upiId: "YOUR_UPI_ID",             // Replace with your UPI ID
    whatsappNumber: "YOUR_PHONE_NUMBER"
};
