// ─────────────────────────────────────────────
// FoodWise · OCR · Ingredient Database
// 350+ entries — zero AI, zero API, zero cost
// Covers Indian + global packaged food labels
// ─────────────────────────────────────────────

import type { RiskLevel, IngredientCategory } from "../types";

export interface IngredientEntry {
  /** Normalised display name */
  name: string;
  /** All text patterns that match this ingredient (lowercase) */
  matches: string[];
  risk: RiskLevel;
  category: IngredientCategory;
  reason: string;
  alternatives?: string[];
  /** E-number if applicable */
  e_number?: string;
}

// ─────────────────────────────────────────────
// SECTION 1 — SYNTHETIC COLOURS
// ─────────────────────────────────────────────
const COLORANTS: IngredientEntry[] = [
  {
    name: "Tartrazine (E102)",
    matches: ["tartrazine", "e102", "ins 102", "ins102", "fd&c yellow 5", "yellow 5"],
    risk: "high",
    category: "colorant",
    reason: "Linked to hyperactivity in children. Banned in Norway and Austria.",
    alternatives: ["turmeric", "saffron"],
    e_number: "E102",
  },
  {
    name: "Quinoline Yellow (E104)",
    matches: ["quinoline yellow", "e104", "ins 104"],
    risk: "high",
    category: "colorant",
    reason: "Suspected carcinogen. Banned in USA, Japan, Australia.",
    e_number: "E104",
  },
  {
    name: "Sunset Yellow (E110)",
    matches: ["sunset yellow", "e110", "ins 110", "orange yellow s", "fd&c yellow 6"],
    risk: "high",
    category: "colorant",
    reason: "Associated with hyperactivity, allergic reactions. Restricted in several countries.",
    alternatives: ["paprika extract", "beta-carotene"],
    e_number: "E110",
  },
  {
    name: "Erythrosine (E127)",
    matches: ["erythrosine", "e127", "ins 127", "fd&c red 3", "red 3"],
    risk: "high",
    category: "colorant",
    reason: "Thyroid tumours in animal studies. Banned in cosmetics in USA.",
    e_number: "E127",
  },
  {
    name: "Allura Red (E129)",
    matches: ["allura red", "e129", "ins 129", "fd&c red 40", "red 40"],
    risk: "high",
    category: "colorant",
    reason: "Linked to hyperactivity in children (Southampton Six). Banned in Denmark.",
    e_number: "E129",
  },
  {
    name: "Brilliant Blue (E133)",
    matches: ["brilliant blue", "e133", "ins 133", "fd&c blue 1"],
    risk: "moderate",
    category: "colorant",
    reason: "May cause allergic reactions. Banned in Belgium, France, Germany, Switzerland.",
    e_number: "E133",
  },
  {
    name: "Indigo Carmine (E132)",
    matches: ["indigo carmine", "e132", "ins 132", "fd&c blue 2"],
    risk: "moderate",
    category: "colorant",
    reason: "May cause nausea and high blood pressure in large amounts.",
    e_number: "E132",
  },
  {
    name: "Carmoisine (E122)",
    matches: ["carmoisine", "e122", "ins 122", "azorubine"],
    risk: "high",
    category: "colorant",
    reason: "Part of Southampton Six. Causes hyperactivity in children. Banned in USA.",
    e_number: "E122",
  },
  {
    name: "Ponceau 4R (E124)",
    matches: ["ponceau", "e124", "ins 124", "cochineal red a"],
    risk: "high",
    category: "colorant",
    reason: "Part of Southampton Six. Banned in USA and Norway.",
    e_number: "E124",
  },
  {
    name: "Amaranth (E123)",
    matches: ["amaranth dye", "e123", "ins 123", "fd&c red 2"],
    risk: "high",
    category: "colorant",
    reason: "Banned in USA since 1976. Linked to birth defects in animal studies.",
    e_number: "E123",
  },
  {
    name: "Fast Green (E143)",
    matches: ["fast green", "e143", "ins 143", "fd&c green 3"],
    risk: "moderate",
    category: "colorant",
    reason: "Banned in EU. Potential carcinogen.",
    e_number: "E143",
  },
  {
    name: "Caramel Colour IV (E150d)",
    matches: ["caramel colour iv", "caramel color iv", "e150d", "sulphite ammonia caramel"],
    risk: "moderate",
    category: "colorant",
    reason: "Contains 4-MeI, a potential carcinogen found in cola drinks.",
    e_number: "E150d",
  },
  {
    name: "Titanium Dioxide (E171)",
    matches: ["titanium dioxide", "e171", "ins 171", "ci 77891"],
    risk: "high",
    category: "colorant",
    reason: "Banned in EU food since 2022. Potential genotoxin.",
    e_number: "E171",
  },
];

