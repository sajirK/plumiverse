// Calcul (5-14 ans) : des additions avec des pommes jusqu'aux pourcentages.
import { L } from "../../core/types";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";
import { TRACK, question, choices, spoken, spokenResult, type Gen } from "./logic";
import { numberWords } from "../../core/numwords";

export const calculGame: GameDef = {
  id: "calcul",
  icon: "🧮",
  category: "maths",
  ages: [5, 14],
  title: L("Calcul", "Mental maths", "Kopfrechnen", "Cálculo mental"),
  desc: L("Additions, soustractions, tables de multiplication, divisions, priorités, nombres relatifs, fractions et pourcentages.", "Addition, subtraction, times tables, division, order of operations, negative numbers, fractions and percentages.", "Plus, Minus, Einmaleins, Teilen, Punkt vor Strich, negative Zahlen, Brüche und Prozente.", "Sumas, restas, tablas, divisiones, prioridad de operaciones, números negativos, fracciones y porcentajes."),
  skills: {
    add5: L("Additions jusqu'à 5", "Adding up to 5", "Plus bis 5", "Sumas hasta 5"),
    add10: L("Additions jusqu'à 10", "Adding up to 10", "Plus bis 10", "Sumas hasta 10"),
    sub10: L("Soustractions jusqu'à 10", "Subtracting within 10", "Minus bis 10", "Restas hasta 10"),
    comp10: L("Compléments à 10", "Number bonds to 10", "Ergänzen bis 10", "Complementos a 10"),
    double: L("Les doubles", "Doubles", "Verdoppeln", "Los dobles"),
    add20: L("Calculs jusqu'à 20", "Sums up to 20", "Rechnen bis 20", "Cálculos hasta 20"),
    add100: L("Calculs jusqu'à 100", "Sums up to 100", "Rechnen bis 100", "Cálculos hasta 100"),
    tables: L("Tables de multiplication", "Times tables", "Einmaleins", "Tablas de multiplicar"),
    div: L("Divisions", "Division", "Teilen", "Divisiones"),
    priorite: L("Priorités de calcul", "Order of operations", "Punkt vor Strich", "Prioridad de operaciones"),
    relatifs: L("Nombres relatifs", "Negative numbers", "Negative Zahlen", "Números negativos"),
    fractions: L("Fractions", "Fractions", "Brüche", "Fracciones"),
    pourcentages: L("Pourcentages", "Percentages", "Prozente", "Porcentajes"),
  },
  track: () => TRACK,
  instruction: (level, ctx) => (level.params.keypad
    ? L("Calcule, puis écris le résultat.", "Work it out, then type the answer.", "Rechne und tipp das Ergebnis ein.", "Calcula y escribe el resultado.")
    : L("Calcule, puis touche le bon résultat.", "Work it out, then tap the right answer.", "Rechne und tipp das richtige Ergebnis an.", "Calcula y toca el resultado correcto."))[ctx.lang],
  start(round, level, ctx) {
    const p = level.params as Gen & { keypad: boolean; n: number };
    const q = question(p);
    const wrap = h("div", { class: "ca-wrap" });
    round.stage.appendChild(wrap);
    const card = h("div", { class: "ca-card" });
    if (q.objects) {
      // comme en V2 : on touche les objets pour les compter, la voix compte avec l'enfant
      let counted = 0;
      const obj = () => { const s = h("button", { class: "ca-obj", "aria-label": q.objects!.e }, q.objects!.e); s.onclick = () => { if (s.classList.contains("counted") || round.ended) return; s.classList.add("counted"); counted++; sfx.step(Math.min(11, counted - 1)); round.say(numberWords(counted, ctx.lang)); }; return s; };
      card.append(h("div", { class: "ca-objects" }, h("div", { class: "ca-grp" }, ...Array.from({ length: q.objects.a }, obj)), h("b", {}, "+"), h("div", { class: "ca-grp add" }, ...Array.from({ length: q.objects.b }, obj))));
    }
    const qEl = h("div", { class: "ca-q" }, q.text.includes("?") ? q.text : `${q.text} = ?`);
    card.append(qEl);
    const reveal = () => { qEl.innerHTML = ""; qEl.append(q.text.includes("?") ? q.text.replace("?", String(q.answer)) : `${q.text} = `, ...(q.text.includes("?") ? [] : [h("span", { class: "ca-ok" }, String(q.answer))])); };
    const result = spokenResult(q, ctx.lang) ?? "";
    wrap.appendChild(card);
    const phrase = spoken(q, ctx.lang);
    if (phrase) round.instruct(phrase);
    if (!p.keypad) {
      const grid = h("div", { class: "ca-choices" });
      let good: HTMLElement | null = null;
      for (const v of choices(q.answer, round.assist ? 2 : p.n)) {
        const b = h("button", { class: "ca-choice" }, String(v));
        if (v === q.answer) good = b;
        b.onclick = () => { if (round.ended) return; if (v === q.answer) { reveal(); round.win(b, result, { delay: result ? 2200 : 1100 }); } else round.miss(b); };
        grid.appendChild(b);
      }
      wrap.appendChild(grid);
      round.setHintTarget(() => good);
      return;
    }
    // pavé numérique (avec le signe moins pour les nombres relatifs)
    let typed = "";
    const screen = h("div", { class: "ca-screen" }, "");
    const pad = h("div", { class: "ca-pad" });
    const render = () => { screen.textContent = typed || " "; };
    const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "−", "0", "⌫"];
    const btn: Record<string, HTMLButtonElement> = {};
    for (const k of keys) {
      const b = h("button", { class: "ca-key" + (k === "⌫" ? " del" : "") }, k) as HTMLButtonElement;
      b.onclick = () => {
        sfx.tap();
        if (k === "⌫") typed = typed.slice(0, -1);
        else if (k === "−") typed = typed.startsWith("-") ? typed.slice(1) : "-" + typed;
        else if (typed.replace("-", "").length < 5) typed += k;
        render();
      };
      btn[k] = b; pad.appendChild(b);
    }
    const ok = h("button", { class: "k-btn primary ca-ok", "aria-label": "OK" }, "✅") as HTMLButtonElement;
    ok.onclick = () => {
      if (!typed || typed === "-") return;
      if (Number(typed) === q.answer) { reveal(); round.win(screen, result, { delay: result ? 2000 : 1000 }); }
      else { round.miss(screen); typed = ""; render(); }
    };
    wrap.append(screen, pad, ok);
    render();
    // aide (et robot) : la prochaine touche à taper, puis ✅
    const target = String(q.answer).replace("-", "−");
    round.setHintTarget(() => {
      const want = target.startsWith("−") ? (typed.startsWith("-") ? target.slice(1) : "−") : target;
      const done = typed.replace("-", "");
      const goal = want === "−" ? "−" : want;
      if (goal === "−") return btn["−"];
      if (!goal.startsWith(done)) return btn["⌫"];
      return done.length < goal.length ? btn[goal[done.length]] : ok;
    });
  },
};
