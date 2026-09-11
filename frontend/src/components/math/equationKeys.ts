export type EquationKey = {
  label: string;
  latex: string;
  previewLatex?: string;
};

const key = (
  label: string,
  latex = label,
  previewLatex?: string,
): EquationKey => ({ label, latex, previewLatex });

export const EQUATION_KEY_GROUPS = [
  {
    id: "excalimath-structures",
    label: "Forms",
    keys: [
      key("fraction", "\\frac{#?}{#?}", "\\frac{a}{b}"),
      key("power", "^{#?}", "x^n"),
      key("subscript", "_{#?}", "x_n"),
      key("square root", "\\sqrt{#?}", "\\sqrt{x}"),
      key("nth root", "\\sqrt[#?]{#?}", "\\sqrt[n]{x}"),
      key("absolute value", "\\left|#?\\right|", "\\left|x\\right|"),
      key("parentheses", "\\left(#?\\right)", "\\left(x\\right)"),
      key("square brackets", "\\left[#?\\right]", "\\left[x\\right]"),
      key("braces", "\\left\\{#?\\right\\}", "\\left\\{x\\right\\}"),
      key("+"),
      key("−", "-"),
      key("×", "\\times"),
      key("÷", "\\div"),
      key("="),
      key("integral", "\\int_{#?}^{#?}#?\\,dx", "\\int_a^b"),
      key("limit", "\\lim_{#?\\to#?}#?", "\\lim_{x\\to a}"),
      key("sum", "\\sum_{#?}^{#?}#?", "\\sum_{i=1}^{n}"),
      key("product", "\\prod_{#?}^{#?}#?", "\\prod_{i=1}^{n}"),
    ],
  },
  {
    id: "excalimath-relations",
    label: "Symbols",
    keys: [
      key("∞", "\\infty"),
      key("∅", "\\varnothing"),
      key("∠", "\\angle"),
      key("⊥", "\\perp"),
      key("△", "\\triangle"),
      key("∼", "\\sim"),
      key("≠", "\\neq"),
      key("→", "\\rightarrow"),
      key("←", "\\leftarrow"),
      key("↔", "\\leftrightarrow"),
      key("⇒", "\\Rightarrow"),
      key("⇐", "\\Leftarrow"),
      key("⇔", "\\Leftrightarrow"),
      key("∀", "\\forall"),
      key("∃", "\\exists"),
      key("∪", "\\cup"),
      key("∩", "\\cap"),
      key("∈", "\\in"),
      key("∉", "\\notin"),
      key("⊂", "\\subset"),
      key("⊆", "\\subseteq"),
      key("<"),
      key(">"),
      key("≤", "\\le"),
      key("≥", "\\ge"),
      key("≈", "\\approx"),
      key("≡", "\\equiv"),
    ],
  },
  {
    id: "excalimath-greek",
    label: "Greek",
    keys: [
      key("α", "\\alpha"), key("β", "\\beta"), key("γ", "\\gamma"),
      key("δ", "\\delta"), key("ε", "\\epsilon"), key("ζ", "\\zeta"),
      key("η", "\\eta"), key("θ", "\\theta"), key("ι", "\\iota"),
      key("κ", "\\kappa"), key("λ", "\\lambda"), key("μ", "\\mu"),
      key("ν", "\\nu"), key("ξ", "\\xi"), key("ο", "o"),
      key("π", "\\pi"), key("ρ", "\\rho"), key("σ", "\\sigma"),
      key("τ", "\\tau"), key("υ", "\\upsilon"), key("φ", "\\phi"),
      key("χ", "\\chi"), key("ψ", "\\psi"), key("ω", "\\omega"),
      key("Γ", "\\Gamma"), key("Δ", "\\Delta"), key("Θ", "\\Theta"),
      key("Λ", "\\Lambda"), key("Ξ", "\\Xi"), key("Π", "\\Pi"),
      key("Σ", "\\Sigma"), key("Φ", "\\Phi"), key("Ψ", "\\Psi"),
      key("Ω", "\\Omega"),
    ],
  },
] as const;