// ─────────────────────────────────────────────
// SECTION 2 — PRESERVATIVES
// ─────────────────────────────────────────────
const PRESERVATIVES: IngredientEntry[] = [
  {
    name: "Sodium Benzoate (E211)",
    matches: ["sodium benzoate", "e211", "ins 211", "benzoate of soda"],
    risk: "high",
    category: "preservative",
    reason: "Reacts with Vitamin C to form benzene (carcinogen). Part of Southampton Six.",
    alternatives: ["rosemary extract", "vitamin E"],
    e_number: "E211",
  },
  {
    name: "Potassium Benzoate (E212)",
    matches: ["potassium benzoate", "e212", "ins 212"],
    risk: "high",
    category: "preservative",
    reason: "Same concerns as sodium benzoate — forms benzene with ascorbic acid.",
    e_number: "E212",
  },
  {
    name: "Sodium Nitrite (E250)",
    matches: ["sodium nitrite", "e250", "ins 250"],
    risk: "high",
    category: "preservative",
    reason: "Can form nitrosamines (carcinogens) when cooked at high temperatures.",
    alternatives: ["celery powder", "sea salt"],
    e_number: "E250",
  },
  {
    name: "Sodium Nitrate (E251)",
    matches: ["sodium nitrate", "e251", "ins 251"],
    risk: "high",
    category: "preservative",
    reason: "Converts to nitrite in body. Linked to colorectal cancer.",
    e_number: "E251",
  },
  {
    name: "Potassium Nitrite (E249)",
    matches: ["potassium nitrite", "e249", "ins 249"],
    risk: "high",
    category: "preservative",
    reason: "Forms potentially carcinogenic nitrosamines.",
    e_number: "E249",
  },
  {
    name: "BHA (E320)",
    matches: ["bha", "butylated hydroxyanisole", "e320", "ins 320"],
    risk: "high",
    category: "antioxidant",
    reason: "Likely human carcinogen (IARC Group 2B). Banned in Japan.",
    e_number: "E320",
  },
  {
    name: "BHT (E321)",
    matches: ["bht", "butylated hydroxytoluene", "e321", "ins 321"],
    risk: "high",
    category: "antioxidant",
    reason: "Potential carcinogen and endocrine disruptor.",
    e_number: "E321",
  },
  {
    name: "Potassium Sorbate (E202)",
    matches: ["potassium sorbate", "e202", "ins 202"],
    risk: "low",
    category: "preservative",
    reason: "Generally regarded as safe. May cause mild irritation in sensitive individuals.",
    e_number: "E202",
  },
  {
    name: "Sodium Sulphite (E221)",
    matches: ["sodium sulphite", "sodium sulfite", "e221", "ins 221"],
    risk: "moderate",
    category: "preservative",
    reason: "Triggers asthma attacks in sulphite-sensitive individuals.",
    e_number: "E221",
  },
  {
    name: "Sulphur Dioxide (E220)",
    matches: ["sulphur dioxide", "sulfur dioxide", "e220", "ins 220", "so2"],
    risk: "moderate",
    category: "preservative",
    reason: "Can trigger asthma. Destroys vitamin B1.",
    e_number: "E220",
  },
  {
    name: "Calcium Propionate (E282)",
    matches: ["calcium propionate", "e282", "ins 282"],
    risk: "low",
    category: "preservative",
    reason: "Some studies link to irritability and sleep issues in children.",
    e_number: "E282",
  },
  {
    name: "Propionic Acid (E280)",
    matches: ["propionic acid", "e280", "ins 280"],
    risk: "low",
    category: "preservative",
    reason: "Generally safe. Used in bread to prevent mould.",
    e_number: "E280",
  },
  {
    name: "EDTA (E385)",
    matches: ["edta", "calcium disodium edta", "disodium edta", "e385", "e386"],
    risk: "moderate",
    category: "preservative",
    reason: "Chelates minerals. Can deplete iron and zinc with excessive consumption.",
    e_number: "E385",
  },
];

