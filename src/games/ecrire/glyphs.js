// @ts-nocheck — données géométriques portées telles quelles de la V2 (games/tracer/logic.js), testées.
// Chaque lettre / chiffre = une liste de traits dans l'ordre et le sens de l'école.
// Boîte de 100 (largeur) × 120 (hauteur), y vers le bas. Voir glyphs.d.ts pour les types.

  const W = 100, H = 120;
  const STEP = 3; // distance entre deux points d'un trait

  // ---------- Petites briques de dessin ----------
  // Segment de (x1,y1) à (x2,y2)
  const L = (x1, y1, x2, y2) => ({ t: "L", x1, y1, x2, y2 });
  // Arc d'ellipse : centre, rayons, angles en degrés (y vers le bas : 90 = en bas).
  // a0 > a1 : on tourne vers la gauche en partant du haut (sens des ronds à l'école).
  const A = (cx, cy, rx, ry, a0, a1) => ({ t: "A", cx, cy, rx, ry, a0, a1 });
  // Courbe douce par un point de contrôle
  const Q = (x1, y1, cx, cy, x2, y2) => ({ t: "Q", x1, y1, cx, cy, x2, y2 });

  function sample(part) {
    const pts = [];
    if (part.t === "L") {
      const len = Math.hypot(part.x2 - part.x1, part.y2 - part.y1);
      const n = Math.max(2, Math.ceil(len / STEP));
      for (let i = 0; i <= n; i++) pts.push([part.x1 + ((part.x2 - part.x1) * i) / n, part.y1 + ((part.y2 - part.y1) * i) / n]);
    } else if (part.t === "A") {
      const len = (Math.abs(part.a1 - part.a0) * Math.PI / 180) * Math.max(part.rx, part.ry);
      const n = Math.max(4, Math.ceil(len / STEP));
      for (let i = 0; i <= n; i++) {
        const a = ((part.a0 + ((part.a1 - part.a0) * i) / n) * Math.PI) / 180;
        pts.push([part.cx + part.rx * Math.cos(a), part.cy + part.ry * Math.sin(a)]);
      }
    } else {
      const n = 30;
      for (let i = 0; i <= n; i++) {
        const t = i / n, u = 1 - t;
        pts.push([u * u * part.x1 + 2 * u * t * part.cx + t * t * part.x2, u * u * part.y1 + 2 * u * t * part.cy + t * t * part.y2]);
      }
    }
    return pts;
  }
  // Un trait = plusieurs morceaux enchaînés sans lever le doigt
  function stroke(...parts) {
    const pts = [];
    for (const p of parts) {
      const s = sample(p);
      if (pts.length) s.shift(); // évite le point en double à la jonction
      pts.push(...s);
    }
    return pts;
  }

  // ---------- Majuscules ----------
  const LETTERS = {
    A: [stroke(L(50, 10, 15, 110)), stroke(L(50, 10, 85, 110)), stroke(L(28, 75, 72, 75))],
    B: [stroke(L(22, 10, 22, 110)), stroke(L(22, 10, 52, 10), A(52, 35, 24, 25, -90, 90), L(52, 60, 22, 60)), stroke(L(22, 60, 56, 60), A(56, 85, 26, 25, -90, 90), L(56, 110, 22, 110))],
    C: [stroke(A(55, 60, 40, 50, -40, -320))],
    D: [stroke(L(22, 10, 22, 110)), stroke(L(22, 10, 38, 10), A(38, 60, 44, 50, -90, 90), L(38, 110, 22, 110))],
    E: [stroke(L(25, 10, 25, 110)), stroke(L(25, 10, 80, 10)), stroke(L(25, 60, 70, 60)), stroke(L(25, 110, 80, 110))],
    F: [stroke(L(25, 10, 25, 110)), stroke(L(25, 10, 80, 10)), stroke(L(25, 60, 70, 60))],
    G: [stroke(A(52, 60, 40, 50, -40, -360)), stroke(L(64, 60, 92, 60))],
    H: [stroke(L(20, 10, 20, 110)), stroke(L(80, 10, 80, 110)), stroke(L(20, 60, 80, 60))],
    I: [stroke(L(50, 10, 50, 110))],
    J: [stroke(L(65, 10, 65, 82), A(42, 82, 23, 26, 0, 180))],
    K: [stroke(L(22, 10, 22, 110)), stroke(L(80, 10, 22, 68)), stroke(L(42, 52, 82, 110))],
    L: [stroke(L(25, 10, 25, 110), L(25, 110, 80, 110))],
    M: [stroke(L(15, 10, 15, 110)), stroke(L(15, 10, 50, 72), L(50, 72, 85, 10)), stroke(L(85, 10, 85, 110))],
    N: [stroke(L(20, 10, 20, 110)), stroke(L(20, 10, 80, 110)), stroke(L(80, 10, 80, 110))],
    O: [stroke(A(50, 60, 40, 50, -90, -450))],
    P: [stroke(L(22, 10, 22, 110)), stroke(L(22, 10, 52, 10), A(52, 35, 26, 25, -90, 90), L(52, 60, 22, 60))],
    Q: [stroke(A(50, 58, 40, 48, -90, -450)), stroke(L(58, 86, 88, 114))],
    R: [stroke(L(22, 10, 22, 110)), stroke(L(22, 10, 52, 10), A(52, 35, 26, 25, -90, 90), L(52, 60, 22, 60)), stroke(L(46, 60, 82, 110))],
    S: [stroke(A(50, 35, 30, 25, -20, -270), A(50, 85, 30, 25, -90, 160))],
    T: [stroke(L(15, 10, 85, 10)), stroke(L(50, 10, 50, 110))],
    U: [stroke(L(20, 10, 20, 75), A(50, 75, 30, 35, 180, 0), L(80, 75, 80, 10))],
    V: [stroke(L(15, 10, 50, 110), L(50, 110, 85, 10))],
    W: [stroke(L(8, 10, 28, 110), L(28, 110, 50, 40), L(50, 40, 72, 110), L(72, 110, 92, 10))],
    X: [stroke(L(15, 10, 85, 110)), stroke(L(85, 10, 15, 110))],
    Y: [stroke(L(15, 10, 50, 60), L(50, 60, 50, 110)), stroke(L(85, 10, 50, 60))],
    Z: [stroke(L(15, 10, 85, 10), L(85, 10, 15, 110), L(15, 110, 85, 110))],
  };

  // ---------- Chiffres ----------
  const DIGITS = {
    "0": [stroke(A(50, 60, 35, 50, -90, -450))],
    "1": [stroke(L(30, 35, 56, 10), L(56, 10, 56, 110))],
    "2": [stroke(A(50, 38, 30, 28, -160, 25), L(77, 50, 18, 110), L(18, 110, 85, 110))],
    "3": [stroke(A(48, 35, 28, 25, -160, 90), A(48, 85, 30, 25, -90, 160))],
    "4": [stroke(L(62, 10, 15, 80), L(15, 80, 88, 80)), stroke(L(66, 42, 66, 110))],
    "5": [stroke(L(32, 10, 30, 59), A(50, 80, 30, 27, -130, 150)), stroke(L(32, 10, 78, 10))],
    "6": [stroke(Q(74, 12, 26, 32, 24, 84), A(50, 84, 26, 26, 180, -180))],
    "7": [stroke(L(15, 10, 85, 10), L(85, 10, 40, 110))],
    "8": [stroke(A(50, 34, 24, 23, -30, -270), A(50, 84, 28, 26, -90, 270), L(50, 58, 71, 22))],
    "9": [stroke(A(50, 36, 26, 26, 0, -360), L(76, 36, 70, 110))],
  };

  // "A comme avion" : un mot dont la première lettre s'entend bien
  const WORDS = {
    A: ["avion", "✈️"], B: ["ballon", "🎈"], C: ["canard", "🦆"], D: ["dauphin", "🐬"], E: ["étoile", "⭐"],
    F: ["fleur", "🌸"], G: ["gâteau", "🎂"], H: ["hibou", "🦉"], I: ["île", "🏝️"], J: ["jus", "🧃"],
    K: ["koala", "🐨"], L: ["lion", "🦁"], M: ["maison", "🏠"], N: ["nuage", "☁️"], O: ["orange", "🍊"],
    P: ["pomme", "🍎"], Q: ["quille", "🎳"], R: ["robot", "🤖"], S: ["soleil", "☀️"], T: ["tortue", "🐢"],
    U: ["usine", "🏭"], V: ["vache", "🐄"], W: ["wagon", "🚃"], X: ["xylophone", "🎶"], Y: ["yoyo", "🪀"], Z: ["zèbre", "🦓"],
  };
  const NUMBER_WORDS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];

  const glyph = (ch) => LETTERS[ch] || DIGITS[ch] || null;

  // ---------- Suivre le doigt sur un trait ----------
  // Le doigt fait avancer la progression seulement s'il est près du trait,
  // et seulement un peu plus loin que là où il en est (pas de raccourci, pas à l'envers).
  const TOLERANCE = 13;   // distance max au trait (en unités de la boîte)
  const LOOKAHEAD = 6;    // nombre de points qu'on peut "sauter" d'un coup
  function newTrace(points) { return { points, progress: 0, done: false, last: null }; }
  // À chaque nouveau toucher du doigt
  function touchStart(trace) { trace.last = null; }

  function feed(trace, x, y, tol = TOLERANCE) {
    if (trace.done) return { near: true, advanced: false };
    const pts = trace.points;
    // on cherche le point du trait le plus proche du doigt, autour de là où on en est
    const from = Math.max(0, trace.progress - LOOKAHEAD);
    const to = Math.min(pts.length - 1, trace.progress + LOOKAHEAD);
    let nearest = -1, bestD = Infinity;
    for (let i = from; i <= to; i++) {
      const d = Math.hypot(pts[i][0] - x, pts[i][1] - y);
      if (d <= tol && d < bestD) { nearest = i; bestD = d; }
    }
    if (nearest < 0) {
      // le doigt est-il quand même sur une autre partie du trait ?
      let near = false;
      for (const p of pts) if (Math.hypot(p[0] - x, p[1] - y) <= tol) { near = true; break; }
      return { near, advanced: false };
    }
    let advanced = false;
    if (trace.last === null) {
      // début d'un toucher : il faut partir de là où on en est (pas d'un peu plus loin)
      if (nearest <= trace.progress + 2 && nearest > trace.progress) { trace.progress = nearest; advanced = true; }
    } else if (nearest > trace.last && nearest > trace.progress) {
      // le doigt avance dans le bon sens
      trace.progress = nearest;
      advanced = true;
    }
    trace.last = nearest;
    if (trace.progress >= pts.length - 2) { trace.progress = pts.length - 1; trace.done = true; }
    return { near: true, advanced, dist: bestD };
  }
  // Le doigt doit commencer près du début du trait (ou là où il s'était arrêté)
  function canStartAt(trace, x, y, tol = TOLERANCE) {
    const p = trace.points[trace.progress];
    return Math.hypot(p[0] - x, p[1] - y) <= tol * 1.6;
  }



  
export { W, H, TOLERANCE, LETTERS, DIGITS, glyph, newTrace, touchStart, feed, canStartAt, stroke, L, A, Q };
