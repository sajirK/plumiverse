// Contenu des cours de langue : mots et phrases dans les 4 langues.
// Chaque mot : [forme affichée avec article | forme à écrire]. Ex. "die Katze|Katze".
// Règles : articles et genres exacts, anglais britannique, espagnol d'Espagne (voix es-ES).
// Toute modification doit garder tests/course.test.ts au vert (aucun doublon, 4 langues partout).
import { L, type Lang, type Tr } from "../../core/types";

export interface Word {
  id: string;
  unit: string;
  /** Image : un emoji, ou une couleur (#rrggbb) pour l'unité des couleurs. */
  e: string;
  color?: string;
  /** Forme affichée (avec article) et forme à écrire (sans article), par langue. */
  t: Record<Lang, { show: string; write: string }>;
}

export interface Sentence { id: string; unit: string; e: string; t: Record<Lang, string> }

export interface Unit { id: string; n: number; icon: string; cefr: "pre-A1" | "A1.1"; title: Tr }

export const UNITS: Unit[] = [
  { id: "couleurs", n: 1, icon: "🎨", cefr: "pre-A1", title: L("Les couleurs", "Colours", "Die Farben", "Los colores") },
  { id: "nombres", n: 2, icon: "🔢", cefr: "pre-A1", title: L("Les nombres", "Numbers", "Die Zahlen", "Los números") },
  { id: "animaux", n: 3, icon: "🐾", cefr: "pre-A1", title: L("Les animaux", "Animals", "Die Tiere", "Los animales") },
  { id: "famille", n: 4, icon: "👨‍👩‍👧", cefr: "pre-A1", title: L("La famille", "Family", "Die Familie", "La familia") },
  { id: "bonjour", n: 5, icon: "👋", cefr: "pre-A1", title: L("Bonjour !", "Hello!", "Hallo!", "¡Hola!") },
  { id: "nourriture", n: 6, icon: "🍎", cefr: "pre-A1", title: L("À table", "Food", "Essen", "La comida") },
  { id: "corps", n: 7, icon: "🖐️", cefr: "A1.1", title: L("Le corps", "The body", "Der Körper", "El cuerpo") },
  { id: "vetements", n: 8, icon: "👕", cefr: "A1.1", title: L("Les vêtements", "Clothes", "Die Kleidung", "La ropa") },
  { id: "maison", n: 9, icon: "🏠", cefr: "A1.1", title: L("La maison", "At home", "Zu Hause", "La casa") },
  { id: "nature", n: 10, icon: "🌳", cefr: "A1.1", title: L("La nature", "Nature", "Die Natur", "La naturaleza") },
  { id: "transports", n: 11, icon: "🚲", cefr: "A1.1", title: L("Bouger et jouer", "Getting around", "Unterwegs", "Moverse y jugar") },
  { id: "actions", n: 12, icon: "🏃", cefr: "A1.1", title: L("Les actions", "Actions", "Was ich tue", "Las acciones") },
];

// W(id, image, fr, en, de, es) — chaque langue "affiché|à écrire" (sans "|" = identique)
function W(unit: string, id: string, e: string, fr: string, en: string, de: string, es: string, color?: string): Word {
  const f = (s: string) => { const [show, write] = s.split("|"); return { show, write: write ?? show }; };
  return { id: `${unit}.${id}`, unit, e, color, t: { fr: f(fr), en: f(en), de: f(de), es: f(es) } };
}