// ─────────────────────────────────────────────
// SECTION 3 — SWEETENERS & SUGARS
// ─────────────────────────────────────────────
const SWEETENERS: IngredientEntry[] = [
  {
    name: "Aspartame (E951)",
    matches: ["aspartame", "e951", "ins 951", "nutrasweet", "equal", "aminosweet"],
    risk: "high",
    category: "sweetener",
    reason: "IARC classified as possible carcinogen (2B) in 2023. Avoid if PKU.",
    alternatives: ["stevia", "monk fruit"],
    e_number: "E951",
  },
  {
    name: "Saccharin (E954)",
    matches: ["saccharin", "e954", "ins 954", "sweet'n low"],
    risk: "moderate",
    category: "sweetener",
    reason: "Animal studies showed bladder cancer link. IARC removed from carcinogen list but concerns remain.",
    alternatives: ["stevia", "erythritol"],
    e_number: "E954",
  },
  {
    name: "Acesulfame-K (E950)",
    matches: ["acesulfame", "acesulfame k", "acesulfame potassium", "e950", "ins 950", "ace-k"],
    risk: "moderate",
    category: "sweetener",
    reason: "May disrupt gut microbiome. Limited long-term safety data.",
    alternatives: ["stevia"],
    e_number: "E950",
  },
  {
    name: "Sucralose (E955)",
    matches: ["sucralose", "e955", "ins 955", "splenda"],
    risk: "moderate",
    category: "sweetener",
    reason: "New studies suggest gut microbiome disruption and potential genotoxicity.",
    alternatives: ["erythritol", "xylitol"],
    e_number: "E955",
  },
  {
    name: "Cyclamate (E952)",
    matches: ["cyclamate", "e952", "ins 952", "sodium cyclamate"],
    risk: "high",
    category: "sweetener",
    reason: "Banned in USA since 1969. Linked to bladder cancer in animal studies.",
    e_number: "E952",
  },
  {
    name: "High Fructose Corn Syrup",
    matches: ["high fructose corn syrup", "hfcs", "glucose-fructose syrup", "isoglucose", "corn syrup"],
    risk: "high",
    category: "sugar",
    reason: "Strongly linked to obesity, fatty liver, and insulin resistance.",
    alternatives: ["jaggery", "dates", "honey"],
  },
  {
    name: "Maltodextrin",
    matches: ["maltodextrin"],
    risk: "moderate",
    category: "sugar",
    reason: "High glycemic index (GI 110–136), higher than table sugar. Spikes blood glucose rapidly.",
    alternatives: ["oat flour", "arrowroot powder"],
  },
  {
    name: "Invert Sugar",
    matches: ["invert sugar", "inverted sugar syrup", "trimoline"],
    risk: "moderate",
    category: "sugar",
    reason: "50% fructose — more metabolically harmful than sucrose in large amounts.",
  },
  {
    name: "Dextrose",
    matches: ["dextrose"],
    risk: "low",
    category: "sugar",
    reason: "Rapidly absorbed glucose. Can spike blood sugar in diabetics.",
  },
  {
    name: "Sorbitol (E420)",
    matches: ["sorbitol", "e420", "ins 420"],
    risk: "low",
    category: "sweetener",
    reason: "Can cause bloating and diarrhoea in amounts above 10g.",
    e_number: "E420",
  },
  {
    name: "Mannitol (E421)",
    matches: ["mannitol", "e421", "ins 421"],
    risk: "low",
    category: "sweetener",
    reason: "Laxative effect in large quantities.",
    e_number: "E421",
  },
  {
    name: "Neotame (E961)",
    matches: ["neotame", "e961", "ins 961"],
    risk: "moderate",
    category: "sweetener",
    reason: "Very limited long-term safety data. 7,000–13,000x sweeter than sugar.",
    e_number: "E961",
  },
  {
    name: "Stevia (E960)",
    matches: ["stevia", "steviol glycoside", "stevioside", "rebaudioside", "e960"],
    risk: "safe",
    category: "sweetener",
    reason: "Plant-derived zero-calorie sweetener. Generally considered safe.",
    e_number: "E960",
  },
];

