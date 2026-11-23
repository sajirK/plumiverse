// Contenu de « Mes émotions » dans les 4 langues.
// Principes : toutes les émotions sont normales ; on apprend à les reconnaître, à les nommer, et ce qui peut aider.
// On ne dit jamais « ne sois pas triste ».
import { L, type Tr } from "../../core/types";

export type Emo = "joie" | "tristesse" | "colere" | "peur" | "surprise" | "degout" | "calme" | "fatigue";
export interface EmotionDef {
  emoji: string; color: string;
  label: Tr;
  /** « Lina est joyeuse » : prédicat masculin et féminin. */
  m: Tr; f: Tr;
  /** « Touche le visage de la joie ! » */
  find: Tr;
  /** « Ça, c'est la joie. » */
  isThis: Tr;
  body: Tr;
  tips: Tr[];
}
const E = (emoji: string, color: string, label: Tr, m: Tr, f: Tr, find: Tr, isThis: Tr, body: Tr, tips: Tr[]): EmotionDef => ({ emoji, color, label, m, f, find, isThis, body, tips });

export const EMOTIONS: Record<Emo, EmotionDef> = {
  joie: E("😄", "#ffd166", L("Joie", "Joy", "Freude", "Alegría"),
    L("est joyeux", "is happy", "ist fröhlich", "está contento"), L("est joyeuse", "is happy", "ist fröhlich", "está contenta"),
    L("Touche le visage de la joie !", "Tap the happy face!", "Tippe auf das fröhliche Gesicht!", "¡Toca la cara de alegría!"),
    L("Ça, c'est la joie.", "That one is happy.", "Das ist fröhlich.", "Esa es la alegría."),
    L("On sourit, on a envie de rire et de sauter !", "We smile and want to laugh and jump!", "Man lächelt und möchte lachen und hüpfen!", "¡Sonreímos y tenemos ganas de reír y saltar!"),
    [L("Partage ta joie : raconte-le à quelqu'un !", "Share your joy: tell someone about it!", "Teile deine Freude: Erzähl es jemandem!", "Comparte tu alegría: ¡cuéntaselo a alguien!"), L("Danse sur une musique !", "Dance to some music!", "Tanz zu einer Musik!", "¡Baila con una canción!")]),
  tristesse: E("😢", "#74c0fc", L("Tristesse", "Sadness", "Traurigkeit", "Tristeza"),
    L("est triste", "is sad", "ist traurig", "está triste"), L("est triste", "is sad", "ist traurig", "está triste"),
    L("Touche le visage de la tristesse !", "Tap the sad face!", "Tippe auf das traurige Gesicht!", "¡Toca la cara de tristeza!"),
    L("Ça, c'est la tristesse.", "That one is sad.", "Das ist traurig.", "Esa es la tristeza."),
    L("On a envie de pleurer, on se sent tout mou.", "We feel like crying and all floppy.", "Man möchte weinen und fühlt sich ganz schlapp.", "Tenemos ganas de llorar y nos sentimos blanditos."),
    [L("Un câlin, ça fait du bien.", "A hug helps.", "Eine Umarmung tut gut.", "Un abrazo ayuda."), L("Parle à quelqu'un que tu aimes.", "Talk to someone you love.", "Sprich mit jemandem, den du lieb hast.", "Habla con alguien a quien quieres."), L("Tu as le droit de pleurer : ça soulage.", "It's okay to cry: it helps.", "Du darfst weinen: Das erleichtert.", "Puedes llorar: eso alivia.")]),
  colere: E("😠", "#ff6b6b", L("Colère", "Anger", "Wut", "Enfado"),
    L("est en colère", "is angry", "ist wütend", "está enfadado"), L("est en colère", "is angry", "ist wütend", "está enfadada"),
    L("Touche le visage de la colère !", "Tap the angry face!", "Tippe auf das wütende Gesicht!", "¡Toca la cara de enfado!"),
    L("Ça, c'est la colère.", "That one is angry.", "Das ist wütend.", "Ese es el enfado."),
    L("On fronce les sourcils, on serre les poings, on a chaud.", "We frown, clench our fists and feel hot.", "Man runzelt die Stirn, ballt die Fäuste und wird ganz heiß.", "Fruncimos el ceño, apretamos los puños y tenemos calor."),
    [L("Respire fort et lentement, comme un ballon.", "Breathe deeply and slowly, like a balloon.", "Atme tief und langsam, wie ein Luftballon.", "Respira hondo y despacio, como un globo."), L("Serre un coussin très fort.", "Squeeze a cushion really hard.", "Drück ein Kissen ganz fest.", "Aprieta un cojín muy fuerte."), L("Dis-le avec des mots : je suis en colère parce que…", "Say it with words: I'm angry because…", "Sag es mit Worten: Ich bin wütend, weil…", "Dilo con palabras: estoy enfadado porque…")]),
  peur: E("😨", "#b197fc", L("Peur", "Fear", "Angst", "Miedo"),
    L("a peur", "is scared", "hat Angst", "tiene miedo"), L("a peur", "is scared", "hat Angst", "tiene miedo"),
    L("Touche le visage de la peur !", "Tap the scared face!", "Tippe auf das ängstliche Gesicht!", "¡Toca la cara de miedo!"),
    L("Ça, c'est la peur.", "That one is scared.", "Das ist ängstlich.", "Ese es el miedo."),
    L("Le cœur bat vite, on a envie de se cacher.", "Our heart beats fast and we want to hide.", "Das Herz klopft schnell und man möchte sich verstecken.", "El corazón late rápido y queremos escondernos."),
    [L("Dis-le à un adulte : il est là pour t'aider.", "Tell a grown-up: they are there to help you.", "Sag es einem Erwachsenen: Er ist da, um dir zu helfen.", "Díselo a un adulto: está ahí para ayudarte."), L("Serre ton doudou contre toi.", "Hold your cuddly toy close.", "Drück dein Kuscheltier an dich.", "Abraza fuerte a tu peluche.")]),
  surprise: E("😲", "#ffa94d", L("Surprise", "Surprise", "Überraschung", "Sorpresa"),
    L("est surpris", "is surprised", "ist überrascht", "está sorprendido"), L("est surprise", "is surprised", "ist überrascht", "está sorprendida"),
    L("Touche le visage de la surprise !", "Tap the surprised face!", "Tippe auf das überraschte Gesicht!", "¡Toca la cara de sorpresa!"),
    L("Ça, c'est la surprise.", "That one is surprised.", "Das ist überrascht.", "Esa es la sorpresa."),
    L("On ouvre grand les yeux et la bouche : oh !", "We open our eyes and mouth wide: oh!", "Man reißt Augen und Mund weit auf: Oh!", "Abrimos mucho los ojos y la boca: ¡oh!"),
    [L("Prends le temps de regarder ce qui se passe.", "Take time to look at what is happening.", "Nimm dir Zeit, um zu schauen, was passiert.", "Tómate tiempo para mirar qué pasa."), L("Raconte ce qui t'a surpris !", "Tell someone what surprised you!", "Erzähl, was dich überrascht hat!", "¡Cuenta qué te ha sorprendido!")]),
  degout: E("🤢", "#8ce99a", L("Dégoût", "Disgust", "Ekel", "Asco"),
    L("est dégoûté", "is disgusted", "ekelt sich", "siente asco"), L("est dégoûtée", "is disgusted", "ekelt sich", "siente asco"),
    L("Touche le visage du dégoût !", "Tap the disgusted face!", "Tippe auf das angeekelte Gesicht!", "¡Toca la cara de asco!"),
    L("Ça, c'est le dégoût.", "That one is disgusted.", "Das ist Ekel.", "Ese es el asco."),
    L("On fronce le nez, on dit beurk !", "We wrinkle our nose and say yuck!", "Man rümpft die Nase und sagt: Igitt!", "Arrugamos la nariz y decimos: ¡puaj!"),
    [L("Tu as le droit de ne pas aimer quelque chose.", "It's okay not to like something.", "Du darfst etwas nicht mögen.", "Puedes no querer algo."), L("Dis-le gentiment : non merci, je n'aime pas.", "Say it kindly: no thank you, I don't like it.", "Sag es freundlich: Nein danke, das mag ich nicht.", "Dilo con amabilidad: no, gracias, no me gusta.")]),
  calme: E("😌", "#96f2d7", L("Calme", "Calm", "Ruhe", "Calma"),
    L("est calme", "is calm", "ist ruhig", "está tranquilo"), L("est calme", "is calm", "ist ruhig", "está tranquila"),
    L("Touche le visage du calme !", "Tap the calm face!", "Tippe auf das ruhige Gesicht!", "¡Toca la cara de calma!"),
    L("Ça, c'est le calme.", "That one is calm.", "Das ist ruhig.", "Esa es la calma."),
    L("On se sent tranquille, tout doux, bien.", "We feel peaceful, soft and good.", "Man fühlt sich ruhig, sanft und wohl.", "Nos sentimos tranquilos, suaves y bien."),
    [L("Profite de ce moment tout doux.", "Enjoy this gentle moment.", "Genieß diesen sanften Moment.", "Disfruta de este momento tan suave."), L("C'est le bon moment pour lire une histoire.", "It's a good time for a story.", "Jetzt ist eine gute Zeit für eine Geschichte.", "Es buen momento para leer un cuento.")]),
  fatigue: E("😴", "#a5d8ff", L("Fatigue", "Tiredness", "Müdigkeit", "Cansancio"),
    L("est fatigué", "is tired", "ist müde", "está cansado"), L("est fatiguée", "is tired", "ist müde", "está cansada"),
    L("Touche le visage de la fatigue !", "Tap the tired face!", "Tippe auf das müde Gesicht!", "¡Toca la cara de cansancio!"),
    L("Ça, c'est la fatigue.", "That one is tired.", "Das ist müde.", "Ese es el cansancio."),
    L("On bâille, les yeux se ferment tout seuls.", "We yawn and our eyes close on their own.", "Man gähnt und die Augen fallen von allein zu.", "Bostezamos y los ojos se cierran solos."),
    [L("Repose-toi un peu.", "Have a little rest.", "Ruh dich ein bisschen aus.", "Descansa un poco."), L("Un câlin et au dodo !", "A hug, then off to bed!", "Eine Umarmung und ab ins Bett!", "¡Un abrazo y a dormir!")]),
};
export const LEVEL_EMOTIONS: Record<1 | 2 | 3, Emo[]> = {
  1: ["joie", "tristesse", "colere", "peur"],
  2: ["joie", "tristesse", "colere", "peur", "surprise", "degout"],
  3: ["joie", "tristesse", "colere", "peur", "surprise", "degout", "calme", "fatigue"],
};