export const WORDS: Word[] = [
  // 1. Couleurs (adjectifs : pas d'article)
  W("couleurs", "rouge", "🔴", "rouge", "red", "rot", "rojo", "#e63946"),
  W("couleurs", "bleu", "🔵", "bleu", "blue", "blau", "azul", "#1d70f5"),
  W("couleurs", "jaune", "🟡", "jaune", "yellow", "gelb", "amarillo", "#ffd60a"),
  W("couleurs", "vert", "🟢", "vert", "green", "grün", "verde", "#2dc653"),
  W("couleurs", "orange", "🟠", "orange", "orange", "orange", "naranja", "#ff8c1a"),
  W("couleurs", "violet", "🟣", "violet", "purple", "lila", "morado", "#8338ec"),
  W("couleurs", "rose", "🌸", "rose", "pink", "rosa", "rosa", "#ff70a6"),
  W("couleurs", "noir", "⚫", "noir", "black", "schwarz", "negro", "#222222"),
  W("couleurs", "blanc", "⚪", "blanc", "white", "weiß", "blanco", "#ffffff"),
  W("couleurs", "marron", "🟤", "marron", "brown", "braun", "marrón", "#8d5524"),
  // 2. Nombres
  W("nombres", "1", "1️⃣", "un", "one", "eins", "uno"),
  W("nombres", "2", "2️⃣", "deux", "two", "zwei", "dos"),
  W("nombres", "3", "3️⃣", "trois", "three", "drei", "tres"),
  W("nombres", "4", "4️⃣", "quatre", "four", "vier", "cuatro"),
  W("nombres", "5", "5️⃣", "cinq", "five", "fünf", "cinco"),
  W("nombres", "6", "6️⃣", "six", "six", "sechs", "seis"),
  W("nombres", "7", "7️⃣", "sept", "seven", "sieben", "siete"),
  W("nombres", "8", "8️⃣", "huit", "eight", "acht", "ocho"),
  W("nombres", "9", "9️⃣", "neuf", "nine", "neun", "nueve"),
  W("nombres", "10", "🔟", "dix", "ten", "zehn", "diez"),
  // 3. Animaux
  W("animaux", "chat", "🐱", "le chat|chat", "the cat|cat", "die Katze|Katze", "el gato|gato"),
  W("animaux", "chien", "🐶", "le chien|chien", "the dog|dog", "der Hund|Hund", "el perro|perro"),
  W("animaux", "oiseau", "🐦", "l'oiseau|oiseau", "the bird|bird", "der Vogel|Vogel", "el pájaro|pájaro"),
  W("animaux", "poisson", "🐟", "le poisson|poisson", "the fish|fish", "der Fisch|Fisch", "el pez|pez"),
  W("animaux", "cheval", "🐴", "le cheval|cheval", "the horse|horse", "das Pferd|Pferd", "el caballo|caballo"),
  W("animaux", "vache", "🐮", "la vache|vache", "the cow|cow", "die Kuh|Kuh", "la vaca|vaca"),
  W("animaux", "cochon", "🐷", "le cochon|cochon", "the pig|pig", "das Schwein|Schwein", "el cerdo|cerdo"),
  W("animaux", "lapin", "🐰", "le lapin|lapin", "the rabbit|rabbit", "das Kaninchen|Kaninchen", "el conejo|conejo"),
  W("animaux", "souris", "🐭", "la souris|souris", "the mouse|mouse", "die Maus|Maus", "el ratón|ratón"),
  W("animaux", "lion", "🦁", "le lion|lion", "the lion|lion", "der Löwe|Löwe", "el león|león"),
  W("animaux", "elephant", "🐘", "l'éléphant|éléphant", "the elephant|elephant", "der Elefant|Elefant", "el elefante|elefante"),
  W("animaux", "canard", "🦆", "le canard|canard", "the duck|duck", "die Ente|Ente", "el pato|pato"),
  // 4. Famille
  W("famille", "maman", "👩", "la maman|maman", "mum", "die Mama|Mama", "la mamá|mamá"),
  W("famille", "papa", "👨", "le papa|papa", "dad", "der Papa|Papa", "el papá|papá"),
  W("famille", "bebe", "👶", "le bébé|bébé", "the baby|baby", "das Baby|Baby", "el bebé|bebé"),
  W("famille", "soeur", "👧", "la sœur|sœur", "the sister|sister", "die Schwester|Schwester", "la hermana|hermana"),
  W("famille", "frere", "👦", "le frère|frère", "the brother|brother", "der Bruder|Bruder", "el hermano|hermano"),
  W("famille", "grand-mere", "👵", "la grand-mère|grand-mère", "grandma", "die Oma|Oma", "la abuela|abuela"),
  W("famille", "grand-pere", "👴", "le grand-père|grand-père", "grandpa", "der Opa|Opa", "el abuelo|abuelo"),
  W("famille", "ami", "🤝", "l'ami|ami", "the friend|friend", "der Freund|Freund", "el amigo|amigo"),
  // 5. Bonjour (expressions)
  W("bonjour", "bonjour", "👋", "bonjour", "hello", "hallo", "hola"),
  W("bonjour", "au-revoir", "🚶", "au revoir", "goodbye", "tschüss", "adiós"),
  W("bonjour", "merci", "🙏", "merci", "thank you", "danke", "gracias"),
  W("bonjour", "stp", "🥺", "s'il te plaît", "please", "bitte", "por favor"),
  W("bonjour", "oui", "✅", "oui", "yes", "ja", "sí"),
  W("bonjour", "non", "❌", "non", "no", "nein", "no"),
  W("bonjour", "bonne-nuit", "😴", "bonne nuit", "good night", "gute Nacht", "buenas noches"),
  W("bonjour", "pardon", "🙇", "pardon", "sorry", "Entschuldigung", "perdón"),
  // 6. Nourriture
  W("nourriture", "pomme", "🍎", "la pomme|pomme", "the apple|apple", "der Apfel|Apfel", "la manzana|manzana"),
  W("nourriture", "banane", "🍌", "la banane|banane", "the banana|banana", "die Banane|Banane", "el plátano|plátano"),
  W("nourriture", "pain", "🍞", "le pain|pain", "the bread|bread", "das Brot|Brot", "el pan|pan"),
  W("nourriture", "lait", "🥛", "le lait|lait", "the milk|milk", "die Milch|Milch", "la leche|leche"),
  W("nourriture", "eau", "💧", "l'eau|eau", "the water|water", "das Wasser|Wasser", "el agua|agua"),
  W("nourriture", "fromage", "🧀", "le fromage|fromage", "the cheese|cheese", "der Käse|Käse", "el queso|queso"),
  W("nourriture", "oeuf", "🥚", "l'œuf|œuf", "the egg|egg", "das Ei|Ei", "el huevo|huevo"),
  W("nourriture", "carotte", "🥕", "la carotte|carotte", "the carrot|carrot", "die Karotte|Karotte", "la zanahoria|zanahoria"),
  W("nourriture", "fraise", "🍓", "la fraise|fraise", "the strawberry|strawberry", "die Erdbeere|Erdbeere", "la fresa|fresa"),
  W("nourriture", "gateau", "🍰", "le gâteau|gâteau", "the cake|cake", "der Kuchen|Kuchen", "el pastel|pastel"),
  W("nourriture", "pizza", "🍕", "la pizza|pizza", "the pizza|pizza", "die Pizza|Pizza", "la pizza|pizza"),
  W("nourriture", "jus", "🧃", "le jus|jus", "the juice|juice", "der Saft|Saft", "el zumo|zumo"),
  // 7. Corps
  W("corps", "tete", "🙂", "la tête|tête", "the head|head", "der Kopf|Kopf", "la cabeza|cabeza"),
  W("corps", "oeil", "👁️", "l'œil|œil", "the eye|eye", "das Auge|Auge", "el ojo|ojo"),
  W("corps", "oreille", "👂", "l'oreille|oreille", "the ear|ear", "das Ohr|Ohr", "la oreja|oreja"),
  W("corps", "nez", "👃", "le nez|nez", "the nose|nose", "die Nase|Nase", "la nariz|nariz"),
  W("corps", "bouche", "👄", "la bouche|bouche", "the mouth|mouth", "der Mund|Mund", "la boca|boca"),
  W("corps", "main", "✋", "la main|main", "the hand|hand", "die Hand|Hand", "la mano|mano"),
  W("corps", "pied", "🦶", "le pied|pied", "the foot|foot", "der Fuß|Fuß", "el pie|pie"),
  W("corps", "jambe", "🦵", "la jambe|jambe", "the leg|leg", "das Bein|Bein", "la pierna|pierna"),
  W("corps", "bras", "💪", "le bras|bras", "the arm|arm", "der Arm|Arm", "el brazo|brazo"),
  W("corps", "dent", "🦷", "la dent|dent", "the tooth|tooth", "der Zahn|Zahn", "el diente|diente"),
  // 8. Vêtements
  W("vetements", "tshirt", "👕", "le tee-shirt|tee-shirt", "the T-shirt|T-shirt", "das T-Shirt|T-Shirt", "la camiseta|camiseta"),
  W("vetements", "pantalon", "👖", "le pantalon|pantalon", "the trousers|trousers", "die Hose|Hose", "el pantalón|pantalón"),
  W("vetements", "robe", "👗", "la robe|robe", "the dress|dress", "das Kleid|Kleid", "el vestido|vestido"),
  W("vetements", "chaussure", "👟", "la chaussure|chaussure", "the shoe|shoe", "der Schuh|Schuh", "el zapato|zapato"),
  W("vetements", "chapeau", "🎩", "le chapeau|chapeau", "the hat|hat", "der Hut|Hut", "el sombrero|sombrero"),
  W("vetements", "manteau", "🧥", "le manteau|manteau", "the coat|coat", "der Mantel|Mantel", "el abrigo|abrigo"),
  W("vetements", "echarpe", "🧣", "l'écharpe|écharpe", "the scarf|scarf", "der Schal|Schal", "la bufanda|bufanda"),
  W("vetements", "chaussette", "🧦", "la chaussette|chaussette", "the sock|sock", "die Socke|Socke", "el calcetín|calcetín"),
  // 9. Maison
  W("maison", "maison", "🏠", "la maison|maison", "the house|house", "das Haus|Haus", "la casa|casa"),
  W("maison", "porte", "🚪", "la porte|porte", "the door|door", "die Tür|Tür", "la puerta|puerta"),
  W("maison", "fenetre", "🪟", "la fenêtre|fenêtre", "the window|window", "das Fenster|Fenster", "la ventana|ventana"),
  W("maison", "lit", "🛏️", "le lit|lit", "the bed|bed", "das Bett|Bett", "la cama|cama"),
  W("maison", "chaise", "🪑", "la chaise|chaise", "the chair|chair", "der Stuhl|Stuhl", "la silla|silla"),
  W("maison", "lampe", "💡", "la lampe|lampe", "the lamp|lamp", "die Lampe|Lampe", "la lámpara|lámpara"),
  W("maison", "cle", "🔑", "la clé|clé", "the key|key", "der Schlüssel|Schlüssel", "la llave|llave"),
  W("maison", "livre", "📖", "le livre|livre", "the book|book", "das Buch|Buch", "el libro|libro"),
  W("maison", "canape", "🛋️", "le canapé|canapé", "the sofa|sofa", "das Sofa|Sofa", "el sofá|sofá"),
  // 10. Nature
  W("nature", "soleil", "☀️", "le soleil|soleil", "the sun|sun", "die Sonne|Sonne", "el sol|sol"),
  W("nature", "lune", "🌙", "la lune|lune", "the moon|moon", "der Mond|Mond", "la luna|luna"),
  W("nature", "etoile", "⭐", "l'étoile|étoile", "the star|star", "der Stern|Stern", "la estrella|estrella"),
  W("nature", "pluie", "🌧️", "la pluie|pluie", "the rain|rain", "der Regen|Regen", "la lluvia|lluvia"),
  W("nature", "neige", "❄️", "la neige|neige", "the snow|snow", "der Schnee|Schnee", "la nieve|nieve"),
  W("nature", "arbre", "🌳", "l'arbre|arbre", "the tree|tree", "der Baum|Baum", "el árbol|árbol"),
  W("nature", "fleur", "🌼", "la fleur|fleur", "the flower|flower", "die Blume|Blume", "la flor|flor"),
  W("nature", "mer", "🌊", "la mer|mer", "the sea|sea", "das Meer|Meer", "el mar|mar"),
  W("nature", "montagne", "⛰️", "la montagne|montagne", "the mountain|mountain", "der Berg|Berg", "la montaña|montaña"),
  W("nature", "nuage", "☁️", "le nuage|nuage", "the cloud|cloud", "die Wolke|Wolke", "la nube|nube"),
  // 11. Bouger et jouer
  W("transports", "voiture", "🚗", "la voiture|voiture", "the car|car", "das Auto|Auto", "el coche|coche"),
  W("transports", "velo", "🚲", "le vélo|vélo", "the bike|bike", "das Fahrrad|Fahrrad", "la bicicleta|bicicleta"),
  W("transports", "bus", "🚌", "le bus|bus", "the bus|bus", "der Bus|Bus", "el autobús|autobús"),
  W("transports", "train", "🚂", "le train|train", "the train|train", "der Zug|Zug", "el tren|tren"),
  W("transports", "avion", "✈️", "l'avion|avion", "the plane|plane", "das Flugzeug|Flugzeug", "el avión|avión"),
  W("transports", "bateau", "⛵", "le bateau|bateau", "the boat|boat", "das Boot|Boot", "el barco|barco"),
  W("transports", "ballon", "⚽", "le ballon|ballon", "the ball|ball", "der Ball|Ball", "la pelota|pelota"),
  W("transports", "sac", "🎒", "le sac à dos|sac à dos", "the backpack|backpack", "der Rucksack|Rucksack", "la mochila|mochila"),
  W("transports", "crayon", "✏️", "le crayon|crayon", "the pencil|pencil", "der Bleistift|Bleistift", "el lápiz|lápiz"),
  // 12. Actions (verbes à l'infinitif)
  W("actions", "manger", "🍽️", "manger", "to eat", "essen", "comer"),
  W("actions", "boire", "🥤", "boire", "to drink", "trinken", "beber"),
  W("actions", "dormir", "🛌", "dormir", "to sleep", "schlafen", "dormir"),
  W("actions", "courir", "🏃", "courir", "to run", "rennen", "correr"),
  W("actions", "sauter", "🤸", "sauter", "to jump", "springen", "saltar"),
  W("actions", "nager", "🏊", "nager", "to swim", "schwimmen", "nadar"),
  W("actions", "lire", "📚", "lire", "to read", "lesen", "leer"),
  W("actions", "chanter", "🎤", "chanter", "to sing", "singen", "cantar"),
  W("actions", "danser", "💃", "danser", "to dance", "tanzen", "bailar"),
  W("actions", "jouer", "🧸", "jouer", "to play", "spielen", "jugar"),
];