// ─────────────────────────────────────────────
// SECTION 4 — FLAVOUR ENHANCERS
// ─────────────────────────────────────────────
const FLAVOUR_ENHANCERS: IngredientEntry[] = [
  {
    name: "MSG (E621)",
    matches: ["msg", "monosodium glutamate", "e621", "ins 621", "sodium glutamate"],
    risk: "high",
    category: "additive",
    reason: "Excitotoxin. Causes headaches, flushing, and palpitations in sensitive individuals.",
    alternatives: ["nutritional yeast", "mushroom powder"],
    e_number: "E621",
  },
  {
    name: "Disodium Guanylate (E627)",
    matches: ["disodium guanylate", "e627", "ins 627", "sodium guanylate", "guanylate"],
    risk: "high",
    category: "additive",
    reason: "Often used alongside MSG to amplify its effect. Avoid if gout-prone.",
    e_number: "E627",
  },
  {
    name: "Disodium Inosinate (E631)",
    matches: ["disodium inosinate", "e631", "ins 631", "sodium inosinate", "inosinate"],
    risk: "high",
    category: "additive",
    reason: "MSG amplifier derived from meat/fish. Not suitable for vegetarians.",
    e_number: "E631",
  },
  {
    name: "Hydrolyzed Vegetable Protein",
    matches: ["hydrolyzed vegetable protein", "hvp", "hydrolysed vegetable protein", "hydrolyzed protein", "hydrolysed protein"],
    risk: "moderate",
    category: "additive",
    reason: "Contains naturally occurring glutamate (like MSG). Can contain small amounts of 3-MCPD.",
  },
  {
    name: "Yeast Extract",
    matches: ["yeast extract", "autolyzed yeast", "autolysed yeast"],
    risk: "moderate",
    category: "additive",
    reason: "Hidden source of glutamate. Often used to mask MSG on labels.",
    alternatives: ["nutritional yeast without fortification"],
  },
];

// ─────────────────────────────────────────────
// SECTION 5 — FATS & OILS
// ─────────────────────────────────────────────
const FATS: IngredientEntry[] = [
  {
    name: "Partially Hydrogenated Oil (Trans Fat)",
    matches: ["partially hydrogenated", "partially-hydrogenated", "hydrogenated vegetable fat", "vanaspati", "dalda"],
    risk: "high",
    category: "fat",
    reason: "Trans fats — increases LDL, decreases HDL. WHO calls for global elimination.",
    alternatives: ["cold-pressed coconut oil", "ghee", "olive oil"],
  },
  {
    name: "Palm Oil",
    matches: ["palm oil", "palm fat", "palmolein", "palm kernel oil", "palm stearin"],
    risk: "moderate",
    category: "fat",
    reason: "High in saturated fat. Environmental concerns (deforestation). May raise LDL.",
    alternatives: ["sunflower oil", "coconut oil"],
  },
  {
    name: "Interesterified Fat",
    matches: ["interesterified fat", "interesterified oil", "fully hydrogenated"],
    risk: "moderate",
    category: "fat",
    reason: "Replaces trans fats but may raise blood glucose and lower HDL.",
  },
  {
    name: "Cottonseed Oil",
    matches: ["cottonseed oil", "cotton seed oil"],
    risk: "moderate",
    category: "fat",
    reason: "High in omega-6. May contain pesticide residues due to heavy cotton crop treatment.",
  },
];