/** Situations : une seule réponse attendue ; alsoOk = émotions aussi possibles, jamais proposées comme mauvaise réponse. */
export interface Situation { who: string; g: "m" | "f"; scene: string; text: Tr; answer: Emo; alsoOk: Emo[] }
const S = (who: string, g: "m" | "f", scene: string, text: Tr, answer: Emo, alsoOk: Emo[]): Situation => ({ who, g, scene, text, answer, alsoOk });
export const SITUATIONS: Situation[] = [
  S("Lina", "f", "🎁🎂", L("Lina reçoit un beau cadeau pour son anniversaire.", "Lina gets a lovely present for her birthday.", "Lina bekommt ein schönes Geschenk zum Geburtstag.", "Lina recibe un regalo precioso por su cumpleaños."), "joie", ["surprise"]),
  S("Tom", "m", "🧸❓", L("Tom a perdu son doudou.", "Tom has lost his cuddly toy.", "Tom hat sein Kuscheltier verloren.", "Tom ha perdido su peluche."), "tristesse", ["peur", "colere"]),
  S("Sami", "m", "🐕💥", L("Un gros chien aboie très fort devant Sami.", "A big dog barks very loudly at Sami.", "Ein großer Hund bellt Sami ganz laut an.", "Un perro grande le ladra muy fuerte a Sami."), "peur", ["surprise"]),
  S("Noé", "m", "🧱💢", L("Quelqu'un fait tomber la tour de Noé exprès.", "Someone knocks down Noé's tower on purpose.", "Jemand wirft Noés Turm absichtlich um.", "Alguien tira la torre de Noé a propósito."), "colere", ["tristesse", "surprise"]),
  S("Jade", "f", "🥗🐛", L("Jade trouve un ver de terre dans sa salade.", "Jade finds a worm in her salad.", "Jade findet einen Regenwurm in ihrem Salat.", "Jade encuentra una lombriz en su ensalada."), "degout", ["surprise", "peur"]),
  S("Malo", "m", "📦🤡", L("Malo ouvre une boîte et un clown en sort d'un coup : boing !", "Malo opens a box and a clown jumps out: boing!", "Malo öffnet eine Kiste und ein Clown springt heraus: Boing!", "Malo abre una caja y sale un payaso de golpe: ¡boing!"), "surprise", ["peur", "joie"]),
  S("Léo", "m", "⚽🚶", L("Le copain de Léo ne veut plus jouer avec lui.", "Léo's friend doesn't want to play with him any more.", "Léos Freund will nicht mehr mit ihm spielen.", "El amigo de Léo ya no quiere jugar con él."), "tristesse", ["colere"]),
  S("Mia", "f", "🏖️🌞", L("Mia joue à la plage avec ses amis.", "Mia is playing on the beach with her friends.", "Mia spielt mit ihren Freunden am Strand.", "Mia juega en la playa con sus amigos."), "joie", ["calme"]),
  S("Inès", "f", "⛈️🌙", L("La nuit, Inès entend le tonnerre faire BOUM très fort.", "At night, Inès hears the thunder go BOOM very loudly.", "In der Nacht hört Inès den Donner ganz laut BUMM machen.", "Por la noche, Inès oye el trueno hacer ¡BUM! muy fuerte."), "peur", ["surprise"]),
  S("Lucas", "m", "🖍️😤", L("Le petit frère de Lucas gribouille sur son beau dessin.", "Lucas's little brother scribbles on his lovely drawing.", "Lucas' kleiner Bruder kritzelt auf sein schönes Bild.", "El hermano pequeño de Lucas garabatea en su bonito dibujo."), "colere", ["tristesse", "surprise"]),
  S("Nina", "f", "🐟💔", L("Le poisson rouge de Nina est mort.", "Nina's goldfish has died.", "Ninas Goldfisch ist gestorben.", "El pez de colores de Nina se ha muerto."), "tristesse", ["surprise"]),
  S("Adam", "m", "🧦💨", L("Adam sent une odeur de chaussettes très sales.", "Adam smells some very dirty socks.", "Adam riecht ganz schmutzige Socken.", "Adam huele unos calcetines muy sucios."), "degout", []),
  S("Chloé", "f", "🚲🎉", L("Chloé réussit à faire du vélo toute seule !", "Chloé manages to ride her bike on her own!", "Chloé kann zum ersten Mal allein Fahrrad fahren!", "¡Chloé consigue montar en bici ella sola!"), "joie", ["surprise"]),
  S("Yanis", "m", "🛁🎶", L("Yanis est dans son bain chaud et écoute une douce musique.", "Yanis is in a warm bath listening to soft music.", "Yanis liegt in der warmen Badewanne und hört leise Musik.", "Yanis está en su baño calentito escuchando música suave."), "calme", ["joie", "fatigue"]),
  S("Emma", "f", "🛋️🥱", L("Il est très tard et Emma bâille sur le canapé.", "It's very late and Emma is yawning on the sofa.", "Es ist sehr spät und Emma gähnt auf dem Sofa.", "Es muy tarde y Emma bosteza en el sofá."), "fatigue", ["calme"]),
  S("Rayan", "m", "🎉🎈", L("Tous ses amis crient « Surprise ! » quand Rayan entre dans la pièce.", "All his friends shout \"Surprise!\" when Rayan walks in.", "Alle Freunde rufen „Überraschung!“, als Rayan hereinkommt.", "Todos sus amigos gritan «¡Sorpresa!» cuando Rayan entra."), "surprise", ["joie"]),
  S("Sara", "f", "🍦⬇️", L("La glace de Sara tombe par terre.", "Sara's ice cream falls on the ground.", "Saras Eis fällt auf den Boden.", "El helado de Sara se cae al suelo."), "tristesse", ["colere", "surprise"]),
  S("Hugo", "m", "🕷️😱", L("Une grosse araignée descend juste devant le nez de Hugo.", "A big spider drops down right in front of Hugo's nose.", "Eine große Spinne seilt sich direkt vor Hugos Nase ab.", "Una araña grande baja justo delante de la nariz de Hugo."), "peur", ["surprise", "degout"]),
  S("Zoé", "f", "🎠🎡", L("Zoé va à la fête foraine avec son papi.", "Zoé goes to the funfair with her grandpa.", "Zoé geht mit ihrem Opa auf den Jahrmarkt.", "Zoé va a la feria con su abuelo."), "joie", ["surprise"]),
  S("Paul", "m", "🧃💦", L("Sa sœur renverse du jus exprès sur les cartes de Paul.", "His sister spills juice on Paul's cards on purpose.", "Seine Schwester kippt absichtlich Saft über Pauls Karten.", "Su hermana tira zumo a propósito sobre las cartas de Paul."), "colere", ["tristesse", "surprise"]),
];
export const howFeels = (s: Situation) => L(`Comment se sent ${s.who} ?`, `How does ${s.who} feel?`, `Wie fühlt sich ${s.who}?`, `¿Cómo se siente ${s.who}?`);

