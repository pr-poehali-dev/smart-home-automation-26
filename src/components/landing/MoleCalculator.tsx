import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Icon from "@/components/ui/icon"

const AVOGADRO = 6.022e23
const MOLAR_MASSES: Record<string, number> = {
  H: 1.008, He: 4.003, Li: 6.941, Be: 9.012, B: 10.81, C: 12.011, N: 14.007,
  O: 15.999, F: 18.998, Ne: 20.18, Na: 22.99, Mg: 24.305, Al: 26.982,
  Si: 28.086, P: 30.974, S: 32.065, Cl: 35.453, Ar: 39.948, K: 39.098,
  Ca: 40.078, Fe: 55.845, Cu: 63.546, Zn: 65.38, Ag: 107.868, Au: 196.967,
  Pb: 207.2, Hg: 200.59, Mn: 54.938, Cr: 51.996, Ni: 58.693, Co: 58.933,
  Ba: 137.327, Al2O3: 101.96
}

function getMolarMass(formula: string): number | null {
  const regex = /([A-Z][a-z]?)(\d*)/g
  let match
  let total = 0
  let matched = false
  while ((match = regex.exec(formula)) !== null) {
    const el = match[1]
    const count = parseInt(match[2] || "1", 10)
    if (!(el in MOLAR_MASSES)) return null
    total += MOLAR_MASSES[el] * count
    matched = true
  }
  return matched ? total : null
}

function formatNum(n: number): string {
  if (n >= 1e15 || n < 0.0001) return n.toExponential(3)
  if (n >= 1000) return n.toFixed(2)
  return parseFloat(n.toFixed(4)).toString()
}

export default function MoleCalculator() {
  const [formula, setFormula] = useState("")
  const [mass, setMass] = useState("")
  const [result, setResult] = useState<{ moles: string; molecules: string; molarMass: string } | null>(null)
  const [error, setError] = useState("")

  const calculate = () => {
    setError("")
    setResult(null)
    const m = getMolarMass(formula.trim())
    if (!m) { setError("Неизвестная формула. Проверьте элементы."); return }
    const massVal = parseFloat(mass)
    if (isNaN(massVal) || massVal <= 0) { setError("Введите корректную массу в граммах"); return }
    const moles = massVal / m
    const molecules = moles * AVOGADRO
    setResult({
      moles: formatNum(moles),
      molecules: formatNum(molecules),
      molarMass: formatNum(m)
    })
  }

  const examples = [
    { formula: "H2O", mass: "18" },
    { formula: "NaCl", mass: "58.5" },
    { formula: "CO2", mass: "44" },
  ]

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm w-full">
      <div className="flex gap-2 mb-4 flex-wrap">
        {examples.map(ex => (
          <button
            key={ex.formula}
            onClick={() => { setFormula(ex.formula); setMass(ex.mass); setResult(null); setError("") }}
            className="text-xs text-neutral-400 border border-white/10 rounded-full px-3 py-1 hover:border-[#00AAFF]/50 hover:text-[#00AAFF] transition-colors"
          >
            {ex.formula} · {ex.mass}г
          </button>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={formula}
          onChange={e => { setFormula(e.target.value); setResult(null) }}
          placeholder="Формула: H2O, NaCl..."
          className="bg-white/5 border-white/20 text-white placeholder:text-neutral-600 focus:border-[#00AAFF]/60"
        />
        <Input
          value={mass}
          onChange={e => { setMass(e.target.value); setResult(null) }}
          onKeyDown={e => e.key === "Enter" && calculate()}
          placeholder="Масса (г)"
          type="number"
          className="bg-white/5 border-white/20 text-white placeholder:text-neutral-600 focus:border-[#00AAFF]/60 sm:w-36"
        />
        <Button
          onClick={calculate}
          className="bg-[#00AAFF] hover:bg-[#0099EE] text-black font-semibold shrink-0"
        >
          <Icon name="Calculator" size={16} />
        </Button>
      </div>
      {error && (
        <div className="mt-4 p-3 rounded-xl text-sm bg-red-500/10 text-red-400 border border-red-500/20">
          {error}
        </div>
      )}
      {result && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-[#00AAFF]/10 border border-[#00AAFF]/20 rounded-xl p-3 text-center">
            <div className="text-[#00AAFF] text-lg font-bold font-mono">{result.moles}</div>
            <div className="text-neutral-500 text-xs mt-1">моль</div>
          </div>
          <div className="bg-[#00AAFF]/10 border border-[#00AAFF]/20 rounded-xl p-3 text-center">
            <div className="text-[#00AAFF] text-lg font-bold font-mono">{result.molarMass}</div>
            <div className="text-neutral-500 text-xs mt-1">г/моль (M)</div>
          </div>
          <div className="bg-[#00AAFF]/10 border border-[#00AAFF]/20 rounded-xl p-3 text-center">
            <div className="text-[#00AAFF] text-lg font-bold font-mono">{result.molecules}</div>
            <div className="text-neutral-500 text-xs mt-1">молекул</div>
          </div>
        </div>
      )}
    </div>
  )
}