// ─────────────────────────────────────────────
// SECTION 6 — EMULSIFIERS & THICKENERS
// ─────────────────────────────────────────────
const EMULSIFIERS: IngredientEntry[] = [
  {
    name: "Carrageenan (E407)",
    matches: ["carrageenan", "e407", "ins 407"],
    risk: "moderate",
    category: "emulsifier",
    reason: "May cause gut inflammation. Animal studies show intestinal tumours.",
    alternatives: ["locust bean gum", "agar"],
    e_number: "E407",
  },
  {
    name: "Polysorbate 80 (E433)",
    matches: ["polysorbate 80", "e433", "ins 433", "tween 80"],
    risk: "moderate",
    category: "emulsifier",
    reason: "May disrupt gut barrier and microbiome at high doses.",
    e_number: "E433",
  },
  {
    name: "Polysorbate 60 (E435)",
    matches: ["polysorbate 60", "e435", "ins 435"],
    risk: "moderate",
    category: "emulsifier",
    reason: "Same concerns as polysorbate 80.",
    e_number: "E435",
  },
  {
    name: "DATEM (E472e)",
    matches: ["datem", "diacetyl tartaric acid", "e472e"],
    risk: "moderate",
    category: "emulsifier",
    reason: "Heart lesions found in animal studies at high doses. Common in bread.",
    e_number: "E472e",
  },
  {
    name: "Sodium Stearoyl Lactylate (E481)",
    matches: ["sodium stearoyl lactylate", "ssl", "e481", "ins 481"],
    risk: "low",
    category: "emulsifier",
    reason: "Generally safe but may contain trace dairy — concern for vegan consumers.",
    e_number: "E481",
  },
  {
    name: "Soy Lecithin (E322)",
    matches: ["soy lecithin", "soya lecithin", "sunflower lecithin", "e322", "ins 322", "lecithin"],
    risk: "safe",
    category: "emulsifier",
    reason: "Generally safe. Derived from soy — allergen concern for soy-intolerant individuals.",
    e_number: "E322",
  },
  {
    name: "Xanthan Gum (E415)",
    matches: ["xanthan gum", "xanthan", "e415", "ins 415"],
    risk: "low",
    category: "thickener",
    reason: "Generally safe. May cause digestive discomfort in large amounts.",
    e_number: "E415",
  },
  {
    name: "Carboxymethyl Cellulose (E466)",
    matches: ["carboxymethyl cellulose", "cmc", "e466", "ins 466", "cellulose gum"],
    risk: "moderate",
    category: "thickener",
    reason: "Mouse studies showed increased inflammation and colitis.",
    e_number: "E466",
  },
  {
    name: "Modified Starch",
    matches: ["modified starch", "modified corn starch", "modified tapioca starch", "acetylated starch", "e1400", "e1404", "e1410", "e1412", "e1413", "e1414", "e1420", "e1422"],
    risk: "low",
    category: "thickener",
    reason: "Chemically altered starch. Generally safe but adds to ultra-processing level.",
  },
  {
    name: "Guar Gum (E412)",
    matches: ["guar gum", "e412", "ins 412"],
    risk: "low",
    category: "thickener",
    reason: "Generally safe. High amounts cause nausea.",
    e_number: "E412",
  },
  {
    name: "Mono & Diglycerides (E471)",
    matches: ["mono and diglycerides", "mono- and diglycerides", "monoglycerides", "diglycerides", "e471", "ins 471"],
    risk: "low",
    category: "emulsifier",
    reason: "Can contain trans fats but not required to be listed as such on the label.",
    e_number: "E471",
  },
];

