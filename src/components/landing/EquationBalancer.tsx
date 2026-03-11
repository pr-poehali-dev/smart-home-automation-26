import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"

interface ParsedFormula {
  [element: string]: number
}

function parseFormula(formula: string): ParsedFormula {
  const result: ParsedFormula = {}
  const regex = /([A-Z][a-z]?)(\d*)/g
  let match
  while ((match = regex.exec(formula)) !== null) {
    const element = match[1]
    const count = parseInt(match[2] || "1", 10)
    result[element] = (result[element] || 0) + count
  }
  return result
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

function balanceEquation(equation: string): string {
  try {
    const sides = equation.split("->").map(s => s.trim())
    if (sides.length !== 2) return "Используйте формат: H2 + O2 -> H2O"

    const reactants = sides[0].split("+").map(s => s.trim())
    const products = sides[1].split("+").map(s => s.trim())

    const allFormulas = [...reactants, ...products]
    const elements = new Set<string>()
    allFormulas.forEach(f => {
      const parsed = parseFormula(f)
      Object.keys(parsed).forEach(e => elements.add(e))
    })

    const elementList = Array.from(elements)
    const n = allFormulas.length
    const m = elementList.length

    if (n > 6 || m > 6) return "Слишком сложное уравнение для автобалансировки"

    const coeffs = findCoefficients(allFormulas, elementList, reactants.length)
    if (!coeffs) return "Не удалось подобрать коэффициенты"

    const reactantParts = reactants.map((f, i) => coeffs[i] === 1 ? f : `${coeffs[i]}${f}`)
    const productParts = products.map((f, i) => coeffs[reactants.length + i] === 1 ? f : `${coeffs[reactants.length + i]}${f}`)

    return reactantParts.join(" + ") + " → " + productParts.join(" + ")
  } catch {
    return "Ошибка при разборе уравнения"
  }
}

function findCoefficients(formulas: string[], elements: string[], reactantCount: number): number[] | null {
  const maxCoeff = 10
  const n = formulas.length

  function tryCoeffs(coeffs: number[], idx: number): number[] | null {
    if (idx === n) {
      if (isBalanced(coeffs, formulas, elements, reactantCount)) return coeffs
      return null
    }
    for (let c = 1; c <= maxCoeff; c++) {
      coeffs[idx] = c
      const result = tryCoeffs(coeffs, idx + 1)
      if (result) {
        const g = result.reduce(gcd)
        return result.map(x => x / g)
      }
    }
    return null
  }

  return tryCoeffs(new Array(n).fill(1), 0)
}

function isBalanced(coeffs: number[], formulas: string[], elements: string[], reactantCount: number): boolean {
  for (const el of elements) {
    let reactantSum = 0
    let productSum = 0
    formulas.forEach((f, i) => {
      const parsed = parseFormula(f)
      const count = (parsed[el] || 0) * coeffs[i]
      if (i < reactantCount) reactantSum += count
      else productSum += count
    })
    if (reactantSum !== productSum) return false
  }
  return true
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

  const examples = ["H2 + O2 -> H2O", "Fe + O2 -> Fe2O3", "CH4 + O2 -> CO2 + H2O"]

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
          placeholder="H2 + O2 -> H2O"
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
