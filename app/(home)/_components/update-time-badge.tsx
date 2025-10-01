"use client";

import { useEffect, useState } from "react";
import { Badge } from "../../_components/ui/badge";
import { TimerIcon } from "lucide-react";

interface UpdateTimerBadgeProps {
  refreshIntervalInSeconds: number;
}

const UpdateTimerBadge = ({
  refreshIntervalInSeconds,
}: UpdateTimerBadgeProps) => {
  const [timeLeft, setTimeLeft] = useState(refreshIntervalInSeconds);

  useEffect(() => {
    // Zera o timer a cada atualização de dados para garantir a sincronia
    setTimeLeft(refreshIntervalInSeconds);

    // Configura um intervalo que roda a cada segundo para decrementar o contador
    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          // Quando o tempo acaba, reseta para o valor inicial
          return refreshIntervalInSeconds;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Limpa o intervalo quando o componente é desmontado para evitar vazamentos de memória
    return () => clearInterval(interval);
  }, [refreshIntervalInSeconds]);

  // Formata o tempo restante em minutos e segundos (MM:SS)
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
    seconds,
  ).padStart(2, "0")}`;

  return (
    <Badge
      variant="outline"
      className="flex items-center gap-2 font-mono text-sm"
    >
      <TimerIcon className="h-4 w-4 animate-pulse" />
      <span>Próxima atualização em: {formattedTime}</span>
    </Badge>
  );
};

export default UpdateTimerBadge;