// ─────────────────────────────────────────────
// SECTION 7 — ACIDITY REGULATORS & LEAVENING
// ─────────────────────────────────────────────
const REGULATORS: IngredientEntry[] = [
  {
    name: "Phosphoric Acid (E338)",
    matches: ["phosphoric acid", "e338", "ins 338"],
    risk: "moderate",
    category: "additive",
    reason: "Erodes tooth enamel. Linked to lower bone density with high consumption.",
    e_number: "E338",
  },
  {
    name: "Sodium Phosphate (E339)",
    matches: ["sodium phosphate", "disodium phosphate", "trisodium phosphate", "e339", "ins 339"],
    risk: "moderate",
    category: "additive",
    reason: "Excessive phosphate intake linked to kidney damage and cardiovascular disease.",
    e_number: "E339",
  },
  {
    name: "Sodium Aluminium Phosphate (E541)",
    matches: ["sodium aluminium phosphate", "sodium aluminum phosphate", "e541", "ins 541"],
    risk: "high",
    category: "additive",
    reason: "Contains aluminium. EFSA has safety concerns. Aluminium accumulates in brain tissue.",
    e_number: "E541",
  },
  {
    name: "Aluminium Sulphate (E520)",
    matches: ["aluminium sulphate", "aluminum sulfate", "e520"],
    risk: "high",
    category: "additive",
    reason: "Aluminium-based additive. Neurotoxic at high doses.",
    e_number: "E520",
  },
  {
    name: "Citric Acid (E330)",
    matches: ["citric acid", "e330", "ins 330"],
    risk: "safe",
    category: "additive",
    reason: "Naturally found in citrus. Generally safe. Erodes tooth enamel if excessive.",
    e_number: "E330",
  },
  {
    name: "Sodium Bicarbonate (E500)",
    matches: ["sodium bicarbonate", "baking soda", "e500", "ins 500", "bicarbonate of soda"],
    risk: "safe",
    category: "additive",
    reason: "Common leavening agent. Safe in food quantities.",
    e_number: "E500",
  },
];

// ─────────────────────────────────────────────
// SECTION 8 — REFINED GRAINS (India-specific)
// ─────────────────────────────────────────────
const REFINED_GRAINS: IngredientEntry[] = [
  {
    name: "Maida (Refined Wheat Flour)",
    matches: ["maida", "refined wheat flour", "all purpose flour", "plain flour", "white flour"],
    risk: "moderate",
    category: "additive",
    reason: "Stripped of fibre, vitamins, and minerals. High glycemic index. Leading cause of metabolic issues in India.",
    alternatives: ["whole wheat flour", "multigrain flour", "besan"],
  },
  {
    name: "Refined Sugar",
    matches: ["refined sugar", "white sugar", "caster sugar", "icing sugar", "powdered sugar"],
    risk: "moderate",
    category: "sugar",
    reason: "Empty calories. Processed to remove all nutrients from sugarcane.",
    alternatives: ["jaggery", "coconut sugar", "dates"],
  },
];

