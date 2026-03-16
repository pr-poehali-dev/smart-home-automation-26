import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"

interface ParsedFormula {
  [element: string]: number
}

function normalizeEquation(eq: string): string {
  // Normalize input: trim, replace = with ->, fix capitalization
  let s = eq.trim()
  // Replace = (but not ->) with ->
  s = s.replace(/(?<!-)=(?!>)/g, "->")
  // Normalize element capitalization: first letter upper, rest lower
  // e.g. "hn03" -> "HN03", but preserve numbers
  // Split by +, ->, spaces and capitalize chemical tokens
  s = s.replace(/[a-z]+/g, (match, offset, full) => {
    const prev = full[offset - 1]
    // If preceded by a digit or uppercase letter, it's continuation of element (like "Fe" -> second char)
    if (prev && /[A-Z]/.test(prev)) return match // lowercase after uppercase = stay lowercase
    return match.charAt(0).toUpperCase() + match.slice(1)
  })
  return s
}

function parseFormula(formula: string): ParsedFormula {
  const result: ParsedFormula = {}
  // Handle parentheses like Ca(OH)2
  function parse(s: string, multiplier: number) {
    const regex = /([A-Z][a-z]?)(\d*)|(\()|\)(\d*)/g
    let match
    let i = 0
    while (i < s.length) {
      if (s[i] === '(') {
        // find matching )
        let depth = 1
        let j = i + 1
        while (j < s.length && depth > 0) {
          if (s[j] === '(') depth++
          if (s[j] === ')') depth--
          j++
        }
        const inner = s.slice(i + 1, j - 1)
        const numMatch = s.slice(j).match(/^(\d+)/)
        const num = numMatch ? parseInt(numMatch[1]) : 1
        parse(inner, multiplier * num)
        i = j + (numMatch ? numMatch[1].length : 0)
      } else {
        const m = s.slice(i).match(/^([A-Z][a-z]?)(\d*)/)
        if (m) {
          const el = m[1]
          const cnt = m[2] ? parseInt(m[2]) : 1
          result[el] = (result[el] || 0) + cnt * multiplier
          i += m[0].length
        } else {
          i++
        }
      }
    }
  }
  parse(formula, 1)
  return result
}

function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b)
  return b === 0 ? a : gcd(b, a % b)
}

function lcm(a: number, b: number): number {
  return (a / gcd(a, b)) * b
}