function S(unit: string, id: string, e: string, fr: string, en: string, de: string, es: string): Sentence {
  return { id: `${unit}.s${id}`, unit, e, t: { fr, en, de, es } };
}

/** Phrases à reconstruire (9 ans et plus). Une seule mise en ordre possible pour chacune. */
export const SENTENCES: Sentence[] = [
  S("couleurs", "1", "🌤️", "Le ciel est bleu.", "The sky is blue.", "Der Himmel ist blau.", "El cielo es azul."),
  S("couleurs", "2", "🍎", "La pomme est rouge.", "The apple is red.", "Der Apfel ist rot.", "La manzana es roja."),
  S("couleurs", "3", "🐈‍⬛", "Mon chat est noir.", "My cat is black.", "Meine Katze ist schwarz.", "Mi gato es negro."),
  S("couleurs", "4", "🍌", "La banane est jaune.", "The banana is yellow.", "Die Banane ist gelb.", "El plátano es amarillo."),
  S("nombres", "1", "🐶🐶", "J'ai deux chiens.", "I have two dogs.", "Ich habe zwei Hunde.", "Tengo dos perros."),
  S("nombres", "2", "🎂", "J'ai cinq ans.", "I am five years old.", "Ich bin fünf Jahre alt.", "Tengo cinco años."),
  S("nombres", "3", "🐦🐦🐦🐦", "Je vois quatre oiseaux.", "I can see four birds.", "Ich sehe vier Vögel.", "Veo cuatro pájaros."),
  S("nombres", "4", "🍓🍓🍓", "Je mange trois fraises.", "I eat three strawberries.", "Ich esse drei Erdbeeren.", "Como tres fresas."),
  S("animaux", "1", "🐕", "Le chien court.", "The dog runs.", "Der Hund rennt.", "El perro corre."),
  S("animaux", "2", "😺", "Le chat dort.", "The cat sleeps.", "Die Katze schläft.", "El gato duerme."),
  S("animaux", "3", "🐟", "Le poisson nage.", "The fish swims.", "Der Fisch schwimmt.", "El pez nada."),
  S("animaux", "4", "🐄", "La vache mange.", "The cow eats.", "Die Kuh frisst.", "La vaca come."),
  S("famille", "1", "👩", "C'est ma maman.", "This is my mum.", "Das ist meine Mama.", "Esta es mi mamá."),
  S("famille", "2", "👦", "Mon frère joue.", "My brother plays.", "Mein Bruder spielt.", "Mi hermano juega."),
  S("famille", "3", "👧", "Ma sœur est petite.", "My sister is small.", "Meine Schwester ist klein.", "Mi hermana es pequeña."),
  S("famille", "4", "👵", "Ma grand-mère est gentille.", "My grandma is kind.", "Meine Oma ist lieb.", "Mi abuela es simpática."),
  S("bonjour", "1", "👋", "Bonjour, je m'appelle Léo.", "Hello, my name is Leo.", "Hallo, ich heiße Leo.", "Hola, me llamo Leo."),
  S("bonjour", "2", "🙏", "Merci beaucoup !", "Thank you very much!", "Vielen Dank!", "¡Muchas gracias!"),
  S("bonjour", "3", "🌙", "Bonne nuit, maman !", "Good night, Mum!", "Gute Nacht, Mama!", "¡Buenas noches, mamá!"),
  S("bonjour", "4", "🥛", "Oui, s'il te plaît.", "Yes, please.", "Ja, bitte.", "Sí, por favor."),
  S("nourriture", "1", "🍏", "J'aime les pommes.", "I like apples.", "Ich mag Äpfel.", "Me gustan las manzanas."),
  S("nourriture", "2", "🥛", "Je bois du lait.", "I drink milk.", "Ich trinke Milch.", "Bebo leche."),
  S("nourriture", "3", "🍞", "Je mange du pain.", "I eat bread.", "Ich esse Brot.", "Como pan."),
  S("nourriture", "4", "🍰", "Le gâteau est bon.", "The cake is good.", "Der Kuchen ist lecker.", "El pastel está rico."),
  S("corps", "1", "✋✋", "J'ai deux mains.", "I have two hands.", "Ich habe zwei Hände.", "Tengo dos manos."),
  S("corps", "2", "🪥", "Je me brosse les dents.", "I brush my teeth.", "Ich putze mir die Zähne.", "Me lavo los dientes."),
  S("corps", "3", "👃", "Mon nez est petit.", "My nose is small.", "Meine Nase ist klein.", "Mi nariz es pequeña."),
  S("corps", "4", "🙋", "Je lève le bras.", "I raise my arm.", "Ich hebe den Arm.", "Levanto el brazo."),
  S("vetements", "1", "🧥", "Je mets mon manteau.", "I put on my coat.", "Ich ziehe meinen Mantel an.", "Me pongo el abrigo."),
  S("vetements", "2", "👗", "La robe est rose.", "The dress is pink.", "Das Kleid ist rosa.", "El vestido es rosa."),
  S("vetements", "3", "🎩", "J'ai un chapeau.", "I have a hat.", "Ich habe einen Hut.", "Tengo un sombrero."),
  S("vetements", "4", "🧦", "Où est ma chaussette ?", "Where is my sock?", "Wo ist meine Socke?", "¿Dónde está mi calcetín?"),
  S("maison", "1", "🚪", "J'ouvre la porte.", "I open the door.", "Ich öffne die Tür.", "Abro la puerta."),
  S("maison", "2", "📖", "Le livre est sur le lit.", "The book is on the bed.", "Das Buch ist auf dem Bett.", "El libro está en la cama."),
  S("maison", "3", "🏡", "Ma maison est grande.", "My house is big.", "Mein Haus ist groß.", "Mi casa es grande."),
  S("maison", "4", "🛏️", "Je dors dans mon lit.", "I sleep in my bed.", "Ich schlafe in meinem Bett.", "Duermo en mi cama."),
  S("nature", "1", "☀️", "Le soleil brille.", "The sun is shining.", "Die Sonne scheint.", "El sol brilla."),
  S("nature", "2", "❄️", "La neige est blanche.", "The snow is white.", "Der Schnee ist weiß.", "La nieve es blanca."),
  S("nature", "3", "🌼", "La fleur est jolie.", "The flower is pretty.", "Die Blume ist schön.", "La flor es bonita."),
  S("nature", "4", "🌙", "Je vois la lune.", "I can see the moon.", "Ich sehe den Mond.", "Veo la luna."),
  S("transports", "1", "🚌", "Le bus est jaune.", "The bus is yellow.", "Der Bus ist gelb.", "El autobús es amarillo."),
  S("transports", "2", "🚄", "Le train est rapide.", "The train is fast.", "Der Zug ist schnell.", "El tren es rápido."),
  S("transports", "3", "🚲", "J'ai un vélo rouge.", "I have a red bike.", "Ich habe ein rotes Fahrrad.", "Tengo una bicicleta roja."),
  S("transports", "4", "✈️", "L'avion vole.", "The plane flies.", "Das Flugzeug fliegt.", "El avión vuela."),
  S("actions", "1", "💃", "J'aime danser.", "I like dancing.", "Ich tanze gern.", "Me gusta bailar."),
  S("actions", "2", "⚽", "Nous jouons dehors.", "We play outside.", "Wir spielen draußen.", "Jugamos fuera."),
  S("actions", "3", "📚", "Elle lit un livre.", "She is reading a book.", "Sie liest ein Buch.", "Ella lee un libro."),
  S("actions", "4", "🏊", "Les enfants nagent.", "The children are swimming.", "Die Kinder schwimmen.", "Los niños nadan."),
];

export const wordsOfUnit = (unit: string) => WORDS.filter((w) => w.unit === unit);
export const sentencesOfUnit = (unit: string) => SENTENCES.filter((s) => s.unit === unit);
export const wordById = (id: string) => WORDS.find((w) => w.id === id);

/**
 * Découpe une phrase en tuiles : la ponctuation reste collée au mot (« chaussette ? » → une tuile,
 * « ¿Dónde » → une tuile). Le point final est gardé sur la dernière tuile.
 */
export function tiles(sentence: string): string[] {
  const raw = sentence.trim().split(/\s+/);
  const out: string[] = [];
  for (const tok of raw) {
    if (/^[?!:;»]+$/.test(tok) && out.length) out[out.length - 1] += " " + tok;
    else out.push(tok);
  }
  return out;
}

/** Compare une réponse écrite au mot attendu : majuscules et espaces ignorés, accents exigés. */
export function sameWord(typed: string, expected: string): boolean {
  const norm = (s: string) => s.trim().replace(/\s+/g, " ").replace(/[’']/g, "'").toLocaleLowerCase();
  return norm(typed) === norm(expected);
}
