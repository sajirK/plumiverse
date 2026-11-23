// Types du module de tracé (glyphs.js, porté de la V2).
export type Pt = [number, number];
export interface Trace { points: Pt[]; progress: number; done: boolean; last: number | null }
export interface Part { t: "L" | "A" | "Q" }
export const W: number;
export const H: number;
export const TOLERANCE: number;
export const LETTERS: Record<string, Pt[][]>;
export const DIGITS: Record<string, Pt[][]>;
export function glyph(ch: string): Pt[][] | null;
export function newTrace(points: Pt[]): Trace;
export function touchStart(t: Trace): void;
export function feed(t: Trace, x: number, y: number, tol?: number): { near: boolean; advanced: boolean; dist?: number };
export function canStartAt(t: Trace, x: number, y: number, tol?: number): boolean;
export function stroke(...parts: Part[]): Pt[];
export function L(x1: number, y1: number, x2: number, y2: number): Part;
export function A(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number): Part;
export function Q(x1: number, y1: number, cx: number, cy: number, x2: number, y2: number): Part;