// Solve using Gaussian elimination with fractions (as rationals p/q)
function balanceEquation(rawEquation: string): string {
  try {
    const equation = normalizeEquation(rawEquation)
    const sep = equation.includes("->") ? "->" : "="
    const sides = equation.split(sep).map(s => s.trim())
    if (sides.length !== 2 || !sides[0] || !sides[1]) {
      return "Используйте формат: H2 + O2 -> H2O"
    }

    const reactants = sides[0].split("+").map(s => s.trim()).filter(Boolean)
    const products = sides[1].split("+").map(s => s.trim()).filter(Boolean)

    if (reactants.length === 0 || products.length === 0) {
      return "Используйте формат: H2 + O2 -> H2O"
    }

    const allFormulas = [...reactants, ...products]
    const elementSet = new Set<string>()
    allFormulas.forEach(f => {
      const parsed = parseFormula(f)
      Object.keys(parsed).forEach(e => elementSet.add(e))
    })

    const elements = Array.from(elementSet)
    const n = allFormulas.length // number of unknowns
    const m = elements.length   // number of equations

    // Build matrix: rows = elements, cols = compounds + 1 (homogeneous)
    // Reactants positive, products negative
    // We use rational arithmetic: store as [numerator, denominator]
    type Rat = [number, number]
    const ratAdd = (a: Rat, b: Rat): Rat => {
      const num = a[0] * b[1] + b[0] * a[1]
      const den = a[1] * b[1]
      const g = gcd(Math.abs(num), Math.abs(den))
      return [num / g, den / g]
    }
    const ratMul = (a: Rat, b: Rat): Rat => {
      const num = a[0] * b[0]
      const den = a[1] * b[1]
      const g = gcd(Math.abs(num), Math.abs(den))
      return [num / g, den / g]
    }
    const ratDiv = (a: Rat, b: Rat): Rat => ratMul(a, [b[1], b[0]])
    const ratSub = (a: Rat, b: Rat): Rat => ratAdd(a, [-b[0], b[1]])
    const ratIsZero = (a: Rat) => a[0] === 0

    // Matrix rows x (n+1) where last col is RHS (all zeros for homogeneous)
    const matrix: Rat[][] = elements.map(el => {
      const row: Rat[] = allFormulas.map((f, i) => {
        const parsed = parseFormula(f)
        const cnt = parsed[el] || 0
        const sign = i < reactants.length ? 1 : -1
        return [cnt * sign, 1] as Rat
      })
      row.push([0, 1]) // RHS
      return row
    })

    // Gaussian elimination
    const rows = matrix.length
    const cols = n + 1
    let pivotRow = 0
    const pivotCols: number[] = []

    for (let col = 0; col < n && pivotRow < rows; col++) {
      // Find pivot
      let found = -1
      for (let r = pivotRow; r < rows; r++) {
        if (!ratIsZero(matrix[r][col])) { found = r; break }
      }
      if (found === -1) continue
      // Swap
      ;[matrix[pivotRow], matrix[found]] = [matrix[found], matrix[pivotRow]]
      // Scale pivot row
      const pivot = matrix[pivotRow][col]
      for (let c = 0; c < cols; c++) {
        matrix[pivotRow][c] = ratDiv(matrix[pivotRow][c], pivot)
      }
      // Eliminate
      for (let r = 0; r < rows; r++) {
        if (r === pivotRow) continue
        const factor = matrix[r][col]
        if (ratIsZero(factor)) continue
        for (let c = 0; c < cols; c++) {
          matrix[r][c] = ratSub(matrix[r][c], ratMul(factor, matrix[pivotRow][c]))
        }
      }
      pivotCols.push(col)
      pivotRow++
    }

    // Free variables (non-pivot columns among 0..n-1)
    const pivotSet = new Set(pivotCols)
    const freeCols = Array.from({ length: n }, (_, i) => i).filter(i => !pivotSet.has(i))

    if (freeCols.length === 0 && pivotCols.length < n) {
      return "Не удалось подобрать коэффициенты"
    }

    // Set free variable(s) to 1
    const solution: Rat[] = new Array(n).fill([0, 1])
    freeCols.forEach(fc => { solution[fc] = [1, 1] })

    // Back-substitute
    for (let i = pivotCols.length - 1; i >= 0; i--) {
      const pc = pivotCols[i]
      let val: Rat = [0, 1]
      for (let c = 0; c < n; c++) {
        if (c === pc) continue
        val = ratAdd(val, ratMul(matrix[i][c], solution[c]))
      }
      solution[pc] = [-val[0], val[1]]
    }

    // All coefficients must be positive
    const allPositive = solution.every(r => r[0] > 0)
    if (!allPositive) {
      // Try negating free variables
      freeCols.forEach(fc => { solution[fc] = [-1, 1] })
      for (let i = pivotCols.length - 1; i >= 0; i--) {
        const pc = pivotCols[i]
        let val: Rat = [0, 1]
        for (let c = 0; c < n; c++) {
          if (c === pc) continue
          val = ratAdd(val, ratMul(matrix[i][c], solution[c]))
        }
        solution[pc] = [-val[0], val[1]]
      }
    }

    if (solution.some(r => r[0] <= 0 || r[1] <= 0)) {
      return "Не удалось подобрать коэффициенты"
    }

    // Convert to integers: find LCM of all denominators
    const denLcm = solution.reduce((acc, r) => lcm(acc, r[1]), 1)
    const intCoeffs = solution.map(r => (r[0] * denLcm) / r[1])

    if (intCoeffs.some(c => !Number.isInteger(c) || c <= 0)) {
      return "Не удалось подобрать коэффициенты"
    }

    // Simplify by GCD
    const g = intCoeffs.reduce(gcd)
    const finalCoeffs = intCoeffs.map(c => c / g)

    const reactantParts = reactants.map((f, i) => finalCoeffs[i] === 1 ? f : `${finalCoeffs[i]}${f}`)
    const productParts = products.map((f, i) => finalCoeffs[reactants.length + i] === 1 ? f : `${finalCoeffs[reactants.length + i]}${f}`)

    return reactantParts.join(" + ") + " → " + productParts.join(" + ")
  } catch {
    return "Ошибка при разборе уравнения"
  }
}

export default function EquationBalancer() {
  const [input, setInput] = useState("")
  const [result, setResult] = useState("")
  const [error, setError] = useState(false)

  const handleBalance = () => {
    if (!input.trim()) return
    const res = balanceEquation(input)
    const isErr = res.startsWith("Не") || res.startsWith("Ошибка") || res.startsWith("Используйте") || res.startsWith("Слишком")
    setError(isErr)
    setResult(res)
  }

  const examples = ["H2 + O2 -> H2O", "Fe + O2 -> Fe2O3", "HNO3 + S = H2SO4 + NO2 + H2O"]

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm w-full">
      <div className="flex gap-2 mb-4 flex-wrap">
        {examples.map(ex => (
          <button
            key={ex}
            onClick={() => { setInput(ex); setResult("") }}
            className="text-xs text-neutral-400 border border-white/10 rounded-full px-3 py-1 hover:border-[#00FF88]/50 hover:text-[#00FF88] transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => { setInput(e.target.value); setResult("") }}
          onKeyDown={e => e.key === "Enter" && handleBalance()}
          placeholder="H2 + O2 -> H2O  или  H2 + O2 = H2O"
          className="bg-white/5 border-white/20 text-white placeholder:text-neutral-600 focus:border-[#00FF88]/60"
        />
        <Button
          onClick={handleBalance}
          className="bg-[#00FF88] hover:bg-[#00DD77] text-black font-semibold shrink-0"
        >
          <Icon name="Zap" size={16} />
        </Button>
      </div>
      {result && (
        <div className={`mt-4 p-3 rounded-xl text-sm font-mono ${error ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20"}`}>
          {result}
        </div>
      )}
    </div>
  )
}