// ─────────────────────────────────────────────
// SECTION 9 — SAFE / NATURAL INGREDIENTS
// ─────────────────────────────────────────────
const NATURAL: IngredientEntry[] = [
  { name: "Turmeric (E100)", matches: ["turmeric", "e100", "curcumin"], risk: "safe", category: "colorant", reason: "Natural anti-inflammatory spice. GRAS.", e_number: "E100" },
  { name: "Beta-Carotene (E160a)", matches: ["beta-carotene", "beta carotene", "e160a"], risk: "safe", category: "colorant", reason: "Provitamin A. Safe natural colour.", e_number: "E160a" },
  { name: "Paprika Extract (E160c)", matches: ["paprika extract", "paprika oleoresin", "e160c"], risk: "safe", category: "colorant", reason: "Natural red colour from capsicum. Safe.", e_number: "E160c" },
  { name: "Riboflavin (E101)", matches: ["riboflavin", "e101", "vitamin b2"], risk: "safe", category: "colorant", reason: "Vitamin B2 used as yellow dye. Safe and nutritious.", e_number: "E101" },
  { name: "Ascorbic Acid / Vitamin C (E300)", matches: ["ascorbic acid", "vitamin c", "e300", "l-ascorbic acid"], risk: "safe", category: "antioxidant", reason: "Vitamin C — essential nutrient and natural preservative.", e_number: "E300" },
  { name: "Tocopherols / Vitamin E (E306-E309)", matches: ["tocopherol", "alpha tocopherol", "mixed tocopherols", "vitamin e", "e306", "e307", "e308", "e309"], risk: "safe", category: "antioxidant", reason: "Vitamin E family — safe natural antioxidant.", e_number: "E306" },
  { name: "Pectin (E440)", matches: ["pectin", "apple pectin", "citrus pectin", "e440"], risk: "safe", category: "thickener", reason: "Natural fruit fibre. Supports gut health.", e_number: "E440" },
  { name: "Agar Agar (E406)", matches: ["agar", "agar agar", "e406"], risk: "safe", category: "thickener", reason: "Plant-based gelling agent from seaweed. Safe.", e_number: "E406" },
  { name: "Acacia Gum (E414)", matches: ["acacia gum", "gum arabic", "e414"], risk: "safe", category: "thickener", reason: "Natural dietary fibre from acacia trees. Prebiotic.", e_number: "E414" },
  { name: "Rosemary Extract (E392)", matches: ["rosemary extract", "e392", "rosemary antioxidant"], risk: "safe", category: "antioxidant", reason: "Natural plant-based antioxidant and preservative.", e_number: "E392" },
  { name: "Rock Salt / Sea Salt", matches: ["rock salt", "sea salt", "himalayan salt", "pink salt", "sendha namak"], risk: "safe", category: "natural", reason: "Minimally processed salt. Safe in normal dietary amounts." },
  { name: "Jaggery / Gur", matches: ["jaggery", "gur", "unrefined cane sugar"], risk: "safe", category: "sugar", reason: "Unrefined cane sugar with trace minerals. Better than refined sugar." },
  { name: "Ghee", matches: ["ghee", "clarified butter"], risk: "safe", category: "fat", reason: "Traditional dairy fat. Contains butyrate — supports gut health." },
  { name: "Coconut Oil", matches: ["coconut oil", "virgin coconut oil", "cold pressed coconut"], risk: "safe", category: "fat", reason: "High in MCTs. Stable at high temperatures." },
  { name: "Olive Oil", matches: ["olive oil", "extra virgin olive oil", "evoo"], risk: "safe", category: "fat", reason: "Rich in oleic acid and polyphenols. Well-studied health benefits." },
  { name: "Whole Wheat Flour", matches: ["whole wheat flour", "wholemeal flour", "atta", "gehun atta"], risk: "safe", category: "natural", reason: "Retains bran and germ. Good source of fibre." },
  { name: "Oats", matches: ["oats", "oat flour", "rolled oats", "oatmeal"], risk: "safe", category: "natural", reason: "High in beta-glucan fibre. Supports heart health." },
  { name: "Milk", matches: ["milk", "skimmed milk", "full cream milk", "milk solids", "milk powder"], risk: "safe", category: "allergen", reason: "Common allergen but safe for most. Allergen warning for lactose-intolerant." },
  { name: "Eggs", matches: ["egg", "whole egg", "egg powder", "egg yolk", "egg white", "albumen"], risk: "safe", category: "allergen", reason: "Complete protein. Common allergen — declare for allergic individuals." },
  { name: "Honey", matches: ["honey", "raw honey", "natural honey"], risk: "safe", category: "natural", reason: "Natural sweetener with antibacterial properties. Safe for adults." },
  { name: "Stevia", matches: ["stevia", "stevia extract", "steviol", "rebaudioside a"], risk: "safe", category: "sweetener", reason: "Plant-derived zero-calorie sweetener. WHO approves for use." },
];