/** « Que ferais-tu ? » : une seule bonne réaction, les autres sont clairement à éviter. */
export interface Option { e: string; t: Tr; why: Tr; good?: boolean }
export interface Choice { scene: string; text: Tr; options: Option[] }
const O = (e: string, t: Tr, why: Tr, good = false): Option => ({ e, t, why, good });
export const CHOICES: Choice[] = [
  { scene: "🤕😭", text: L("Ton ami tombe dans la cour et se met à pleurer.", "Your friend falls over in the playground and starts crying.", "Dein Freund fällt auf dem Schulhof hin und fängt an zu weinen.", "Tu amigo se cae en el patio y se pone a llorar."), options: [
    O("🤗", L("Je vais le voir et je lui demande s'il a mal.", "I go to him and ask if he's hurt.", "Ich gehe zu ihm und frage, ob es wehtut.", "Voy a verle y le pregunto si le duele."), L("Oui ! Quand quelqu'un a mal, on va le voir, et si besoin on appelle un adulte.", "Yes! When someone is hurt, we go to them and call a grown-up if needed.", "Ja! Wenn jemandem etwas wehtut, geht man hin und holt wenn nötig einen Erwachsenen.", "¡Sí! Cuando alguien se hace daño, vamos a verle y, si hace falta, llamamos a un adulto."), true),
    O("😆", L("Je me moque de lui.", "I laugh at him.", "Ich lache ihn aus.", "Me río de él."), L("Ton ami serait encore plus triste. Que pourrais-tu faire pour l'aider ?", "Your friend would be even sadder. What could you do to help?", "Dein Freund wäre noch trauriger. Wie könntest du ihm helfen?", "Tu amigo estaría aún más triste. ¿Qué podrías hacer para ayudarle?")),
    O("🙈", L("Je fais comme si je n'avais rien vu.", "I pretend I didn't see anything.", "Ich tue so, als hätte ich nichts gesehen.", "Hago como si no hubiera visto nada."), L("Il a besoin d'aide. Que pourrais-tu faire pour lui ?", "He needs help. What could you do for him?", "Er braucht Hilfe. Was könntest du für ihn tun?", "Necesita ayuda. ¿Qué podrías hacer por él?")),
  ] },
  { scene: "🧸😠", text: L("Tu es très en colère parce que ta sœur a pris ton jouet.", "You are very angry because your sister took your toy.", "Du bist sehr wütend, weil deine Schwester dein Spielzeug genommen hat.", "Estás muy enfadado porque tu hermana te ha cogido el juguete."), options: [
    O("🗣️", L("Je respire fort, puis je lui dis que je suis en colère et je lui demande de me le rendre.", "I take a deep breath, tell her I'm angry and ask her to give it back.", "Ich atme tief durch, sage ihr, dass ich wütend bin, und bitte sie, es zurückzugeben.", "Respiro hondo, le digo que estoy enfadado y le pido que me lo devuelva."), L("Bravo ! Tu as le droit d'être en colère, et tu l'as dit avec des mots.", "Well done! It's okay to be angry, and you said it with words.", "Super! Du darfst wütend sein, und du hast es mit Worten gesagt.", "¡Bravo! Puedes estar enfadado, y lo has dicho con palabras."), true),
    O("👊", L("Je la tape.", "I hit her.", "Ich haue sie.", "Le pego."), L("Taper fait mal. On a le droit d'être en colère, mais on le dit avec des mots.", "Hitting hurts. It's okay to be angry, but we say it with words.", "Hauen tut weh. Man darf wütend sein, aber man sagt es mit Worten.", "Pegar hace daño. Puedes enfadarte, pero se dice con palabras.")),
    O("💥", L("Je casse son jouet à elle.", "I break her toy.", "Ich mache ihr Spielzeug kaputt.", "Rompo su juguete."), L("Elle serait triste, et ton jouet ne reviendrait pas. Essaie autre chose.", "She'd be sad, and you still wouldn't get your toy back. Try something else.", "Sie wäre traurig, und dein Spielzeug bekämst du trotzdem nicht zurück. Versuch etwas anderes.", "Ella estaría triste y tu juguete no volvería. Prueba otra cosa.")),
  ] },
  { scene: "🧒🌧️", text: L("Un enfant est tout seul dans la cour. Il a l'air triste.", "A child is all alone in the playground. He looks sad.", "Ein Kind ist ganz allein auf dem Schulhof. Es sieht traurig aus.", "Un niño está solo en el patio. Parece triste."), options: [
    O("🤝", L("Je lui demande s'il veut jouer avec moi.", "I ask if he wants to play with me.", "Ich frage, ob es mit mir spielen möchte.", "Le pregunto si quiere jugar conmigo."), L("Super ! Grâce à toi, il ne sera plus tout seul.", "Great! Thanks to you, he won't be alone any more.", "Toll! Dank dir ist es nicht mehr allein.", "¡Genial! Gracias a ti, ya no estará solo."), true),
    O("🚫", L("Je dis aux autres de ne pas jouer avec lui.", "I tell the others not to play with him.", "Ich sage den anderen, dass sie nicht mit ihm spielen sollen.", "Les digo a los demás que no jueguen con él."), L("Il serait encore plus triste. Comment pourrais-tu l'aider ?", "He would be even sadder. How could you help him?", "Es wäre noch trauriger. Wie könntest du helfen?", "Estaría aún más triste. ¿Cómo podrías ayudarle?")),
    O("😛", L("Je lui tire la langue.", "I stick my tongue out at him.", "Ich strecke ihm die Zunge raus.", "Le saco la lengua."), L("Ce n'est pas gentil. Que pourrais-tu faire pour qu'il se sente mieux ?", "That's not kind. What could you do to make him feel better?", "Das ist nicht nett. Was könntest du tun, damit es sich besser fühlt?", "Eso no es amable. ¿Qué podrías hacer para que se sienta mejor?")),
  ] },
  { scene: "🏺💔", text: L("Tu as cassé un vase sans faire exprès.", "You broke a vase by accident.", "Du hast aus Versehen eine Vase kaputt gemacht.", "Has roto un jarrón sin querer."), options: [
    O("🙋", L("Je le dis à un adulte et je dis pardon.", "I tell a grown-up and say sorry.", "Ich sage es einem Erwachsenen und entschuldige mich.", "Se lo digo a un adulto y pido perdón."), L("Bravo ! Dire la vérité, c'est courageux. Tout le monde fait des erreurs.", "Well done! Telling the truth is brave. Everyone makes mistakes.", "Super! Die Wahrheit zu sagen ist mutig. Jeder macht Fehler.", "¡Bravo! Decir la verdad es valiente. Todo el mundo se equivoca."), true),
    O("🙊", L("Je cache les morceaux.", "I hide the pieces.", "Ich verstecke die Scherben.", "Escondo los trozos."), L("Quelqu'un pourrait se couper. Mieux vaut le dire à un adulte.", "Someone could cut themselves. It's better to tell a grown-up.", "Jemand könnte sich schneiden. Sag es lieber einem Erwachsenen.", "Alguien podría cortarse. Es mejor decírselo a un adulto.")),
    O("🐱", L("Je dis que c'est le chat.", "I say the cat did it.", "Ich sage, es war die Katze.", "Digo que ha sido el gato."), L("Ce n'est pas la vérité. On peut dire ce qui s'est passé, même si on a un peu peur.", "That's not the truth. You can say what happened, even if you're a bit scared.", "Das stimmt nicht. Man kann sagen, was passiert ist, auch wenn man ein bisschen Angst hat.", "Eso no es verdad. Puedes contar lo que pasó, aunque tengas un poco de miedo.")),
  ] },
  { scene: "🖼️✨", text: L("Ton copain te montre son dessin. Il en est très fier.", "Your friend shows you his drawing. He is very proud of it.", "Dein Freund zeigt dir sein Bild. Er ist sehr stolz darauf.", "Tu amigo te enseña su dibujo. Está muy orgulloso."), options: [
    O("👏", L("Je lui dis que son dessin est trop beau.", "I tell him his drawing is lovely.", "Ich sage ihm, dass sein Bild toll ist.", "Le digo que su dibujo es precioso."), L("Oui ! Un compliment, ça rend tout le monde heureux.", "Yes! A compliment makes everyone happy.", "Ja! Ein Kompliment macht alle froh.", "¡Sí! Un cumplido hace feliz a todo el mundo."), true),
    O("👎", L("Je lui dis qu'il est moche.", "I tell him it's ugly.", "Ich sage ihm, dass es hässlich ist.", "Le digo que es feo."), L("Ça lui ferait de la peine. Que pourrais-tu lui dire de gentil ?", "That would hurt his feelings. What nice thing could you say?", "Das würde ihn traurig machen. Was Nettes könntest du sagen?", "Eso le pondría triste. ¿Qué cosa bonita podrías decirle?")),
    O("🖍️", L("Je gribouille dessus.", "I scribble on it.", "Ich kritzle darauf herum.", "Garabateo encima."), L("Il serait très triste et en colère. Essaie autre chose.", "He would be very sad and angry. Try something else.", "Er wäre sehr traurig und wütend. Versuch etwas anderes.", "Estaría muy triste y enfadado. Prueba otra cosa.")),
  ] },
  { scene: "🌙😨", text: L("Le soir, dans ton lit, tu as peur du noir.", "At night in bed, you are scared of the dark.", "Abends im Bett hast du Angst im Dunkeln.", "Por la noche, en la cama, te da miedo la oscuridad."), options: [
    O("👨‍👩‍👧", L("J'appelle papa ou maman et je dis que j'ai peur.", "I call Mum or Dad and say I'm scared.", "Ich rufe Mama oder Papa und sage, dass ich Angst habe.", "Llamo a papá o a mamá y digo que tengo miedo."), L("Oui ! Quand on a peur, on peut le dire : les adultes sont là pour nous aider.", "Yes! When we're scared, we can say so: grown-ups are there to help.", "Ja! Wenn man Angst hat, darf man es sagen: Erwachsene sind da, um zu helfen.", "¡Sí! Cuando tenemos miedo, podemos decirlo: los adultos están para ayudarnos."), true),
    O("🤐", L("Je garde ma peur pour moi et je ne dis rien.", "I keep my fear to myself and say nothing.", "Ich behalte meine Angst für mich und sage nichts.", "Me guardo el miedo y no digo nada."), L("Ta peur, tu as le droit d'en parler. Ça aide beaucoup !", "You're allowed to talk about your fear. It helps a lot!", "Du darfst über deine Angst sprechen. Das hilft sehr!", "Puedes hablar de tu miedo. ¡Ayuda mucho!")),
    O("🔊", L("Je crie très fort sans rien expliquer.", "I scream very loudly without explaining.", "Ich schreie ganz laut, ohne etwas zu erklären.", "Grito muy fuerte sin explicar nada."), L("Les autres ne comprendraient pas ce qui se passe. Que pourrais-tu dire ?", "The others wouldn't understand what's going on. What could you say?", "Die anderen würden nicht verstehen, was los ist. Was könntest du sagen?", "Los demás no entenderían qué pasa. ¿Qué podrías decir?")),
  ] },
  { scene: "🧱👶", text: L("Ton petit frère voudrait jouer avec tes briques.", "Your little brother would like to play with your bricks.", "Dein kleiner Bruder möchte mit deinen Bausteinen spielen.", "Tu hermano pequeño quiere jugar con tus bloques."), options: [
    O("🤝", L("Je partage et on construit ensemble.", "I share and we build together.", "Ich teile und wir bauen zusammen.", "Comparto y construimos juntos."), L("Génial ! Jouer à deux, c'est encore plus rigolo.", "Great! Playing together is even more fun.", "Toll! Zu zweit spielen macht noch mehr Spaß.", "¡Genial! Jugar juntos es aún más divertido."), true),
    O("✋", L("Je lui arrache les briques des mains.", "I grab the bricks out of his hands.", "Ich reiße ihm die Bausteine aus der Hand.", "Le quito los bloques de las manos."), L("Il serait triste. Comment pourriez-vous jouer tous les deux ?", "He'd be sad. How could you both play?", "Er wäre traurig. Wie könntet ihr beide spielen?", "Estaría triste. ¿Cómo podríais jugar los dos?")),
    O("💢", L("Je le pousse.", "I push him.", "Ich schubse ihn.", "Le empujo."), L("Pousser peut faire mal. Essaie autre chose.", "Pushing can hurt. Try something else.", "Schubsen kann wehtun. Versuch etwas anderes.", "Empujar puede hacer daño. Prueba otra cosa.")),
  ] },
  { scene: "🎲😕", text: L("Tu as perdu à un jeu de société.", "You lost a board game.", "Du hast bei einem Brettspiel verloren.", "Has perdido en un juego de mesa."), options: [
    O("👏", L("Je dis bravo au gagnant, et on fait une autre partie.", "I say well done to the winner, and we play again.", "Ich gratuliere dem Gewinner und wir spielen noch einmal.", "Felicito al ganador y jugamos otra partida."), L("Bravo ! Perdre, ça arrive à tout le monde. Et on peut rejouer !", "Well done! Everyone loses sometimes. And we can play again!", "Super! Verlieren passiert jedem. Und man kann nochmal spielen!", "¡Bravo! Perder le pasa a todo el mundo. ¡Y se puede volver a jugar!"), true),
    O("🃏", L("Je jette le jeu par terre.", "I throw the game on the floor.", "Ich werfe das Spiel auf den Boden.", "Tiro el juego al suelo."), L("On peut être déçu, mais on ne casse pas le jeu. Que pourrais-tu faire ?", "It's okay to be disappointed, but we don't break the game. What could you do?", "Man darf enttäuscht sein, aber man macht das Spiel nicht kaputt. Was könntest du tun?", "Puedes estar desilusionado, pero no se rompe el juego. ¿Qué podrías hacer?")),
    O("😤", L("Je dis que l'autre a triché.", "I say the other player cheated.", "Ich sage, dass der andere geschummelt hat.", "Digo que el otro ha hecho trampa."), L("Ce n'est pas vrai, et ça lui ferait de la peine. Essaie autre chose.", "That's not true, and it would hurt their feelings. Try something else.", "Das stimmt nicht und würde ihn traurig machen. Versuch etwas anderes.", "No es verdad y le pondría triste. Prueba otra cosa.")),
  ] },
  { scene: "🐈🤒", text: L("Ton ami te dit qu'il est triste parce que son chat est malade.", "Your friend tells you he's sad because his cat is ill.", "Dein Freund erzählt dir, dass er traurig ist, weil seine Katze krank ist.", "Tu amigo te dice que está triste porque su gato está enfermo."), options: [
    O("👂", L("Je l'écoute et je lui fais un câlin.", "I listen to him and give him a hug.", "Ich höre ihm zu und umarme ihn.", "Le escucho y le doy un abrazo."), L("Oui ! Écouter quelqu'un qui est triste, c'est un beau cadeau.", "Yes! Listening to someone who is sad is a lovely gift.", "Ja! Jemandem zuzuhören, der traurig ist, ist ein schönes Geschenk.", "¡Sí! Escuchar a alguien que está triste es un regalo precioso."), true),
    O("🤷", L("Je lui dis que ce n'est pas grave, que c'est juste un chat.", "I tell him it doesn't matter, it's just a cat.", "Ich sage ihm, dass es nicht schlimm ist, es ist ja nur eine Katze.", "Le digo que no pasa nada, que solo es un gato."), L("Pour lui, c'est important. Que pourrais-tu faire pour le consoler ?", "It matters to him. What could you do to comfort him?", "Für ihn ist es wichtig. Wie könntest du ihn trösten?", "Para él es importante. ¿Qué podrías hacer para consolarle?")),
    O("🚂", L("Je parle de mes jouets à la place.", "I talk about my toys instead.", "Ich erzähle stattdessen von meinen Spielsachen.", "Hablo de mis juguetes en su lugar."), L("Il a besoin que tu l'écoutes. Essaie autre chose.", "He needs you to listen. Try something else.", "Er braucht jemanden, der zuhört. Versuch etwas anderes.", "Necesita que le escuches. Prueba otra cosa.")),
  ] },
  { scene: "🚶💥", text: L("Un enfant te bouscule sans faire exprès, et il te dit pardon.", "A child bumps into you by accident and says sorry.", "Ein Kind rempelt dich aus Versehen an und entschuldigt sich.", "Un niño te empuja sin querer y te pide perdón."), options: [
    O("👍", L("Je lui dis : d'accord, ce n'est pas grave.", "I say: okay, no problem.", "Ich sage: Okay, nicht schlimm.", "Le digo: vale, no pasa nada."), L("Bravo ! Il ne l'a pas fait exprès et il s'est excusé.", "Well done! He didn't mean it and he said sorry.", "Super! Es war keine Absicht und es hat sich entschuldigt.", "¡Bravo! No lo hizo a propósito y pidió perdón."), true),
    O("💢", L("Je le bouscule aussi.", "I bump into him too.", "Ich rempele es auch an.", "Yo también le empujo."), L("Il ne l'a pas fait exprès. Que pourrais-tu lui répondre ?", "He didn't mean it. What could you say back?", "Es war keine Absicht. Was könntest du antworten?", "No lo hizo a propósito. ¿Qué podrías contestarle?")),
    O("😾", L("Je boude toute la journée.", "I sulk all day.", "Ich schmolle den ganzen Tag.", "Me enfurruño todo el día."), L("Il a dit pardon : tu peux accepter ses excuses.", "He said sorry: you can accept it.", "Es hat sich entschuldigt: Du kannst die Entschuldigung annehmen.", "Ha pedido perdón: puedes aceptar sus disculpas.")),
  ] },
  { scene: "👩😩", text: L("Maman a l'air très fatiguée ce soir.", "Mum looks very tired this evening.", "Mama sieht heute Abend sehr müde aus.", "Mamá parece muy cansada esta noche."), options: [
    O("🧺", L("Je range mes jouets et je lui fais un câlin.", "I tidy my toys and give her a hug.", "Ich räume meine Spielsachen auf und umarme sie.", "Recojo mis juguetes y le doy un abrazo."), L("Oui ! Tu as vu qu'elle était fatiguée et tu l'as aidée. C'est très gentil.", "Yes! You saw she was tired and you helped. That's very kind.", "Ja! Du hast gesehen, dass sie müde ist, und hast geholfen. Das ist sehr lieb.", "¡Sí! Has visto que estaba cansada y la has ayudado. Es muy amable."), true),
    O("📢", L("Je fais plein de bruit dans la maison.", "I make lots of noise in the house.", "Ich mache ganz viel Lärm im Haus.", "Hago mucho ruido en casa."), L("Elle a besoin de calme. Comment pourrais-tu l'aider ?", "She needs some quiet. How could you help her?", "Sie braucht Ruhe. Wie könntest du ihr helfen?", "Necesita calma. ¿Cómo podrías ayudarla?")),
    O("🛋️", L("Je saute partout sur le canapé.", "I jump all over the sofa.", "Ich hüpfe auf dem Sofa herum.", "Salto por todo el sofá."), L("Ce n'est pas le bon moment. Que pourrais-tu faire pour l'aider ?", "It's not the right time. What could you do to help her?", "Das ist nicht der richtige Moment. Was könntest du tun, um ihr zu helfen?", "No es el momento. ¿Qué podrías hacer para ayudarla?")),
  ] },
  { scene: "🗯️😞", text: L("Tu as dit quelque chose de méchant à ton ami, et il est triste.", "You said something mean to your friend, and he is sad.", "Du hast deinem Freund etwas Gemeines gesagt, und er ist traurig.", "Le has dicho algo feo a tu amigo y está triste."), options: [
    O("💛", L("Je lui dis pardon.", "I say sorry.", "Ich entschuldige mich bei ihm.", "Le pido perdón."), L("Bravo ! Dire pardon, ça répare, et c'est courageux.", "Well done! Saying sorry helps fix things, and it's brave.", "Super! Sich entschuldigen macht vieles wieder gut, und es ist mutig.", "¡Bravo! Pedir perdón arregla las cosas y es valiente."), true),
    O("🔁", L("Je recommence.", "I do it again.", "Ich mache es nochmal.", "Lo vuelvo a hacer."), L("Il serait encore plus triste. Que pourrais-tu lui dire ?", "He'd be even sadder. What could you say to him?", "Er wäre noch trauriger. Was könntest du ihm sagen?", "Estaría aún más triste. ¿Qué podrías decirle?")),
    O("🙈", L("Je fais comme si de rien n'était.", "I act as if nothing happened.", "Ich tue so, als wäre nichts gewesen.", "Hago como si nada."), L("Il est toujours triste. Comment pourrais-tu réparer ?", "He's still sad. How could you make it right?", "Er ist immer noch traurig. Wie könntest du es wiedergutmachen?", "Sigue triste. ¿Cómo podrías arreglarlo?")),
  ] },
];
export const COLOR_NAMES: Tr[] = [L("Le bleu :", "Blue:", "Blau:", "El azul:"), L("L'orange :", "Orange:", "Orange:", "El naranja:"), L("Le violet :", "Purple:", "Lila:", "El morado:")];
export const WHAT_WOULD = L("Qu'est-ce que tu ferais ?", "What would you do?", "Was würdest du tun?", "¿Qué harías tú?");
export const NOT_SURE = L("Hmm… je ne crois pas. Écoute encore.", "Hmm… I don't think so. Listen again.", "Hmm… ich glaube nicht. Hör noch einmal zu.", "Mmm… no creo. Escucha otra vez.");
export const YES = L("Oui !", "Yes!", "Ja!", "¡Sí!");
