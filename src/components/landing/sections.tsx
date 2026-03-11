import { Badge } from "@/components/ui/badge"
import EquationBalancer from "./EquationBalancer"
import MoleCalculator from "./MoleCalculator"

export const sections = [
  {
    id: 'hero',
    subtitle: <Badge variant="outline" className="text-white border-white">Химия — просто</Badge>,
    title: "Химический калькулятор.",
    content: "Балансируйте уравнения и рассчитывайте моли вещества в пару кликов.",
    showButton: true,
    buttonText: 'Попробовать'
  },
  {
    id: 'balancer',
    subtitle: <Badge variant="outline" className="text-[#00FF88] border-[#00FF88]/50">Балансировщик</Badge>,
    title: "Уравняй реакцию.",
    content: "Введите уравнение в формате A + B -> C и получите расставленные коэффициенты мгновенно.",
    customContent: <EquationBalancer />
  },
  {
    id: 'moles',
    subtitle: <Badge variant="outline" className="text-[#00AAFF] border-[#00AAFF]/50">Расчёт молей</Badge>,
    title: "Рассчитай моли.",
    content: "Введите химическую формулу и массу вещества — получите количество молей, молярную массу и число молекул.",
    customContent: <MoleCalculator />
  },
  {
    id: 'about',
    title: 'Всё в одном месте.',
    content: 'Балансировка уравнений реакций, расчёт количества вещества, молярной массы и числа молекул — без лишних сложностей.'
  },
  {
    id: 'cta',
    title: 'Готов решать задачи?',
    content: 'Используй инструменты прямо сейчас — бесплатно и без регистрации.',
    showButton: true,
    buttonText: 'К калькулятору'
  },
]