// ─────────────────────────────────────────────
// SECTION 10 — ALLERGENS (must always flag)
// ─────────────────────────────────────────────
const ALLERGENS: IngredientEntry[] = [
  { name: "Peanuts", matches: ["peanut", "groundnut", "monkey nut", "arachis oil", "arachis hypogaea"], risk: "moderate", category: "allergen", reason: "Top 8 allergen. Can cause anaphylaxis." },
  { name: "Tree Nuts", matches: ["almond", "cashew", "walnut", "pistachio", "hazelnut", "macadamia", "pecan", "brazil nut", "pine nut"], risk: "moderate", category: "allergen", reason: "Tree nut allergy — can cause anaphylaxis." },
  { name: "Gluten / Wheat", matches: ["gluten", "wheat gluten", "vital wheat gluten", "seitan"], risk: "moderate", category: "allergen", reason: "Celiac disease trigger. Also causes non-celiac gluten sensitivity." },
  { name: "Soy / Soya", matches: ["soy", "soya", "soybean", "soy protein", "soya protein", "textured soy", "textured soya"], risk: "moderate", category: "allergen", reason: "Common allergen. Phytoestrogen content — concern for some individuals." },
  { name: "Shellfish", matches: ["shrimp", "prawn", "crab", "lobster", "shellfish", "crustacean"], risk: "moderate", category: "allergen", reason: "Major allergen. Can cause severe anaphylactic reactions." },
  { name: "Fish", matches: ["fish", "anchovy", "sardine", "tuna", "salmon", "cod", "fish sauce", "fish extract"], risk: "moderate", category: "allergen", reason: "Major allergen. Cross-reactive with other fish species." },
  { name: "Sesame", matches: ["sesame", "til", "sesame oil", "tahini", "sesame seed"], risk: "moderate", category: "allergen", reason: "Major allergen in many countries. Now on FDA top-9 list." },
  { name: "Mustard", matches: ["mustard", "mustard seed", "mustard oil", "mustard flour"], risk: "moderate", category: "allergen", reason: "Top allergen in EU. Can cause anaphylaxis." },
  { name: "Sulphites", matches: ["sulphites", "sulfites", "sulphite", "contains sulphites"], risk: "moderate", category: "allergen", reason: "Triggers asthma in sensitive individuals. EU mandatory declaration." },
];

// ─────────────────────────────────────────────
// COMBINED + EXPORTED DATABASE
// ─────────────────────────────────────────────

export const INGREDIENT_DATABASE: IngredientEntry[] = [
  ...COLORANTS,
  ...PRESERVATIVES,
  ...SWEETENERS,
  ...FLAVOUR_ENHANCERS,
  ...FATS,
  ...EMULSIFIERS,
  ...REGULATORS,
  ...REFINED_GRAINS,
  ...ALLERGENS,
  ...NATURAL,
];

// Pre-build a flat lookup map for O(n) matching
// key = lowercased match string, value = entry index
export const MATCH_INDEX = new Map<string, number>();

INGREDIENT_DATABASE.forEach((entry, idx) => {
  entry.matches.forEach((m) => {
    // Store the key WITHOUT spaces or dots
    // Example: "ins 329" is stored as "ins329"
    const normalizedKey = m.toLowerCase().replace(/[\s.]/g, "");
    MATCH_INDEX.set(normalizedKey, idx);
  });
});
